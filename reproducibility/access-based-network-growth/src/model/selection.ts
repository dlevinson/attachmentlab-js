import type { NodeRecord, SelectionRound, SimulationParams } from '../types/model';
import { updateCapacityState } from './capacity';
import { computeFeasibleProbabilities } from './kernel';
import { weightedChoiceIndex, type RngState } from './random';

export interface SelectionResult {
  selectedTargetIds: string[];
  selectionRounds: SelectionRound[];
  truncationOccurred: boolean;
  missingLinks: number;
}

export function selectSequentialNeighbors(
  arrivingNode: { x: number; y: number },
  candidateNodes: NodeRecord[],
  params: SimulationParams,
  rng: RngState,
): SelectionResult {
  const selectedTargetIds: string[] = [];
  const selectionRounds: SelectionRound[] = [];
  let truncationOccurred = false;
  let missingLinks = 0;

  const initiallyFeasible = candidateNodes.filter((node) => node.degree < node.capacity - 1e-9);
  if (initiallyFeasible.length === 0) {
    return { selectedTargetIds, selectionRounds, truncationOccurred, missingLinks };
  }

  if (initiallyFeasible.length < params.kappa) {
    truncationOccurred = true;
    missingLinks = params.kappa - initiallyFeasible.length;
  }

  const linksToAdd = Math.min(params.kappa, initiallyFeasible.length);

  for (let roundIndex = 0; roundIndex < linksToAdd; roundIndex += 1) {
    const available = candidateNodes.filter(
      (node) =>
        node.degree < node.capacity - 1e-9 &&
        !selectedTargetIds.includes(node.id),
    );

    if (available.length === 0) {
      if (selectedTargetIds.length < params.kappa) {
        truncationOccurred = true;
        missingLinks = Math.max(missingLinks, params.kappa - selectedTargetIds.length);
      }
      break;
    }

    const candidates = computeFeasibleProbabilities(arrivingNode, available, params);
    const weights = candidates.map((candidate) => candidate.weight);
    const choiceIndex = weightedChoiceIndex(weights, rng);
    const selected = candidates[choiceIndex];

    selectionRounds.push({
      feasibleNodeIds: candidates.map((candidate) => candidate.nodeId),
      probabilities: candidates.map((candidate) => candidate.probability),
      weights,
      selectedId: selected.nodeId,
    });

    selectedTargetIds.push(selected.nodeId);
    const target = candidateNodes.find((node) => node.id === selected.nodeId);
    if (target) {
      target.degree += 1;
      updateCapacityState(target);
    }
  }

  if (selectedTargetIds.length < params.kappa && initiallyFeasible.length >= params.kappa) {
    truncationOccurred = true;
    missingLinks = Math.max(missingLinks, params.kappa - selectedTargetIds.length);
  }

  return {
    selectedTargetIds,
    selectionRounds,
    truncationOccurred,
    missingLinks,
  };
}
