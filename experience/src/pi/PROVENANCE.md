# Board asset provenance and budget

`PiBoard.tsx` and `layout.ts` are original procedural geometry created for this repository. They do not use an imported model, scan, CAD drawing, photograph, logo, texture, or generated image. No third-party asset package is included. Runtime dependencies retain their own licenses in the npm dependency tree.

This is a **Raspberry Pi-inspired single-board computer study**, not an official product model or an accurate PCB/electrical design. Its placement, 40-pin header, hollow sockets, chip packages, plated holes, contacts, solder pads, capacitors and branching traces are independently authored. It makes no claim of endorsement or hardware compatibility.

The same layout renders at object scale and at 100× in Circuit World. Edges, trace routes and component dimensions therefore remain shared visual landmarks across the coordinate handoff.

Budget in `BOARD_BUDGET`: 48 mesh/material submissions, 18,000 full-model triangles, zero textures / zero texture bytes, and 8,000 gzip bytes for the dedicated model chunk. Measured model: 36 submissions and 14,016 triangles; model chunk approximately 2.77 kB gzip. These counts include instanced repeated components. World budgets remain the original Phase 1 ceilings; they were not raised to fit the asset.

Geometries, materials and instanced meshes are declarative R3F children owned by `ScaleBoard` inside the single Canvas. The same mesh survives the trail-to-circuit handoff, preserving GPU buffers and the animated signal clock. It fully unmounts when entering the notebook or removing the renderer. Shape/path descriptors and part arrays contain CPU data only; no external GPU geometry/material is cached globally. The existing custom trail buffer retains its explicit disposal. Repeated world-visit checks cover GPU geometry plateaus; those checks are not a complete heap/driver memory audit.
