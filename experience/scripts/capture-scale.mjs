import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "docs", "media");
await mkdir(output, { recursive: true });
const server = spawn(
  process.execPath,
  [
    path.join(root, "node_modules", "vite", "bin", "vite.js"),
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4175",
    "--strictPort",
  ],
  { cwd: root, windowsHide: true, stdio: "ignore" },
);
const base = "http://127.0.0.1:4175";
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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
  const results = {
    date: new Date().toISOString(),
    method:
      "Chromium D3D11; mobile is viewport/DPR emulation plus 4× CPU throttling, not physical mobile hardware",
    samples: [],
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
    const page = await context.newPage(),
      session = await context.newCDPSession(page);
    await session.send("Emulation.setCPUThrottlingRate", { rate: config.rate });
    for (const world of ["trail/start", "circuit/board"]) {
      await page.goto(`${base}/#/${world}`);
      await page.waitForFunction(
        (expected) => document.documentElement.dataset.worldReady === expected,
        world,
        { timeout: 20000 },
      );
      await pause(4500);
      const sample = await page.evaluate(() =>
        JSON.parse(document.documentElement.dataset.sceneStats),
      );
      results.samples.push({
        configuration: config.name,
        viewport: [config.width, config.height],
        requestedDpr: config.dpr,
        cpuThrottle: config.rate,
        ...sample,
      });
      console.log(config.name, world, JSON.stringify(sample));
    }
    await page.goto(`${base}/#/trail/start`);
    await page.waitForFunction(
      () => document.documentElement.dataset.worldReady === "trail/start",
    );
    await page
      .getByRole("button", { name: "Inspect the Raspberry Pi" })
      .click();
    await pause(900);
    await page.evaluate(() => {
      window.__scaleFrameTimes = [];
      window.__scaleSampling = true;
      let last = performance.now();
      const sample = (time) => {
        if (!window.__scaleSampling) return;
        window.__scaleFrameTimes.push(time - last);
        last = time;
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    const began = Date.now();
    await page.getByRole("button", { name: "Enter the circuitry" }).click();
    await page.waitForURL(/circuit\/board/);
    await page.waitForFunction(
      () => document.documentElement.dataset.worldReady === "circuit/board",
    );
    const timing = await page.evaluate(() => {
      window.__scaleSampling = false;
      const frames = window.__scaleFrameTimes.sort((a, b) => a - b);
      return {
        count: frames.length,
        median: frames[Math.floor(frames.length * 0.5)],
        p95: frames[Math.floor(frames.length * 0.95)],
        max: frames.at(-1),
      };
    });
    results.samples.push({
      configuration: config.name,
      stage: "focus-shrink-arrival",
      elapsedMs: Date.now() - began,
      frameMs: timing,
      cpuThrottle: config.rate,
    });
    console.log(config.name, "focus-shrink-arrival", JSON.stringify(timing));
    await context.close();
  }
  // Separate capture run: recording overhead is excluded from the steady samples.
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    recordVideo: {
      dir: path.join(root, "test-results", "video"),
      size: { width: 1440, height: 1000 },
    },
  });
  const page = await context.newPage();
  await page.goto(base);
  await page.waitForFunction(
    () => document.documentElement.dataset.worldReady === "trail/start",
  );
  await pause(700);
  await page.getByRole("button", { name: "Inspect the Raspberry Pi" }).click();
  await page.mouse.move(450, 550);
  await pause(1300);
  await page.screenshot({ path: path.join(output, "pi-inspection.png") });
  await page.mouse.move(1000, 480, { steps: 40 });
  await pause(1200);
  await page.getByRole("button", { name: "Enter the circuitry" }).click();
  await page.waitForFunction(
    () => Number(document.documentElement.dataset.journeyPhase) > 0.75,
  );
  await page.screenshot({ path: path.join(output, "pi-shrinking.png") });
  await page.waitForURL(/circuit\/board/);
  await page.waitForFunction(
    () => document.documentElement.dataset.worldReady === "circuit/board",
  );
  await pause(800);
  await page.getByRole("button", { name: "Move forward", exact: true }).click();
  await pause(900);
  await page.getByRole("button", { name: "Explore left branch" }).click();
  await pause(900);
  await page.screenshot({ path: path.join(output, "circuit-arrival.png") });
  const video = page.video();
  await context.close();
  await video.saveAs(path.join(output, "pi-scale-transition.webm"));
  await writeFile(
    path.join(root, "docs", "phase2-performance.json"),
    JSON.stringify(results, null, 2) + "\n",
  );
} finally {
  await browser?.close();
  server.kill();
}
