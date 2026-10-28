# PCB reconciliation v2

This supersedes the independent concept coordinates in the original study. It is a focused design-only revision: actual production board geometry, three updated views, a notebook visibility sweep and proposed routes. No new animatic, runtime change or material-development pass is included.

## Review artifacts

- [A: entry orientation](frame-A.png), [B: notebook reveal](frame-B.png), [C: workshop](frame-C.png).
- [Visibility strip](visibility-strip.png): five views during the same lateral movement; individual [start](sweep-start.png), [2 units](sweep-early.png), [4 units](sweep-middle.png), [6 units](sweep-late.png), [8 units](sweep-end.png).
- [PCB-aligned manifest](scene-manifest.json), [full visibility sweep](visibility-sweep.json), [route centerline checks](route-checks.json), [PCB spatial plan](spatial-plan.svg).
- Reproduce from `experience/`: `node docs/phase3a/render-reconciliation.mjs`.

## Physical authority

The renderer imports the unchanged `src/pi/PiBoard.tsx` itself, not a hand-built approximation. It mounts that component with `position = -TRACE_ANCHOR * 100` and `scale = 100`, importing those constants from `src/pi/layout.ts`. All sockets, GPIO, capacitors, resistor banks, mounting holes, processor and traces therefore retain their production geometry and relative positions. This is one board in one renderer. Proposed additions are in a separate named attachment group.

| Landmark | Board-local coordinates | Circuit coordinates |
| --- | --- | --- |
| Processor center | `[-0.08, 0.073, -0.04]` | `[39, 7.3, -28]` |
| Processor size | `[0.42, 0.14, 0.36]` | `[42, 14, 36]` |
| Socket 0 shell center | `[0.72, 0.12, 0.30]` | `[119, 12, 6]` |
| Socket 1 shell center | `[0.72, 0.12, -0.06]` | `[119, 12, -30]` |
| GPIO centers | imported `layout.gpio` | X `-20` to `82.6`; Y `13.5`; Z `-67` / `-60.5` |
| Notebook attachment center | `[0.65, 0.012, 0.12]` | `[112, 1.2, -12]` |
| Workshop canopy center | `[-0.325, 0.058, 0.08]` | `[14.5, 5.8, -16]` |

The manifest lists each GPIO pin, all existing trace points, component sources, cameras, attachments and navigation proposals. Imported geometry is authoritative; explicit source-coordinate entries document mapping rather than replacing the source model.

### Consequences for the composition

The physical board does not contain the old walk-in space under the processor. Its bottom is Y=0.3 at circuit scale. The revised workshop is deliberately attached to the processor's west edge, under a new canopy that abuts X=18. The processor is neither hollowed, moved nor lifted. The workshop's walls, threshold and controls are new attached structures; its short surface conductor connects to the existing branch at Z=-4. These additions need later creative and engineering approval.

Arrival A keeps the exact `CIRCUIT_ENTRY.position` `[0,1.8,10]`. It is an orientation view looking toward the processor, not a replacement handoff pose. The transition must first retain the existing entry target `[0,1.2,-10]`, then allow visitor-controlled rotation. With the real board authoritative, the processor appears to the right and GPIO to the left in this view. This differs from the original maquette's handedness; do not silently mirror the board to preserve an illustration. A rotated-view composition needs visual review.

The notebook sits in the real six-unit gap between socket walls at Z=-15 and Z=-9. Its cover is 5 by 3.6 circuit units, with layered paper and a raised corner. No socket geometry is removed or repositioned to expose it.

## Reveal measurement

The local reveal begins at J `[98,2.6,-5]` and ends at B `[98,2.6,-13]`, looking east toward the notebook. Displacement is exactly eight circuit units in Z (0.08 board-local units); X and height are constant. This is lateral relative to the east-facing view, with zero forward displacement. Arrival-to-notebook travel is a separate optional route, not disguised as a single sideways step.

The sweep samples 33 positions at 0.25-unit intervals and ten points distributed over the cover/page, including the raised corner. Each sample requires both camera-frustum inclusion and a nearest ray hit on the actual notebook mesh. Rays intersect all rendered meshes recursively, including the actual socket walls and interiors. No bounding-box-only visibility approximation is used.

| Distance from J | Visible points |
| --- | --- |
| 0 through 3.25 | 0/10 |
| 3.5 | 1/10 |
| 3.75 | 2/10 |
| 4.0 | 4/10 |
| 4.25 | 6/10 |
| 4.5 through 5.5 | 10/10 |
| 5.75 through 8 | 9/10 |

The first partial reveal starts 43.75% through the shift, leaving 4.5 units of movement with at least one visible point. At least 8/10 points remain visible across the final 3.5 units. The first majority occurs at 4.25 units. Arrival A exposes 0/10 points. These are discrete geometric samples, not a guarantee of perceptual recognition, continuous area visibility or touch usability. Intermediate screenshots provide the visual check. The render script asserts arrival occlusion, a partial reveal by halfway, sustained visibility over the final interval, and unblocked route centerlines.

## Reachability and remaining gate

The manifest proposes independent main and notebook branches, sharing a junction on the existing trace network. Main reaches the workshop directly without notebook discovery. The optional route detours south of the ribbon connector at Z=27, then approaches the socket gap from its west side. Following the original copper line literally would pass beneath the ribbon housing; the detour avoids that physical obstacle. Centerline rays at Y=2.6 find no mesh intersections on either proposed polyline. These checks do not certify body-radius clearance, camera smoothing, corner turning or every intermediate camera orientation.

The current application controller remains a narrow guided corridor and cannot reach the proposed workshop or socket gap. A future branch controller must make these routes interruptible and independently reachable, with deliberate visitor control, accessible equivalents and existing history/cancellation semantics. The long optional route is not a fast automatic traversal. This study approves no such implementation.

The original 16-second video remains historical evidence of the old maquette. It is not a recording of this revision. Materials, lighting, atmosphere and Phase 3A implementation remain gated on visual review of this reconciliation. New shaders, lighting and effects must not worsen cold-entry GPU synchronization without explicit performance review. No performance claim is derived from these offline renders.
