# Trace Canyon: composition approval package

**Latest revision: [PCB reconciliation v2](reconciled/README.md).** It renders the unchanged production board at its actual circuit transform, widens and samples the notebook reveal, and provides updated A/B/C frames. The original maquette and video below remain historical; they are not the latest PCB-aligned layout.

Design-only shared 3D maquette. Original custom geometry; no external models, textures or generated image backgrounds. This package changes no application scene or runtime dependencies. All three targets are real renders of the same fixed geometry. Only camera pose and the trace pulse change. Annotations are review overlays, not proposed persistent interface labels.

- [A: arrival](frame-A.png): narrow foreground, main trace, monumental processor left, GPIO forest right, warm workshop beyond.
- [B: hidden discovery](frame-B.png): lateral displacement around the connector screen reveals the notebook. The processor and workshop remain in their original locations behind it.
- [C: laboratory](frame-C.png): moving forward along the main route reveals a recessed machine and physical controls beneath the processor. Controls are depicted, not functional in this design study.
- [16-second camera animatic](trace-canyon-animatic.webm): A hold 0–2s; lateral A→B 2–6s; notebook hold 6–8s; return B→A 8–10s; main route A→C 10–14s; workshop hold 14–16s. No cuts, fades, landmark swaps or geometry motion.
- [Spatial plan](spatial-plan.svg), [exact scene/camera manifest](scene-manifest.json), [notebook sightline samples](sightlines.json).

The animatic is sampled deterministically at 10 fps for composition review. Its playback cadence is not a runtime performance measurement. Rough geometry, simple materials and a small lighting setup establish scale and reveal timing; this is not a claim of final cinematic quality. Particles, flutter, functional controls, polished surface detail and portrait framing are not implemented. Notebook sample raycasts establish occlusion for one point, not visibility of every page corner. Review the actual views as well.

Coordinates are concept metres in this maquette, not current production board coordinates. The broad processor/connector/GPIO relationship carries over, but faithful integration still requires an explicit mapping to `src/pi/layout.ts` and the existing scale-transition landmarks. Do not copy this scene into the engine as an unrelated replacement board. Preserve the shared physical object through the transition.

Reproduce from `experience/` with `node docs/phase3a/render-study.mjs`. Uses existing Three.js, esbuild and Playwright packages without installing new dependencies; the WebM encoder is the local Windows Playwright ffmpeg build. The script bundles a standalone ignored `study.html`, launches an owned headless Chromium, renders frames without a server, encodes a WebM, and closes Chromium. Open the generated HTML locally to inspect the source scene. All retained frames derive from `study.js` and one shared manifest.

The overall Trace Canyon concept and arrival/junction/laboratory relationship are conceptually approved. Concealed notebook behavior is approved in principle, pending inspection of the actual recording. Camera pacing and sightlines still require visual sign-off. This recording is a cinematography study, not a prescribed visitor sequence: the main trace must reach the laboratory directly, and lateral curiosity may lead to the notebook independently. Returning to the junction demonstrates the shared layout; it is not a required itinerary.

The original maquette coordinates above are not PCB coordinates. The [v2 reconciliation](reconciled/README.md) supplies that mapping using the actual board component and samples the reveal over a useful movement interval. Review its revised frames and deliberate attachments before materials and lighting. Phase 3A implementation is not yet approved. Approving this spatial study does not approve an expensive effect stack or waive the cold-entry GPU performance review. 3B and 3C remain separate milestones.
