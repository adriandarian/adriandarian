# Repository assessment — 27 October 2026

Inspected before implementation, from clean `main` at `8d631d0`.

## Protected existing content

- Root `README.md` is the GitHub profile, independent of the website.
- Root `index.html` is the legacy homepage, referencing `assets/css/main.css`, the background image, Font Awesome and local fonts. Its biography differs from the profile README; neither is treated as verified new-world content.
- `test.html` contains older Toastify, speech, vibration and geolocation experiments. Preserve it as-is.
- `assets/` includes CSS, Sass, backgrounds, overlays and webfonts. Preserve all files.
- `CNAME` contains `adarian.dev`. Do not copy, edit or relocate it.
- `.github/FUNDING.yml` is the only existing GitHub configuration file. There is no build/deployment workflow, package manifest or existing application toolchain.
- Root `.gitignore` ignores `node_modules/`.

## Deployment evidence

Read-only `gh api repos/adriandarian/adriandarian/pages` reports `build_type: legacy`, `source: {branch: main, path: /}`, `cname: adarian.dev`, and status `built`. The feature branch does not deploy through this configuration. No Pages setting, root file, domain file or workflow is changed by this prototype.

The Vite source is deliberately separate in `experience/`, with output in ignored `experience/dist/`. No built bundle is committed and no production deployment is installed. Merging this PR would add source only; publishing the compiled app requires a separately reviewed deployment decision. The legacy root homepage is not wired to this app.

## Decisions made before architecture changes

1. One React Three Fiber Canvas, with independently lazy-loaded worlds. No simultaneous renderer per world.
2. World definitions own camera sampling, entry locations, lighting and geometry. The host handles lifecycle and navigation, without requiring a page layout or a shared camera curve.
3. A directed graph connects contextual artifact placements to world entry points. Hash routes survive static hosting and browser back/forward without server rewrites.
4. Artifacts, placements, graph edges and content records live separately. Notebook identity recurs; its destinations depend on the world. Unverified biography and projects are excluded. The signal laboratory is explicitly prototype content.
5. Board entry uses an interruptible GSAP camera approach/dive, followed by a short circuit-colored occlusion and destination emergence. History commits once at the covered boundary. Back/forward cancels an active transition.
6. Procedural geometry first: no external models, textures, environment maps or image backgrounds. Imported future assets must be world-owned, budgeted and disposed on unmount.
7. Accessible DOM discovery controls mirror mesh interactions. Touch uses vertical drag and large step controls. Reduced motion removes continuous signal animation and cinematic travel. WebGL failure leaves a usable graph and signal experiment.

References: [R3F Canvas fallback](https://r3f.docs.pmnd.rs/api/canvas), [Vite deployment/base paths](https://vite.dev/guide/static-deploy). These informed the single-renderer fallback and relative build base; no deployment instructions from those guides are applied to production.
