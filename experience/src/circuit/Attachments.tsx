import { useRuntime } from "../core/context";
import { Box } from "../scene/Models";
import { Vector3, Quaternion } from "three";
import { useSignal } from "./Signal";
function Brace({ z }: { z: number }) {
  const a = new Vector3(17.85, 3.8, z),
    b = new Vector3(13, 5.6, z),
    delta = b.clone().sub(a),
    q = new Quaternion().setFromUnitVectors(
      new Vector3(0, 1, 0),
      delta.clone().normalize(),
    );
  return (
    <mesh position={a.add(b).multiplyScalar(0.5)} quaternion={q}>
      <boxGeometry args={[0.22, delta.length(), 0.22]} />
      <meshStandardMaterial color="#687e7d" roughness={0.65} metalness={0.25} />
    </mesh>
  );
}
export function Workshop() {
  const runtime = useRuntime(),
    lab = useSignal();
  return (
    <group name="processor-workshop">
      <Box position={[15, 5.8, -18]} size={[6, 0.35, 6.5]} color="#687e7d" />
      {[-20, -16].map((z) => (
        <group key={z}>
          <Box
            position={[17.96, 4.45, z]}
            size={[0.18, 2, 0.6]}
            color="#bb8555"
          />
          <Brace z={z} />
        </group>
      ))}
      <Box position={[14.5, 0.5, -16]} size={[7, 0.4, 12]} color="#687e7d" />
      <Box
        position={[13.5, 5.35, -17]}
        size={[0.15, 0.12, 1.2]}
        color="#f2b978"
        emissive="#f2b978"
      />
      {/* Defer additional light/shader variants until the cold-entry review. */}
      <group
        position={[13.5, 1.65, -18]}
        onClick={(e) => {
          e.stopPropagation();
          runtime.activate("signal");
        }}
        onPointerOver={() => runtime.hover("Signal laboratory")}
        onPointerOut={() => runtime.hover(null)}
      >
        <Box size={[3, 2.3, 2]} color="#16252b" />
        <Box
          position={[0, 0.75, 1.05]}
          size={[1.6, 0.75, 0.06]}
          color="#f2b978"
          emissive="#f2b978"
        />
        {[-0.9, -0.05, 0.8].map((x, i) => (
          <mesh
            key={x}
            name={["lab-gate", "lab-branch", "lab-send"][i]}
            position={[x, -0.15, 1.15]}
            rotation={[Math.PI / 2, 0, 0]}
            onClick={(e) => {
              e.stopPropagation();
              if (i === 0) lab.setGate(!lab.gate);
              else if (i === 1) lab.setBranch(lab.branch === "A" ? "B" : "A");
              else lab.send();
            }}
            onPointerOver={(e) => {
              e.stopPropagation();
              runtime.hover(
                [
                  `Gate ${lab.gate ? "open" : "closed"} — toggle`,
                  `Output ${lab.branch} — switch`,
                  "Send a pulse",
                ][i],
              );
            }}
          >
            <cylinderGeometry args={[0.23, 0.23, 0.25, 16]} />
            <meshStandardMaterial
              color={
                i === 0
                  ? lab.gate
                    ? "#68dbc6"
                    : "#bb8555"
                  : i === 1
                    ? lab.branch === "A"
                      ? "#bb8555"
                      : "#68dbc6"
                    : "#bb8555"
              }
            />
          </mesh>
        ))}
        <Box
          position={[lab.branch === "A" ? -0.6 : 0.6, -0.85, 1.05]}
          size={[0.18, 0.12, 0.06]}
          color={lab.pulse && lab.gate ? "#68dbc6" : "#16252b"}
          emissive={lab.pulse && lab.gate ? "#68dbc6" : undefined}
        />
      </group>
      <mesh position={[23, 0.4, -4]}>
        <boxGeometry args={[14, 0.04, 0.12]} />
        <meshStandardMaterial
          color="#68dbc6"
          emissive="#68dbc6"
          emissiveIntensity={1.2}
        />
      </mesh>
      <mesh position={[16, 0.4, -9]}>
        <boxGeometry args={[0.12, 0.04, 4]} />
        <meshStandardMaterial
          color="#68dbc6"
          emissive="#68dbc6"
          emissiveIntensity={1.2}
        />
      </mesh>
    </group>
  );
}
export function CircuitNotebook() {
  return (
    <group name="circuit-notebook">
      <Box size={[5, 0.6, 3.6]} color="#795038" />
      <Box position={[0, 0.35, 0]} size={[4.9, 0.1, 3.5]} color="#d6c4a1" />
      {[0, 1, 2, 3].map((i) => (
        <Box
          key={i}
          position={[0, 0.08 + i * 0.06, 0]}
          size={[4.94, 0.018, 3.54]}
          color="#d6c4a1"
        />
      ))}
      <group position={[1.4, 0.6, 0.55]} rotation={[-0.2, 0, -0.15]}>
        <Box size={[1.6, 0.035, 1.6]} color="#d6c4a1" />
      </group>
      <Box
        position={[0.8, 0.44, 0]}
        size={[0.13, 0.035, 3.65]}
        color="#bb8555"
      />
    </group>
  );
}
