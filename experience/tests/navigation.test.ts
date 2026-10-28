import { describe, expect, it } from "vitest";
import {
  destination,
  entries,
  graph,
  home,
  parseRoute,
  routeHash,
} from "../src/core/navigation";
import {
  artifacts,
  placements,
  validatePlacements,
} from "../src/core/artifacts";
import { worlds } from "../src/core/worlds";
import type { Route, WorldId } from "../src/core/types";

describe("static-host-safe navigation", () => {
  it("round trips every supported deep link", () => {
    for (const [world, points] of Object.entries(entries))
      for (const entry of points) {
        const route = { world: world as WorldId, entry };
        expect(parseRoute(routeHash(route))).toEqual(route);
      }
  });
  it("recovers invalid, malformed and prototype-property routes", () => {
    for (const hash of [
      "",
      "#/missing/start",
      "#/trail/missing",
      "#/constructor/start",
      "#/toString/start",
      "#/%invalid",
    ])
      expect(parseRoute(hash)).toEqual(home);
  });
  it("gives the recurring notebook context-specific entry points", () => {
    expect(destination("trail", "notebook")).toEqual({
      world: "notebook",
      entry: "field",
    });
    expect(destination("circuit", "notebook")).toEqual({
      world: "notebook",
      entry: "copper",
    });
  });
  it("has valid graph destinations, camera entries, and outgoing recovery paths", () => {
    for (const route of Object.values(graph) as Route[]) {
      expect(entries[route.world]).toContain(route.entry);
      expect(worlds[route.world].entries[route.entry]).toBeGreaterThanOrEqual(
        0,
      );
    }
    for (const world of Object.keys(entries) as WorldId[])
      expect(
        placements[world].some((item) => destination(world, item.id)),
      ).toBe(true);
  });
  it("connects every world back to the trail without requiring browser history", () => {
    const visit = (world: WorldId, seen = new Set<WorldId>()): boolean => {
      if (world === "trail") return true;
      if (seen.has(world)) return false;
      seen.add(world);
      return placements[world].some((item) => {
        const next = destination(world, item.id);
        return next && visit(next.world, seen);
      });
    };
    for (const world of Object.keys(entries) as WorldId[])
      expect(visit(world)).toBe(true);
  });
});
describe("artifact registration", () => {
  it("validates independent placements and the shared notebook identity", () => {
    for (const items of Object.values(placements))
      expect(validatePlacements(items)).toBe(true);
    expect(
      placements.trail.find((p) => p.id === "notebook")?.position,
    ).not.toEqual(
      placements.circuit.find((p) => p.id === "notebook")?.position,
    );
  });
  it("rejects collisions, missing identities and non-finite positions", () => {
    const item = placements.trail[0];
    expect(() => validatePlacements([item, item])).toThrow("Duplicate");
    expect(() =>
      validatePlacements([{ ...item, id: "missing" as typeof item.id }]),
    ).toThrow("Unknown");
    expect(() =>
      validatePlacements([{ ...item, position: [NaN, 0, 0] }]),
    ).toThrow("Invalid");
  });
  it("provides a connection for every travel artifact placement", () => {
    for (const [world, items] of Object.entries(placements))
      for (const item of items) {
        if (artifacts[item.id].kind === "travel")
          expect(destination(world as WorldId, item.id)).toBeDefined();
      }
  });
  it("produces finite camera poses throughout every world", () => {
    for (const world of Object.values(worlds))
      for (const p of [0, 0.25, 0.5, 0.75, 1]) {
        const pose = world.camera(p);
        expect(
          [...pose.position, ...pose.target, pose.fov].every(Number.isFinite),
        ).toBe(true);
        expect(pose.position).not.toEqual(pose.target);
      }
  });
});
