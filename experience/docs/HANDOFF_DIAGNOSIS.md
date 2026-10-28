# Handoff diagnosis — 27 October 2026

This follows the Phase 2 review at `333ec6e`. It changes no art direction, adds no world and does not change production deployment. Phase 1 PR #3 was subsequently squash-merged as `f73018f`; Phase 2 PR #4 now targets `main` and remains open for final review. The before/after trace evidence below is preserved unchanged.

## Evidence collection

The instrumented production build records opt-in User Timing marks at activation, destination module completion, camera arrival, route dispatch, actual R3F world mount and first Circuit camera frame. Chrome DevTools Protocol captures timeline events and a 1 ms V8 CPU profile. Wrapped WebGL calls measure synchronous shader/program-query wall time. Local source maps map CPU samples back to original functions.

Desktop: 1440×1000, DPR 1. Mobile-class: 390×844, DPR capped at 1.5 and 4× CPU throttle. Both use Windows / ANGLE D3D11 / Radeon RX 6950 XT. Each configuration has one first destination visit and one repeat visit. “Cold” means a fresh browser context/module cache; GPU/driver cache state is not guaranteed cold, especially across contexts in one browser.

These are **diagnostic runs with profiling overhead**, not replacements for the earlier uninstrumented benchmark or physical-phone measurements. The route-to-first-frame interval measures scene availability separately from requestAnimationFrame gaps. Nested trace events must not be added together as independent costs. V8 self samples are not precise wall-time percentages, and `(program)`/native time remains partly unattributed.

Raw files and summaries are under [before](handoff-traces/before/summary.json) and [after](handoff-traces/after/summary.json). Each directory contains compressed Chrome trace JSON and V8 `.cpuprofile` files for all four runs. Decompress and import the trace into Chrome's Performance panel or Perfetto; decompress CPU profiles for DevTools' JavaScript Profiler. Source maps were generated only in ignored `dist/` and are not published.

## Findings

**Module loading was not the handoff bottleneck in these samples.** Cold destination imports completed 16 ms after activation on desktop and 134 ms on the mobile-class run, roughly four seconds before camera arrival. Repeat-visit completion was also early. No network completion was pending at the measured boundary.

**The world-loading boundary introduced an avoidable delay and repeated geometry processing.** `Scene.tsx` created a new `React.lazy` wrapper at each world change, even after the destination import had completed. The shared board was inside that same Suspense boundary. Suspending/revealing the boundary reran layout effects in its retained subtree. The source-mapped profile shows `toCreasedNormals`, vector operations and Drei `RoundedBox` work during the handoff. On the warm mobile-class visit, `toCreasedNormals` alone received approximately 47 ms of self samples; its callees add further work.

The baseline had a 341 ms desktop / 522 ms mobile-class route-to-first-frame interval on warm visits, despite the module already being ready. The trace contains substantial idle time in this interval, so this must not be described as 522 ms of React CPU execution. The pending lazy boundary and its hide/reveal work are implicated by code inspection and the controlled fix below.

**Cold shader-related driver synchronization is a separate cost.** The cold desktop trace contains an approximately 79 ms `getProgramInfoLog` call. Native trace events show two GPU command-buffer waits (`GLES2Implementation::GetProgramiv`, `WaitForCmd` / `WaitForGetOffset`) totaling approximately 79 ms inside the render task. Repeat entry does not repeat those queries. This establishes synchronous GPU/program-query waiting; it does not assign all internal driver time specifically to compiler execution.

**Remaining mobile-class work includes renderer reconciliation/teardown and rendering.** In the after warm trace, a roughly 50 ms scheduler callback (`performWorkUntilDeadline`) contains R3F work; CPU samples include `removeChild`. The cold after run also contains a roughly 89 ms R3F animation/render callback and roughly 25 ms of measured shader/program calls. Artificial CPU throttling and native `(program)` time prevent a complete percentage attribution from these samples alone.

## Focused fix and controlled comparison

1. `worldModules.ts` coalesces pending imports and stores completed module exports. The scene renders an already-prefetched module synchronously instead of suspending again on a fresh lazy promise. First entry and direct links still lazy-load normally.
2. `ScaleBoard` lives outside the world-loading Suspense boundary. Unrelated environment loading cannot hide/reveal its retained geometry or rerun its layout effects.
3. Regression coverage checks cache coalescing, synchronous availability, retry after failure, retained model identity and absence of board layout cleanup/remount across the handoff. GPU ownership remains with mounted R3F objects; the cache stores CPU module exports only.

| Configuration / visit          | Route → first circuit frame, before → after | Largest nearby frame interval, before → after |
| ------------------------------ | ------------------------------------------: | --------------------------------------------: |
| Desktop first destination      |                             357.9 → 18.7 ms |                               133.2 → 83.3 ms |
| Desktop repeat                 |                             341.2 → 17.5 ms |                                33.4 → 16.8 ms |
| Mobile-class first destination |                            577.5 → 184.0 ms |                              266.6 → 199.9 ms |
| Mobile-class repeat            |                             521.6 → 94.2 ms |                               183.4 → 83.4 ms |

Rounded-normal recomputation is absent from the after handoff samples. Cold desktop WebGL query time remains approximately 82 ms. The warm mobile-class result improves, but cold entry still has a visible hitch. These single paired runs support the identified fix; they do not establish percentile guarantees across devices.

## Reproduce

```sh
cd experience
npm ci
npm run build
npx vite build --sourcemap
node scripts/trace-handoff.mjs current
```

The script targets Windows D3D11, owns a temporary preview on port 4177, closes its browser/server, and writes a new labeled directory under `docs/handoff-traces/`. Use an alphabetic/hyphenated label. For a baseline run, use code before the module-cache/boundary fix; the committed before/after traces already preserve that comparison. `@jridgewell/trace-mapping` is a diagnostic-only dev dependency, already present transitively at the same pinned version before this change. Runtime dependencies are unchanged.

Normal visits record no marks. Add `?traceScale=1` to enable local User Timing diagnostics; nothing is sent to a service. Rebuild normally after profiling to remove ignored local sourcemaps.

## Before adding Phase 3 complexity

Validation of this follow-up: 17 unit tests, the production TypeScript/Vite build and all 14 browser scenarios passed locally. This includes the 10 current Phase 1 scenarios, module-cache tests, a retained-board layout-effect regression, cancellation/history/late-import checks and repeated complete board unloads. The repeated trail/circuit view stayed at 231 GPU geometries, and complete notebook unload/reload cycles stayed at 259 each. Existing production files and deployment configuration remain unchanged. These results are local validation, not independent CI.

Do not treat the remaining cold hitch as solved. Next investigate same-renderer asynchronous shader prewarming for the destination light configuration, with explicit cancellation/resource ownership, and reduce or amortize source-world reconciliation/teardown. Confirm those effects on actual low-power/mobile hardware before adding heavier lighting or atmospheric effects. Do not hide the cost with a full-screen fade.

Phase 3's art direction can then focus on monumental component architecture, a laboratory integrated into a chip, less obvious notebook placement and restrained contextual labels. None of that visual scope is implemented in this diagnostic change.

References for the capture mechanisms: [Chromium tracing and profiling](https://chromium.googlesource.com/devtools/devtools-frontend/+/HEAD/front_end/panels/timeline/docs/tracing_profiling.md), [CDP CPU profiler](https://chromedevtools.github.io/devtools-protocol/tot/Profiler/). The remaining Phase 1 timing regression uses [Playwright clock control](https://playwright.dev/docs/clock) instead of wall-clock delays.
