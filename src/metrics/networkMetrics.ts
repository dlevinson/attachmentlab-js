import type { EdgeRecord, MetricBundle, NodeRecord } from '../types/model';
import { gini } from './gini';

type Adjacency = Map<string, Set<string>>;

function buildAdjacency(nodes: NodeRecord[], edges: EdgeRecord[]): Adjacency {
  const adjacency = new Map<string, Set<string>>();
  nodes.forEach((node) => adjacency.set(node.id, new Set()));
  edges.forEach((edge) => {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  });
  return adjacency;
}

function connectedComponents(nodes: NodeRecord[], adjacency: Adjacency): string[][] {
  const seen = new Set<string>();
  const components: string[][] = [];

  nodes.forEach((node) => {
    if (seen.has(node.id)) {
      return;
    }

    const component: string[] = [];
    const queue = [node.id];
    seen.add(node.id);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(current);
      adjacency.get(current)?.forEach((neighbor) => {
        if (!seen.has(neighbor)) {
          seen.add(neighbor);
          queue.push(neighbor);
        }
      });
    }

    components.push(component);
  });

  return components;
}

function averageClustering(nodes: NodeRecord[], adjacency: Adjacency): number {
  if (nodes.length === 0) {
    return 0;
  }

  let total = 0;
  nodes.forEach((node) => {
    const neighbors = [...(adjacency.get(node.id) ?? [])];
    const degree = neighbors.length;
    if (degree < 2) {
      return;
    }
    let triangles = 0;
    for (let i = 0; i < neighbors.length; i += 1) {
      for (let j = i + 1; j < neighbors.length; j += 1) {
        if (adjacency.get(neighbors[i])?.has(neighbors[j])) {
          triangles += 1;
        }
      }
    }
    total += (2 * triangles) / (degree * (degree - 1));
  });
  return total / nodes.length;
}

function bfsDistances(start: string, allowed: Set<string>, adjacency: Adjacency): Map<string, number> {
  const distances = new Map<string, number>([[start, 0]]);
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const distance = distances.get(current)!;
    adjacency.get(current)?.forEach((neighbor) => {
      if (!allowed.has(neighbor) || distances.has(neighbor)) {
        return;
      }
      distances.set(neighbor, distance + 1);
      queue.push(neighbor);
    });
  }
  return distances;
}

function largestComponentStats(componentIds: string[], adjacency: Adjacency): { averagePathLength: number | null; diameter: number | null } {
  if (componentIds.length <= 1) {
    return { averagePathLength: 0, diameter: 0 };
  }

  if (componentIds.length > 700) {
    return { averagePathLength: null, diameter: null };
  }

  const allowed = new Set(componentIds);
  let total = 0;
  let count = 0;
  let diameter = 0;

  componentIds.forEach((nodeId) => {
    const distances = bfsDistances(nodeId, allowed, adjacency);
    distances.forEach((distance, targetId) => {
      if (targetId === nodeId) {
        return;
      }
      total += distance;
      count += 1;
      if (distance > diameter) {
        diameter = distance;
      }
    });
  });

  return {
    averagePathLength: count > 0 ? total / count : 0,
    diameter,
  };
}

function degreeAssortativity(edges: EdgeRecord[], degreeById: Map<string, number>): number | null {
  if (edges.length === 0) {
    return null;
  }
  const xs = edges.map((edge) => degreeById.get(edge.source) ?? 0);
  const ys = edges.map((edge) => degreeById.get(edge.target) ?? 0);
  const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;

  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  for (let index = 0; index < xs.length; index += 1) {
    const dx = xs[index] - meanX;
    const dy = ys[index] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }

  const denominator = Math.sqrt(denomX * denomY);
  return denominator > 0 ? numerator / denominator : null;
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const mid = Math.floor(values.length / 2);
  if (values.length % 2 === 0) {
    return (values[mid - 1] + values[mid]) / 2;
  }
  return values[mid];
}

function countSquares(adjacency: Adjacency): number {
  const nodeIds = [...adjacency.keys()];
  let squares = 0;

  for (let i = 0; i < nodeIds.length; i += 1) {
    for (let j = i + 1; j < nodeIds.length; j += 1) {
      const commonNeighbors = [...(adjacency.get(nodeIds[i]) ?? [])].filter((neighbor) =>
        adjacency.get(nodeIds[j])?.has(neighbor),
      );
      if (commonNeighbors.length >= 2) {
        squares += (commonNeighbors.length * (commonNeighbors.length - 1)) / 2;
      }
    }
  }

  return Math.floor(squares / 2);
}

function cross2d(ax: number, ay: number, bx: number, by: number): number {
  return ax * by - ay * bx;
}

function segmentIntersectionPoint(
  a1: { x: number; y: number },
  a2: { x: number; y: number },
  b1: { x: number; y: number },
  b2: { x: number; y: number },
): { x: number; y: number } | null {
  const r = { x: a2.x - a1.x, y: a2.y - a1.y };
  const s = { x: b2.x - b1.x, y: b2.y - b1.y };
  const denominator = cross2d(r.x, r.y, s.x, s.y);
  if (Math.abs(denominator) <= 1e-12) {
    return null;
  }
  const qp = { x: b1.x - a1.x, y: b1.y - a1.y };
  const t = cross2d(qp.x, qp.y, s.x, s.y) / denominator;
  const u = cross2d(qp.x, qp.y, r.x, r.y) / denominator;
  if (t <= 1e-9 || t >= 1 - 1e-9 || u <= 1e-9 || u >= 1 - 1e-9) {
    return null;
  }
  return {
    x: a1.x + t * r.x,
    y: a1.y + t * r.y,
  };
}

function crossingDiagnostics(nodes: NodeRecord[], edges: EdgeRecord[]): { crossingCount: number | null; crossingRate: number | null; approximatePlanar: boolean | null } {
  if (edges.length > 500) {
    return { crossingCount: null, crossingRate: null, approximatePlanar: null };
  }
  const byId = new Map(nodes.map((node) => [node.id, node]));
  let crossings = 0;
  for (let i = 0; i < edges.length; i += 1) {
    for (let j = i + 1; j < edges.length; j += 1) {
      const a = edges[i];
      const b = edges[j];
      if ([a.source, a.target].some((id) => id === b.source || id === b.target)) {
        continue;
      }
      const a1 = byId.get(a.source)!;
      const a2 = byId.get(a.target)!;
      const b1 = byId.get(b.source)!;
      const b2 = byId.get(b.target)!;
      if (segmentIntersectionPoint(a1, a2, b1, b2)) {
        crossings += 1;
      }
    }
  }
  const possiblePairs = (edges.length * (edges.length - 1)) / 2;
  return {
    crossingCount: crossings,
    crossingRate: possiblePairs > 0 ? crossings / possiblePairs : 0,
    approximatePlanar: crossings === 0,
  };
}

interface PlanarityDiagnostics {
  splitEvents?: number;
  splitLinkCount?: number;
  crossingCandidatesEncountered?: number;
  crossingCandidatesAdmitted?: number;
}

export function computeNetworkMetrics(
  nodes: NodeRecord[],
  edges: EdgeRecord[],
  degreeThreshold = 10,
  planarityDiagnostics: PlanarityDiagnostics = {},
): MetricBundle {
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const degrees = nodes.map((node) => node.degree);
  const adjacency = buildAdjacency(nodes, edges);
  const components = connectedComponents(nodes, adjacency);
  const largestComponent = components.reduce<string[]>((best, current) => (current.length > best.length ? current : best), []);
  const degreeById = new Map(nodes.map((node) => [node.id, node.degree]));
  const componentAssignments: Record<string, number> = {};
  components.forEach((component, index) => {
    component.forEach((nodeId) => {
      componentAssignments[nodeId] = index;
    });
  });

  const triangleCount =
    nodes.reduce((sum, node) => {
      const neighbors = [...(adjacency.get(node.id) ?? [])];
      let triangles = 0;
      for (let i = 0; i < neighbors.length; i += 1) {
        for (let j = i + 1; j < neighbors.length; j += 1) {
          if (adjacency.get(neighbors[i])?.has(neighbors[j])) {
            triangles += 1;
          }
        }
      }
      return sum + triangles;
    }, 0) / 3;

  const lccStats = largestComponentStats(largestComponent, adjacency);
  const crossings = crossingDiagnostics(nodes, edges);
  const sortedEdgeLengths = edges.map((edge) => edge.length).sort((a, b) => a - b);

  return {
    nodeCount,
    edgeCount,
    generatedIntersectionNodes: nodes.filter((node) => node.generatedBy === 'split_crossing').length,
    splitLinkCount: planarityDiagnostics.splitLinkCount ?? 0,
    splitEvents: planarityDiagnostics.splitEvents ?? 0,
    crossingCandidatesEncountered: planarityDiagnostics.crossingCandidatesEncountered ?? 0,
    crossingCandidatesAdmitted: planarityDiagnostics.crossingCandidatesAdmitted ?? 0,
    lonelyNodeCount: nodes.filter((node) => node.lonely).length,
    meanDegree: nodeCount > 0 ? (2 * edgeCount) / nodeCount : 0,
    maxDegree: degrees.length > 0 ? Math.max(...degrees) : 0,
    degreeGini: gini(degrees),
    shareAtCapacity: nodeCount > 0 ? nodes.filter((node) => node.saturated).length / nodeCount : 0,
    connectedComponents: components.length,
    largestComponentSize: largestComponent.length,
    largestComponentShare: nodeCount > 0 ? largestComponent.length / nodeCount : 0,
    averageClustering: averageClustering(nodes, adjacency),
    averagePathLengthLargestComponent: lccStats.averagePathLength,
    diameterLargestComponent: lccStats.diameter,
    degreeAssortativity: degreeAssortativity(edges, degreeById),
    meanEdgeLength: edgeCount > 0 ? edges.reduce((sum, edge) => sum + edge.length, 0) / edgeCount : 0,
    medianEdgeLength: edgeCount > 0 ? median(sortedEdgeLengths) : 0,
    totalNetworkLength: edges.reduce((sum, edge) => sum + edge.length, 0),
    fractionLeaves: nodeCount > 0 ? degrees.filter((degree) => degree === 1).length / nodeCount : 0,
    fractionDegreeAboveThreshold: nodeCount > 0 ? degrees.filter((degree) => degree >= degreeThreshold).length / nodeCount : 0,
    cyclomaticNumber: edgeCount - nodeCount + components.length,
    triangleCount,
    squareCount: countSquares(adjacency),
    crossingCount: crossings.crossingCount,
    crossingRate: crossings.crossingRate,
    approximatePlanar: crossings.approximatePlanar,
    dominantDirectionSector: 'NA',
    dominantDirectionShare: 0,
    eastWestBias: 0,
    northSouthBias: 0,
    componentAssignments,
  };
}
