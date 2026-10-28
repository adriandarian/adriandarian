import { expect, test, type Page } from "@playwright/test";
async function ready(page: Page, route: string) {
  await expect(page.locator("html")).toHaveAttribute("data-world-ready", route);
  await expect(page.locator(".transition-veil")).toHaveCSS("opacity", "0");
}
async function openObject(page: Page, name: string) {
  const details = page.locator("#discoveries");
  if (!((await details.getAttribute("open")) !== null))
    await details.locator("summary").click();
  await details.getByRole("button", { name: new RegExp(name) }).click();
}

test("skip link focuses the expanded object list without changing world or history", async ({
  page,
}) => {
  await page.goto("/#/circuit/bookmark");
  await ready(page, "circuit/bookmark");
  const historyLength = await page.evaluate(() => history.length);
  const skip = page.getByRole("link", { name: "Skip to objects" });
  await skip.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#discoveries")).toHaveAttribute("open", "");
  await expect(
    page.getByRole("region", { name: "Objects in this world" }),
  ).toBeFocused();
  await expect(page).toHaveURL(/#\/circuit\/bookmark$/);
  await expect(page.locator("main")).toHaveAttribute("data-world", "circuit");
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
  await page.keyboard.press("Tab");
  await expect(
    page
      .locator("#discoveries")
      .getByRole("button", { name: /Signal laboratory/ }),
  ).toBeFocused();
});

test("deep-link movement controls start at the camera entry and can move backward", async ({
  page,
}) => {
  await page.goto("/#/circuit/bookmark");
  await ready(page, "circuit/bookmark");
  await expect(page.locator(".movement b")).toHaveAttribute(
    "style",
    "width: 62%;",
  );
  const backward = page.getByRole("button", { name: "Move backward" });
  await expect(backward).toBeEnabled();
  await backward.click();
  await expect(page.locator(".movement b")).toHaveAttribute(
    "style",
    "width: 53%;",
  );
  await expect(page).toHaveURL(/#\/circuit\/bookmark$/);
});
test("real WebGL scene, guided movement, spatial portal, history and contextual notebook", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await expect
    .poll(() => page.locator("html").getAttribute("data-scene-stats"))
    .not.toBeNull();
  await ready(page, "trail/start");
  await page.screenshot({ path: "test-results/trail-start.png" });
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".movement b")).toHaveAttribute(
    "style",
    "width: 7%;",
  );
  await page.mouse.move(740, 550);
  await page.mouse.wheel(0, 500);
  await expect(page.locator(".movement b")).not.toHaveAttribute(
    "style",
    "width: 0%;",
  );
  await page.screenshot({ path: "test-results/trail-moved.png" });
  await openObject(page, "Raspberry Pi");
  await expect(page.locator("main")).toHaveAttribute("data-busy", "true");
  await expect(page).toHaveURL(/circuit\/board/);
  await expect(
    page.getByRole("heading", { name: "Inside the circuit" }),
  ).toBeVisible();
  await expect(page.locator("main")).toHaveAttribute("data-busy", "false");
  await ready(page, "circuit/board");
  const stats = JSON.parse(
    (await page.locator("html").getAttribute("data-scene-stats"))!,
  );
  expect(stats.background).toBe("071e23");
  expect(stats.withinBudget).toBe(true);
  console.log("Circuit budget:", stats);
  await page.screenshot({ path: "test-results/circuit-entry.png" });
  await openObject(page, "Signal laboratory");
  await page.getByRole("button", { name: "Send a pulse" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Pulse received" }),
  ).toHaveText("Pulse received at output A.");
  await page.getByRole("radio", { name: "B", exact: true }).check();
  await page.getByRole("button", { name: "Send a pulse" }).click();
  await expect(page.getByText("Pulse received at output B.")).toBeVisible();
  await page.getByLabel("Gate open").uncheck();
  await page.getByRole("button", { name: "Send a pulse" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Pulse stopped" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close object" }).click();
  await openObject(page, "Field notebook");
  await expect(page).toHaveURL(/notebook\/copper/);
  await ready(page, "notebook/copper");
  await page.screenshot({ path: "test-results/notebook-copper.png" });
  await page.goBack();
  await expect(page).toHaveURL(/circuit\/board/);
  await page.goBack();
  await expect(page).toHaveURL(/trail\/start/);
  await page.goForward();
  await expect(page).toHaveURL(/circuit\/board/);
  expect(errors).toEqual([]);
});
test("interrupted travel does not commit a late route; repeated unloads stabilize resources", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("canvas")).toBeVisible();
  await openObject(page, "Raspberry Pi");
  await page.keyboard.press("Escape");
  await expect(page.locator("main")).toHaveAttribute("data-busy", "false");
  await page.waitForTimeout(2400); // Exceeds original transition, catches stale callbacks.
  await expect(page).toHaveURL(/trail\/start/);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const samples: number[] = [];
  for (let i = 0; i < 5; i++) {
    await openObject(page, "Raspberry Pi");
    await expect(page).toHaveURL(/circuit\/board/);
    await openObject(page, "Pressed leaf");
    await expect(page).toHaveURL(/trail\/board/);
    await ready(page, "trail/board");
    await expect
      .poll(async () => {
        const data = await page
          .locator("html")
          .getAttribute("data-scene-stats");
        return data ? JSON.parse(data).geometries : 0;
      })
      .toBeGreaterThan(100);
    const data = JSON.parse(
      (await page.locator("html").getAttribute("data-scene-stats"))!,
    );
    expect(data.withinBudget).toBe(true);
    samples.push(data.geometries);
  }
  console.log("Trail geometry samples:", samples);
  expect(Math.max(...samples) - Math.min(...samples)).toBeLessThanOrEqual(1);
  expect(samples.at(-1)!).toBeLessThanOrEqual(samples[0] + 1);
});
test("reduced motion, mobile controls, deep links and WebGL recovery", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/notebook/field");
  await expect(page.getByText("Gathered along the path")).toBeVisible();
  await page.getByRole("button", { name: "Move forward" }).click();
  await openObject(page, "Copper bookmark");
  await expect(page).toHaveURL(/circuit\/bookmark/);
  await expect(page.locator("main")).toHaveAttribute("data-busy", "false");
  await ready(page, "circuit/bookmark");
  await page.screenshot({ path: "test-results/mobile-circuit.png" });
  await page.evaluate(() => {
    document
      .querySelector("canvas")
      ?.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  });
  await expect(
    page.getByRole("heading", { name: "The worlds are still connected." }),
  ).toBeVisible();
  await openObject(page, "Field notebook");
  await expect(page).toHaveURL(/notebook\/copper/);
  await page.getByRole("button", { name: "Wayfinder" }).click();
  await page.getByRole("button", { name: "01 The mountain trail" }).click();
  await expect(page).toHaveURL(/trail\/start/);
});

test("raycasts the physical board mesh and focuses it before the world changes", async ({
  page,
}) => {
  await page.goto("/");
  await ready(page, "trail/start");
  // Coordinates come from the inspected 1440×1000 rendered trail capture.
  await page.mouse.move(645, 380);
  await expect(page.locator(".hover-prompt")).toContainText("A smaller world");
  await page.mouse.click(645, 380);
  await expect(page.locator("main")).toHaveAttribute("data-busy", "true");
  await page.waitForTimeout(900); // Capture the physical approach before the covered boundary.
  await expect(page).toHaveURL(/trail\/start/);
  await page.screenshot({ path: "test-results/board-approach.png" });
  await expect(page).toHaveURL(/circuit\/board/);
  await ready(page, "circuit/board");
});

test("WebGL construction failure preserves the accessible graph", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      type: string,
      ...args: unknown[]
    ) {
      if (type.startsWith("webgl")) return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "The worlds are still connected." }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openObject(page, "Raspberry Pi");
  await expect(page).toHaveURL(/circuit\/board/);
  await openObject(page, "Signal laboratory");
  await page.getByRole("button", { name: "Send a pulse" }).click();
  await expect(page.getByText("Pulse received at output A.")).toBeVisible();
});

test("touch drag advances the camera without activating objects", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto("/");
  await ready(page, "trail/start");
  const cdp = await context.newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 190, y: 550 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 190, y: 490 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 190, y: 420 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.locator(".movement b")).not.toHaveAttribute(
    "style",
    "width: 0%;",
  );
  await expect(page).toHaveURL(/trail\/start/);
  await expect(page.locator("main")).toHaveAttribute("data-busy", "false");
  await context.close();
});
