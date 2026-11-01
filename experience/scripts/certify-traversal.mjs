import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  entryPoints: [path.join(root, "src/circuit/traversal.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
});
const { paths, BODY, sweptClear, obstacles, junction } = await import(
  "data:text/javascript;base64," +
    Buffer.from(bundle.outputFiles[0].text).toString("base64")
);
const routes = {};
for (const [name, p] of Object.entries(paths)) {
  let lo = 0,
    hi = 10;
  for (let i = 0; i < 24; i++) {
    const r = (lo + hi) / 2;
    if (p.samples.slice(1).every((b, j) => sweptClear(p.samples[j], b, r)))
      lo = r;
    else hi = r;
  }
  if (lo < BODY.radius + BODY.curveError)
    throw new Error("Insufficient clearance");
  routes[name] = {
    length: p.length,
    segments: p.samples.length - 1,
    minConservativeHorizontalClearance: lo,
    bodyRadius: BODY.radius,
    reservedCurveMargin: BODY.curveError,
    nominalCruiseSeconds: p.length / 18,
    passes: true,
  };
}
const sourceHashes = {};
for (const file of [
  "src/pi/PiBoard.tsx",
  "src/pi/layout.ts",
  "src/pi/ScaleBoard.tsx",
  "src/pi/scaleJourney.ts",
  "src/circuit/traversal.ts",
])
  sourceHashes[file] = createHash("sha256")
    .update(await readFile(path.join(root, file)))
    .digest("hex");
const report = {
  designBaseline: "737ae7f",
  body: BODY,
  obstacleCount: obstacles.length,
  junction,
  routes,
  sourceHashes,
  method:
    "Continuous swept horizontal disk against vertically overlapping conservative component bounds. This over-approximates the upright capsule; all controller segments are tested, not only center rays. Curves use certified chord samples with extra deviation margin.",
  limitations:
    "Static guided paths, not free roaming or dynamic rigid-body physics. Rounded component boxes are conservative. Bounds must be maintained if authoritative geometry changes. Nominal cruise time excludes acceleration, slower discovery approaches, stops and low-frame-rate dt clamping.",
};
await writeFile(
  path.join(root, "docs/phase3-traversal-clearance.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(routes);
