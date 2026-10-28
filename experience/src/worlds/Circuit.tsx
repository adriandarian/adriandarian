import type { WorldProps } from "../core/types";
import { Atmosphere, Box } from "../scene/Models";

// The landscape is literally the same board, transformed 100?. No proxy skyline.
export default function Circuit({ reducedMotion }: WorldProps) {
  return (
    <>
      <Atmosphere color="#071e23" near={35} far={160} />
      <ambientLight intensity={1.35} color="#b0d1b9" />
      <directionalLight
        position={[-15, 35, 25]}
        intensity={3.1}
        color="#ffe0a7"
      />
      <directionalLight
        position={[50, 18, -30]}
        intensity={1.5}
        color="#70c9bd"
      />
      <Box position={[3, 0.55, -11]} size={[3.2, 1.1, 3.6]} color="#244b47" />
      <Box position={[3.5, 0.5, 4]} size={[1.6, 0.9, 2]} color="#53665a" />
    </>
  );
}
