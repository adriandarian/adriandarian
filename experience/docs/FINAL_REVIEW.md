# Phase 2 final review preparation — 27 October 2026

PR #3 was squash-merged into `main` as `f73018f534155c0f2b315646fb03bb17661229c8`, from approved head `2c8f988`. All review threads were resolved, the reported CodeRabbit check was successful, and no branch-protection or ruleset approval requirements were configured. Squash was the repository's only enabled merge method.

PR #4 now targets `main` and remains open and unmerged. No Phase 3 work or deployment action is included.

## Diff and ancestry verification

The squash commit's tree exactly matches `2c8f988`. Phase 2 already contained that approved tree, so ancestry was reconciled with merge commit `0f0e33f`, preserving the exact original Phase 2 tree (`63e558f1c45c6f93e07828224ea81c161f7c3c83`).

Before the status-documentation updates, the new `main` → Phase 2 diff matched the previous `2c8f988` → `3fc9410` delta byte-for-byte, with SHA-256 `591616da64819801ad83efb13f0ad334698b964b64d25909e0865841ae072ffa`. The retargeted delta contains Phase 2 work only, all under `experience/`; Phase 1 files are not reintroduced as new files. Final changes beyond ancestry are status documentation, separate follow-up tracking and an ASCII-only correction to the `100x` comment in `Circuit.tsx`.

## Post-retarget validation

- **17 unit tests passed** via `npm test`.
- **Production build passed** via `npm run build` (TypeScript + Vite). The existing large Three.js chunk warning remains.
- **All 14 browser scenarios passed** against the production preview, using software WebGL. These local checks are separate from hosted review/check status.
- Five repeated trail/circuit visits held at **231 GPU geometries**. Four complete board unload/reload cycles through the notebook held at **259 each**.
- Diff checks passed. The legacy root files, existing assets, profile README, homepage, test page, `CNAME` and `.github` configuration match their pre-Phase-1 versions.
- Pages remains configured for a legacy build from `main` at `/`, with `adarian.dev`. No Pages setting or deployment command was changed/run.
- Captured demo, benchmark data and before/after Chrome trace evidence are unchanged from `3fc9410`.

## Outstanding findings for the approval decision

**Cold-entry GPU synchronization:** open performance limitation, tracked in [its own follow-up](COLD_ENTRY_GPU_FOLLOWUP.md). The shader/program-query wait remains distinct from the resolved lazy-boundary problem. Preserve the [trace diagnosis](HANDOFF_DIAGNOSIS.md) and test on physical mobile hardware before a seamless-mobile claim.

**GitHub-reported development dependency alerts:** the following open Dependabot alerts are present in `main`'s inherited Vitest dependency tree. Exploitability was not assessed in this retargeting task. No dependency upgrade is included in this review-preparation change.

| Alert | Package | Reported severity | Advisory summary | First patched version |
| --- | --- | --- | --- | --- |
| [#4](https://github.com/adriandarian/adriandarian/security/dependabot/4) | tinypool | Critical | Prototype-pollution gadget in worker options leading to RCE | 2.1.1 |
| [#3](https://github.com/adriandarian/adriandarian/security/dependabot/3) | tinypool | Critical | Prototype-pollution gadget in `run()` options leading to RCE | 2.1.2 |
| [#5](https://github.com/adriandarian/adriandarian/security/dependabot/5) | @vitest/mocker | Moderate | Code injection through unauthenticated manual mock registration | 4.1.12 |
| [#2](https://github.com/adriandarian/adriandarian/security/dependabot/2) | vitest | Moderate | Path traversal / arbitrary file read through redirect mocks | 4.1.11 |
| [#1](https://github.com/adriandarian/adriandarian/security/dependabot/1) | @vitest/mocker | Moderate | Path traversal / arbitrary file read through redirect mocks | 4.1.11 |

These alerts should receive a dedicated dependency-remediation decision before final approval. They are not new runtime dependency changes introduced by the retarget. Current review-thread and hosted-check state should be read live from PR #4, rather than inferred from this timestamped document.
