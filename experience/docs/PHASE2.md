# Phase 2 · Raspberry Pi — The Scale Transition

This is a stacked change on Phase 1 PR #3, on `feat/pi-scale-transition`. It keeps the existing engine, hash navigation graph, notebook, recovery controls and production protection. Phase 1 review fixes through `2c8f988` have been merged into this feature branch. The Phase 2 PR targets the Phase 1 branch while PR #3 remains open. Neither PR is merged into main or deployed.

The original capture and benchmark below describe the Phase 2 baseline at `333ec6e`. The [review follow-up diagnosis](HANDOFF_DIAGNOSIS.md) adds cold/warm handoff traces, fixes an avoidable lazy-boundary stall, and separates the remaining shader/GPU-wait cost. Its instrumented measurements are not directly comparable to the uninstrumented baseline table.

## Try it

```sh
cd experience
npm ci
npm run dev
```

On the trail, click **Inspect the Raspberry Pi**. Move the pointer across the canvas to inspect different sides of the physical board; portrait framing increases the inspection distance. Movement buttons pause during inspection. **Leave inspection** or Escape returns to the trail view. Click the board mesh, the existing object-index entry, or **Enter the circuitry** to travel.

The 4.2-second journey focuses the board, arcs across it, descends toward a trace corridor and brings the lens down to component scale. There is no full-screen veil on this route. The same board mesh then changes coordinate scale by 100×, with the camera at the matching local position, direction and field of view. Circuit World keeps that geometry and signal clock alive. GPIO pins, resistors and the processor become large spatial landmarks.

Scroll/step to advance or retreat inside the circuit. Left/right arrow keys and the contextual branch buttons move between traces within the safe corridor. The signal terminal, recurring notebook and pressed leaf retain their original graph destinations. Reduced motion enters directly without the camera journey and holds the signals still. Touch users retain vertical drag/step controls and can use the object index; native-phone acceptance remains outstanding.

## Demonstration and evidence

- [15.6-second captured demonstration](media/pi-scale-transition.webm): trail discovery, two inspection angles, full shrink/handoff and movement inside the enlarged board. Actual local Chromium capture, not a rendered animation or edited mockup.
- [Inspection frame](media/pi-inspection.png), [descent frame](media/pi-shrinking.png), [arrival frame](media/circuit-arrival.png).
- [Raw performance measurements](phase2-performance.json).

The capture and metrics can be reproduced on Windows with D3D11:

```sh
npm run build
node scripts/capture-scale.mjs
```

That script owns a temporary preview process on port 4175 and closes its browser/server when finished. It records the demo separately from timing samples so video encoding does not pollute those results. Timing is measured with Chromium requestAnimationFrame intervals; it is not a GPU timestamp measurement.

## Model and architecture

- `src/pi/PiBoard.tsx`: original procedural board, using rounded chip packages, actual hollow socket shells and contacts, plated cut-through mounting holes, 40 GPIO pins, solder pads, capacitors, ribbon contacts, routed traces and animated signals. No static background or interaction hotspot substitutes for the model.
- `src/pi/layout.ts`: shared dimensions, trace routes, entry pose and explicit budgets. The board is inspired by a single-board computer, not official hardware CAD. See [provenance](../src/pi/PROVENANCE.md).
- `src/pi/ScaleBoard.tsx`: one lazy-loaded physical mesh retained across trail/circuit traversal, then fully unmounted in the notebook or when the renderer is removed. This avoids rebuilding its GPU resources at the handoff. It does not keep two renderers or two worlds running.
- `src/pi/scaleJourney.ts`: placement-aware camera choreography, microscopic near-plane adjustment and coordinate alignment. The registered Circuit camera derives from the same entry constants.
- `src/core/journeyLease.ts`: generation-based ownership for asynchronous imports and timeline callbacks. Escape, history navigation, reduced-motion changes and context loss invalidate the current lease. A stale callback cannot commit a route. History commits once after the camera and destination module are ready; a slow module holds the final board framing rather than fading to a blank screen.
- Existing world definitions still own lighting/atmosphere and navigation stays in the original directed graph. Circuit lighting changes at entry to distinguish the interior; geometry and trace landmarks remain shared. Other artifact journeys retain their Phase 1 paper transition.

## Budgets and measurements

Full board: **36 mesh/material submissions, 14,016 triangles, zero textures**. Model ceilings: 48 submissions, 18,000 triangles, zero texture bytes, 8 kB gzip for its dedicated lazy chunk. The model chunk is approximately **2.75 kB gzip**. Original world ceilings remain unchanged; DPR remains capped at 1.5. Instancing batches repeated pins, pads, contacts, resistors, traces and signals.

Measured on Windows with Chromium / ANGLE D3D11 / **AMD Radeon RX 6950 XT**. Desktop is 1440×1000 at DPR 1. Mobile-class is 390×844, requested DPR 2 capped to 1.5, touch/mobile emulation and **4× CPU throttling on the same desktop GPU**. This is not physical-mobile GPU or thermal validation.

| Configuration / scene | Median frame interval |     p95 | Draw calls | Visible triangles |
| --------------------- | --------------------: | ------: | ---------: | ----------------: |
| Desktop trail         |               16.6 ms | 17.9 ms |        259 |            17,034 |
| Desktop circuit       |               16.7 ms | 18.0 ms |         24 |             7,476 |
| Mobile-class trail    |               16.6 ms | 18.0 ms |        135 |            15,422 |
| Mobile-class circuit  |               16.6 ms | 17.7 ms |         17 |             5,912 |

Focus + shrink + arrival sampling: desktop median/p95 **16.7/16.7 ms**, worst **33.3 ms**; mobile-class median/p95 **16.7/16.8 ms**, worst **166.7 ms**. Median pacing is near 60 Hz; the worst mobile-class frame is a visible hitch and remains a limitation. Retaining the board improved the sampled worst frame from an earlier 300 ms mobile-class run, but this is a bounded local comparison, not a device-wide guarantee.

## Verification and remaining acceptance

The original nine unit and eight browser regressions remain in place. Phase 2 adds camera/entry alignment, landmark direction invariance, above-PCB camera sampling, lease cancellation/restart tests, physical inspection, single-canvas and persistent-board identity checks, no-veil travel, exactly-once history, branch movement, rapid cancellation including mid-descent, browser back, and a deliberately delayed destination import released after Escape. Run:

```sh
npm test
npm run build
npm run test:e2e
```

Browser regression runs use software WebGL for repeatability; hardware timings above are a separate run. The repeated-world GPU geometry check must plateau instead of increasing per trip. Captures were inspected for model depth, actual sockets/contacts, trajectory and enlarged component geometry.

Validation results: **15 unit tests passed**, production TypeScript/Vite build passed, and **all 12 browser scenarios passed**, including all eight preserved Phase 1 regressions. Five trail/circuit round trips held at **231 GPU geometries** in the repeated-view check. Four complete board unload/reload cycles through the notebook held at **259, 259, 259, 259 geometries** in their repeated view, with zero board meshes registered while in the notebook. The board UUID remains the same across the scale handoff. These are local checks, not independent CI results.

Limitations: this is a stylized authored board, not manufacturing CAD or an electrical simulator. Circuit exploration is bounded forward/lateral movement, not an unrestricted flight camera. Circuit artifacts and interior lighting are introduced at the coordinate handoff; pixel-perfect cross-environment lighting continuity is not claimed. The CPU-throttled boundary hitch needs further work before claiming a seamless mobile experience. Firefox, Safari, screen readers and physical phones/tablets need acceptance testing. The existing Three.js engine chunk still triggers Vite's size warning. No personal project achievements were invented, and no production deployment/domain files were modified.
