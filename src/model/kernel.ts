import type { ImpedanceMode, NodeRecord, SimulationParams } from '../types/model';
import { distanceToNode } from './cost';

export interface CandidateProbability {
  nodeId: string;
  weight: number;
  probability: number;
}

export function computeAttachmentLogWeight(
  degree: number,
  capacity: number,
  cost: number,
  {
    alpha,
    beta,
    phi,
    eps,
    impedanceMode,
    lambda,
  }: Pick<SimulationParams, 'alpha' | 'beta' | 'phi' | 'eps' | 'impedanceMode' | 'lambda'>,
): number {
  const remainingCapacity = Math.max(capacity - degree, 0);
  if (remainingCapacity <= 1e-12) {
    return Number.NEGATIVE_INFINITY;
  }

  const degreeTerm = alpha === 0 ? 0 : alpha * Math.log(Math.max(degree + eps, eps));
  const saturationTerm = beta === 0 ? 0 : beta * Math.log(Math.max(remainingCapacity, eps));
  const costTerm =
    impedanceMode === ('exponential' satisfies ImpedanceMode)
      ? -((lambda ?? 1) * cost)
      : -phi * Math.log(Math.max(cost + eps, eps));

  return degreeTerm + saturationTerm + costTerm;
}

export function computeAttachmentWeight(
  degree: number,
  capacity: number,
  cost: number,
  {
    alpha,
    beta,
    phi,
    eps,
    impedanceMode,
    lambda,
  }: Pick<SimulationParams, 'alpha' | 'beta' | 'phi' | 'eps' | 'impedanceMode' | 'lambda'>,
): number {
  const logWeight = computeAttachmentLogWeight(degree, capacity, cost, {
    alpha,
    beta,
    phi,
    eps,
    impedanceMode,
    lambda,
  });
  return Number.isFinite(logWeight) ? Math.exp(logWeight) : 0;
}

export function computeFeasibleProbabilities(
  arrivingNode: { x: number; y: number },
  candidateNodes: NodeRecord[],
  params: Pick<SimulationParams, 'alpha' | 'beta' | 'phi' | 'eps' | 'impedanceMode' | 'lambda'>,
): CandidateProbability[] {
  const feasible = candidateNodes
    .filter((node) => node.degree < node.capacity - 1e-9)
    .map((node) => {
      const cost = distanceToNode(arrivingNode, node);
      const logWeight = computeAttachmentLogWeight(node.degree, node.capacity, cost, params);
      return { nodeId: node.id, logWeight };
    });

  if (feasible.length === 0) {
    return [];
  }

  const finiteLogWeights = feasible
    .map((item) => item.logWeight)
    .filter((value) => Number.isFinite(value));

  if (finiteLogWeights.length === 0) {
    return feasible.map((item) => ({
      nodeId: item.nodeId,
      weight: 1,
      probability: 1 / feasible.length,
    }));
  }

  const maxLogWeight = Math.max(...finiteLogWeights);
  let total = 0;
  const stabilized = feasible.map((item) => {
    const weight = Number.isFinite(item.logWeight) ? Math.exp(item.logWeight - maxLogWeight) : 0;
    total += weight;
    return {
      nodeId: item.nodeId,
      weight,
      probability: 0,
    };
  });

  if (!Number.isFinite(total) || total <= 0) {
    return stabilized.map((item) => ({
      nodeId: item.nodeId,
      weight: 1,
      probability: 1 / stabilized.length,
    }));
  }

  return stabilized.map((item) => ({
    ...item,
    probability: item.weight / total,
  }));
}
