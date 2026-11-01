import { createContext, useContext } from "react";
import type { ArtifactId, Journey } from "./types";
import type { MutableRefObject } from "react";
import type { Travel } from "../circuit/traversal";
export type Runtime = {
  activate: (id: ArtifactId) => void;
  hover: (label: string | null) => void;
  progress: MutableRefObject<number>;
  journey: MutableRefObject<Journey | null>;
  handoff: MutableRefObject<boolean>;
  steer: MutableRefObject<number>;
  inspection: MutableRefObject<boolean>;
  circuit: MutableRefObject<Travel>;
  reducedMotion: boolean;
};
export const RuntimeContext = createContext<Runtime | null>(null);
export function useRuntime() {
  const value = useContext(RuntimeContext);
  if (!value) throw new Error("Missing world runtime");
  return value;
}
