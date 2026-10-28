import { Html } from "@react-three/drei";
import { useRuntime } from "../core/context";
import type { WorldId } from "../core/types";
import { worlds } from "../core/worlds";
import { artifacts } from "../core/artifacts";
import { ArtifactModel } from "./Models";
export default function Artifacts({ world }: { world: WorldId }) {
  const runtime = useRuntime();
  return (
    <group>
      {worlds[world].placements.map((item) => (
        <group
          key={item.id}
          position={item.position}
          rotation={item.rotation}
          scale={item.scale ?? 1}
          onClick={(e) => {
            e.stopPropagation();
            runtime.activate(item.id);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            runtime.hover(item.label);
            document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            runtime.hover(null);
            document.body.style.cursor = "";
          }}
        >
          {item.id !== "pi" && <ArtifactModel id={item.id} />}
          <Html
            position={[0, item.id === "cafe" ? 4.3 : 1.1, 0]}
            center
            distanceFactor={14}
            occlude
            style={{ pointerEvents: "none" }}
          >
            <span className="mesh-label">
              {artifacts[item.id].name}
              <span>↗</span>
            </span>
          </Html>
        </group>
      ))}
    </group>
  );
}
