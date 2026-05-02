import { describe, expect, test } from 'vitest';
import { computeNetworkMetrics } from './networkMetrics';

describe('network metrics', () => {
  test('metrics are correct on a triangle graph', () => {
    const nodes = [
      { id: 'a', x: 0, y: 0, birthStep: 0, degree: 2, capacity: 4, residualCapacity: 2, saturated: false },
      { id: 'b', x: 1, y: 0, birthStep: 0, degree: 2, capacity: 4, residualCapacity: 2, saturated: false },
      { id: 'c', x: 0.5, y: 1, birthStep: 0, degree: 2, capacity: 4, residualCapacity: 2, saturated: false },
    ];
    const edges = [
      { id: 'ab', source: 'a', target: 'b', length: 1, birthStep: 0 },
      { id: 'bc', source: 'b', target: 'c', length: 1, birthStep: 0 },
      { id: 'ac', source: 'a', target: 'c', length: 1, birthStep: 0 },
    ];

    const metrics = computeNetworkMetrics(nodes, edges, 2);
    expect(metrics.nodeCount).toBe(3);
    expect(metrics.edgeCount).toBe(3);
    expect(metrics.meanDegree).toBe(2);
    expect(metrics.averageClustering).toBe(1);
    expect(metrics.connectedComponents).toBe(1);
    expect(metrics.cyclomaticNumber).toBe(1);
    expect(metrics.triangleCount).toBe(1);
  });

  test('metrics include planarity diagnostics and split-node counts when supplied', () => {
    const nodes = [
      { id: 'a', x: 0, y: 0, birthStep: 0, degree: 1, capacity: 4, residualCapacity: 3, saturated: false, generatedBy: 'seed' as const },
      { id: 'b', x: 1, y: 0, birthStep: 0, degree: 2, capacity: 4, residualCapacity: 2, saturated: false, generatedBy: 'seed' as const },
      { id: 'c', x: 2, y: 0, birthStep: 1, degree: 1, capacity: 4, residualCapacity: 3, saturated: false, generatedBy: 'split_crossing' as const },
    ];
    const edges = [
      { id: 'ab', source: 'a', target: 'b', length: 1, birthStep: 0 },
      { id: 'bc', source: 'b', target: 'c', length: 1, birthStep: 1 },
    ];

    const metrics = computeNetworkMetrics(nodes, edges, 2, {
      splitEvents: 2,
      splitLinkCount: 3,
      crossingCandidatesEncountered: 5,
      crossingCandidatesAdmitted: 2,
    });

    expect(metrics.generatedIntersectionNodes).toBe(1);
    expect(metrics.splitEvents).toBe(2);
    expect(metrics.splitLinkCount).toBe(3);
    expect(metrics.crossingCandidatesEncountered).toBe(5);
    expect(metrics.crossingCandidatesAdmitted).toBe(2);
  });
});
