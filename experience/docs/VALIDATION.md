# Phase 1 validation — 27 October 2026

## Scope and environment

Windows, Node 22.16.0, npm 10.9.2. Browser scenarios run against **Vite's production preview**, using Playwright Chromium with software WebGL (SwiftShader). Mobile coverage uses a 390×844 viewport plus a separate touch-enabled emulated device. This is focused prototype verification, not a claim of cross-browser or physical-device acceptance.

## Results

- `npm test`: **9 passing** unit tests for route round trips, invalid-route recovery, graph integrity and return paths, contextual notebook entries, artifact registration/collisions, travel connections and finite camera poses.
- `npm run build`: **passed** strict TypeScript checking and production compilation. Environments are separate lazy chunks; Three.js is a shared engine chunk.
- `npm run test:e2e`: **10 passing** production-preview scenarios cover real WebGL rendering; scroll and keyboard movement; physical Pi raycasting and approach before route commit; circuit entry; functioning output A/B and closed-gate behavior; notebook travel; browser back/forward; interrupted transitions; repeat scene unloads; mobile steps and deep links; reduced motion; context loss; WebGL construction failure; and touch drag without unwanted activation. The review regressions also verify that keyboard skip activation expands and focuses the object list without changing route or history, and that a direct `#/circuit/bookmark` load starts with 62% progress and an enabled backward control that moves to 53%. Initial Tab now reaches the skip link; actual route changes still focus their headings. Notebook camera checks confirm 48 degrees on direct entry and after the circuit's 58-degree view. See the committed test cases for exact assertions.
- Final rendered captures inspected locally: trail entrance with visible winding path, moved perspective, circuit entry with distinct background/fog, board approach showing real geometry growing in view, notebook/copper and mobile circuit. Captures are generated into ignored `test-results/` by the browser suite.
- Five consecutive trail round trips after explicit trail-buffer disposal: **208, 208, 208, 208, 208 GPU geometries**. This catches the observed buffer leak; it is not a full heap/GPU memory audit.
- Sample circuit entry: **227 draw calls, 3,154 triangles, 0 textures**, within manifest ceilings. This is a sampled frame, not an FPS benchmark. Budgets are also checked for trail round trips.
- Protected-file verification: current hashes of every tracked legacy README, homepage, test page, asset, CNAME, GitHub configuration and root ignore file matched their original HEAD blobs byte-for-byte.
- `git diff --check`: passed. All proposed files are under `experience/`. No compiled output, dependency directory, capture, deployment workflow or domain change is included.

## Findings addressed

- Corrected downward-facing trail triangles that hid the path from above.
- Added rendered-scene readiness to browser checks so a changed URL cannot be mistaken for a loaded 3D environment.
- Replaced background/fog attachment overlap during lazy swaps with explicit world ownership and cleanup.
- Disposed the custom trail buffer explicitly; repeated production visits now plateau rather than adding one GPU geometry each round trip.
- Guarded asynchronous destination loading against cancelled travel so its late completion cannot replace the current navigation state.
- Avoided initial heading autofocus using a route-key guard that also survives StrictMode effect replay, while retaining heading focus after navigation.
- Applied the notebook's declared field of view rather than inheriting the shared camera's previous value.
- Replaced wall-clock transition screenshot timing with a paused Playwright clock and explicit advancement. The percentage assertion reads numeric width with tolerance; the original string assertion already passed Chromium's CSS serialization, so the review's claim that it could never pass was not reproduced.

## Known limitations and next acceptance work

- Deliberately low-detail, procedural art. The trail is a flat ground route surrounded by 3D mountain geometry, trees and rocks; it is guided traversal, not a free-roaming hiking simulation or a terrain collision system.
- Pi travel is a real camera approach/dive followed by a brief board-colored covered scene swap and circuit emergence. It is not yet a seamless cross-scale shader/morph transition.
- Circuit signals and branches are real animated geometry. The prototype laboratory is a DOM experiment reached through its terminal mesh; it is not a claimed personal project or an electrical simulator.
- Café is an inspectable destination with placeholder intent. Notebook is a small navigable 3D space, not a complete content-authoring or notebook system.
- History restores world and named entry, not exact scroll distance or an orbital camera pose. Escape cancels travel before commit; after commit it leaves the visitor at the committed destination.
- Three.js is **703.79 kB minified / 181.24 kB gzip** in this build and triggers Vite's >500 kB chunk warning. The shell is roughly 310 kB minified / 103 kB gzip, including React and GSAP. These are measured bundle sizes, not transfer-time guarantees.
- Renderer stays active for ambient signals and input; no target-device frame-rate guarantee is made. Instancing, demand rendering and adaptive quality should follow measured device testing before increasing scene density.
- Context loss falls back to accessible navigation; a page reload is required to retry WebGL. Unavailable WebGL does not provide the spatial experience.
- Optional web fonts depend on Google Fonts; local serif/sans-serif fallbacks remain available. World geometry requires no remote models or textures.
- Firefox, Safari, physical phones/tablets, screen-reader behavior and integrated-GPU thermals remain on the [manual acceptance checklist](MANUAL_TESTS.md). Emulation does not replace those checks.
- Production deployment is intentionally absent. This feature branch and its pull request do not change the main-branch GitHub Pages source or `adarian.dev`.
