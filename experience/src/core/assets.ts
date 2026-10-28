import type { WorldId } from "./types";
// World-scoped inventory. No remote textures/models are needed for Phase 1.
// Future asset imports belong in their owning world's lazy module.
export const assetManifest: Record<
  WorldId,
  {
    source: "procedural";
    maxDrawCalls: number;
    maxTriangles: number;
    maxTextures: number;
    maxDpr: number;
  }
> = {
  trail: {
    source: "procedural",
    maxDrawCalls: 450,
    maxTriangles: 60000,
    maxTextures: 0,
    maxDpr: 1.5,
  },
  circuit: {
    source: "procedural",
    maxDrawCalls: 400,
    maxTriangles: 50000,
    maxTextures: 0,
    maxDpr: 1.5,
  },
  notebook: {
    source: "procedural",
    maxDrawCalls: 100,
    maxTriangles: 10000,
    maxTextures: 0,
    maxDpr: 1.5,
  },
};
export function checkBudget(
  world: WorldId,
  sample: { calls: number; triangles: number; textures: number },
) {
  const budget = assetManifest[world];
  return (
    sample.calls <= budget.maxDrawCalls &&
    sample.triangles <= budget.maxTriangles &&
    sample.textures <= budget.maxTextures
  );
}
