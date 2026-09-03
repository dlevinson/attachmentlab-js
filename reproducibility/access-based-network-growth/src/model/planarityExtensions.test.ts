import { describe, expect, test } from 'vitest';
import { getBrowserParityEngine } from './browserParity';
import { createDefaultParams, initializeSimulation, runSimulation, sanitizeSimulationParams } from './simulator';

describe('planarity extensions', () => {
  test('potential-site accessibility applies the configured destination semantics', () => {
    const engine = getBrowserParityEngine();
    const params = sanitizeSimulationParams({
      ...createDefaultParams(),
      finalNodeCount: 40,
      m0: 9,
      seedGraphType: 'grid',
      arrivalMode: 'frontier',
      meshMode: 'grid_bias',
      meshAngleSet: '90',
      meshAdjacencyMode: 'queen',
      kappa: 4,
      alpha: 0.5,
      beta: 0,
      phi: 0,
      capacityValue: 64,
      rngSeed: 424242,
      trackHistory: false,
    });
    const state = initializeSimulation(params);
    state.nodes.forEach((node, index) => {
      node.weight = index + 1;
      node.typeShare = index / Math.max(1, state.nodes.length - 1);
    });

    const seedRows = engine.computePotentialSiteAccessibility(
      state,
      { ...params, accessSemantics: 'seed' },
    );
    const opportunityRows = engine.computePotentialSiteAccessibility(
      state,
      { ...params, accessSemantics: 'opportunity' },
    );
    const gravityValues = (result: typeof seedRows) => result.rows
      .filter((row) => row.realizableNow)
      .map((row) => row.gravity);

    expect(seedRows.available).toBe(true);
    expect(gravityValues(seedRows).length).toBeGreaterThan(0);
    expect(gravityValues(opportunityRows)).not.toEqual(gravityValues(seedRows));
  });

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
