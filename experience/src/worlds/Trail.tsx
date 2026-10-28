import { useEffect, useMemo } from "react";
import { BufferGeometry, Float32BufferAttribute } from "three";
import { pathX } from "../core/worlds";
import { Atmosphere, Box } from "../scene/Models";

function TrailPath() {
  const geometry = useMemo(() => {
    const g = new BufferGeometry(),
      vertices: number[] = [];
    for (let i = 0; i < 90; i++) {
      const z = 24 - i * 0.6,
        next = z - 0.6;
      const a = pathX(z),
        b = pathX(next),
        w = 1.15;
      vertices.push(
        a - w,
        0.035,
        z,
        a + w,
        0.035,
        z,
        b - w,
        0.035,
        next,
        a + w,
        0.035,
        z,
        b + w,
        0.035,
        next,
        b - w,
        0.035,
        next,
      );
    }
    g.setAttribute("position", new Float32BufferAttribute(vertices, 3));
    g.computeVertexNormals();
    return g;
  }, []);
  // This geometry is passed as a prop rather than a declarative child, so its
  // owner explicitly releases the GPU buffer when this world unloads.
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} receiveShadow>
      <meshStandardMaterial color="#cfbb93" roughness={1} />
    </mesh>
  );
}
function Tree({ x, z, size }: { x: number; z: number; size: number }) {
  return (
    <group position={[x, 0, z]} scale={size}>
      <Box position={[0, 0.9, 0]} size={[0.25, 1.8, 0.25]} color="#6b6247" />
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, 1.8 + i * 0.65, 0]}>
          <coneGeometry args={[1.2 - i * 0.23, 2.2, 6]} />
          <meshStandardMaterial
            color={i % 2 ? "#4e705e" : "#3c5d50"}
            flatShading
          />
        </mesh>
      ))}
    </group>
  );
}
export default function Trail() {
  const trees = useMemo(
    () =>
      Array.from({ length: 62 }, (_, i) => {
        const z = 22 - i * 0.9;
        return {
          x: pathX(z) + (i % 2 ? 1 : -1) * (4 + Math.sin(i * 42) ** 2 * 11),
          z,
          size: 0.8 + Math.sin(i * 8) ** 2 * 0.7,
        };
      }),
    [],
  );
  return (
    <>
      <Atmosphere color="#dbe2d6" near={23} far={95} />
      <ambientLight intensity={1.5} color="#ecebd0" />
      <directionalLight
        position={[-12, 20, 8]}
        intensity={2.5}
        color="#fff0cd"
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[180, 180]} />
        <meshStandardMaterial color="#879779" roughness={1} />
      </mesh>
      <TrailPath />
      {trees.map((tree, i) => (
        <Tree key={i} {...tree} />
      ))}
      {Array.from({ length: 28 }, (_, i) => (
        <mesh
          key={i}
          position={[
            (i % 2 ? -1 : 1) * (4 + (i % 5)) + pathX(15 - i * 1.5),
            0.25,
            15 - i * 1.5,
          ]}
          scale={[0.7 + (i % 3) * 0.2, 0.55, 0.7]}
        >
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color={i % 2 ? "#83877a" : "#9a9a86"}
            flatShading
          />
        </mesh>
      ))}
      {Array.from({ length: 11 }, (_, i) => (
        <mesh
          key={i}
          position={[-65 + i * 13, 8, -60 - (i % 3) * 10]}
          rotation={[0, i, 0]}
        >
          <coneGeometry args={[18 + (i % 4) * 3, 26 + (i % 3) * 8, 5]} />
          <meshStandardMaterial
            color={i % 2 ? "#9eafa3" : "#acbaaf"}
            flatShading
          />
        </mesh>
      ))}
      <mesh position={[2.2, 0.55, 3]} scale={[2, 0.8, 1.5]}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#a5a58b" />
      </mesh>
      <Box position={[-2.8, 0.5, -4]} size={[2.6, 0.9, 1.7]} color="#8b795a" />
      <Box position={[0, 0.15, -23]} size={[7, 0.3, 6]} color="#a8a087" />
      <group position={[-3, 0, 9]}>
        <Box position={[0, 1.2, 0]} size={[0.12, 2.4, 0.12]} color="#7f6a48" />
        <Box position={[0.2, 2, 0]} size={[1.1, 0.4, 0.1]} color="#bca878" />
      </group>
    </>
  );
}
