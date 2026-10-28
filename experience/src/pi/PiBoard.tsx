import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { InstancedMesh, Object3D, Path, Shape } from "three";
import {
  gpio,
  mountingHoles,
  resistors,
  traces,
  traceSegments,
  type Part,
} from "./layout";

function Batch({
  parts,
  color,
  metalness = 0,
  roughness = 0.5,
  glow = 0,
}: {
  parts: Part[];
  color: string;
  metalness?: number;
  roughness?: number;
  glow?: number;
}) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const object = new Object3D();
    parts.forEach((part, i) => {
      object.position.fromArray(part.position);
      object.scale.fromArray(part.size);
      object.rotation.set(0, part.rotation ?? 0, 0);
      object.updateMatrix();
      mesh.current!.setMatrixAt(i, object.matrix);
    });
    mesh.current!.instanceMatrix.needsUpdate = true;
    mesh.current!.computeBoundingSphere();
  }, [parts]);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, parts.length]}>
      <boxGeometry />
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
        emissive={color}
        emissiveIntensity={glow}
      />
    </instancedMesh>
  );
}
function Solid({
  position,
  size,
  color,
  metalness = 0,
  roughness = 0.5,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  metalness?: number;
  roughness?: number;
}) {
  return (
    <RoundedBox
      args={size}
      radius={Math.min(...size) * 0.12}
      smoothness={2}
      position={position}
    >
      <meshStandardMaterial
        color={color}
        metalness={metalness}
        roughness={roughness}
      />
    </RoundedBox>
  );
}
function Socket({
  x,
  z,
  width,
  depth,
  height,
}: {
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
}) {
  const walls: Part[] = [
    { position: [x, height, z], size: [width, 0.018, depth] },
    { position: [x, 0.025, z], size: [width, 0.018, depth] },
    ...[-1, 1].map((sign) => ({
      position: [x, height / 2, z + (sign * depth) / 2] as [
        number,
        number,
        number,
      ],
      size: [width, height, 0.014] as [number, number, number],
    })),
  ];
  return (
    <group>
      <Batch parts={walls} color="#b7c4c6" metalness={0.86} roughness={0.24} />
      <Solid
        position={[x - 0.07, height * 0.46, z]}
        size={[width * 0.36, height * 0.45, depth * 0.65]}
        color="#121d22"
      />
      <Batch
        parts={Array.from({ length: 5 }, (_, i) => ({
          position: [
            x + 0.09,
            height * 0.38,
            z - depth * 0.28 + i * depth * 0.14,
          ],
          size: [0.08, 0.009, 0.012],
        }))}
        color="#d6b36d"
        metalness={0.8}
      />
    </group>
  );
}
function Pulses({ reducedMotion }: { reducedMotion: boolean }) {
  const mesh = useRef<InstancedMesh>(null);
  const object = useMemo(() => new Object3D(), []);
  useFrame(({ clock }) => {
    const paths = traces.filter((t) => t.live);
    paths.forEach((path, i) => {
      const p =
          (reducedMotion ? 0.3 : (clock.elapsedTime * 0.09 + i * 0.19) % 1) *
          (path.points.length - 1),
        j = Math.min(path.points.length - 2, Math.floor(p)),
        t = p - j;
      const a = path.points[j],
        b = path.points[j + 1];
      object.position.set(
        a[0] + (b[0] - a[0]) * t,
        0.009,
        a[1] + (b[1] - a[1]) * t,
      );
      object.scale.setScalar(0.0045);
      object.updateMatrix();
      mesh.current!.setMatrixAt(i, object.matrix);
    });
    mesh.current!.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, traces.filter((t) => t.live).length]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 8, 6]} />
      <meshStandardMaterial
        color="#ecffe0"
        emissive="#a6ffd0"
        emissiveIntensity={3}
      />
    </instancedMesh>
  );
}
export default function PiBoard({
  reducedMotion = false,
}: {
  reducedMotion?: boolean;
}) {
  const shape = useMemo(() => {
    const s = new Shape(),
      w = 0.84,
      h = 0.55,
      r = 0.055;
    s.moveTo(-w + r, -h);
    s.lineTo(w - r, -h);
    s.quadraticCurveTo(w, -h, w, -h + r);
    s.lineTo(w, h - r);
    s.quadraticCurveTo(w, h, w - r, h);
    s.lineTo(-w + r, h);
    s.quadraticCurveTo(-w, h, -w, h - r);
    s.lineTo(-w, -h + r);
    s.quadraticCurveTo(-w, -h, -w + r, -h);
    mountingHoles.forEach(([x, z]) => {
      const hole = new Path();
      hole.absarc(x, -z, 0.028, 0, Math.PI * 2, true);
      s.holes.push(hole);
    });
    return s;
  }, []);
  const segments = useMemo(traceSegments, []);
  const solder = useMemo(
    () =>
      gpio.map((p) => ({
        position: [p.position[0], 0.004, p.position[2]] as [
          number,
          number,
          number,
        ],
        size: [0.035, 0.008, 0.035] as [number, number, number],
      })),
    [],
  );
  const contacts = useMemo(
    () =>
      resistors.flatMap((p) =>
        [-1, 1].map((sign) => ({
          position: [
            p.position[0] + sign * 0.015,
            p.position[1],
            p.position[2],
          ] as [number, number, number],
          size: [0.008, 0.028, 0.018] as [number, number, number],
        })),
      ),
    [],
  );
  return (
    <group name="pi-board-custom-geometry">
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.055, 0]}>
        <extrudeGeometry
          args={[
            shape,
            {
              depth: 0.055,
              bevelEnabled: true,
              bevelSize: 0.002,
              bevelThickness: 0.002,
              bevelSegments: 1,
              steps: 1,
              curveSegments: 8,
            },
          ]}
        />
        <meshStandardMaterial
          color="#145b48"
          metalness={0.2}
          roughness={0.48}
        />
      </mesh>
      <Batch
        parts={segments}
        color="#67a786"
        metalness={0.55}
        roughness={0.35}
        glow={0.22}
      />
      <Batch parts={solder} color="#d3b970" metalness={0.8} roughness={0.23} />
      <Batch parts={gpio} color="#d7ac55" metalness={0.85} roughness={0.24} />
      <Solid
        position={[-0.16, 0.045, -0.405]}
        size={[1.13, 0.085, 0.15]}
        color="#141c1b"
      />
      <Solid
        position={[-0.08, 0.073, -0.04]}
        size={[0.42, 0.14, 0.36]}
        color="#162227"
        metalness={0.2}
        roughness={0.37}
      />
      <Solid
        position={[-0.08, 0.147, -0.04]}
        size={[0.32, 0.008, 0.27]}
        color="#536868"
        metalness={0.82}
        roughness={0.27}
      />
      <Solid
        position={[0.29, 0.04, -0.08]}
        size={[0.19, 0.08, 0.25]}
        color="#192126"
      />
      <Batch parts={resistors} color="#30373a" roughness={0.75} />
      <Batch parts={contacts} color="#b8c3ba" metalness={0.75} />
      <Socket x={0.72} z={0.3} width={0.36} depth={0.3} height={0.24} />
      <Socket x={0.72} z={-0.06} width={0.36} depth={0.3} height={0.24} />
      <Socket x={0.69} z={-0.405} width={0.4} depth={0.27} height={0.28} />
      <Socket x={-0.12} z={0.51} width={0.28} depth={0.09} height={0.09} />
      <Solid
        position={[-0.66, 0.06, 0.36]}
        size={[0.2, 0.12, 0.17]}
        color="#bbc4b9"
        metalness={0.85}
      />
      <Solid
        position={[0.3, 0.05, 0.34]}
        size={[0.08, 0.1, 0.28]}
        color="#ece4c4"
      />
      <Batch
        parts={Array.from({ length: 16 }, (_, i) => ({
          position: [0.3, 0.105, 0.22 + i * 0.015],
          size: [0.08, 0.005, 0.005],
        }))}
        color="#ab8e4d"
        metalness={0.8}
      />
      {mountingHoles.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.005, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.028, 0.041, 20]} />
          <meshStandardMaterial
            color="#d5b668"
            metalness={0.78}
            roughness={0.27}
          />
        </mesh>
      ))}
      {[-0.32, -0.18].map((x, i) => (
        <group key={x} position={[x, 0, 0.35]}>
          <mesh position={[0, 0.045, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.085, 16]} />
            <meshStandardMaterial
              color="#485c64"
              metalness={0.72}
              roughness={0.26}
            />
          </mesh>
          <mesh position={[0, 0.089, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.003, 16]} />
            <meshStandardMaterial color="#d8ddd1" metalness={0.6} />
          </mesh>
        </group>
      ))}
      <Batch
        parts={Array.from({ length: 16 }, (_, i) => ({
          position: [-0.285 + i * 0.026, 0.045, -0.236],
          size: [0.012, 0.012, 0.045],
        }))}
        color="#bbb8a2"
        metalness={0.8}
      />
      <Solid
        position={[-0.62, 0.012, 0.47]}
        size={[0.025, 0.018, 0.018]}
        color="#c4ff96"
      />
      <Pulses reducedMotion={reducedMotion} />
    </group>
  );
}
