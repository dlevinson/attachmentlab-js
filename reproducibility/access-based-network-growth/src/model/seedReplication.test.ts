import { describe, expect, test } from 'vitest';
import { createDefaultParams, runSimulation, sanitizeSimulationParams } from './simulator';
import { runSimpleBatch } from '../analysis/benchmarkHarness';

describe('replication seed integrity', () => {
  test.each([2147483648, 3306612829, 3289835210, 3273057591, 3256279972, 4294967295])(
    'preserves unsigned 32-bit seed %i through sanitisation and simulation', (seed) => {
      const params = { ...createDefaultParams(), finalNodeCount: 12, trackHistory: false, rngSeed: seed };
      expect(sanitizeSimulationParams(params).rngSeed).toBe(seed);
      expect(runSimulation(params).params.rngSeed).toBe(seed);
    },
  );

  test('the previously collapsed seeds produce distinct network realisations', () => {
    const seeds = [3306612829, 3289835210, 3273057591, 3256279972];
    const graphs = seeds.map((rngSeed) => {
      const state = runSimulation({ ...createDefaultParams(), finalNodeCount: 20, trackHistory: false, rngSeed });
      return JSON.stringify([state.nodes.map(({ x, y }) => [x, y]), state.edges]);
    });
    expect(new Set(graphs).size).toBe(seeds.length);
  });

  test('batch records carry distinct effective seeds equal to the requested seeds', () => {
    const result = runSimpleBatch({
      scenarios: [{ id: 'interaction_reject_none', label: 'Seed regression',
        params: { ...createDefaultParams(), finalNodeCount: 20, trackHistory: false } }],
      replications: 4,
    });
    expect(result.runs.every((run) => run.effectiveSeed === run.seed)).toBe(true);
    expect(new Set(result.runs.map((run) => run.effectiveSeed)).size).toBe(4);
  });
});
