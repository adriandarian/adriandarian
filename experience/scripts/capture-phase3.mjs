import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url)),
  out = path.join(root, "docs/media/phase3a");
await mkdir(out, { recursive: true });
const server = spawn(
  process.execPath,
  [
    path.join(root, "node_modules/vite/bin/vite.js"),
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4178",
    "--strictPort",
  ],
  { cwd: root, windowsHide: true, stdio: "ignore" },
);
let browser;
const base = "http://127.0.0.1:4178",
  pause = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    await pause(100);
  }
  browser = await chromium.launch({
    headless: true,
    args: ["--use-angle=d3d11", "--enable-webgl", "--ignore-gpu-blocklist"],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: path.join(root, "test-results/phase3-video"),
      size: { width: 1280, height: 720 },
    },
  });
  const page = await context.newPage(),
    video = page.video();
  await page.goto(base);
  const ready = (world) =>
    page.waitForFunction(
      (w) => document.documentElement.dataset.worldReady === w,
      world,
    );
  const stats = () =>
    page.evaluate(() =>
      JSON.parse(document.documentElement.dataset.sceneStats),
    );
  const arrived = () =>
    page.waitForFunction(
      () => {
        const s = JSON.parse(
          document.documentElement.dataset.circuitTravel || "{}",
        );
        return s.distance >= s.length - 0.02 && s.speed === 0;
      },
      {},
      { timeout: 60000 },
    );
  await ready("trail/start");
  await page.getByRole("button", { name: "Inspect the Raspberry Pi" }).click();
  await pause(700);
  await page.getByRole("button", { name: "Enter the circuitry" }).click();
  await ready("circuit/board");
  const entry = await stats();
  await page.screenshot({ path: path.join(out, "entry.png") });
  await page.locator(".branch-controls summary").click();
  await page
    .getByRole("button", { name: "Workshop trace", exact: true })
    .click();
  let start = Date.now();
  await page.keyboard.press("End");
  await arrived();
  const workshopMs = Date.now() - start;
  await page.locator(".branch-controls summary").click();
  await pause(700);
  await page.screenshot({ path: path.join(out, "workshop.png") });
  for (const name of ["gate", "branch", "send"]) {
    const target = (await stats()).targets[name];
    await page.mouse.click(target.x, target.y);
    await pause(400);
  }
  await page.locator(".branch-controls summary").click();
  await page
    .getByRole("button", { name: "Connector detour", exact: true })
    .click();
  await page.waitForFunction(
    () => {
      const s = JSON.parse(
        document.documentElement.dataset.circuitTravel || "{}",
      );
      return s.branch === "notebook" && !s.pending;
    },
    {},
    { timeout: 30000 },
  );
  start = Date.now();
  await page.keyboard.press("End");
  await arrived();
  const detourMs = Date.now() - start;
  await page.locator(".branch-controls summary").click();
  await pause(700);
  const notebook = await stats();
  await page.screenshot({ path: path.join(out, "notebook.png") });
  const target = notebook.targets.notebook;
  await page.mouse.click(target.x, target.y);
  await page.waitForURL(/notebook\/copper/);
  await ready("notebook/copper");
  await pause(500);
  await page.goBack();
  await ready("circuit/board");
  await pause(700);
  const restored = await page.evaluate(() =>
    JSON.parse(document.documentElement.dataset.circuitTravel),
  );
  await context.close();
  await copyFile(await video.path(), path.join(out, "visitor-traversal.webm"));
  await writeFile(
    path.join(out, "capture.json"),
    JSON.stringify(
      {
        method:
          "Actual DOM, keyboard and physical-mesh inputs; video recording separate from performance traces",
        renderer: entry.renderer,
        workshopMs,
        optionalDetourFromJunctionMs: detourMs,
        entry,
        notebook,
        restored,
        physicalPhone: false,
      },
      null,
      2,
    ) + "\n",
  );
  console.log("Captured real traversal:", {
    workshopMs,
    detourMs,
    renderer: entry.renderer,
  });
} finally {
  await browser?.close();
  server.kill();
}
