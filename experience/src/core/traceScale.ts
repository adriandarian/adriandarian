// Local opt-in User Timing markers for exact handoff attribution. No telemetry.
const enabled =
  typeof location !== "undefined" &&
  new URLSearchParams(location.search).get("traceScale") === "1";
export function traceScaleMark(name: string) {
  if (enabled) performance.mark(`scale:${name}`);
}
