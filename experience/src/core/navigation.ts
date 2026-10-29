import type { ArtifactId, Route, WorldId } from "./types";
export const entries: Record<WorldId, string[]> = {
  trail: ["start", "board", "notebook"],
  circuit: ["board", "bookmark"],
  notebook: ["field", "copper"],
};
export const graph: Partial<Record<`${WorldId}:${ArtifactId}`, Route>> = {
  "trail:pi": { world: "circuit", entry: "board" },
  "trail:notebook": { world: "notebook", entry: "field" },
  "circuit:notebook": { world: "notebook", entry: "copper" },
  "circuit:trail-thread": { world: "trail", entry: "board" },
  "notebook:trail-thread": { world: "trail", entry: "notebook" },
  "notebook:circuit-thread": { world: "circuit", entry: "bookmark" },
};
export const home: Route = { world: "trail", entry: "start" };
export function parseRoute(hash: string): Route {
  const [world, entry] = hash.replace(/^#\/?/, "").split("/");
  if (
    Object.hasOwn(entries, world) &&
    entries[world as WorldId].includes(entry)
  )
    return { world: world as WorldId, entry };
  return home;
}
export const routeHash = (route: Route) => `#/${route.world}/${route.entry}`;
export const destination = (world: WorldId, artifact: ArtifactId) =>
  graph[`${world}:${artifact}`];
export function commitRoute(route: Route) {
  window.dispatchEvent(new Event("universe:before-navigate"));
  if (location.hash !== routeHash(route))
    history.pushState(null, "", routeHash(route));
  window.dispatchEvent(new Event("universe:navigate"));
}
