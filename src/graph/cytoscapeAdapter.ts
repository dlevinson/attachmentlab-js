import type { ElementDefinition } from 'cytoscape';
import type { NodeColorMode, SimulationState } from '../types/model';

const COMPONENT_COLORS = ['#0b4f6c', '#c05621', '#2f855a', '#805ad5', '#d69e2e', '#e53e3e'];

function lerpColor(start: [number, number, number], end: [number, number, number], t: number): string {
  const channel = (index: number) => Math.round(start[index] + (end[index] - start[index]) * t);
  return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
}

function scaleColor(value: number, min: number, max: number): string {
  const t = max > min ? (value - min) / (max - min) : 0.5;
  return lerpColor([232, 241, 245], [11, 79, 108], Math.max(0, Math.min(1, t)));
}

function nodeColor(
  state: SimulationState,
  nodeId: string,
  colorMode: NodeColorMode,
): string {
  const node = state.nodes.find((entry) => entry.id === nodeId)!;
  if (colorMode === 'saturated') {
    return node.saturated ? '#b42318' : '#0b4f6c';
  }

  if (colorMode === 'age') {
    return scaleColor(node.birthStep, 0, Math.max(...state.nodes.map((entry) => entry.birthStep), 1));
  }

  if (colorMode === 'residual_capacity') {
    return scaleColor(node.residualCapacity, 0, Math.max(...state.nodes.map((entry) => entry.capacity), 1));
  }

  if (colorMode === 'component') {
    const metrics = state.history.at(-1)?.metrics;
    const componentId = metrics?.componentAssignments[node.id] ?? 0;
    return COMPONENT_COLORS[componentId % COMPONENT_COLORS.length];
  }

  return scaleColor(node.degree, 0, Math.max(...state.nodes.map((entry) => entry.degree), 1));
}

export function toCytoscapeElements(
  state: SimulationState,
  colorMode: NodeColorMode,
  options: {
    edgeColorByLength: boolean;
    highlightNewest: boolean;
    highlightSaturated: boolean;
    showAttachmentWeights: boolean;
  },
): ElementDefinition[] {
  const maxEdgeLength = Math.max(...state.edges.map((edge) => edge.length), 1);
  const latestRound = state.lastStepDetails?.selectionRounds.at(0);

  const nodes = state.nodes.map((node) => {
    const isNewest = options.highlightNewest && node.id === state.lastStepDetails?.newNodeId;
    const isSelected = options.highlightNewest && state.lastStepDetails?.selectedTargetIds.includes(node.id);
    const attachmentIndex = latestRound?.feasibleNodeIds.indexOf(node.id) ?? -1;
    const probability = attachmentIndex >= 0 ? latestRound?.probabilities[attachmentIndex] ?? null : null;

    return {
      data: {
        id: node.id,
        label: node.id,
        degree: node.degree,
        capacity: node.capacity,
        residualCapacity: node.residualCapacity,
        birthStep: node.birthStep,
        probabilityLabel:
          options.showAttachmentWeights && probability !== null ? probability.toFixed(3) : '',
        color: nodeColor(state, node.id, colorMode),
        size: 12 + Math.sqrt(node.degree) * 3.8,
        outlineColor:
          isNewest ? '#f79009' : isSelected ? '#12b76a' : options.highlightSaturated && node.saturated ? '#b42318' : '#ffffff',
        outlineWidth: isNewest || isSelected || (options.highlightSaturated && node.saturated) ? 3 : 1,
      },
      position: {
        x: node.x * 1000,
        y: (1 - node.y) * 1000,
      },
      classes: [isNewest ? 'newest-node' : '', isSelected ? 'selected-target' : '', node.saturated ? 'saturated-node' : '']
        .filter(Boolean)
        .join(' '),
    };
  });

  const edges = state.edges.map((edge) => ({
    data: {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      length: edge.length,
      birthStep: edge.birthStep,
      color: options.edgeColorByLength ? scaleColor(edge.length, 0, maxEdgeLength) : '#98a2b3',
    },
  }));

  return [...nodes, ...edges];
}
