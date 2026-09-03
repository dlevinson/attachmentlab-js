import type { NodeRecord } from '../types/model';

export function euclideanDistance(ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  return Math.hypot(dx, dy);
}

export function distanceToNode(point: { x: number; y: number }, node: NodeRecord): number {
  return euclideanDistance(point.x, point.y, node.x, node.y);
}
