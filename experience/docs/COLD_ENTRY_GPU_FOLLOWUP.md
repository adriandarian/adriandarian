# Follow-up: cold-entry GPU synchronization

Status: **open performance limitation**, tracked separately from the resolved lazy-boundary/layout-effect problem. This is not a Phase 3 art-direction task.

Evidence is preserved in [the handoff diagnosis](HANDOFF_DIAGNOSIS.md), [before traces](handoff-traces/before/summary.json) and [after traces](handoff-traces/after/summary.json).

- The cold desktop after trace records about 79 ms in synchronous `getProgramInfoLog`; native trace events show GPU command-buffer waits during program queries.
- Destination module loading completed well before camera arrival. The resolved module-cache/Suspense fix removed repeated board layout work and substantially shortened warm entry.
- The instrumented mobile-class cold after run still has a 199.9 ms largest nearby frame interval. It uses 4× CPU throttling on a desktop Radeon GPU, so it does not establish physical-phone performance.

Next investigation: evaluate same-renderer asynchronous shader prewarming for the destination light configuration during the approach, with explicit lifetime and cancellation ownership. Measure source-world reconciliation/teardown separately and preserve the single renderer and board identity. Do not mask stalls with a full-screen fade.

Acceptance for closing this follow-up:

1. Capture comparable cold/warm traces and demonstrate that synchronous program-query waiting has been reduced or removed from the visual handoff.
2. Preserve graph/history, reduced motion, cancellation, shared geometry, lazy assets and GPU resource plateaus.
3. Record profiling overhead and distinguish diagnostic timings from uninstrumented frame benchmarks.
4. Validate on actual low-power/mobile hardware before making a seamless-mobile claim.
