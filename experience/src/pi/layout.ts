import type { Point, Pose } from "../core/types";
// Original, procedural Raspberry Pi-inspired study; not a hardware CAD replica.
export const CIRCUIT_SCALE = 100;
export const TRACE_ANCHOR: Point = [-0.47, 0, 0.24];
export const BOARD_BUDGET = {
  maxDrawCalls: 48,
  maxTriangles: 18000,
  maxTextures: 0,
  maxTextureBytes: 0,
  maxModuleGzipBytes: 8000,
};
export type Part = { position: Point; size: Point; rotation?: number };
export type Trace = {
  points: [number, number][];
  width: number;
  live?: boolean;
};
export const traces: Trace[] = [
  ...[-0.55, -0.51, -0.47, -0.43, -0.39].map((x, i) => ({
    points: [
      [x, 0.47],
      [x, -0.27],
      [x + 0.1, -0.37],
    ] as [number, number][],
    width: i === 2 ? 0.008 : 0.004,
    live: i % 2 === 0,
  })),
  {
    points: [
      [-0.55, 0.19],
      [-0.61, 0.19],
      [-0.66, 0.12],
      [-0.66, -0.14],
    ],
    width: 0.006,
    live: true,
  },
  {
    points: [
      [-0.43, 0.13],
      [-0.35, 0.13],
      [-0.31, 0.2],
      [0.15, 0.2],
      [0.25, 0.3],
      [0.58, 0.3],
    ],
    width: 0.006,
    live: true,
  },
  ...Array.from({ length: 12 }, (_, i) => ({
    points: [
      [-0.27 + i * 0.022, -0.22],
      [-0.27 + i * 0.022, -0.27],
      [0.08 + i * 0.024, -0.33],
      [0.2 + i * 0.025, -0.33],
    ] as [number, number][],
    width: 0.003,
  })),
  ...Array.from({ length: 10 }, (_, i) => ({
    points: [
      [-0.25 + i * 0.025, 0.15],
      [-0.25 + i * 0.025, 0.25],
      [0.04 + i * 0.035, 0.4],
      [0.36, 0.4],
    ] as [number, number][],
    width: 0.003,
  })),
];
export const resistors: Part[] = Array.from({ length: 48 }, (_, i) => ({
  position: [
    (i < 24 ? -0.73 : 0.22) + (i % 4) * 0.055,
    0.018,
    -0.24 + Math.floor((i % 24) / 4) * 0.075,
  ],
  size: [0.032, 0.027, 0.015],
}));
export const gpio: Part[] = Array.from({ length: 40 }, (_, i) => ({
  position: [-0.67 + Math.floor(i / 2) * 0.054, 0.135, -0.43 + (i % 2) * 0.065],
  size: [0.012, 0.2, 0.012],
}));
export const mountingHoles: [number, number][] = [
  [-0.75, -0.46],
  [-0.75, 0.46],
  [0.55, -0.46],
  [0.55, 0.46],
];
export function traceSegments(): Part[] {
  return traces.flatMap((trace) =>
    trace.points.slice(1).map((point, i) => {
      const a = trace.points[i],
        dx = point[0] - a[0],
        dz = point[1] - a[1];
      return {
        position: [
          (point[0] + a[0]) / 2,
          0.003,
          (point[1] + a[1]) / 2,
        ] as Point,
        size: [trace.width, 0.003, Math.hypot(dx, dz)] as Point,
        rotation: Math.atan2(dx, dz),
      };
    }),
  );
}
export const toCircuit = (point: Point): Point =>
  point.map((n, i) => (n - TRACE_ANCHOR[i]) * CIRCUIT_SCALE) as Point;

export const MICRO_ENTRY: Pose = {
  position: [-0.47, 0.018, 0.34],
  target: [-0.47, 0.012, 0.14],
  fov: 58,
};
export const CIRCUIT_ENTRY: Pose = {
  position: toCircuit(MICRO_ENTRY.position),
  target: toCircuit(MICRO_ENTRY.target),
  fov: 58,
};

export function circuitPose(progress: number): Pose {
  return {
    position: [
      Math.sin(progress * 4) * 1.5,
      CIRCUIT_ENTRY.position[1] +
        Math.sin((Math.min(1, progress * 4) * Math.PI) / 2) * 2,
      CIRCUIT_ENTRY.position[2] - progress * 46,
    ],
    target: [
      Math.sin(progress * 4) * 1.5,
      1.2,
      CIRCUIT_ENTRY.target[2] - progress * 46,
    ],
    fov: 58,
  };
}
