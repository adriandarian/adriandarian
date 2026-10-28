# Open canopy refinement

Focused design-only revision of the workshop at the approved spatial baseline **446f8a7**. PCB geometry, notebook placement, trace mapping and proposed navigation routes remain locked to that baseline. This package requests visual sign-off on the canopy; it does not authorize implementation, new materials, effects or postprocessing.

## Views to review

- [A-to-C approach sequence](approach-sequence.png): seven views of one fixed scene, starting with the exact Phase 2 handoff pose. The individual [handoff](approach-00-handoff.png), [half turn](approach-01-turn.png), [oriented arrival](approach-02-arrival.png), [junction](approach-03-junction.png), [west turn](approach-04-west-turn.png), [approach](approach-05-approach.png) and [workshop](approach-06-workshop.png) are available at full resolution.
- [Closer laboratory view](frame-close.png): original controls, open side, short roof and housing-mounted braces.
- [Side view](frame-side.png): the original processor edge, upper silhouette and lid remain legible as the workshop's host.
- [Updated arrival](frame-A.png) and [workshop context](frame-C.png).
- [Manifest](scene-manifest.json) and [validation results](validation.json).

The sequence is an ordered set of spatial samples, not a timed animation or a mandatory itinerary. It does not claim playback smoothness. No additional elaborate animatic is introduced.

## Targeted architectural change

The roof changes from 7 by 12 units to 6 by 6.5 units, with thickness reduced from 0.5 to 0.35. Its center is `[15,5.8,-18]`; the unchanged processor's west edge remains at X=18. The front, west side and rear are open. Both full-height enclosure walls are removed.

Two diagonal braces run from housing anchor plates at the processor's west face to the roof underside. They show how the shallow canopy depends on its electronic host, rather than reading as an independent room. This is architectural visual intent, not structural engineering certification. The original processor is not hollowed, raised, mirrored or moved.

The platform remains centered at `[14.5,0.5,-16]`, size `[7,0.4,12]`. The console remains at `[13.5,1.65,-18]`; all three controls retain their exact baseline positions. Their future signal-routing behavior remains unimplemented. The existing small overhead strip is shortened to one third of its previous length; the point light, scene lights and material setup remain those of the geometry study. Intimate final lighting is a later pass, not part of this approval request.

The workshop C camera position remains `[16,2.6,-5]`; its view now includes both the console and original chip housing. Close and side camera poses are recorded in the manifest. The notebook remains at `[112,1.2,-12]` in the unchanged socket gap.

## Handoff camera condition

The first sample uses the exact imported `CIRCUIT_ENTRY`: position, target and FOV. Subsequent samples show a gradual yaw/pitch change at the same position, then movement along the proposed main trace route. The approved handedness is retained. The scene does not snap to the approximately 43-degree processor-facing orientation at the scale handoff.

Actual visitor-controlled rotation, speed, interruption, focus and reduced-motion behavior require later controller implementation and verification. The samples deliberately prescribe no duration. They are not permission for an automatic forced turn or automatic A-to-C journey.

## Verification and remaining navigation gate

Run from `experience/`: `node docs/phase3a/render-canopy.mjs`.

The script renders the unchanged production `PiBoard` with the existing transform. It asserts equality against the committed reconciliation manifest for all PCB landmarks, existing traces, notebook, attached spur, route proposals, transform and approved A/B poses. It also confirms:

- The 33-position notebook visibility-count sequence is unchanged; arrival still exposes zero sampled notebook points.
- The original processor sample `[18,10,-20]` is in the frustum and first hits the original board mesh in workshop, close and side views. The images provide the broader visual check; one ray is not proof of whole-component visibility.
- Both proposed route centerlines still have no mesh intersections at the sampled height.

The existing full application test suite is not rerun for this documentation-only geometry study. These focused render/assertion checks do not replace application regression tests or physical-device measurements.

**Navigation remains a separate acceptance gate before implementation approval:** swept capsule/body-radius clearance; smooth corner traversal; actual controllable and independently reachable main/notebook paths; camera visibility; cancellation/history consistency; keyboard/touch and accessible alternatives. The 43-unit main route and approximately 167.6-unit optional detour are unchanged. The detour still needs a real usability check at visitor-controlled speed. Centerline rays do not establish that it feels rewarding or that a body can traverse it.

Materials, lighting and storytelling can follow spatial sign-off. New shaders, lighting or effects must not worsen cold-entry GPU synchronization without explicit performance review. No application or deployment change is included here.
