import { test, expect, type Page } from "@playwright/test";
const stats = async (page: Page) =>
  JSON.parse((await page.locator("html").getAttribute("data-scene-stats"))!);
const travel = async (page: Page) =>
  JSON.parse((await page.locator("html").getAttribute("data-circuit-travel"))!);
async function ready(page: Page) {
  await page.goto("/#/circuit/board");
  await expect(page.locator("html")).toHaveAttribute(
    "data-world-ready",
    "circuit/board",
  );
  await page.locator(".branch-controls summary").click();
}
for (const [entry, branch, distance] of [
  ["board", "workshop", 30],
  ["bookmark", "notebook", 100],
] as const) {
  test(`reload preserves saved ${branch} travel on ${entry} entry`, async ({
    page,
  }) => {
    await page.goto(`/#/circuit/${entry}`);
    await expect(page.locator("html")).toHaveAttribute(
      "data-world-ready",
      `circuit/${entry}`,
    );
    await page.evaluate(
      ({ branch, distance }) =>
        history.replaceState(
          { circuitTravel: { branch, distance, heading: 0.2 } },
          "",
        ),
      { branch, distance },
    );
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute(
      "data-world-ready",
      `circuit/${entry}`,
    );
    const restored = await travel(page);
    expect(restored.branch).toBe(branch);
    expect(restored.distance).toBeCloseTo(distance, 5);
    expect(restored.target).toBeCloseTo(distance, 5);
    expect(restored.speed).toBe(0);
    await expect(
      page.getByRole("button", { name: "Move backward", exact: true }),
    ).toBeEnabled();
    await page.waitForTimeout(800);
    expect((await travel(page)).distance).toBeCloseTo(distance, 5);
    expect(
      await page
        .locator(".movement b")
        .evaluate((el) => parseFloat((el as HTMLElement).style.width)),
    ).toBeCloseTo((distance / restored.length) * 100, 2);
  });
}
test("reselecting workshop cancels the pending notebook return", async ({
  page,
}) => {
  await ready(page);
  await page.evaluate(() =>
    history.replaceState(
      { circuitTravel: { branch: "workshop", distance: 35, heading: 0 } },
      "",
    ),
  );
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute(
    "data-world-ready",
    "circuit/board",
  );
  await page.locator(".branch-controls summary").click();
  await page
    .getByRole("button", { name: "Connector detour", exact: true })
    .click();
  await expect.poll(async () => (await travel(page)).pending).toBe("notebook");
  await page
    .getByRole("button", { name: "Workshop trace", exact: true })
    .click();
  await expect.poll(async () => (await travel(page)).pending).toBeNull();
  await expect.poll(async () => (await travel(page)).speed).toBe(0);
  const stopped = await travel(page);
  await page.waitForTimeout(800);
  expect((await travel(page)).distance).toBeCloseTo(stopped.distance, 5);
  expect((await travel(page)).branch).toBe("workshop");
  await page.locator(".scene").focus();
  await page.keyboard.press("End");
  await expect
    .poll(
      async () => {
        const s = await travel(page);
        return s.length - s.distance;
      },
      { timeout: 15000 },
    )
    .toBeLessThan(0.02);
  expect((await travel(page)).branch).toBe("workshop");
});
test("workshop is independently reachable, physical controls work, and cancellation stops a branch return", async ({
  page,
}) => {
  test.setTimeout(90000);
  await ready(page);
  const entry = await stats(page);
  expect(entry.camera.direction[0]).toBeCloseTo(0, 2);
  expect(entry.camera.position[0]).toBe(0);
  await page
    .getByRole("button", { name: "Workshop trace", exact: true })
    .click();
  await page.keyboard.press("End");
  await expect
    .poll(
      async () => {
        const s = await travel(page);
        return s.length - s.distance;
      },
      { timeout: 35000 },
    )
    .toBeLessThan(0.05);
  await page.getByRole("button", { name: "Center view" }).click();
  await expect
    .poll(async () => (await stats(page)).targets.send.inFrustum)
    .toBe(true);
  await page.locator(".branch-controls summary").click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: "test-results/phase3-workshop.png" });
  const gate = (await stats(page)).targets.gate;
  await page.mouse.click(gate.x, gate.y);
  await page.locator("#discoveries summary").click();
  await page
    .locator("#discoveries")
    .getByRole("button", { name: /Signal laboratory/ })
    .click();
  await expect(page.getByLabel("Gate open")).not.toBeChecked();
  await page.getByRole("button", { name: "Send a pulse" }).click();
  await expect(
    page.getByText("Pulse stopped at the closed gate."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close object" }).click();
  await page.locator(".branch-controls summary").click();
  await page
    .getByRole("button", { name: "Connector detour", exact: true })
    .click();
  await expect.poll(async () => (await travel(page)).pending).toBe("notebook");
  await page.keyboard.press("ArrowDown");
  await expect.poll(async () => (await travel(page)).pending).toBeNull();
  await page.keyboard.press("Escape");
  await expect.poll(async () => (await travel(page)).speed).toBe(0);
  const stopped = await travel(page);
  await page.waitForTimeout(600);
  expect((await travel(page)).distance).toBeCloseTo(stopped.distance, 1);
  expect((await travel(page)).pending).toBeNull();
});
test("optional notebook detour has visible arrival, real mesh travel and history restores visited position", async ({
  page,
}) => {
  test.setTimeout(110000);
  await ready(page);
  await page
    .getByRole("button", { name: "Connector detour", exact: true })
    .click();
  await page.keyboard.press("End");
  await expect
    .poll(
      async () => {
        const s = await travel(page);
        return s.length - s.distance;
      },
      { timeout: 70000 },
    )
    .toBeLessThan(0.05);
  await page.getByRole("button", { name: "Center view" }).click();
  await expect
    .poll(async () => (await stats(page)).targets.notebook.inFrustum)
    .toBe(true);
  await page.screenshot({ path: "test-results/phase3-notebook.png" });
  const before = await travel(page),
    length = await page.evaluate(() => history.length);
  const book = (await stats(page)).targets.notebook;
  await page.mouse.click(book.x, book.y);
  await expect(page).toHaveURL(/notebook\/copper/);
  await page.goBack();
  await expect(page.locator("html")).toHaveAttribute(
    "data-world-ready",
    "circuit/board",
  );
  await expect.poll(async () => (await travel(page)).branch).toBe("notebook");
  expect((await travel(page)).distance).toBeCloseTo(before.distance, 1);
  expect((await travel(page)).speed).toBe(0);
  expect(await page.evaluate(() => history.length)).toBe(length + 1);
});
test("touch movement can be stopped and reduced-motion routes preserve accessible destinations", async ({
  browser,
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await ready(page);
  await page.locator(".branch-controls summary").click();
  const cdp = await context.newCDPSession(page);
  for (const [type, y] of [
    ["touchStart", 470],
    ["touchMove", 410],
    ["touchMove", 340],
    ["touchEnd", 0],
  ] as const)
    await cdp.send("Input.dispatchTouchEvent", {
      type,
      touchPoints: type === "touchEnd" ? [] : [{ x: 190, y }],
    });
  await expect
    .poll(async () => (await travel(page)).distance)
    .toBeGreaterThan(0);
  await page.locator(".branch-controls summary").click();
  await page.getByRole("button", { name: "Stop movement" }).click();
  await page.waitForTimeout(200);
  const stopped = (await travel(page)).distance;
  await page.waitForTimeout(400);
  expect((await travel(page)).distance).toBeCloseTo(stopped, 2);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByRole("button", { name: "Connector detour", exact: true })
    .click();
  await page.locator(".scene").focus();
  await page.keyboard.press("End");
  await expect
    .poll(async () => {
      const s = await travel(page);
      return s.length - s.distance;
    })
    .toBeLessThan(0.01);
  await page.locator("#discoveries summary").click();
  await page
    .locator("#discoveries")
    .getByRole("button", { name: /Field notebook/ })
    .click();
  await expect(page).toHaveURL(/notebook\/copper/);
  await context.close();
});
