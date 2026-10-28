import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, lazy, useEffect, useMemo, useRef } from "react";
import { worlds } from "../core/worlds";
import { RuntimeContext, type Runtime } from "../core/context";
import type { Route } from "../core/types";
import { PerspectiveCamera, Mesh, InstancedMesh } from "three";
import { BOARD_BUDGET } from "../pi/layout";
import CameraRig from "./CameraRig";
import Artifacts from "./Artifacts";
import { assetManifest, checkBudget } from "../core/assets";
import ScaleBoard from "../pi/ScaleBoard";

function Diagnostics({ route }: { route: Route }) {
  const { gl, scene, camera } = useThree();
  const frames = useRef(0);
  const intervals = useRef<number[]>([]);
  const ready = `${route.world}/${route.entry}`;
  useFrame((_, dt) => {
    frames.current += dt;
    intervals.current.push(dt * 1000);
    if (intervals.current.length > 180) intervals.current.shift();
    if (frames.current > 1.2)
      document.documentElement.dataset.worldReady = ready;
  });
  useEffect(() => {
    // Read-only local diagnostics for lifecycle/performance verification.
    const timer = window.setInterval(() => {
      const info = gl.info;
      const sample = {
        calls: info.render.calls,
        triangles: info.render.triangles,
        textures: info.memory.textures,
      };
      const sorted = [...intervals.current].sort((a, b) => a - b);
      const context = gl.getContext(),
        debug = context.getExtension("WEBGL_debug_renderer_info");
      const board = scene.getObjectByName("pi-board-custom-geometry");
      let modelCalls = 0,
        modelTriangles = 0;
      board?.traverse((object) => {
        if (!(object instanceof Mesh)) return;
        modelCalls += Array.isArray(object.material)
          ? object.material.length
          : 1;
        modelTriangles +=
          ((object.geometry.index?.count ??
            object.geometry.attributes.position.count) /
            3) *
          (object instanceof InstancedMesh ? object.count : 1);
      });
      document.documentElement.dataset.sceneStats = JSON.stringify({
        world: route.world,
        entry: route.entry,
        background:
          scene.background && "getHexString" in scene.background
            ? scene.background.getHexString()
            : null,
        geometries: info.memory.geometries,
        ...sample,
        withinBudget: checkBudget(route.world, sample),
        children: scene.children.length,
        frameMs: {
          median: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
          p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
        },
        renderer: debug
          ? context.getParameter(debug.UNMASKED_RENDERER_WEBGL)
          : "unreported",
        dpr: gl.getPixelRatio(),
        camera: {
          position: camera.position.toArray(),
          fov: (camera as PerspectiveCamera).fov,
          near: (camera as PerspectiveCamera).near,
        },
        model: {
          uuid: board?.uuid,
          calls: modelCalls,
          triangles: modelTriangles,
          withinBudget:
            modelCalls <= BOARD_BUDGET.maxDrawCalls &&
            modelTriangles <= BOARD_BUDGET.maxTriangles,
        },
      });
    }, 500);
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      window.dispatchEvent(new Event("universe:context-lost"));
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => {
      clearInterval(timer);
      canvas.removeEventListener("webglcontextlost", lost);
      delete document.documentElement.dataset.sceneStats;
      delete document.documentElement.dataset.worldReady;
    };
  }, [gl, scene, route.world, route.entry]);
  return null;
}
export default function Scene({
  route,
  runtime,
  fallback,
}: {
  route: Route;
  runtime: Runtime;
  fallback: React.ReactNode;
}) {
  const world = worlds[route.world];
  const World = useMemo(
    () =>
      lazy(async () => {
        const { default: Geometry, Controller } = await world.load();
        return {
          default: (props: { reducedMotion: boolean }) => (
            <>
              <Geometry {...props} />
              {Controller ? (
                <Controller {...props} />
              ) : (
                <CameraRig world={world} />
              )}
            </>
          ),
        };
      }),
    [world],
  );
  return (
    <Canvas
      dpr={[1, assetManifest[route.world].maxDpr]}
      camera={{ position: [0, 5, 17], near: 0.05, far: 180 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      fallback={fallback}
    >
      <RuntimeContext.Provider value={runtime}>
        <Suspense fallback={null}>
          <ScaleBoard world={route.world} />
          <group key={`${route.world}/${route.entry}`}>
            <World reducedMotion={runtime.reducedMotion} />
            <Artifacts world={route.world} />
            <Diagnostics route={route} />
          </group>
        </Suspense>
      </RuntimeContext.Provider>
    </Canvas>
  );
}
