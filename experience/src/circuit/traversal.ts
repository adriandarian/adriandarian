import { gpio, resistors, toCircuit, CIRCUIT_ENTRY } from "../pi/layout";
import type { Point, Pose } from "../core/types";
export type Branch = "workshop" | "notebook";
type XY = [number, number];
export type Obstacle = { name: string; min: Point; max: Point };
export const BODY = { radius: 0.6, bottom: 0.2, top: 3.2, curveError: 0.015 };
const solid = (name: string, p: Point, s: Point): Obstacle => ({
  name,
  min: p.map((v, i) => v - s[i] / 2) as Point,
  max: p.map((v, i) => v + s[i] / 2) as Point,
});
// Conservative bounds of the authoritative PiBoard solids. Rounded faces are
// deliberately not used to squeeze clearance; sockets retain their real openings.
export const obstacles: Obstacle[] = [
  solid("processor", toCircuit([-0.08, 0.073, -0.04]), [42, 14, 36]),
  solid("secondary chip", toCircuit([0.29, 0.04, -0.08]), [19, 8, 25]),
  solid("GPIO base", toCircuit([-0.16, 0.045, -0.405]), [113, 8.5, 15]),
  solid("small port", toCircuit([-0.66, 0.06, 0.36]), [20, 12, 17]),
  solid("ribbon connector", toCircuit([0.3, 0.05, 0.34]), [8, 10, 28]),
  ...resistors.map((p, i) =>
    solid(
      "resistor " + i,
      toCircuit(p.position),
      p.size.map((n) => n * 100) as Point,
    ),
  ),
  ...gpio.map((p, i) =>
    solid(
      "pin " + i,
      toCircuit(p.position),
      p.size.map((n) => n * 100) as Point,
    ),
  ),
  ...[
    [0.72, 0.3, 0.36, 0.3, 0.24],
    [0.72, -0.06, 0.36, 0.3, 0.24],
    [0.69, -0.405, 0.4, 0.27, 0.28],
    [-0.12, 0.51, 0.28, 0.09, 0.09],
  ].flatMap(([x, z, w, d, h], i) => [
    solid("socket top " + i, toCircuit([x, h, z]), [w * 100, 1.8, d * 100]),
    solid("socket bottom " + i, toCircuit([x, 0.025, z]), [
      w * 100,
      1.8,
      d * 100,
    ]),
    ...[-1, 1].map((sign) =>
      solid("socket wall " + i, toCircuit([x, h / 2, z + (sign * d) / 2]), [
        w * 100,
        h * 100,
        1.4,
      ]),
    ),
    solid("socket insert " + i, toCircuit([x - 0.07, h * 0.46, z]), [
      w * 36,
      h * 45,
      d * 65,
    ]),
  ]),
  ...[-0.32, -0.18].map((x, i) =>
    solid("capacitor " + i, toCircuit([x, 0.045, 0.35]), [7, 8.5, 7]),
  ),
  solid("workshop platform", [14.5, 0.5, -16], [7, 0.4, 12]),
  solid("console", [13.5, 1.65, -18], [3, 2.3, 2]),
  solid("notebook", [112, 1.2, -12], [5, 0.6, 3.6]),
];
function pointSegment(p: XY, a: XY, b: XY) {
  const dx = b[0] - a[0],
    dz = b[1] - a[1],
    t = Math.max(
      0,
      Math.min(
        1,
        ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz || 1),
      ),
    );
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dz);
}
function intersects(a: XY, b: XY, min: XY, max: XY) {
  let lo = 0,
    hi = 1;
  for (let i = 0; i < 2; i++) {
    const d = b[i] - a[i];
    if (Math.abs(d) < 1e-9) {
      if (a[i] < min[i] || a[i] > max[i]) return false;
    } else {
      const t0 = (min[i] - a[i]) / d,
        t1 = (max[i] - a[i]) / d;
      lo = Math.max(lo, Math.min(t0, t1));
      hi = Math.min(hi, Math.max(t0, t1));
      if (lo > hi) return false;
    }
  }
  return true;
}
export function sweptClear(
  a: XY,
  b: XY,
  radius = BODY.radius + BODY.curveError,
  solids = obstacles,
) {
  return solids.every((o) => {
    if (o.max[1] < BODY.bottom || o.min[1] > BODY.top) return true;
    const min: XY = [o.min[0], o.min[2]],
      max: XY = [o.max[0], o.max[2]];
    if (intersects(a, b, min, max)) return false;
    const corners: XY[] = [
      [min[0], min[1]],
      [min[0], max[1]],
      [max[0], min[1]],
      [max[0], max[1]],
    ];
    const pointBox = (p: XY) =>
      Math.hypot(
        Math.max(min[0] - p[0], 0, p[0] - max[0]),
        Math.max(min[1] - p[1], 0, p[1] - max[1]),
      );
    return (
      Math.min(
        pointBox(a),
        pointBox(b),
        ...corners.map((p) => pointSegment(p, a, b)),
      ) > radius
    );
  });
}
// Quadratic corner fillets, tessellated finely enough that the analytical
// deviation bound is below the extra curveError in the swept-body test.
function rounded(points: XY[]) {
  const out: XY[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const a = points[i - 1],
      b = points[i],
      c = points[i + 1],
      ab = Math.hypot(b[0] - a[0], b[1] - a[1]),
      bc = Math.hypot(c[0] - b[0], c[1] - b[1]),
      r = Math.min(1.2, ab / 3, bc / 3);
    const start: XY = [
        b[0] + ((a[0] - b[0]) * r) / ab,
        b[1] + ((a[1] - b[1]) * r) / ab,
      ],
      end: XY = [
        b[0] + ((c[0] - b[0]) * r) / bc,
        b[1] + ((c[1] - b[1]) * r) / bc,
      ];
    out.push(start);
    for (let j = 1; j <= 16; j++) {
      const t = j / 16;
      out.push([
        (1 - t) ** 2 * start[0] + 2 * t * (1 - t) * b[0] + t * t * end[0],
        (1 - t) ** 2 * start[1] + 2 * t * (1 - t) * b[1] + t * t * end[1],
      ]);
    }
  }
  out.push(points.at(-1)!);
  return out;
}
const common = rounded([
  [0, 10],
  [0, -11],
  [2.8, -11],
]);
function path(points: XY[]) {
  const samples = [...common, ...rounded(points).slice(1)],
    distances = [0];
  for (let i = 1; i < samples.length; i++) {
    if (!sweptClear(samples[i - 1], samples[i]))
      throw new Error("Circuit path lacks swept clearance at " + samples[i]);
    distances.push(
      distances.at(-1)! +
        Math.hypot(
          samples[i][0] - samples[i - 1][0],
          samples[i][1] - samples[i - 1][1],
        ),
    );
  }
  return { samples, distances, length: distances.at(-1)! };
}
export const paths = {
  workshop: path([
    [2.8, -11],
    [4, -11],
    [4, -7],
    [16, -7],
    [16, -5],
  ]),
  notebook: path([
    [2.8, -11],
    [4, -11],
    [12, -4],
    [69, -4],
    [69, 27],
    [98, 27],
    [98, -5],
    [98, -13],
  ]),
};
export const junction = common
  .slice(1)
  .reduce(
    (n, p, i) => n + Math.hypot(p[0] - common[i][0], p[1] - common[i][1]),
    0,
  );
export function positionAt(branch: Branch, distance: number): XY {
  const p = paths[branch],
    d = Math.max(0, Math.min(p.length, distance));
  let i = p.distances.findIndex((v) => v >= d);
  if (i <= 0) return [...p.samples[0]];
  const t = (d - p.distances[i - 1]) / (p.distances[i] - p.distances[i - 1]);
  return p.samples[i].map(
    (v, j) => p.samples[i - 1][j] + (v - p.samples[i - 1][j]) * t,
  ) as XY;
}
export type Travel = {
  branch: Branch;
  distance: number;
  target: number;
  speed: number;
  pending: Branch | null;
  heading: number;
  stopped: boolean;
};
export const createTravel = (entry = "board"): Travel => ({
  branch: entry === "bookmark" ? "notebook" : "workshop",
  distance: entry === "bookmark" ? paths.notebook.length * 0.62 : 0,
  target: entry === "bookmark" ? paths.notebook.length * 0.62 : 0,
  speed: 0,
  pending: null,
  heading: 0,
  stopped: false,
});
export function stopTravel(s: Travel) {
  s.target = s.distance;
  s.speed = 0;
  s.pending = null;
  s.stopped = true;
}
export function selectBranch(s: Travel, branch: Branch) {
  s.stopped = false;
  if (s.branch === branch) return;
  if (s.distance <= junction + 0.001) {
    s.branch = branch;
    s.target = s.distance;
    s.pending = null;
  } else {
    s.pending = branch;
    s.target = junction;
  }
}
export function advanceTravel(s: Travel, dt: number, reduced: boolean) {
  dt = Math.min(0.05, Math.max(0, dt));
  const delta = s.target - s.distance,
    direction = Math.sign(delta),
    // Cruise through the long detour, then slow before the reveal corridor.
    // The final eight units are inspected at <=4 units/s, not swept past at 18.
    pace = Math.min(
      18,
      4 + Math.max(0, paths[s.branch].length - s.distance - 8) * 2,
    ),
    desired = direction * Math.min(pace, Math.sqrt(2 * 32 * Math.abs(delta)));
  s.speed += Math.max(-32 * dt, Math.min(32 * dt, desired - s.speed));
  const move = s.speed * dt;
  if (
    reduced ||
    Math.abs(delta) < 0.002 ||
    direction * move >= Math.abs(delta)
  ) {
    s.distance = s.target;
    s.speed = 0;
    if (s.pending) {
      s.branch = s.pending;
      s.pending = null;
    }
  } else
    s.distance = Math.max(
      0,
      Math.min(paths[s.branch].length, s.distance + move),
    );
}
export function snapshot(s: Travel) {
  return { branch: s.branch, distance: s.distance, heading: s.heading };
}
export function restoreTravel(value: unknown, entry: string) {
  const s = createTravel(entry);
  if (!value || typeof value !== "object") return s;
  const v = value as Record<string, unknown>;
  if (
    (v.branch === "workshop" || v.branch === "notebook") &&
    typeof v.distance === "number" &&
    Number.isFinite(v.distance)
  ) {
    s.branch = v.branch;
    s.distance = s.target = Math.max(
      0,
      Math.min(paths[s.branch].length, v.distance),
    );
    if (typeof v.heading === "number" && Number.isFinite(v.heading))
      s.heading = Math.max(-1, Math.min(1, v.heading));
  }
  return s;
}
export function travelPose(s: Travel): Pose {
  const [x, z] = positionAt(s.branch, s.distance);
  if (s.distance === 0 && s.heading === 0)
    return {
      ...CIRCUIT_ENTRY,
      position: [...CIRCUIT_ENTRY.position],
      target: [...CIRCUIT_ENTRY.target],
    };
  const end = s.branch === "workshop" ? [20, 5, -22] : [112, 1.65, -12],
    look = positionAt(
      s.branch,
      Math.min(paths[s.branch].length, s.distance + 5),
    ),
    nearEnd = Math.max(
      0,
      Math.min(1, (s.distance - (paths[s.branch].length - 9)) / 9),
    );
  const target: Point = [
    look[0] * (1 - nearEnd) + end[0] * nearEnd,
    2 * (1 - nearEnd) + end[1] * nearEnd,
    look[1] * (1 - nearEnd) + end[2] * nearEnd,
  ];
  const dx = target[0] - x,
    dz = target[2] - z,
    angle = s.heading;
  return {
    position: [x, 1.8 + Math.min(1, s.distance / 4) * 0.8, z],
    target: [
      x + dx * Math.cos(angle) - dz * Math.sin(angle),
      target[1],
      z + dx * Math.sin(angle) + dz * Math.cos(angle),
    ],
    fov: 58,
  };
}
