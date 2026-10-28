import { describe, it, expect } from "vitest";
import { Vector3 } from "three";
import { JourneyLease } from "../src/core/journeyLease";
import {
  CIRCUIT_ENTRY,
  MICRO_ENTRY,
  placementMatrix,
  sampleScaleJourney,
} from "../src/pi/scaleJourney";
import { CIRCUIT_SCALE, TRACE_ANCHOR } from "../src/pi/layout";
import { placements } from "../src/core/artifacts";
import { worlds } from "../src/core/worlds";
const start = {
  position: [0, 4, 17] as [number, number, number],
  target: [0, 1, 8] as [number, number, number],
  fov: 54,
};
describe("continuous scale choreography", () => {
  it("registers the exact microscopic handoff pose as the circuit entry", () => {
    expect(worlds.circuit.camera(0)).toEqual(CIRCUIT_ENTRY);
  });
  it("starts at the actual camera pose and ends at the registered trace corridor", () => {
    const item = placements.trail[0],
      first = sampleScaleJourney(0, start, item),
      last = sampleScaleJourney(1, start, item);
    first.position.forEach((n, i) =>
      expect(n).toBeCloseTo(start.position[i], 10),
    );
    const local = new Vector3(...last.position).applyMatrix4(
      placementMatrix(item).invert(),
    );
    local
      .toArray()
      .forEach((n, i) => expect(n).toBeCloseTo(MICRO_ENTRY.position[i], 10));
  });
  it("preserves relative landmark projections across the 100× coordinate handoff", () => {
    for (const point of [
      [-0.47, 0, 0.15],
      [-0.51, 0.003, 0.24],
      [-0.39, 0.003, -0.1],
    ] as [number, number, number][]) {
      const before = new Vector3(...point)
        .sub(new Vector3(...MICRO_ENTRY.position))
        .normalize();
      const after = new Vector3(...point)
        .sub(new Vector3(...TRACE_ANCHOR))
        .multiplyScalar(CIRCUIT_SCALE)
        .sub(new Vector3(...CIRCUIT_ENTRY.position))
        .normalize();
      expect(before.distanceTo(after)).toBeLessThan(1e-10);
    }
  });
  it("keeps the camera above the PCB and finite throughout the shrink", () => {
    const item = placements.trail[0],
      inverse = placementMatrix(item).invert();
    for (let i = 0; i <= 200; i++) {
      const pose = sampleScaleJourney(i / 200, start, item);
      expect(
        [...pose.position, ...pose.target, pose.fov, pose.near].every(
          Number.isFinite,
        ),
      ).toBe(true);
      expect(
        new Vector3(...pose.position).applyMatrix4(inverse).y,
      ).toBeGreaterThan(0.01);
    }
  });
});
describe("interaction leases", () => {
  it("invalidates late module and timeline completions after cancellation", () => {
    const lease = new JourneyLease(),
      token = lease.begin();
    expect(lease.owns(token)).toBe(true);
    lease.cancel();
    expect(lease.owns(token)).toBe(false);
    expect(lease.running).toBe(false);
  });
  it("only the newest interaction can commit, including rapid cancel/restart", () => {
    const lease = new JourneyLease();
    const stale: number[] = [];
    for (let i = 0; i < 100; i++) {
      stale.push(lease.begin());
      lease.cancel();
    }
    const current = lease.begin();
    expect(stale.some((t) => lease.owns(t))).toBe(false);
    expect(lease.owns(current)).toBe(true);
  });
});
