import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";
import type { WorldProps } from "../core/types";
import { Atmosphere, Box } from "../scene/Models";
function Signal({
  lane,
  reducedMotion,
}: {
  lane: number;
  reducedMotion: boolean;
}) {
  const mesh = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    if (mesh.current && !reducedMotion)
      mesh.current.position.z = 18 - ((clock.elapsedTime * 3 + lane * 4) % 52);
  });
  return (
    <mesh ref={mesh} position={[lane * 1.4, 0.15, lane * -3]}>
      <sphereGeometry args={[0.11, 6, 6]} />
      <meshStandardMaterial
        color="#e3fce3"
        emissive="#6effd4"
        emissiveIntensity={4}
      />
    </mesh>
  );
}
export default function Circuit({ reducedMotion }: WorldProps) {
  return (
    <>
      <Atmosphere color="#071e23" near={18} far={70} />
      <ambientLight intensity={1.8} color="#7ebbb1" />
      <directionalLight position={[4, 12, 5]} intensity={3} color="#c6e6d6" />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[140, 140]} />
        <meshStandardMaterial color="#0d3434" metalness={0.3} roughness={0.6} />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <group key={i}>
          <Box
            position={[(i - 4) * 1.4, 0.035, -7]}
            size={[0.045, 0.05, 54]}
            color="#49a68b"
            emissive={i % 3 === 0 ? "#2e896c" : undefined}
          />
          {[-2, -12, -23].map((z, j) => (
            <Box
              key={z}
              position={[(i - 4) * 1.4 + (j % 2 ? 2 : -2), 0.04, z + i * 0.3]}
              size={[4, 0.05, 0.045]}
              color="#b38b53"
              emissive="#70552b"
            />
          ))}
          <Signal lane={i - 4} reducedMotion={reducedMotion} />
        </group>
      ))}
      {Array.from({ length: 34 }, (_, i) => {
        const x = (i % 2 ? -1 : 1) * (6.5 + (i % 4) * 2.2),
          z = 12 - Math.floor(i / 2) * 3;
        return (
          <group key={i} position={[x, 0, z]}>
            <Box
              position={[0, 1 + (i % 3), 0]}
              size={[1.7, 2 + (i % 3) * 2, 2.1]}
              color={i % 2 ? "#214444" : "#284d4e"}
            />
            {Array.from({ length: 4 }, (_, n) => (
              <Box
                key={n}
                position={[-1.04, 0.3, -0.7 + n * 0.45]}
                size={[0.5, 0.2, 0.13]}
                color="#c9b67d"
              />
            ))}
            <Box
              position={[0, 2.05 + (i % 3) * 2, 0]}
              size={[1.1, 0.04, 1.4]}
              color="#405e59"
            />
          </group>
        );
      })}
      <Box position={[3, 0.55, -11]} size={[3.2, 1.1, 3.6]} color="#244b47" />
      <Box position={[3.5, 0.5, 4]} size={[1.6, 0.9, 2]} color="#53665a" />
    </>
  );
}
