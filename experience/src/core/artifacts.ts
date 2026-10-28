import type { ArtifactId, Placement, WorldId } from "./types";
export const artifacts: Record<
  ArtifactId,
  { name: string; kind: "travel" | "inspect" }
> = {
  pi: { name: "Raspberry Pi", kind: "travel" },
  notebook: { name: "Field notebook", kind: "travel" },
  cafe: { name: "The café at the bend", kind: "inspect" },
  signal: { name: "Signal laboratory", kind: "inspect" },
  "trail-thread": { name: "Pressed leaf", kind: "travel" },
  "circuit-thread": { name: "Copper bookmark", kind: "travel" },
};
export const placements: Record<WorldId, Placement[]> = {
  trail: [
    {
      id: "pi",
      position: [2.2, 1.35, 3],
      rotation: [0, -0.3, 0],
      scale: 1.6,
      label: "A smaller world",
    },
    {
      id: "notebook",
      position: [-2.8, 1.1, -4],
      rotation: [0, 0.3, 0],
      label: "Something to remember",
    },
    { id: "cafe", position: [0, 1.5, -23], label: "The café at the bend" },
  ],
  circuit: [
    { id: "signal", position: [-3.2, 1.4, -5], label: "Follow a signal" },
    {
      id: "notebook",
      position: [3, 1.25, -11],
      rotation: [0, -0.4, 0],
      scale: 1.8,
      label: "A familiar notebook",
    },
    {
      id: "trail-thread",
      position: [3.5, 1.3, 4],
      label: "A trace of the trail",
    },
  ],
  notebook: [
    {
      id: "trail-thread",
      position: [-2, 0.4, 0],
      label: "Return to the trail",
    },
    {
      id: "circuit-thread",
      position: [2, 0.4, 0],
      label: "Follow the copper thread",
    },
  ],
};
export function validatePlacements(items: Placement[]) {
  const seen = new Set<string>();
  for (const item of items) {
    if (!artifacts[item.id]) throw new Error(`Unknown artifact: ${item.id}`);
    if (seen.has(item.id)) throw new Error(`Duplicate placement: ${item.id}`);
    if (!item.position.every(Number.isFinite))
      throw new Error(`Invalid position: ${item.id}`);
    seen.add(item.id);
  }
  return true;
}
