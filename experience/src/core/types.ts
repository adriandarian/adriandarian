import type { ComponentType } from "react";
export type WorldId = "trail" | "circuit" | "notebook";
export type ArtifactId =
  "pi" | "notebook" | "cafe" | "signal" | "trail-thread" | "circuit-thread";
export type Point = [number, number, number];
export type Route = { world: WorldId; entry: string };
export type Pose = { position: Point; target: Point; fov: number };
export type Placement = {
  id: ArtifactId;
  position: Point;
  rotation?: Point;
  scale?: number;
  label: string;
};
export type WorldProps = { reducedMotion: boolean };
export type TransitionSpec = {
  kind: "board" | "paper";
  duration: number;
  cover: string;
};
export type WorldDefinition = {
  id: WorldId;
  title: string;
  subtitle: string;
  color: string;
  entries: Record<string, number>;
  camera: (progress: number) => Pose;
  load: () => Promise<{
    default: ComponentType<WorldProps>;
    Controller?: ComponentType<WorldProps>;
  }>;
  transitions?: Partial<Record<ArtifactId, TransitionSpec>>;
  placements: Placement[];
};
export type Journey = {
  target: Point;
  phase: number;
  kind: "board" | "paper";
  placement?: Placement;
  start?: Pose;
};
