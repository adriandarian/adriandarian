import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef, type ComponentRef } from "react";
import { Vector3, type PerspectiveCamera } from "three";
import { useRuntime } from "../core/context";
import { worlds } from "../core/worlds";
import type { WorldProps } from "../core/types";

// Notebook owns an orbital camera; it does not have to inherit trail controls.
export default function NotebookController({ reducedMotion }: WorldProps) {
  const { camera } = useThree();
  const { progress, journey } = useRuntime();
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const origin = useRef(new Vector3());
  const wasTravelling = useRef(false);
  const lastProgress = useRef(-1);
  useLayoutEffect(() => {
    const pose = worlds.notebook.camera(progress.current);
    camera.position.fromArray(pose.position);
    camera.lookAt(...pose.target);
    (camera as PerspectiveCamera).fov = pose.fov;
    camera.updateProjectionMatrix();
    if (controls.current) controls.current.target.fromArray(pose.target);
  }, [camera, progress]);
  useFrame(() => {
    const travel = journey.current;
    if (!controls.current) return;
    controls.current.enabled = !travel;
    if (travel) {
      if (!wasTravelling.current) origin.current.copy(camera.position);
      const target = new Vector3(...travel.target);
      const end = target.clone().add(new Vector3(0, 0.15, 0.15));
      camera.position.lerpVectors(origin.current, end, travel.phase);
      controls.current.target.lerp(target, Math.min(1, travel.phase * 3));
      camera.lookAt(controls.current.target);
    } else if (
      lastProgress.current !== progress.current ||
      wasTravelling.current
    ) {
      const pose = worlds.notebook.camera(progress.current);
      camera.position.fromArray(pose.position);
      controls.current.target.fromArray(pose.target);
      lastProgress.current = progress.current;
    }
    wasTravelling.current = Boolean(travel);
  }, -0.5);
  return (
    <OrbitControls
      ref={controls}
      enableRotate={!matchMedia("(pointer: coarse)").matches}
      enablePan={false}
      enableZoom={false}
      enableDamping={!reducedMotion}
      dampingFactor={0.12}
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI / 2.5}
      minAzimuthAngle={-0.7}
      maxAzimuthAngle={0.7}
    />
  );
}
