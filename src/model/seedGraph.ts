import type { CustomSeedGraph, EdgeRecord, NodeRecord, SeedGraphType, SimulationParams } from '../types/model';
import { euclideanDistance } from './cost';
import { sampleCapacity, updateCapacityState } from './capacity';
import { randomPoint, type RngState } from './random';

function makeNodeId(index: number): string {
  return `node-${index}`;
}

function makeEdgeId(source: string, target: string): string {
  const [a, b] = [source, target].sort();
  return `edge-${a}-${b}`;
}

function createNode(
  index: number,
  x: number,
  y: number,
  birthStep: number,
  capacity: number,
): NodeRecord {
  return updateCapacityState({
    id: makeNodeId(index),
    x,
    y,
    birthStep,
    degree: 0,
    capacity,
    residualCapacity: capacity,
    saturated: false,
    weight: 1,
    typeShare: 0.5,
    accessValue: 0,
    accessCumulative: 0,
    accessGravity: 0,
    generatedBy: 'seed',
  });
}

function connect(nodes: NodeRecord[], edges: EdgeRecord[], sourceIndex: number, targetIndex: number, birthStep: number): void {
  const source = nodes[sourceIndex];
  const target = nodes[targetIndex];
  source.degree += 1;
  target.degree += 1;
  updateCapacityState(source);
  updateCapacityState(target);
  edges.push({
    id: makeEdgeId(source.id, target.id),
    source: source.id,
    target: target.id,
    length: euclideanDistance(source.x, source.y, target.x, target.y),
    birthStep,
  });
}

function generateSeedPositions(type: SeedGraphType, m0: number, rng: RngState): Array<[number, number]> {
  if (type === 'grid') {
    const size = Math.ceil(Math.sqrt(m0));
    return Array.from({ length: m0 }, (_, index) => {
      const row = Math.floor(index / size);
      const column = index % size;
      const denom = Math.max(size - 1, 1);
      return [column / denom, row / denom] as [number, number];
    });
  }

  if (type === 'ring') {
    const radius = 0.38;
    return Array.from({ length: m0 }, (_, index) => {
      const angle = (Math.PI * 2 * index) / m0;
      return [0.5 + radius * Math.cos(angle), 0.5 + radius * Math.sin(angle)] as [number, number];
    });
  }

  if (type === 'cross') {
    const offsets: Array<[number, number]> = [
      [0, 0],
      [1, 0],
      [0, 1],
      [-1, 1],
      [-1, 0],
      [0, -1],
      [1, -1],
    ];
    const spacing = 0.12;
    return Array.from({ length: m0 }, (_, index) => {
      const [u, v] = offsets[index] ?? offsets[offsets.length - 1];
      return [0.5 + spacing * (u + 0.5 * v), 0.5 + spacing * (Math.sqrt(3) / 2) * v] as [number, number];
    });
  }

  return Array.from({ length: m0 }, () => randomPoint(rng));
}

function buildCustomSeed(
  customSeedGraph: CustomSeedGraph,
  params: SimulationParams,
  rng: RngState,
): { nodes: NodeRecord[]; edges: EdgeRecord[] } {
  const nodes = customSeedGraph.nodes.map((node, index) =>
    createNode(
      index,
      node.x,
      node.y,
      0,
      node.capacity ?? sampleCapacity(rng, params, true),
    ),
  );

  const edges: EdgeRecord[] = [];
  customSeedGraph.edges.forEach(([source, target]) => {
    if (source === target || !nodes[source] || !nodes[target]) {
      return;
    }
    if (edges.some((edge) => edge.id === makeEdgeId(nodes[source].id, nodes[target].id))) {
      return;
    }
    connect(nodes, edges, source, target, 0);
  });

  nodes.forEach((node) => {
    updateCapacityState(node);
    if (node.degree > node.capacity + 1e-9) {
      throw new Error(`Custom seed node ${node.id} exceeds its capacity under the current seed and capacity settings.`);
    }
  });

  return { nodes, edges };
}

export function createSeedGraph(
  params: SimulationParams,
  rng: RngState,
): { nodes: NodeRecord[]; edges: EdgeRecord[] } {
  if (params.seedGraphType === 'custom' && params.customSeedGraph) {
    return buildCustomSeed(params.customSeedGraph, params, rng);
  }

  const positions = generateSeedPositions(params.seedGraphType, params.m0, rng);
  const nodes = positions.map(([x, y], index) =>
    createNode(index, x, y, 0, sampleCapacity(rng, params, true)),
  );
  const edges: EdgeRecord[] = [];

  if (params.seedGraphType === 'ring') {
    for (let index = 0; index < params.m0; index += 1) {
      connect(nodes, edges, index, (index + 1) % params.m0, 0);
    }
  } else if (params.seedGraphType === 'cross') {
    const canonicalNeighborDistance = 0.13;
    for (let source = 0; source < params.m0; source += 1) {
      for (let target = source + 1; target < params.m0; target += 1) {
        if (euclideanDistance(nodes[source].x, nodes[source].y, nodes[target].x, nodes[target].y) <= canonicalNeighborDistance + 1e-9) {
          connect(nodes, edges, source, target, 0);
        }
      }
    }
  } else if (params.seedGraphType === 'grid') {
    const size = Math.ceil(Math.sqrt(params.m0));
    for (let index = 0; index < params.m0; index += 1) {
      const row = Math.floor(index / size);
      const col = index % size;
      const right = index + 1;
      const down = index + size;
      if (col < size - 1 && right < params.m0) {
        connect(nodes, edges, index, right, 0);
      }
      if (down < params.m0) {
        connect(nodes, edges, index, down, 0);
      }
    }
  } else {
    for (let source = 0; source < params.m0; source += 1) {
      for (let target = source + 1; target < params.m0; target += 1) {
        connect(nodes, edges, source, target, 0);
      }
    }
  }

  nodes.forEach((node) => {
    updateCapacityState(node);
    if (node.degree > node.capacity + 1e-9) {
      throw new Error(`Seed node ${node.id} exceeds its capacity under the current seed and capacity settings.`);
    }
  });
  return { nodes, edges };
}

export function nodeIdFromIndex(index: number): string {
  return makeNodeId(index);
}

export function edgeIdFor(source: string, target: string): string {
  return makeEdgeId(source, target);
}
