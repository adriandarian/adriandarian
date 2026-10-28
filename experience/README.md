# Adrian's Interactive Universe · Phases 1–2

An isolated spatial prototype. The production homepage, profile README, old experiments, assets, GitHub Pages settings and custom domain remain unchanged. **There is no deployment workflow in this app.**

Read [the repository assessment](docs/ASSESSMENT.md) for deployment evidence and decisions recorded before implementation.

Phase 2 adds the detailed Raspberry Pi-inspired board, close inspection, a shared-geometry 100× scale handoff, and lateral circuit exploration. Start with [the Phase 2 guide, captured demo and performance results](docs/PHASE2.md) for the current slice. The Phase 1 assessment and validation notes remain historical records of that foundation.

## Run locally

Node 22.12+ (validated on 22.16), npm 10+:

```sh
cd experience
npm ci
npm run dev
```

Open the localhost URL Vite prints. The application is independent of the root site.

```sh
npm test                 # Navigation, artifact and camera contracts
npm run build           # TypeScript + production bundles into experience/dist
npm run preview         # Serve the production build locally
npx playwright install chromium
npm run test:e2e         # Build first; tests launch their own preview on port 4173
```

Build output, dependencies and browser captures are ignored. Relative Vite asset URLs and hash routes allow a future subdirectory deployment, but no publishing is configured. Do not copy `dist/` to the repository root or change Pages to publish it without a separate review.

## Explore

- Scroll or use ↑ / ↓, Page Up / Down, Home / End to follow the trail or circuit route. Buttons at the bottom provide deliberate steps.
- Move the pointer to look slightly around. Click actual object meshes to interact.
- Inspect the Raspberry Pi using the contextual inspection control, or click its mesh to travel. The camera focuses, orbits and shrinks toward a trace corridor; the same board becomes Circuit World at 100× scale without a full-screen veil. Escape cancels a journey before its route commits.
- In Circuit World, use the signal terminal to send pulses through an open/closed gate to output A or B. This is **prototype content**, not a claim about an Adrian project.
- The notebook recurs in both worlds. It opens a small 3D notebook space with a contextual field note and two physical keepsakes that lead elsewhere. Drag on desktop to orbit this space within a safe range.
- On touch devices, drag vertically to move, tap objects to enter, or use the step controls. Drag gestures suppress accidental object activation. Notebook orbit is disabled for coarse pointers so touch scrolling has one meaning.
- Browser back/forward retraces world and entry-point history. Each hash is a deep link, e.g. `#/circuit/board` or `#/notebook/copper`.
- **Objects nearby** mirrors every mesh interaction with native buttons. **Wayfinder** is recovery navigation. Keyboard users have a skip link, focus moves to the new world title, and inspection dialogs trap focus and close with Escape.
- Reduced motion skips camera journeys, disables pointer sway and continuous signals, and removes orbit damping. WebGL construction failure or context loss preserves the accessible graph and signal experiment. Refresh to attempt 3D again after context loss.

## Architecture and extension points

| Responsibility                                                  | Location                                        |
| --------------------------------------------------------------- | ----------------------------------------------- |
| World contracts and optional custom controllers                 | `src/core/types.ts`                             |
| Lazy world registry, camera samples and entries                 | `src/core/worlds.ts`                            |
| Artifact identities and contextual mesh placements              | `src/core/artifacts.ts`                         |
| Directed traversal graph and static-host-safe URLs              | `src/core/navigation.ts`                        |
| Per-world transition recipes                                    | `src/core/transitions.ts` and world definitions |
| Asset inventories and performance budgets                       | `src/core/assets.ts`                            |
| Single renderer, scene lifetime and diagnostics                 | `src/scene/Scene.tsx`                           |
| Guided camera and physical model primitives                     | `src/scene/`                                    |
| Independent geometry, lighting and controllers                  | `src/worlds/`                                   |
| Personal/prototype content and provenance                       | `src/content/records.ts`                        |
| DOM accessibility, recovery, input and transition orchestration | `src/App.tsx`                                   |

To add a world:

1. Add an ID to `WorldId` and a lazy module under `src/worlds/`. Its default component owns geometry and lights. Use `Atmosphere` for safe background/fog ownership during lazy scene swaps.
2. Register title, camera sampler, named entry progress values, lazy loader, placements and an asset budget. A module may export its own `Controller` instead of using the guided rig; Notebook demonstrates an orbital controller. Controllers can read the shared journey and input refs without updating React every frame.
3. Add registered artifact identities/models as needed, then contextual placements. An identity can recur at unrelated positions and scales.
4. Add navigation graph edges from `world:artifact` to a named world entry. There is no required parent world. Register optional transition recipes for source artifacts; the board demonstrates shared-geometry scale travel, while paper travel uses a shorter covered approach. Keep transition callbacks cancellable and commit history once at the visual handoff, after the destination module is ready.
5. Add verified content records separately, with provenance. No legacy biography or project achievements have been copied into the prototype. A future content record can power a tiny object interaction or a full environment without changing its identity.
6. Add graph/registration tests and run the manual checklist. Load future GLB/texture assets inside their owning lazy module, use Vite imports for hashed URLs, and budget download size, texture resolution and GPU lifetime. Do not globally preload every world.

## Resource and performance policy

One Canvas remains mounted; only the active world's geometry and controls are mounted. The shared board mesh persists across trail/circuit scale changes and unmounts in the notebook. Declarative R3F geometries/materials are disposed on unmount. The custom trail buffer has explicit disposal because it is supplied as a geometry prop. Event listeners, diagnostics timers, controls and GSAP timelines have cleanup paths. Destination code starts loading when an artifact is activated; the final framing waits for that module and ignores completion after cancellation.

The first slice has no model or texture downloads. DPR is capped at 1.5. Manifest ceilings are 450/400/100 draw calls and 60k/50k/10k triangles for trail/circuit/notebook, with zero world textures. Read `document.documentElement.dataset.sceneStats` for the active route, GPU geometry/texture counts, draw calls, triangles, background and budget status. `data-world-ready` marks a rendered scene after its initial camera entry. These diagnostics are local and send no telemetry.

Three.js remains a substantial engine download; Vite reports a >500 kB engine chunk. Future optimization should be measured on target hardware before adding bloom, shadows, textures or denser worlds. Optional Google Fonts have Georgia/sans-serif fallbacks; the 3D worlds need no external asset service.

See [validation and limitations](docs/VALIDATION.md) and [manual checklist](docs/MANUAL_TESTS.md).
