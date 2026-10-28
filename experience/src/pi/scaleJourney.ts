import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import type { Placement, Point, Pose } from "../core/types";
import { MICRO_ENTRY } from "./layout";
const ease = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: Point, b: Point, t: number): Point =>
  a.map((n, i) => n + (b[i] - n) * t) as Point;
export function placementMatrix(item: Placement) {
  return new Matrix4().compose(
    new Vector3(...item.position),
    new Quaternion().setFromEuler(new Euler(...(item.rotation ?? [0, 0, 0]))),
    new Vector3().setScalar(item.scale ?? 1),
  );
}
export function sampleScaleJourney(
  phase: number,
  start: Pose,
  placement: Placement,
): Pose & { near: number } {
  const matrix = placementMatrix(placement),
    inverse = matrix.clone().invert();
  const localStart = new Vector3(...start.position)
    .applyMatrix4(inverse)
    .toArray() as Point;
  const localLook = new Vector3(...start.target)
    .applyMatrix4(inverse)
    .toArray() as Point;
  const stops = [
    { at: 0, position: localStart, target: localLook },
    {
      at: 0.27,
      position: [0.9, 0.95, 1.2] as Point,
      target: [0, 0.06, 0] as Point,
    },
    {
      at: 0.53,
      position: [-0.65, 0.65, 0.75] as Point,
      target: [-0.15, 0.04, 0.02] as Point,
    },
    {
      at: 0.72,
      position: [-0.47, 0.17, 0.48] as Point,
      target: [-0.47, 0.01, 0.17] as Point,
    },
    { at: 1, position: MICRO_ENTRY.position, target: MICRO_ENTRY.target },
  ];
  const p = Math.max(0, Math.min(1, phase));
  const index = Math.min(
    stops.length - 2,
    stops.findIndex((s, i) => i < stops.length - 1 && p <= stops[i + 1].at),
  );
  const a = stops[Math.max(0, index)],
    b = stops[Math.max(0, index) + 1],
    t = ease((p - a.at) / (b.at - a.at));
  const worldPoint = (point: Point) =>
    new Vector3(...point).applyMatrix4(matrix).toArray() as Point;
  return {
    position: worldPoint(lerp(a.position, b.position, t)),
    target: worldPoint(lerp(a.target, b.target, t)),
    fov: start.fov + (58 - start.fov) * ease(Math.min(1, p * 2)),
    near: 0.0002 * (placement.scale ?? 1),
  };
}
export {
  TRACE_ANCHOR,
  CIRCUIT_SCALE,
  MICRO_ENTRY,
  CIRCUIT_ENTRY,
} from "./layout";
