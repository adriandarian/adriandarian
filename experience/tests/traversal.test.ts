import { describe, it, expect } from "vitest";
import {
  paths,
  obstacles,
  BODY,
  sweptClear,
  createTravel,
  advanceTravel,
  selectBranch,
  stopTravel,
  junction,
  positionAt,
  restoreTravel,
  snapshot,
  travelPose,
} from "../src/circuit/traversal";
import { CIRCUIT_ENTRY } from "../src/pi/layout";
describe("PCB traversal acceptance", () => {
  it("certifies the complete rounded paths for a swept upright body", () => {
    for (const path of Object.values(paths))
      for (let i = 1; i < path.samples.length; i++)
        expect(sweptClear(path.samples[i - 1], path.samples[i])).toBe(true);
    expect(BODY.radius).toBe(0.6);
    expect(paths.notebook.length).toBeGreaterThan(paths.workshop.length * 3);
  });
  it("rejects wall crossing, radius grazing and a direct ribbon shortcut", () => {
    expect(sweptClear([60, 6], [98, 6])).toBe(false);
    expect(sweptClear([100.6, -8], [100.6, 10])).toBe(false);
    expect(sweptClear([98, -5], [98, -13])).toBe(true);
    expect(obstacles.find((o) => o.name === "processor")!.min[0]).toBeCloseTo(
      18,
    );
  });
  it("retains the exact handoff until a visitor moves or looks", () =>
    expect(travelPose(createTravel())).toEqual(CIRCUIT_ENTRY));
  it("rounds every moving corner, including the shared branch junction", () => {
    for (const path of Object.values(paths))
      for (let i = 1; i < path.samples.length - 1; i++) {
        const a = path.samples[i - 1],
          b = path.samples[i],
          c = path.samples[i + 1],
          u = [b[0] - a[0], b[1] - a[1]],
          v = [c[0] - b[0], c[1] - b[1]],
          angle = Math.acos(
            Math.max(
              -1,
              Math.min(
                1,
                (u[0] * v[0] + u[1] * v[1]) /
                  (Math.hypot(...u) * Math.hypot(...v)),
              ),
            ),
          );
        expect(angle).toBeLessThan(0.2);
      }
  });
  it("changes branches through the shared junction without a teleport", () => {
    const s = createTravel();
    s.distance = s.target = paths.workshop.length;
    selectBranch(s, "notebook");
    expect(s.pending).toBe("notebook");
    expect(s.target).toBe(junction);
    let previous = positionAt(s.branch, s.distance);
    for (let i = 0; i < 1500 && s.pending; i++) {
      advanceTravel(s, 0.016, false);
      const next = positionAt(s.branch, s.distance);
      expect(
        Math.hypot(next[0] - previous[0], next[1] - previous[1]),
      ).toBeLessThanOrEqual(18 * 0.016 + 0.001);
      previous = next;
    }
    expect(s.branch).toBe("notebook");
    expect(s.distance).toBeCloseTo(junction);
    expect(s.speed).toBe(0);
  });
  it("stops immediately and does not resume on subsequent frames", () => {
    const s = createTravel();
    s.target = paths.workshop.length;
    for (let i = 0; i < 40; i++) advanceTravel(s, 0.016, false);
    stopTravel(s);
    const frozen = snapshot(s);
    for (let i = 0; i < 100; i++) advanceTravel(s, 0.016, false);
    expect(snapshot(s)).toEqual(frozen);
    expect(s.pending).toBeNull();
  });
  it("restores actual visited position, never a pending journey", () => {
    const s = createTravel();
    s.distance = 12;
    s.target = 40;
    s.speed = 9;
    const restored = restoreTravel(snapshot(s), "board");
    expect(restored.distance).toBe(12);
    expect(restored.target).toBe(12);
    expect(restored.speed).toBe(0);
    expect(
      restoreTravel({ branch: "notebook", distance: Infinity }, "board"),
    ).toEqual(createTravel());
  });
  it("clamps frame stalls and supports deliberate reduced-motion steps", () => {
    const s = createTravel();
    s.target = 10;
    advanceTravel(s, 1, false);
    expect(s.distance).toBeLessThan(0.1);
    advanceTravel(s, 0.016, true);
    expect(s.distance).toBe(10);
  });
  it("brakes before reversing direction rather than flipping velocity", () => {
    const s = createTravel();
    s.target = 30;
    for (let i = 0; i < 50; i++) advanceTravel(s, 0.016, false);
    const before = s.speed;
    s.target = 0;
    advanceTravel(s, 0.016, false);
    expect(s.speed).toBeGreaterThan(0);
    expect(before - s.speed).toBeLessThanOrEqual(32 * 0.016 + 0.0001);
  });
});
