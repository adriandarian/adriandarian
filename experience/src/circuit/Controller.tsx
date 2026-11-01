import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { PerspectiveCamera, Quaternion, Matrix4, Vector3 } from "three";
import { useRuntime } from "../core/context";
import { traceScaleMark } from "../core/traceScale";
import { advanceTravel, paths, snapshot, travelPose } from "./traversal";
export default function Controller() {
  const { camera } = useThree(),
    { circuit, progress, handoff, journey, reducedMotion } = useRuntime();
  const first = useRef(true),
    elapsed = useRef(0),
    historyElapsed = useRef(0),
    historyRecord = useRef(""),
    eye = useRef(new Vector3()),
    look = useRef(new Vector3()),
    matrix = useRef(new Matrix4()),
    rotation = useRef(new Quaternion());
  useEffect(
    () => () => {
      delete document.documentElement.dataset.circuitTravel;
    },
    [],
  );
  useFrame((_, dt) => {
    const s = circuit.current;
    if (first.current) traceScaleMark("circuit:first-frame");
    // The route lease owns world travel; local movement never commits a route.
    if (!journey.current) {
      if (!s.pending && !s.stopped)
        s.target = progress.current * paths[s.branch].length;
      const before = s.branch;
      advanceTravel(s, dt, reducedMotion);
      if (before !== s.branch)
        progress.current = s.distance / paths[s.branch].length;
    }
    if (s.pending || s.stopped)
      progress.current = s.distance / paths[s.branch].length;
    const pose = travelPose(s);
    eye.current.fromArray(pose.position);
    look.current.fromArray(pose.target);
    // Position follows the certified arc. Lerp across a corner would cut through
    // obstacles; only orientation is damped, independently of path clearance.
    camera.position.copy(eye.current);
    matrix.current.lookAt(eye.current, look.current, camera.up);
    rotation.current.setFromRotationMatrix(matrix.current);
    if (first.current || reducedMotion)
      camera.quaternion.copy(rotation.current);
    else
      camera.quaternion.slerp(
        rotation.current,
        1 - Math.exp(-Math.min(dt, 0.05) * 5),
      );
    const lens = camera as PerspectiveCamera;
    lens.near = 0.01;
    lens.fov = 58;
    lens.updateProjectionMatrix();
    handoff.current = false;
    first.current = false;
    elapsed.current += dt;
    historyElapsed.current += dt;
    if (elapsed.current > 0.15) {
      elapsed.current = 0;
      document.documentElement.dataset.circuitTravel = JSON.stringify({
        ...snapshot(s),
        target: s.target,
        speed: s.speed,
        pending: s.pending,
        length: paths[s.branch].length,
        position: pose.position,
        targetPoint: pose.target,
      });
      if (
        location.hash.startsWith("#/circuit/") &&
        historyElapsed.current > 0.6
      ) {
        historyElapsed.current = 0;
        const record = JSON.stringify(snapshot(s));
        if (record !== historyRecord.current) {
          historyRecord.current = record;
          history.replaceState(
            { ...history.state, circuitTravel: snapshot(s) },
            "",
          );
        }
      }
    }
  });
  return null;
}
