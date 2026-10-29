import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Suspense,
  lazy,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { traceScaleMark } from "../core/traceScale";
import { worlds } from "../core/worlds";
import { RuntimeContext, type Runtime } from "../core/context";
import type { Route } from "../core/types";
import { PerspectiveCamera, Mesh, InstancedMesh, Vector3 } from "three";
import { BOARD_BUDGET } from "../pi/layout";
import CameraRig from "./CameraRig";
import Artifacts from "./Artifacts";
import { assetManifest, checkBudget } from "../core/assets";
import ScaleBoard from "../pi/ScaleBoard";
import { worldModules } from "../core/worldModules";

function Diagnostics({ route }: { route: Route }) {
  useLayoutEffect(() => {
    traceScaleMark(`${route.world}:world-mounted`);
  }, [route.world]);
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
          direction: camera.getWorldDirection(new Vector3()).toArray(),
          fov: (camera as PerspectiveCamera).fov,
          near: (camera as PerspectiveCamera).near,
        },
        targets:
          route.world === "circuit"
            ? Object.fromEntries(
                Object.entries({
                  gate: [12.6, 1.5, -16.85],
                  branch: [13.45, 1.5, -16.85],
                  send: [14.3, 1.5, -16.85],
                  notebook: [112, 1.65, -12],
                }).map(([name, p]) => {
                  const v = new Vector3(...p).project(camera);
                  return [
                    name,
                    {
                      x: (v.x * 0.5 + 0.5) * gl.domElement.clientWidth,
                      y: (-v.y * 0.5 + 0.5) * gl.domElement.clientHeight,
                      inFrustum:
                        Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1 && v.z < 1,
                    },
                  ];
                }),
              )
            : undefined,
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
  const World = useMemo(() => {
    const component = ({
      default: Geometry,
      Controller,
    }: Awaited<ReturnType<typeof world.load>>) =>
      function WorldBundle(props: { reducedMotion: boolean }) {
        return (
          <>
            <Geometry {...props} />
            {Controller ? (
              <Controller {...props} />
            ) : (
              <CameraRig world={world} />
            )}
          </>
        );
      };
    const ready = worldModules.get(world.id);
    // Prefetch completion is a synchronous render path. Creating a fresh lazy
    // promise here would suspend again even though the import already finished.
    return ready
      ? component(ready)
      : lazy(async () => ({
          default: component(await worldModules.load(world)),
        }));
  }, [world]);
  return (
    <Canvas
      dpr={[1, assetManifest[route.world].maxDpr]}
      camera={{ position: [0, 5, 17], near: 0.05, far: 180 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      fallback={fallback}
    >
      <RuntimeContext.Provider value={runtime}>
        <ScaleBoard world={route.world} />
        <Suspense fallback={null}>
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
