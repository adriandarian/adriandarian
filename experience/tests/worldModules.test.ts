import { describe, it, expect, vi } from "vitest";
import { createWorldLoader } from "../src/core/worldModules";
import { worlds } from "../src/core/worlds";
describe("prefetched world modules", () => {
  it("coalesces in-flight loads and makes the resolved module synchronously readable", async () => {
    const loader = createWorldLoader(),
      module = { default: () => null };
    let resolve!: (value: typeof module) => void;
    const load = vi.fn(
      () =>
        new Promise<typeof module>((done) => {
          resolve = done;
        }),
    );
    const world = { ...worlds.circuit, load };
    expect(loader.get("circuit")).toBeUndefined();
    const first = loader.load(world),
      second = loader.load(world);
    expect(first).toBe(second);
    await Promise.resolve();
    expect(load).toHaveBeenCalledTimes(1);
    resolve(module);
    await first;
    expect(loader.get("circuit")).toBe(module);
    expect(await loader.load(world)).toBe(module);
    expect(load).toHaveBeenCalledTimes(1);
  });
  it("clears failed requests so a later load can retry", async () => {
    const loader = createWorldLoader(),
      module = { default: () => null };
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(module);
    const world = { ...worlds.trail, load };
    await expect(loader.load(world)).rejects.toThrow("offline");
    expect(loader.get("trail")).toBeUndefined();
    expect(await loader.load(world)).toBe(module);
    expect(loader.get("trail")).toBe(module);
  });
});
