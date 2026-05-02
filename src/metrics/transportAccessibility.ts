import type { AccessSemantics, EdgeRecord, NodeRecord } from '../types/model';

type WeightedAdjacency = Map<string, Array<{ id: string; weight: number }>>;

export interface TransportAccessibilitySummary {
  cumulativeById: Record<string, number>;
  gravityById: Record<string, number>;
  meanCumulative: number;
  meanGravity: number;
  maxCumulative: number;
  maxGravity: number;
  maxCumulativeNodeId: string | null;
  maxGravityNodeId: string | null;
  semantics: AccessSemantics;
  available: true;
}

function buildWeightedAdjacency(nodes: NodeRecord[], edges: EdgeRecord[]): WeightedAdjacency {
  const adjacency = new Map<string, Array<{ id: string; weight: number }>>();
  nodes.forEach((node) => adjacency.set(node.id, []));
  edges.forEach((edge) => {
    adjacency.get(edge.source)?.push({ id: edge.target, weight: edge.length });
    adjacency.get(edge.target)?.push({ id: edge.source, weight: edge.length });
  });
  return adjacency;
}

function dijkstraDistances(startId: string, adjacency: WeightedAdjacency): Map<string, number> {
  const distances = new Map<string, number>([[startId, 0]]);
  const queue = new Set<string>([startId]);

  while (queue.size > 0) {
    let currentId: string | null = null;
    let currentDistance = Number.POSITIVE_INFINITY;
    queue.forEach((nodeId) => {
      const distance = distances.get(nodeId) ?? Number.POSITIVE_INFINITY;
      if (distance < currentDistance) {
        currentDistance = distance;
        currentId = nodeId;
      }
    });

    if (currentId === null) {
      break;
    }

    queue.delete(currentId);
    adjacency.get(currentId)?.forEach((neighbor) => {
      const candidate = currentDistance + neighbor.weight;
      const best = distances.get(neighbor.id);
      if (best === undefined || candidate < best - 1e-12) {
        distances.set(neighbor.id, candidate);
        queue.add(neighbor.id);
      }
    });
  }

  return distances;
}

function destinationWeight(node: NodeRecord, semantics: AccessSemantics): number {
  if (semantics === 'seed') {
    return node.birthStep === 0 ? 1 : 0;
  }
  if (semantics === 'opportunity') {
    return Math.max(0, (node.weight ?? 1) * (1 - (node.typeShare ?? 0.5)));
  }
  return 1;
}

export function computeTransportAccessibility(
  nodes: NodeRecord[],
  edges: EdgeRecord[],
  {
    radius = 0.75,
    decay = 3,
    semantics = 'network',
  }: {
    radius?: number;
    decay?: number;
    semantics?: AccessSemantics;
  } = {},
): TransportAccessibilitySummary {
  if (nodes.length === 0) {
    return {
      cumulativeById: {},
      gravityById: {},
      meanCumulative: 0,
      meanGravity: 0,
      maxCumulative: 0,
      maxGravity: 0,
      maxCumulativeNodeId: null,
      maxGravityNodeId: null,
      semantics,
      available: true,
    };
  }

  const adjacency = buildWeightedAdjacency(nodes, edges);
  const cumulativeById: Record<string, number> = {};
  const gravityById: Record<string, number> = {};
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  nodes.forEach((node) => {
    const distances = dijkstraDistances(node.id, adjacency);
    let cumulative = 0;
    let gravity = 0;

    distances.forEach((distance, otherId) => {
      if (otherId === node.id) {
        return;
      }
      const destination = nodeById.get(otherId);
      if (!destination) {
        return;
      }
      const opportunityWeight = destinationWeight(destination, semantics);
      if (opportunityWeight <= 0) {
        return;
      }
      if (distance <= radius) {
        cumulative += opportunityWeight;
      }
      gravity += opportunityWeight * Math.exp(-decay * distance);
    });

    cumulativeById[node.id] = cumulative;
    gravityById[node.id] = gravity;
  });

  const cumulativeEntries = Object.entries(cumulativeById);
  const gravityEntries = Object.entries(gravityById);
  const bestCumulative = cumulativeEntries.reduce<[string, number] | null>(
    (best, entry) => (!best || entry[1] > best[1] ? entry as [string, number] : best),
    null,
  );
  const bestGravity = gravityEntries.reduce<[string, number] | null>(
    (best, entry) => (!best || entry[1] > best[1] ? entry as [string, number] : best),
    null,
  );

  return {
    cumulativeById,
    gravityById,
    meanCumulative: cumulativeEntries.reduce((sum, entry) => sum + entry[1], 0) / nodes.length,
    meanGravity: gravityEntries.reduce((sum, entry) => sum + entry[1], 0) / nodes.length,
    maxCumulative: bestCumulative?.[1] ?? 0,
    maxGravity: bestGravity?.[1] ?? 0,
    maxCumulativeNodeId: bestCumulative?.[0] ?? null,
    maxGravityNodeId: bestGravity?.[0] ?? null,
    semantics,
    available: true,
  };
}

export function applyTransportAccessibilityToNodes(
  nodes: NodeRecord[],
  edges: EdgeRecord[],
  {
    radius = 0.75,
    decay = 3,
    semantics = 'network',
  }: {
    radius?: number;
    decay?: number;
    semantics?: AccessSemantics;
  } = {},
): TransportAccessibilitySummary {
  const summary = computeTransportAccessibility(nodes, edges, { radius, decay, semantics });
  nodes.forEach((node) => {
    node.accessCumulative = summary.cumulativeById[node.id] ?? 0;
    node.accessGravity = summary.gravityById[node.id] ?? 0;
    node.accessValue = node.accessGravity;
  });
  return summary;
}
