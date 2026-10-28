import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { useRuntime } from "../core/context";
import type { WorldDefinition } from "../core/types";
import { placementMatrix, sampleScaleJourney } from "../pi/scaleJourney";
import { worlds } from "../core/worlds";
export default function CameraRig({ world }: { world: WorldDefinition }) {
  const { camera, pointer } = useThree();
  const { progress, journey, reducedMotion, handoff, steer, inspection } =
    useRuntime();
  const initialized = useRef(false);
  const look = useRef(new Vector3());
  const desired = useRef(new Vector3());
  const target = useRef(new Vector3());
  useEffect(
    () => () => {
      // Release the microscopic projection even when history leaves directly
      // for a world with its own camera controller.
      (camera as PerspectiveCamera).near = 0.01;
      camera.updateProjectionMatrix();
      delete document.documentElement.dataset.journeyPhase;
    },
    [camera],
  );
  useFrame((_, dt) => {
    if (handoff.current && world.id === "trail") return;
    const pose = world.camera(progress.current);
    desired.current.fromArray(pose.position);
    target.current.fromArray(pose.target);
    if (world.id === "circuit") {
      desired.current.x += steer.current;
      target.current.x += steer.current;
      handoff.current = false;
    }
    if (!reducedMotion && !journey.current) {
      desired.current.x += pointer.x * 0.45;
      desired.current.y += pointer.y * 0.18;
    }
    const travel = journey.current;
    if (world.id === "trail" && inspection.current && !travel) {
      const item = worlds.trail.placements.find((p) => p.id === "pi")!;
      const matrix = placementMatrix(item);
      const framing = Math.max(1, 1.1 / (camera as PerspectiveCamera).aspect);
      const angle = reducedMotion ? -0.5 : -0.5 + pointer.x * 0.8;
      desired.current
        .set(
          Math.sin(angle) * 1.45 * framing,
          (0.85 + (reducedMotion ? 0 : pointer.y * 0.3)) * framing,
          Math.cos(angle) * 1.45 * framing,
        )
        .applyMatrix4(matrix);
      target.current.set(0, 0.04, 0).applyMatrix4(matrix);
    }
    if (travel?.kind === "board" && travel.placement) {
      if (!travel.start)
        travel.start = {
          position: camera.position.toArray() as [number, number, number],
          target: look.current.toArray() as [number, number, number],
          fov: (camera as PerspectiveCamera).fov,
        };
      const frame = sampleScaleJourney(
        travel.phase,
        travel.start,
        travel.placement,
      );
      camera.position.fromArray(frame.position);
      camera.lookAt(...frame.target);
      const lens = camera as PerspectiveCamera;
      lens.near = frame.near;
      lens.fov = frame.fov;
      lens.updateProjectionMatrix();
      document.documentElement.dataset.journeyPhase = travel.phase.toFixed(3);
      return;
    }
    if (travel) {
      const focus = new Vector3(...travel.target);
      const approach = focus
        .clone()
        .add(new Vector3(0, travel.kind === "board" ? 2.2 : 3, 2.2));
      const close = focus.clone().add(new Vector3(0, 0.12, 0.12));
      const p = travel.phase;
      desired.current.lerp(approach, Math.min(1, p / 0.58));
      if (p > 0.58)
        desired.current.lerpVectors(approach, close, (p - 0.58) / 0.42);
      target.current.lerp(focus, Math.min(1, p * 3));
    }
    const damping =
      reducedMotion || !initialized.current
        ? 1
        : 1 - Math.exp(-dt * (travel ? 18 : 7));
    camera.position.lerp(desired.current, damping);
    look.current.lerp(target.current, damping);
    camera.lookAt(look.current);
    (camera as PerspectiveCamera).fov = MathUtils.lerp(
      (camera as PerspectiveCamera).fov,
      pose.fov,
      damping,
    );
    (camera as PerspectiveCamera).near = 0.01;
    delete document.documentElement.dataset.journeyPhase;
    camera.updateProjectionMatrix();
    initialized.current = true;
  });
  return null;
}
