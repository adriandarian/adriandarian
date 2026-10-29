# Phase 3A handoff performance review

Baseline code: main `33c57c3`. Measured implementation code: `ce7eaa0` (the final geometry/controller, before a later input-only hover-label cleanup). Design baseline: `737ae7f`. No material/light/effect expansion is justified by this report.

Production Vite builds with local sourcemaps were profiled using the existing `scripts/trace-handoff.mjs`: CDP timeline, 1 ms V8 sampling and wrappers around synchronous WebGL calls. Windows Chromium used ANGLE D3D11 on an AMD Radeon RX 6950 XT. Desktop is 1440 by 1000, DPR 1. Mobile-class is 390 by 844, requested DPR 2 capped at 1.5, touch/mobile emulation and 4x CPU throttling on the same desktop GPU. This is not physical-phone testing. The video capture is separate from all timing runs.

The baseline was built in a separate temporary source copy from main with the same installed dependency tree. The retained baseline and implementation runs were serial, with no concurrent build, test suite or video recording. An initial exploratory baseline that overlapped other work was excluded. Cold means the first destination visit in a new browser context, not a guarantee of cleared driver/disk shader caches. Warm means a second visit in that context. These are one diagnostic sample per configuration, not a statistical benchmark or proof of a general speedup.

| Configuration | Baseline largest boundary frame | Implementation largest boundary frame | Baseline timed GL total | Implementation timed GL total |
| --- | ---: | ---: | ---: | ---: |
| Desktop, cold destination | 116.7 ms | 66.7 ms | 96.8 ms | 68.2 ms |
| Desktop, warm destination | 16.7 ms | 16.8 ms | 0 ms | 0 ms |
| Mobile-class, cold destination | 216.7 ms | 150.1 ms | 30.4 ms | 19.0 ms |
| Mobile-class, warm destination | 166.6 ms | 66.7 ms | 0 ms | 0 ms |

| Configuration | Baseline route commit to first controller-frame callback | Implementation callback interval |
| --- | ---: | ---: |
| Desktop cold | 27.1 ms | 20.9 ms |
| Desktop warm | 18.9 ms | 17.4 ms |
| Mobile-class cold | 260.6 ms | 147.1 ms |
| Mobile-class warm | 197.5 ms | 109.8 ms |

The callback marker occurs before the renderer completes the frame. It is not a measurement of first presented pixels. The boundary-frame intervals expose stalls that the callback interval alone can miss. Timed GL totals measure JavaScript API calls including native/driver waiting; they are not GPU timer-query measurements. Sampling, tracing and wrappers add overhead. Original Phase 2 captures and uninstrumented metrics are historical evidence and should not be substituted into this paired comparison.

## Rejected point-light experiment

The study's added warm point light initially produced a 166.7 ms desktop cold boundary frame and 135.5 ms summed synchronous GL time in the retained experiment, compared with 116.7/96.8 ms in the baseline. Other configurations varied. This is evidence to defer the new light/shader variant, not a statistically isolated attribution of every millisecond to that light. The shipped geometry uses the existing circuit lights and modest emissive materials. No extra point light, postprocessing, particle system or shadow-map pass is included.

The final samples show no larger cold GL wait or boundary frame than the fresh baseline, but do not close the existing [GPU synchronization follow-up](../COLD_ENTRY_GPU_FOLLOWUP.md). The 150.1 ms mobile-class cold interval is visibly non-seamless, and physical mobile performance, thermal behavior and detour comfort remain unverified. Additional lighting/shaders must receive explicit performance review before integration.

## Retained evidence and reproduction

- [Baseline summary](baseline/summary.json), [final summary](final/summary.json), [rejected point-light summary](rejected-point-light/summary.json): every desktop/mobile-class cold/warm result from the selected runs.
- Baseline and final directories also retain compressed desktop/mobile-class cold timeline traces and V8 profiles. Decompress `.trace.json.gz` to load in Chrome/Perfetto. Warm raw captures and other exploratory runs remain local scratch output; all selected warm metrics remain in the summaries.
- Existing `docs/handoff-traces/before/` and `after/` evidence is unchanged.

```sh
npm run build
node node_modules/vite/bin/vite.js build --sourcemap
node scripts/trace-handoff.mjs your-label
```

Run serially on an idle machine, using the same hardware/configuration and a separate baseline checkout/source copy. Do not build while preview serves its dist directory, and do not record video during timing capture. Repeat multiple cold/warm trials and test physical low-power hardware before claiming a reliable performance improvement.

## Traversal capture

The [captured visitor traversal](../media/phase3a/visitor-traversal.webm) uses actual local application inputs: board inspection/scale transition, workshop route, physical controls, return through the shared junction, independent notebook branch, mesh travel and browser back. It is not the earlier design animatic. [Capture metadata](../media/phase3a/capture.json) records the Radeon renderer, entry pose, destination view and restored traversal state.

Observed capture times are about 4.6 seconds from entry to the workshop and 11.6 seconds from the shared junction to the notebook. They exclude deliberate stops and do not establish human satisfaction with the detour. They include video-recording overhead and are not frame-timing benchmarks. The prototype's 18-unit/s cruise and slower reveal corridor require usability review, especially on a physical phone.
