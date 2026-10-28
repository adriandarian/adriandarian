import { lazy, Suspense } from "react";
import type { WorldId } from "../core/types";
import { placements } from "../core/artifacts";
import { useRuntime } from "../core/context";
import { CIRCUIT_SCALE, TRACE_ANCHOR } from "./layout";
const PiBoard = lazy(() => import("./PiBoard"));
// Preserve GPU buffers, materials, signal clock and landmarks at the boundary.
export default function ScaleBoard({ world }: { world: WorldId }) {
  const { activate, hover, reducedMotion } = useRuntime();
  if (world === "notebook") return null;
  const item = placements.trail.find((item) => item.id === "pi")!;
  const outside = world === "trail";
  return (
    <group
      position={
        outside
          ? item.position
          : (TRACE_ANCHOR.map((n) => -n * CIRCUIT_SCALE) as [
              number,
              number,
              number,
            ])
      }
      rotation={outside ? item.rotation : [0, 0, 0]}
      scale={outside ? item.scale : CIRCUIT_SCALE}
      onClick={
        outside
          ? (event) => {
              event.stopPropagation();
              activate("pi");
            }
          : undefined
      }
      onPointerOver={
        outside
          ? (event) => {
              event.stopPropagation();
              hover(item.label);
              document.body.style.cursor = "pointer";
            }
          : undefined
      }
      onPointerOut={
        outside
          ? () => {
              hover(null);
              document.body.style.cursor = "";
            }
          : undefined
      }
    >
      <Suspense fallback={null}>
        <PiBoard reducedMotion={reducedMotion} />
      </Suspense>
    </group>
  );
}
