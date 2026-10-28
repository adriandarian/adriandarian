# Manual spatial interaction checklist

Run `npm run build` and `npm run preview`. Use the local URL, not the production domain. Browser automation captures evidence in ignored `test-results/`; inspect those captures as well as moving through the app yourself.

## Desktop, standard motion

- [ ] Trail starts calmly, with a winding ground path, foreground trees/rocks, distant mountains and café destination.
- [ ] Scroll from start to end and reverse. Watch near trees move faster than mountains; nearer geometry should occlude objects behind it. The camera must not tunnel through terrain.
- [ ] Move the pointer to inspect both sides; click the physical Pi, notebook and café meshes. Labels are annotations, not invisible interaction regions.
- [ ] Pi approach shows the actual board getting larger. The camera arcs over it and shrinks toward the traces; matching component geometry continues into the circuit entry without a full-screen veil.
- [ ] Escape during the approach cancels travel without a later route jump. Browser back during a second approach must also cancel it.
- [ ] Circuit has component height, branching traces and moving pulses. Scroll toward/away from components and confirm parallax and occlusion.
- [ ] Open signal laboratory, send to A and B, close the gate, and confirm blocked output. Escape closes the dialog.
- [ ] Enter the notebook from both worlds. Field and copper entries show distinct context. Drag to orbit on desktop; inspect the page geometry and activate either keepsake.
- [ ] At the end of every guided route, nearby objects, reverse scrolling and Wayfinder prevent a dead end.

## History and lifecycle

- [ ] Refresh `#/circuit/board` and `#/notebook/copper`. Invalid hashes recover to the trail.
- [ ] Traverse trail → circuit → notebook → trail; browser back/forward should restore world and entry point without duplicate entries.
- [ ] Repeat ten transitions. Inspect `data-scene-stats`; GPU resources should settle for each world, rather than accumulating per visit.
- [ ] Throttle network on the first circuit visit. The final physical board framing should wait for its module; Escape must still cancel it.
- [ ] Close/open Wayfinder while travelling. No stale animation should override its destination.

## Accessibility, touch and failure

- [ ] Tab to the skip link and use Objects nearby without pointing at the canvas. All artifacts must remain reachable.
- [ ] Navigate with arrows and step buttons. New world title receives focus; dialog focus stays inside until closed and then returns.
- [ ] Enable reduced motion before load and while travelling. No cinematic zoom or moving pulses; navigation still works.
- [ ] On an actual phone/tablet: drag vertically, tap a mesh, use large step controls, open/close panels in portrait and landscape. Dragging must not accidentally open an artifact.
- [ ] Disable WebGL (or lose its context). The fallback explains recovery; object links and signal laboratory remain usable.
- [ ] Check Chrome, Firefox and Safari, including a low-power integrated GPU, before treating this as a production release.

Unchecked boxes are a reusable human acceptance list, not claims that device testing has been performed. See VALIDATION.md for checks actually run.

## Phase 2 scale-transition acceptance

- [ ] Use the inspection control and move around the board; sockets have actual apertures, the pins have thickness and component edges show changing material highlights.
- [ ] On a portrait phone, inspection framing should show the board without requiring a precision mesh tap; object-index and Enter the circuitry controls remain reachable.
- [ ] Click the physical board from different trail positions. The choreography starts from the current camera instead of jumping to a fixed opening shot.
- [ ] Follow a trace into the shrink. The same component shapes and GPIO structure should remain identifiable after the 100× handoff, with no full-screen color veil.
- [ ] Move forward/backward and left/right in the circuit. Reach the signal laboratory, notebook and leaf through their real meshes or accessible controls.
- [ ] Cancel during focus, orbit, descent and a delayed module load. Rapidly restart, use browser back/forward, and toggle reduced motion; no late callback should navigate unexpectedly.
- [ ] Inspect `data-scene-stats`: the board UUID should survive trail/circuit handoffs; it should be released when the notebook unmounts that mesh. Repeat visits and check resource plateaus.
- [ ] Assess the CPU-throttled boundary hitch on physical low-power hardware before describing the mobile transition as seamless.
