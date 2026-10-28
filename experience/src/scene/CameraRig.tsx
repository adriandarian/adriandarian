import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { useRuntime } from "../core/context";
import type { WorldDefinition } from "../core/types";
export default function CameraRig({ world }: { world: WorldDefinition }) {
  const { camera, pointer } = useThree();
  const { progress, journey, reducedMotion } = useRuntime();
  const initialized = useRef(false);
  const arrival = useRef(0);
  const look = useRef(new Vector3());
  const desired = useRef(new Vector3());
  const target = useRef(new Vector3());
  useFrame((_, dt) => {
    const pose = world.camera(progress.current);
    desired.current.fromArray(pose.position);
    target.current.fromArray(pose.target);
    arrival.current = Math.min(1, arrival.current + dt / 1.05);
    if (world.id === "circuit" && !reducedMotion && arrival.current < 1) {
      const t = 1 - (1 - arrival.current) ** 3;
      desired.current.lerpVectors(
        new Vector3(pose.position[0], 0.3, pose.position[2] - 5),
        desired.current.clone(),
        t,
      );
    }
    if (!reducedMotion && !journey.current) {
      desired.current.x += pointer.x * 0.45;
      desired.current.y += pointer.y * 0.18;
    }
    const travel = journey.current;
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
    camera.updateProjectionMatrix();
    initialized.current = true;
  });
  return null;
}
