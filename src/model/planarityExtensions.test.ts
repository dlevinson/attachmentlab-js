import { describe, expect, test } from 'vitest';
import { createDefaultParams, runSimulation, sanitizeSimulationParams } from './simulator';

describe('planarity extensions', () => {
  test('none, reject, and split crossings produce distinct diagnostics on a crossing-prone fixed-seed case', () => {
    const base = sanitizeSimulationParams({
      ...createDefaultParams(),
      finalNodeCount: 30,
      alpha: 0.5,
      beta: 0,
      phi: 0,
      kappa: 4,
      m0: 6,
      capacityValue: 64,
      seedGraphType: 'complete',
      arrivalMode: 'uniform',
      meshMode: 'off',
      rngSeed: 12345,
      trackHistory: false,
    });

    const noneState = runSimulation({ ...base, planarityMode: 'none' });
    const rejectState = runSimulation({ ...base, planarityMode: 'reject_crossings' });
    const splitState = runSimulation({ ...base, planarityMode: 'split_crossings' });

    expect(noneState.nodes.length).toBe(base.finalNodeCount);
    expect(rejectState.nodes.length).toBe(base.finalNodeCount);
    expect(splitState.nodes.length).toBeGreaterThan(base.finalNodeCount);
    expect(noneState.crossingCandidatesAdmitted ?? 0).toBeGreaterThan(0);
    expect(rejectState.crossingCandidatesAdmitted ?? 0).toBe(0);
    expect(splitState.crossingCandidatesAdmitted ?? 0).toBeGreaterThan(0);
    expect(splitState.splitEvents ?? 0).toBeGreaterThan(0);
    expect(splitState.nodes.some((node) => node.generatedBy === 'split_crossing')).toBe(true);
  }, 30_000);
});
