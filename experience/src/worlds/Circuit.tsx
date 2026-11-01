import type { WorldProps } from "../core/types";
import { Atmosphere, Box } from "../scene/Models";
import { Workshop } from "../circuit/Attachments";
export { default as Controller } from "../circuit/Controller";

// The landscape is the same board, transformed 100x. No proxy skyline.
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
      <Workshop />
    </>
  );
}
