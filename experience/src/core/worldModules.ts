import type { WorldDefinition, WorldId } from "./types";
type WorldModule = Awaited<ReturnType<WorldDefinition["load"]>>;

export function createWorldLoader() {
  const loaded = new Map<WorldId, WorldModule>();
  const pending = new Map<WorldId, Promise<WorldModule>>();
  return {
    get: (id: WorldId) => loaded.get(id),
    load(world: WorldDefinition): Promise<WorldModule> {
      const ready = loaded.get(world.id);
      if (ready) return Promise.resolve(ready);
      const existing = pending.get(world.id);
      if (existing) return existing;
      const request = Promise.resolve()
        .then(() => world.load())
        .then(
          (module) => {
            loaded.set(world.id, module);
            pending.delete(world.id);
            return module;
          },
          (error) => {
            pending.delete(world.id);
            throw error;
          },
        );
      pending.set(world.id, request);
      return request;
    },
  };
}
// CPU module exports only. GPU resources still belong to mounted R3F objects.
export const worldModules = createWorldLoader();
