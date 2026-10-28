import { chromium } from "@playwright/test";
import { TraceMap, originalPositionFor } from "@jridgewell/trace-mapping";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const label = process.argv[2] ?? "current";
if (!/^[a-z-]+$/.test(label))
  throw new Error("Use a simple alphabetic trace label");
const output = path.join(root, "docs", "handoff-traces", label);
await mkdir(output, { recursive: true });
const server = spawn(
  process.execPath,
  [
    path.join(root, "node_modules/vite/bin/vite.js"),
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4177",
    "--strictPort",
  ],
  { cwd: root, windowsHide: true, stdio: "ignore" },
);
const base = "http://127.0.0.1:4177";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const maps = new Map();
async function mapped(frame) {
  if (!frame.url.includes("/assets/"))
    return { name: frame.functionName || "(anonymous)", source: frame.url };
  const filename = path.basename(new URL(frame.url).pathname) + ".map";
  if (!maps.has(filename)) {
    try {
      maps.set(
        filename,
        new TraceMap(
          JSON.parse(
            await readFile(path.join(root, "dist/assets", filename), "utf8"),
          ),
        ),
      );
    } catch {
      maps.set(filename, null);
    }
  }
  const map = maps.get(filename);
  const original =
    map &&
    originalPositionFor(map, {
      line: frame.lineNumber + 1,
      column: frame.columnNumber,
    });
  return {
    name: original?.name || frame.functionName || "(anonymous)",
    source: original?.source || frame.url,
  };
}
async function readStream(session, handle) {
  const chunks = [];
  for (;;) {
    const part = await session.send("IO.read", { handle });
    chunks.push(Buffer.from(part.data, part.base64Encoded ? "base64" : "utf8"));
    if (part.eof) break;
  }
  await session.send("IO.close", { handle });
  return Buffer.concat(chunks);
}
async function profileSummary(profile, trace, readout) {
  const commit = readout.marks.find(
    (m) => m.name === "scale:route-commit-before",
  );
  const first = readout.marks.find(
    (m) => m.name === "scale:circuit:first-frame",
  );
  const matching = trace.traceEvents.find(
    (e) => e.name === "scale:route-commit-before" && e.ts,
  );
  if (!commit || !first || !matching)
    throw new Error("Missing handoff markers");
  const offset = matching.ts - commit.startTime * 1000;
  const begin = offset + (commit.startTime - 10) * 1000,
    end = offset + (first.startTime + 300) * 1000;
  const nodes = new Map(profile.nodes.map((node) => [node.id, node]));
  const totals = new Map();
  let cursor = profile.startTime;
  for (let i = 0; i < (profile.samples?.length ?? 0); i++) {
    const delta = profile.timeDeltas[i],
      previous = cursor;
    cursor += delta;
    const overlap = Math.max(
      0,
      Math.min(cursor, end) - Math.max(previous, begin),
    );
    if (!overlap) continue;
    const node = nodes.get(profile.samples[i]);
    if (!node) continue;
    const frame = await mapped(node.callFrame),
      key = frame.source + "|" + frame.name;
    if (!totals.has(key)) totals.set(key, { ...frame, sampledMs: 0 });
    totals.get(key).sampledMs += overlap / 1000;
  }
  const topCpu = [...totals.values()]
    .sort((a, b) => b.sampledMs - a.sampledMs)
    .slice(0, 25);
  const boundaryGl = readout.gl.filter(
    (call) =>
      call.start >= commit.startTime - 10 &&
      call.start <= first.startTime + 300,
  );
  const boundaryFrames = readout.frames.filter(
    (frame) =>
      frame.time >= commit.startTime - 100 &&
      frame.time <= first.startTime + 500,
  );
  const tasks = trace.traceEvents
    .filter(
      (e) =>
        e.ph === "X" &&
        e.dur &&
        e.ts < end &&
        e.ts + e.dur > begin &&
        /RunTask|FunctionCall|EvaluateScript|UpdateLayoutTree|Paint|MinorGC|MajorGC/.test(
          e.name,
        ),
    )
    .sort((a, b) => b.dur - a.dur)
    .slice(0, 15)
    .map((e) => ({
      name: e.name,
      ms: e.dur / 1000,
      startFromCommitMs: (e.ts - offset) / 1000 - commit.startTime,
      pid: e.pid,
      tid: e.tid,
    }));
  return {
    window: { fromCommitMs: -10, toFirstCircuitFrameMs: 300 },
    marks: readout.marks,
    frameMs: {
      max: Math.max(...boundaryFrames.map((f) => f.delta)),
      samples: boundaryFrames,
    },
    glCalls: boundaryGl,
    topCpu,
    tasks,
  };
}
let browser;
try {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    await pause(200);
  }
  browser = await chromium.launch({
    args: ["--use-angle=d3d11", "--enable-webgl", "--ignore-gpu-blocklist"],
  });
  const report = {
    date: new Date().toISOString(),
    method:
      "Instrumented production build with local sourcemaps, CDP timeline + 1ms V8 sampling + WebGL synchronous call timing; Windows D3D11; mobile CPU emulation uses desktop GPU. Profiling overhead means these are diagnostic runs, not replacement benchmark claims.",
    runs: [],
  };
  for (const config of [
    { name: "desktop", width: 1440, height: 1000, dpr: 1, rate: 1 },
    { name: "mobile-class", width: 390, height: 844, dpr: 2, rate: 4 },
  ]) {
    const context = await browser.newContext({
      viewport: { width: config.width, height: config.height },
      deviceScaleFactor: config.dpr,
      isMobile: config.rate > 1,
      hasTouch: config.rate > 1,
    });
    await context.addInitScript(() => {
      window.__handoffGL = [];
      window.__handoffFrames = [];
      window.__handoffSampling = false;
      for (const prototype of [
        WebGLRenderingContext.prototype,
        WebGL2RenderingContext.prototype,
      ]) {
        for (const name of [
          "compileShader",
          "linkProgram",
          "getProgramParameter",
          "getShaderParameter",
          "getProgramInfoLog",
          "getShaderInfoLog",
          "shaderSource",
          "getActiveUniform",
          "getUniformLocation",
        ]) {
          const native = prototype[name];
          prototype[name] = function (...args) {
            const start = performance.now();
            try {
              return Reflect.apply(native, this, args);
            } finally {
              const duration = performance.now() - start;
              if (window.__handoffSampling)
                window.__handoffGL.push({ name, start, duration });
            }
          };
        }
      }
      let previous;
      const frame = (time) => {
        if (window.__handoffSampling && previous !== undefined)
          window.__handoffFrames.push({ time, delta: time - previous });
        previous = time;
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    const page = await context.newPage(),
      session = await context.newCDPSession(page);
    await session.send("Emulation.setCPUThrottlingRate", { rate: config.rate });
    await page.goto(`${base}/?traceScale=1#/trail/start`);
    await page.waitForFunction(
      () => document.documentElement.dataset.worldReady === "trail/start",
    );
    for (const visit of ["cold-destination", "warm-destination"]) {
      if (visit === "warm-destination") {
        await page.goBack();
        await page.waitForFunction(
          () => document.documentElement.dataset.worldReady === "trail/start",
        );
      }
      await page
        .getByRole("button", { name: "Inspect the Raspberry Pi" })
        .click();
      await pause(1000);
      await page.evaluate(() => {
        performance.clearMarks();
        window.__handoffGL = [];
        window.__handoffFrames = [];
        window.__handoffSampling = true;
      });
      await session.send("Profiler.enable");
      await session.send("Profiler.setSamplingInterval", { interval: 1000 });
      await session.send("Tracing.start", {
        categories:
          "devtools.timeline,blink.user_timing,v8,gpu,disabled-by-default-devtools.timeline",
        transferMode: "ReturnAsStream",
      });
      await session.send("Profiler.start");
      await page.getByRole("button", { name: "Enter the circuitry" }).click();
      await page.waitForURL(/circuit\/board/);
      await page.waitForFunction(
        () => document.documentElement.dataset.worldReady === "circuit/board",
      );
      await pause(250);
      const { profile } = await session.send("Profiler.stop");
      const readout = await page.evaluate(() => {
        window.__handoffSampling = false;
        return {
          marks: performance
            .getEntriesByType("mark")
            .filter((m) => m.name.startsWith("scale:"))
            .map((m) => ({ name: m.name, startTime: m.startTime })),
          gl: window.__handoffGL,
          frames: window.__handoffFrames,
          stats: JSON.parse(document.documentElement.dataset.sceneStats),
        };
      });
      const complete = new Promise((resolve) =>
        session.once("Tracing.tracingComplete", resolve),
      );
      await session.send("Tracing.end");
      const { stream } = await complete;
      const raw = await readStream(session, stream);
      const trace = JSON.parse(raw.toString());
      const name = `${config.name}-${visit}`;
      await writeFile(
        path.join(output, name + ".trace.json.gz"),
        gzipSync(raw),
      );
      await writeFile(
        path.join(output, name + ".cpuprofile.gz"),
        gzipSync(JSON.stringify(profile)),
      );
      const summary = await profileSummary(profile, trace, readout);
      report.runs.push({
        name,
        cpuThrottle: config.rate,
        renderer: readout.stats.renderer,
        ...summary,
      });
      console.log(
        name,
        JSON.stringify({
          marks: summary.marks,
          maxBoundaryFrameMs: summary.frameMs.max,
          glMs: summary.glCalls.reduce((n, c) => n + c.duration, 0),
          topCpu: summary.topCpu.slice(0, 8),
        }),
      );
    }
    await context.close();
  }
  await writeFile(
    path.join(output, "summary.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
} finally {
  await browser?.close();
  server.kill();
}
