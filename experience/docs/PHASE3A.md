# Phase 3A: PCB composition and visitor traversal

This implementation uses the approved spatial design at [737ae7f](https://github.com/adriandarian/adriandarian/tree/737ae7f/experience/docs/phase3a/canopy-refinement), retaining the PCB-aligned baseline at 446f8a7. It adds the open workshop, a notebook in the real socket gap, and independently selectable visitor-controlled paths. It is a bounded geometry/navigation milestone. Material art direction, additional lights, postprocessing and particles remain deferred.

The existing `PiBoard.tsx`, `layout.ts`, `ScaleBoard.tsx` and `scaleJourney.ts` are unchanged. The same board is retained through the existing 100x handoff. Existing graph destinations and hash entries are unchanged. The legacy production site, root files, domain and deployment configuration are outside this change.

## Try the routes

```sh
cd experience
npm ci
npm run dev
```

Inspect the board on the trail and enter its circuitry. The first Circuit view preserves the Phase 2 entry pose. Looking with the left/right keys or trace controls is deliberate visitor input; no automatic 43-degree turn is inserted at the handoff.

Open **Trace controls** to choose **Workshop trace** or **Connector detour**. Scroll, drag vertically, use up/down keys or movement buttons to advance/reverse. Home/End request the beginning/end of the selected trace; normal motion still traverses the physical path. Escape or **Stop movement** stops immediately. **Center view** restores the path's view direction. The scene is keyboard-focusable, and choosing a trace returns focus to it.

The workshop is the default route; notebook discovery is never a prerequisite. Choosing a different trace beyond the junction retraces the current path to the shared junction and pauses there. Movement input can interrupt that return; Escape discards it. Continue on the selected branch when ready. Browser history stores visited positions, rather than uncompleted movement targets. World navigation saves an exact checkpoint before committing its existing graph edge. During local travel, changed checkpoints are rate-limited; idle frames do not continually rewrite history.

The optional path detours around the ribbon housing instead of following a conductor underneath solid geometry. Cruising is bounded at 18 circuit units/s with acceleration/braking at 32 units/s². Approaches slow toward 4 units/s before the final eight-unit reveal, so the book is not swept past at cruising speed. Continuous input is not required: modest scroll/step requests and Home/End are also usable. This is still guided branching exploration, not free roaming.

At the workshop, the physical gate, branch and send knobs operate the same prototype signal state as the accessible laboratory panel. The notebook is a real mesh opening the existing `notebook/copper` destination. Collapse trace controls before inspecting small physical controls. The object index exposes equivalent destinations and lab controls without requiring precise pointer hits, particularly on touch and assistive technology. Reduced motion applies deliberate steps directly and uses the existing direct world-travel fallback. The circuit heading is a brief orientation cue; its semantic heading remains available afterward.

## Spatial verification

`src/circuit/traversal.ts` owns path geometry, body clearance, movement state and history validation. `Controller.tsx` owns the camera update; `Attachments.tsx` owns the approved additions. The Circuit World selects its own controller through the engine's existing named-controller extension point. No second canvas or renderer is introduced.

The clearance certificate uses 118 conservative component bounds and an upright body with radius 0.6, vertical range 0.2 to 3.2, plus a 0.015 curve margin. Rounded paths contain 70 workshop segments and 121 notebook segments. A continuous swept horizontal disk test over vertically overlapping bounds over-approximates the capsule; this is stronger than centerline rays. Each segment is certified when paths are constructed, and a failed certificate rejects the path. Walkable PCB/trace surfaces are treated as the floor, rather than blocking components. The static bounds must be maintained when board or attached geometry changes; they are not a dynamic physics engine or a mesh-perfect collision service.

Rounded routes measure about 41.79 units to the workshop and 190.78 units from entry to the notebook, including 23.45 units shared before the branch. The notebook branch after that junction is about 167.34 units. Fillets shorten the design's raw polylines while preserving its component locations, endpoints and route topology. Conservative horizontal clearance is approximately 3 units along both paths, exceeding body radius plus margin. See [the generated certificate and source hashes](phase3-traversal-clearance.json).

Camera positions sample the certified path by arc length. Position interpolation never cuts across a corner. Velocity ramps and brakes on reversal; orientation damps independently. The final orientation opens onto the workshop or notebook, with deliberate look controls available. Frame deltas are capped to prevent long stalls producing large movement leaps; low frame rates can consequently extend travel time. The detour's perceived length still requires human usability review, including on an actual phone.

## Validation and evidence

```sh
npm test
npm run build
npm run test:e2e
node scripts/certify-traversal.mjs
node scripts/capture-phase3.mjs
```

Local validation uses Node 22.16.0, npm 10.9.2 and Chromium. The original 17 unit tests remain, with ten new traversal cases. The original 14 browser scenarios remain, with three new scenarios covering both independently reachable paths, physical controls, actual notebook mesh travel, interruption, touch/reduced motion and visited-position restoration. One existing branch-look assertion now checks view direction instead of the removed free X-offset; its board identity, single-canvas, transition and history assertions remain intact. Tests use production preview; software WebGL regression timing is not a hardware performance benchmark.

| Local check | Result |
| --- | --- |
| Unit suite | 27/27 passing |
| Complete production-preview browser suite | 17/17 passing on the integrated geometry/controller |
| Final focused traversal rerun after input-hover cleanup | 3/3 passing |
| TypeScript + Vite production build | Passing; existing Three.js chunk-size warning remains |
| Swept-body certificate | Both complete rounded paths pass |
| Resource lifecycle | Trail samples 231/231/231/231/231; full board unload/reload 259/259/259/259 |
| Authoritative model | 36 submissions, 14,016 triangles; source and scale handoff unchanged |
| npm audit | Zero reported vulnerabilities; manifests/lockfile unchanged |
| Captured WebM decode/seek | 36.88 seconds, 1280x720; seek to 12 seconds succeeds |

These are local results, not hosted CI. The retained cold-entry trace targets geometry/controller commit `ce7eaa0`; the subsequent input-only cleanup clears stale hover text/cursors when moving or looking. The final capture and focused rerun include that cleanup.

See the [paired performance review](phase3-performance/README.md), [actual visitor traversal](media/phase3a/visitor-traversal.webm), and captured [entry](media/phase3a/entry.png), [workshop](media/phase3a/workshop.png) and [notebook](media/phase3a/notebook.png) frames. Timing captures are separate from video recording. Existing Phase 2 trace evidence and the [cold-entry GPU follow-up](COLD_ENTRY_GPU_FOLLOWUP.md) remain intact. An additional workshop point light was tested and deferred after a larger desktop cold GL wait was observed. The shipped geometry uses the existing world lights and modest emissive materials; no additional shader-light variant or effect stack is justified here.

## Manual review checklist

- Enter from the trail. Confirm board identity and the exact forward-facing handoff before any deliberate look/movement input.
- Follow only the workshop trace. Watch the processor remain the host while the canopy, supports and console become legible. Try gate, branch and send physically, then compare the accessible panel's state.
- From a fresh entry, select the connector detour without visiting the workshop. Inspect the ribbon bypass, rounded corners, approach slowdown and progressive notebook reveal. Judge whether the detour feels rewarding at normal speed.
- Reverse direction before and during corners. Change routes beyond the junction, then interrupt the return using movement, Escape and Stop. No late route commit or resumed movement should follow.
- Enter the notebook by its visible mesh, then use browser back/forward. Confirm restored visited position and a stopped controller, rather than resuming an old target.
- Repeat with keyboard only, a narrow touch viewport and reduced motion. Reach the object index, Wayfinder, route controls and laboratory alternatives. Check that drag does not activate an object.
- Repeat world unload/reload, monitor geometry/resource counts, and exercise WebGL loss/fallback. Verify one canvas, no growing resource plateau and no stale input listeners.
- Test a physical low-power/mobile device for pacing, input comfort, sustained frame timing and memory before making a seamless-mobile claim.

This PR requests review only. It does not authorize merging, production deployment, Phase 3B/3C, or the later material/effect expansion.
