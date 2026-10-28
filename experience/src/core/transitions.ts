import type { ArtifactId, TransitionSpec, WorldDefinition } from "./types";
const paper: TransitionSpec = {
  kind: "paper",
  duration: 1.1,
  cover: "#dfd1ad",
};
export function transitionFor(
  world: WorldDefinition,
  artifact: ArtifactId,
): TransitionSpec {
  return world.transitions?.[artifact] ?? paper;
}
