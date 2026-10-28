import type { ArtifactId } from "../core/types";
import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Color, Fog } from "three";
export function Atmosphere({
  color,
  near,
  far,
}: {
  color: string;
  near: number;
  far: number;
}) {
  const { scene } = useThree();
  useLayoutEffect(() => {
    const background = new Color(color),
      fog = new Fog(color, near, far);
    scene.background = background;
    scene.fog = fog;
    return () => {
      if (scene.background === background) scene.background = null;
      if (scene.fog === fog) scene.fog = null;
    };
  }, [scene, color, near, far]);
  return null;
}
export function Box({
  position = [0, 0, 0],
  size,
  color,
  emissive,
}: {
  position?: [number, number, number];
  size: [number, number, number];
  color: string;
  emissive?: string;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={0.8}
        emissive={emissive}
        emissiveIntensity={emissive ? 1.7 : 0}
      />
    </mesh>
  );
}
export function Board() {
  return (
    <group>
      <Box size={[1.65, 0.12, 1.1]} color="#22664c" />
      <Box position={[0, 0.13, 0]} size={[0.5, 0.15, 0.45]} color="#202e2a" />
      {[-0.56, -0.26, 0.04, 0.34, 0.64].map((x) => (
        <Box
          key={x}
          position={[x, 0.1, -0.44]}
          size={[0.08, 0.12, 0.1]}
          color="#e7bf64"
        />
      ))}
      {[-0.28, 0.26].map((z) => (
        <Box
          key={z}
          position={[0.66, 0.18, z]}
          size={[0.4, 0.3, 0.35]}
          color="#bcc8bf"
        />
      ))}
      {[-0.55, -0.3, -0.05].map((x) => (
        <Box
          key={x}
          position={[x, 0.085, 0.33]}
          size={[0.12, 0.03, 0.3]}
          color="#dab875"
        />
      ))}
      <Box
        position={[-0.65, 0.12, 0.4]}
        size={[0.08, 0.06, 0.07]}
        color="#b4ffad"
        emissive="#94ff7b"
      />
    </group>
  );
}
export function Book() {
  return (
    <group>
      <Box size={[1.3, 0.2, 1.7]} color="#7a4937" />
      <Box
        position={[0.05, 0.12, 0]}
        size={[1.18, 0.08, 1.53]}
        color="#eee1bc"
      />
      <Box position={[0, 0.18, 0]} size={[1.3, 0.04, 1.7]} color="#9a5e42" />
      <Box
        position={[0.22, 0.205, 0]}
        size={[0.08, 0.02, 1.7]}
        color="#d9b977"
      />
    </group>
  );
}
export function Leaf() {
  return (
    <group rotation={[0, 0.3, 0.25]}>
      <mesh scale={[0.45, 0.07, 0.95]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#a4b46e" />
      </mesh>
      <Box size={[0.035, 0.12, 1.6]} color="#725c3a" />
    </group>
  );
}
export function ArtifactModel({ id }: { id: ArtifactId }) {
  if (id === "pi") return <Board />;
  if (id === "notebook") return <Book />;
  if (id === "trail-thread") return <Leaf />;
  if (id === "circuit-thread")
    return (
      <group>
        <Box size={[1.4, 0.08, 0.3]} color="#a96940" />
        <Box
          position={[0.4, 0.08, 0]}
          size={[0.3, 0.06, 0.3]}
          color="#f2c38c"
        />
      </group>
    );
  if (id === "signal")
    return (
      <group>
        <Box size={[1.5, 1.7, 1.1]} color="#285051" />
        <Box
          position={[0, 0.35, 0.57]}
          size={[1.1, 0.7, 0.04]}
          color="#61dac2"
          emissive="#22bc99"
        />
        <Box
          position={[0.42, -0.45, 0.6]}
          size={[0.2, 0.2, 0.1]}
          color="#f6be6c"
        />
      </group>
    );
  return (
    <group>
      <Box position={[0, 0.5, 0]} size={[4, 3, 3]} color="#c0b492" />
      <mesh position={[0, 2.8, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[3.3, 2, 4]} />
        <meshStandardMaterial color="#67564a" />
      </mesh>
      <Box position={[0, 0, 1.52]} size={[0.9, 2, 0.08]} color="#6a5341" />
      {[-1.25, 1.25].map((x) => (
        <Box
          key={x}
          position={[x, 0.6, 1.55]}
          size={[0.8, 1, 0.05]}
          color="#ffd999"
          emissive="#ad7841"
        />
      ))}
    </group>
  );
}
