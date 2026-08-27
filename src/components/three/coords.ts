import type { GridNode } from "@/types/grid";

/** Source topology space (see src/data/topology.ts) */
const X_RANGE = 1040;
const Y_RANGE = 1680;

/** Half-extents of the 3D world footprint (units are arbitrary "meters") */
const WORLD_HALF_X = 26;
const WORLD_HALF_Z = 34;

/** Maps a node's 2D topology coordinate onto the ground plane of the 3D scene. */
export function nodeWorldPos(node: Pick<GridNode, "x" | "y">): [number, number, number] {
  const wx = (node.x / X_RANGE - 0.5) * WORLD_HALF_X * 2;
  const wz = (node.y / Y_RANGE - 0.5) * WORLD_HALF_Z * 2;
  return [wx, 0, wz];
}

export const WORLD_BOUNDS = { halfX: WORLD_HALF_X, halfZ: WORLD_HALF_Z };
