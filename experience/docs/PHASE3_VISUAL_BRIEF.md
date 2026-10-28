# Phase 3 visual design brief

Status: Overall composition approved at f96b3db, subject to focused notebook-reveal and PCB-mapping reconciliation. The [v2 study](phase3a/reconciled/README.md) now uses the actual production PiBoard geometry and a multipoint lateral visibility sweep. Its updated composition and explicitly attached workshop need visual review before material/lighting development. Phase 3A implementation is not yet approved.
Baseline: Phase 2 squash merge `65c2acf`; security cleanup squash merge `33c57c3`.

## The question

Can someone forget the prototype and feel that they have entered a living, mysterious place?

The experience should invite a small decision before explaining a destination. A light disappears behind a component; a paper corner catches the eye; following either reveals a connection to somewhere already encountered. Discovery must change what the visitor understands about the surroundings. Visual richness alone does not satisfy this brief.

## Evidence and continuity

The [inspection frame](media/pi-inspection.png) establishes a recognizable physical board: sockets, GPIO pins, chips, capacitors and traces. Preserve those landmarks through the descent. The [arrival frame](media/circuit-arrival.png) proves component scale and perspective, but its bright uniform floor, dark undifferentiated components, large title and persistent destination labels compete with spatial discovery. The first improvement should be composition, material separation and light hierarchy.

These committed frames are historical Phase 2 captures, not fresh captures of main. The brief is grounded in them and the current scene source. The references supplied in the conversation are mood prompts; this draft does not claim to have inspected their linked images or cleared them for asset use. Any future reference board should retain source and license information. No external imagery becomes an in-world background.

## Shared visual language

- Contrast intimate human traces with enormous physical structures: paper against copper, a warm recess beneath a cold chip, a familiar leaf beside an unfamiliar path.
- Establish foreground occlusion, a readable middle-distance invitation and a partially concealed far landmark in each key composition.
- Let purposeful movement carry information. Signals follow actual connections and disappear behind geometry. Keep ambient motion sparse and calm; discovery must remain possible with motion disabled.
- Communicate interactivity through physical affordances, material contrast, local response and focused labels. Preserve an immediately available accessible object index and recovery navigation.
- Preserve the directed navigation graph, contextual entry points, deep links, history and cancellation. Connections should create loops and unexpected returns rather than a sequence of three scene demos.

## 3A: Circuit World — the trace canyon

Proposed direction: an impossible landscape made from electronics, with a narrow foreground opening into an enormous canyon. Working palette supplied for creative review: deep void `#071B21`, PCB green `#17443B`, copper `#BB8555`, signal `#68DBC6`, warmth `#F2B978`. Avoid constant neon: a pulse communicates activity, amber suggests habitation, and an unusual transient color may hint at a secret.

Arrival composition: a low camera looks along a trace that bends behind a towering capacitor. A nearer component cuts into one edge of the view. The processor rises beyond it, with a tiny warm recess visible beneath its edge. GPIO pins form an unevenly occluded distant rhythm. The visitor recognizes the board inspected seconds earlier while the framing makes its scale surprising.

Three discovery beats, using existing artifacts and destinations:

1. **Follow the current.** A bounded signal travels along the physical trace, turns behind a component and reappears farther away. The junction presents two visibly different routes. Both remain understandable without animation through trace shape and lighting.
2. **Find the laboratory.** The existing signal artifact becomes a small workshop physically embedded beneath the processor overhang. A threshold, interior surface and warm light make it legible before a label appears. Physical controls reroute the existing prototype signal experiment in the scene; an ordinary modal is not its primary experience. Keep an equivalent accessible control surface. The design maquette depicts controls but does not implement their behavior. No invented personal project history and no new laboratory world in 3A.
3. **Notice the paper.** A notebook corner protrudes between connectors. Changing viewpoint reveals its cover and copper bookmark. Its visible mesh is the interaction target; activating it retains the contextual notebook entry. A pressed leaf elsewhere offers the existing unexpected return to the mountain trail.

Materials should read through real edge thickness, restrained roughness variation and directional highlights. Copper paths should feel embedded in the board; emission should reveal routes without flattening the entire floor. Use distance atmosphere to separate layers while preserving silhouettes. Begin with geometry, existing lights and inexpensive fog; evaluate postprocessing only after this composition works.

During descent, carry a recognizable trace junction and adjacent component through matching views. Evolve the illumination gradually along the approach where technically feasible. Preserve the same board identity, coordinate alignment and interruptible journey. No new full-screen fade to hide a loading or compilation stall.

## 3B: Mountain World — the inhabited trail

Develop after approval and validation of 3A. Keep the guided trail and existing board discovery. Shape terrain into bends, shelves and small changes in elevation, with near vegetation, a middle-distance path and layered mountain silhouettes. Choose vegetation clusters with distinctive silhouettes before increasing their count.

The cafe should be glimpsed across a bend through warm windows or a roof silhouette, then hidden briefly by terrain. It remains the existing inspectable destination unless a separate scope approves an interior. Board placement needs a believable resting surface and an inviting approach. Use weather as atmosphere and material response first; do not make dense particles essential to the scene.

Curiosity loop: a cafe glimpse encourages movement, an unexpected object interrupts that journey, and a notebook/leaf connection can return the visitor to a meaningful trail entry. No new biography or adventure claims without verified records.

## 3C: Notebook — a physical collection of connections

Develop after the earlier directions are approved. Start with one convincing page turn: a curved sheet, readable thickness, contact with the book and interruptible movement. Paper, binding, marginal sketches and a copper bookmark should feel handled and specific.

Use a small number of inspectable marks and embedded portals with real surface placement. A recurring sketch can recall a trace junction or mountain silhouette. Mark sample sketches and stories as prototype content until sourced. Page turns must be usable with keyboard, touch and reduced motion; a direct page selection provides equivalent access. A portal is a graph edge with context, not an arbitrary next-page action. Do not build a full publishing system in this milestone.

## Interface and access

Propose replacing the persistent oversized world heading with a brief orientation cue, then allowing the environment to lead. Keep semantic headings available to assistive technology and preserve route-change focus behavior. Show concise object names on intentional hover, keyboard focus or touch selection. Touch must not depend on hover; selection and travel need deliberate, distinguishable actions.

The object index must expose all usable discoveries, including partly concealed objects. Wayfinder/recovery navigation stays available without requiring a visual hunt. Reduced motion retains composition, static path cues and equivalent direct travel. Fog and shadows must never make recovery or required controls illegible. No timed discovery requirement, flashing signal effect or mandatory sound cue.

## Performance and engineering constraints

The [cold-entry GPU follow-up](COLD_ENTRY_GPU_FOLLOWUP.md) remains a separate task and an explicit risk before expensive effects. **New shaders, lighting and effects must not worsen the existing cold-entry GPU synchronization problem without an explicit performance review.** Preserve all Chrome trace evidence. CPU-throttled desktop emulation is not physical-phone acceptance.

- Retain one canvas/renderer, shared board identity, lazy environment modules, disposal ownership and cancellation leases.
- Keep the board's current ceilings: 48 mesh/material submissions, 18,000 triangles, zero texture bytes and an 8 kB gzip module. Its measured baseline is 36 submissions and 14,016 triangles. These are model limits, not total-scene limits.
- Establish fresh total-scene and handoff baselines before implementing the first lighting study. Any additional texture, shadow, light or postprocessing pass needs an explicit measured budget and a lower-cost fallback. Do not silently raise existing limits.
- Test repeated unload/reload and interrupted travel as art assets are added. Compare identical cold/warm routes with profiling overhead identified. Physical mobile checks must include GPU frame pacing, memory, touch usability and sustained use before a seamless-mobile claim.
- No static scenery replacing geometry, invisible image hotspots or decorative particle volume to conceal missing spatial detail.

## Approval package and acceptance

The first [three-frame spatial target and animatic package](phase3a/README.md) uses one fixed scene and camera-only movement: A arrival, B lateral notebook reveal, C workshop approach. It includes landmark coordinates, an annotated spatial plan and a 16-second animatic. These are rough geometric composition targets, not polished concept art or application footage. Before implementation, review continuity and reveal timing, then develop approved material/lighting targets and portrait compositions. Fine particles and page flutter remain optional, unimplemented studies; composition and static affordances must work without them.

After approval, implement one bounded 3A lighting/composition study before spreading the treatment across the board. Review a real moving capture, then expand only if these conditions hold:

1. Arrival is recognizably the same physical board and feels monumental without a large explanatory heading.
2. A visitor can identify an inviting direction and discover a second route through viewpoint change; labels explain an encountered object rather than advertise every destination from arrival.
3. Laboratory and notebook each have distinct physical affordances, usable mesh targets and their existing functional graph connections. The world offers an optional surprise and an accessible route to every interaction.
4. Keyboard, touch, reduced motion, deep links, browser history and rapid cancellation still work. All 17 unit tests and 14 browser scenarios remain passing, with focused new checks only for changed behavior.
5. Comparable measurements show the cost of the artistic change; GPU lifecycle plateaus remain stable. Outstanding hardware limitations are stated plainly.

The animatic demonstrates independent choices, not a mandatory visitor sequence. The primary trace must lead directly to the laboratory without requiring notebook discovery. The connector route should reveal the notebook through a useful interval of lateral motion, not one exact camera coordinate. Returning to the junction demonstrates a memorable fixed landmark.

The original animatic is historical cinematography evidence. The focused v2 reconciliation now supplies the PCB mapping, updated frames, multi-position notebook sweep and route proposals. Remaining approval gates: review the mapped composition (including the change in handedness at the actual entry), accept or revise the attached workshop, and confirm the reveal before developing material, lighting and atmosphere targets. A future navigation implementation must still make the proposed routes reachable. No Phase 3A implementation is authorized. 3B and 3C remain separate creative milestones.
