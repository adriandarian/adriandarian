import { circuitPose } from "../pi/layout";
import { placements } from "./artifacts";
import type { WorldDefinition, WorldId } from "./types";
export const pathX = (z: number) => Math.sin((z + 5) * 0.16) * 2.4;
export const worlds: Record<WorldId, WorldDefinition> = {
  trail: {
    id: "trail",
    title: "The mountain trail",
    subtitle: "Every path holds a smaller world.",
    color: "#dbe2d6",
    entries: { start: 0, board: 0.18, notebook: 0.48 },
    placements: placements.trail,
    camera: (p) => {
      const z = 17 - p * 37;
      return {
        position: [pathX(z) + 0.9, 4.2 + Math.sin(p * Math.PI) * 0.5, z],
        target: [pathX(z - 9), 1.2, z - 9],
        fov: 54,
      };
    },
    load: () => import("../worlds/Trail"),
    transitions: { pi: { kind: "board", duration: 4.2, cover: "#0d3434" } },
  },
  circuit: {
    id: "circuit",
    title: "Inside the circuit",
    subtitle: "Small things. Endless possibilities.",
    color: "#071e23",
    entries: { board: 0, bookmark: 0.62 },
    placements: placements.circuit,
    camera: circuitPose,
    load: () => import("../worlds/Circuit"),
  },
  notebook: {
    id: "notebook",
    title: "Between the pages",
    subtitle: "A place to hold the threads.",
    color: "#d7c7a4",
    entries: { field: 0.1, copper: 0.7 },
    placements: placements.notebook,
    camera: (p) => ({
      position: [Math.sin(p * 2 - 1) * 3, 7, 7 - p * 3],
      target: [0, 0, -0.5],
      fov: 48,
    }),
    load: () => import("../worlds/Notebook"),
  },
};
