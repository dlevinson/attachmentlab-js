import { describe, expect, test } from 'vitest';
import { createDefaultParams, initializeSimulation, runSimulation, stepSimulation } from './simulator';
import { computeFeasibleProbabilities } from './kernel';
import { parseScenarioDocument } from '../utils/import';
import { scenarioToDocument } from '../utils/export';
import { validateSimulationParams } from '../utils/validation';

describe('model core', () => {
  test('probabilities sum to 1 over feasible nodes', () => {
    const candidates = [
      { id: 'a', x: 0.1, y: 0.1, birthStep: 0, degree: 3, capacity: 3, residualCapacity: 0, saturated: true },
      { id: 'b', x: 0.4, y: 0.4, birthStep: 0, degree: 1, capacity: 4, residualCapacity: 3, saturated: false },
      { id: 'c', x: 0.8, y: 0.2, birthStep: 0, degree: 2, capacity: 5, residualCapacity: 3, saturated: false },
    ];
    const probabilities = computeFeasibleProbabilities({ x: 0.2, y: 0.2 }, candidates, {
      alpha: 1,
      beta: 1,
      phi: 1,
      eps: 1e-9,
      impedanceMode: 'power',
      lambda: 1,
    });

    expect(probabilities.map((entry) => entry.nodeId)).toEqual(['b', 'c']);
    expect(probabilities.reduce((sum, entry) => sum + entry.probability, 0)).toBeCloseTo(1, 8);
  });

  test('no node exceeds capacity, no duplicate edges, and no self-loops', () => {
    const state = runSimulation({
      ...createDefaultParams(),
      finalNodeCount: 80,
      capacityValue: 8,
      phi: 0.5,
    });

    expect(state.nodes.every((node) => node.degree <= node.capacity + 1e-9)).toBe(true);
    expect(new Set(state.edges.map((edge) => edge.id)).size).toBe(state.edges.length);
    expect(state.edges.every((edge) => edge.source !== edge.target)).toBe(true);
  });

  test('sequential selection is without replacement', () => {
    let state = initializeSimulation({ ...createDefaultParams(), finalNodeCount: 12, rngSeed: 77 });
    state = stepSimulation(state);
    expect(new Set(state.lastStepDetails?.selectedTargetIds ?? []).size).toBe(
      state.lastStepDetails?.selectedTargetIds.length ?? 0,
    );
  });

  test('BA benchmark runs to completion with effectively unlimited capacity', () => {
    const params = {
      ...createDefaultParams(),
      finalNodeCount: 50,
      beta: 0,
      phi: 0,
      capacityValue: 'very_large' as const,
    };
    const state = runSimulation(params);
    const expectedEdges = (params.m0 * (params.m0 - 1)) / 2 + (params.finalNodeCount - params.m0) * params.kappa;
    expect(state.status).toBe('done');
    expect(state.edges.length).toBe(expectedEdges);
  });

  test('raising phi in the strict baseline materially shortens edges', () => {
    const lowPhi = runSimulation({
      ...createDefaultParams(),
      finalNodeCount: 120,
      beta: 0,
      phi: 0,
      capacityValue: 'very_large',
    });
    const highPhi = runSimulation({
      ...createDefaultParams(),
      finalNodeCount: 120,
      beta: 0,
      phi: 5,
      capacityValue: 'very_large',
    });

    const lowMean = lowPhi.edges.reduce((sum, edge) => sum + edge.length, 0) / lowPhi.edges.length;
    const highMean = highPhi.edges.reduce((sum, edge) => sum + edge.length, 0) / highPhi.edges.length;
    expect(highMean).toBeLessThan(lowMean * 0.8);
  }, 15_000);

  test('lowering K under binding settings increases saturation and caps hub growth', () => {
    const tightCapacity = runSimulation({
      ...createDefaultParams(),
      finalNodeCount: 120,
      beta: 2,
      phi: 0,
      m0: 4,
      seedGraphType: 'ring',
      capacityValue: 4,
    });
    const looseCapacity = runSimulation({
      ...createDefaultParams(),
      finalNodeCount: 120,
      beta: 2,
      phi: 0,
      m0: 4,
      seedGraphType: 'ring',
      capacityValue: 64,
    });

    const tightShare = tightCapacity.nodes.filter((node) => node.saturated).length / tightCapacity.nodes.length;
    const looseShare = looseCapacity.nodes.filter((node) => node.saturated).length / looseCapacity.nodes.length;
    const tightMaxDegree = Math.max(...tightCapacity.nodes.map((node) => node.degree));
    const looseMaxDegree = Math.max(...looseCapacity.nodes.map((node) => node.degree));

    expect(tightShare).toBeGreaterThan(looseShare);
    expect(tightMaxDegree).toBeLessThanOrEqual(4);
    expect(looseMaxDegree).toBeGreaterThan(tightMaxDegree);
  });

  test('homogeneous capacity validation uses actual seed max degree', () => {
    const ringMessages = validateSimulationParams({
      ...createDefaultParams(),
      seedGraphType: 'ring',
      m0: 6,
      capacityValue: 2,
    });
    const completeMessages = validateSimulationParams({
      ...createDefaultParams(),
      seedGraphType: 'complete',
      m0: 6,
      capacityValue: 2,
    });

    expect(ringMessages.some((message) => message.level === 'error')).toBe(false);
    expect(completeMessages.some((message) => message.level === 'error')).toBe(true);
  });

  test('early stop and truncation are recorded', () => {
    const truncated = runSimulation({
      ...createDefaultParams(),
      finalNodeCount: 18,
      kappa: 3,
      capacityValue: 5,
    });
    expect(truncated.truncationEvents).toBeGreaterThan(0);

    const earlyStopped = runSimulation({
      ...createDefaultParams(),
      finalNodeCount: 10,
      m0: 3,
      kappa: 2,
      capacityValue: 2,
    });
    expect(earlyStopped.status).toBe('early_stopped');
    expect(earlyStopped.terminationReason).toBe('no_feasible_nodes');
  });

  test('scenario documents round-trip exactly', () => {
    const params = createDefaultParams();
    const document = scenarioToDocument('round-trip', params);
    const parsed = parseScenarioDocument(JSON.stringify(document));
    expect(parsed).toEqual(document);
  });
});
