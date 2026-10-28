import { test, expect } from "@playwright/test";
test("inspection reveals a detailed mesh, then shrinks without a fullscreen veil", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute(
    "data-world-ready",
    "trail/start",
  );
  await page.getByRole("button", { name: "Inspect the Raspberry Pi" }).click();
  const historyLength = await page.evaluate(() => history.length);
  const sourceModel = JSON.parse(
    (await page.locator("html").getAttribute("data-scene-stats"))!,
  ).model.uuid;
  await page.mouse.move(340, 480);
  await page.waitForTimeout(800);
  await page.screenshot({ path: "test-results/pi-inspect-left.png" });
  await page.mouse.move(1050, 500);
  await page.waitForTimeout(800);
  await page.screenshot({ path: "test-results/pi-inspect-right.png" });
  await page.getByRole("button", { name: "Enter the circuitry" }).click();
  await expect
    .poll(async () =>
      Number(await page.locator("html").getAttribute("data-journey-phase")),
    )
    .toBeGreaterThan(0.55);
  await expect(page.locator(".transition-veil")).toHaveCSS("opacity", "0");
  await page.screenshot({ path: "test-results/pi-shrink.png" });
  await expect(page).toHaveURL(/circuit\/board/);
  await expect(page.locator("html")).toHaveAttribute(
    "data-world-ready",
    "circuit/board",
  );
  expect(await page.locator("canvas").count()).toBe(1);
  await expect
    .poll(
      async () =>
        JSON.parse(
          (await page.locator("html").getAttribute("data-scene-stats"))!,
        ).model.uuid,
    )
    .toBe(sourceModel);
  expect(await page.evaluate(() => history.length)).toBe(historyLength + 1);
  await expect(page.locator(".transition-veil")).toHaveCSS("opacity", "0");
  await page.getByRole("button", { name: "Explore left branch" }).click();
  await page.waitForTimeout(700);
  const stats = JSON.parse(
    (await page.locator("html").getAttribute("data-scene-stats"))!,
  );
  expect(stats.camera.position[0]).toBeLessThan(-1);
});
test("rapid cancels and browser back cannot commit stale journeys", async ({
  page,
}) => {
  await page.goto("/#/notebook/copper");
  await page.evaluate(() => {
    history.pushState(null, "", "#/trail/start");
    window.dispatchEvent(new Event("popstate"));
  });
  await expect(page.locator("html")).toHaveAttribute(
    "data-world-ready",
    "trail/start",
  );
  for (let i = 0; i < 3; i++) {
    await page
      .getByRole("button", { name: "Inspect the Raspberry Pi" })
      .click();
    await page.getByRole("button", { name: "Enter the circuitry" }).click();
    await expect(page.locator("main")).toHaveAttribute("data-busy", "true");
    if (i === 2)
      await page.waitForFunction(
        () => Number(document.documentElement.dataset.journeyPhase) > 0.6,
      );
    await page.keyboard.press("Escape");
    await expect(page.locator("main")).toHaveAttribute("data-busy", "false");
  }
  await page.getByRole("button", { name: "Inspect the Raspberry Pi" }).click();
  await page.getByRole("button", { name: "Enter the circuitry" }).click();
  await page.goBack();
  await expect(page).toHaveURL(/notebook\/copper/);
  await expect(page.locator("html")).toHaveAttribute(
    "data-world-ready",
    "notebook/copper",
  );
  await expect
    .poll(
      async () =>
        JSON.parse(
          (await page.locator("html").getAttribute("data-scene-stats"))!,
        ).camera.near,
    )
    .toBe(0.01);
  await page.waitForTimeout(4600);
  await expect(page).toHaveURL(/notebook\/copper/);
  await expect(page.locator("main")).toHaveAttribute("data-busy", "false");
});

test("late destination import cannot navigate after Escape", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requested = false;
  await page.route("**/assets/Circuit-*.js", async (route) => {
    requested = true;
    await gate;
    await route.continue();
  });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute(
    "data-world-ready",
    "trail/start",
  );
  await page.getByRole("button", { name: "Inspect the Raspberry Pi" }).click();
  await page.getByRole("button", { name: "Enter the circuitry" }).click();
  await expect.poll(() => requested).toBe(true);
  await page.keyboard.press("Escape");
  release();
  await page.waitForTimeout(4600);
  await expect(page).toHaveURL(/trail\/start/);
  await expect(page.locator("main")).toHaveAttribute("data-busy", "false");
});

test("repeated notebook visits release the shared board and stabilize GPU resources", async ({
  page,
}) => {
  test.setTimeout(45000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const samples: number[] = [];
  for (let i = 0; i < 4; i++) {
    await expect(page.locator("html")).toHaveAttribute(
      "data-world-ready",
      "trail/start",
    );
    await page.locator("#discoveries summary").click();
    await page
      .locator("#discoveries")
      .getByRole("button", { name: /Field notebook/ })
      .click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-world-ready",
      "notebook/field",
    );
    await expect
      .poll(
        async () =>
          JSON.parse(
            (await page.locator("html").getAttribute("data-scene-stats"))!,
          ).model.calls,
      )
      .toBe(0);
    await page.locator("#discoveries summary").click();
    await page
      .locator("#discoveries")
      .getByRole("button", { name: /Pressed leaf/ })
      .click();
    await page
      .getByRole("link", { name: "Adrian's universe, trail entrance" })
      .click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-world-ready",
      "trail/start",
    );
    samples.push(
      JSON.parse((await page.locator("html").getAttribute("data-scene-stats"))!)
        .geometries,
    );
  }
  console.log("Full board unload/reload geometry samples:", samples);
  expect(Math.max(...samples) - Math.min(...samples)).toBeLessThanOrEqual(1);
});
