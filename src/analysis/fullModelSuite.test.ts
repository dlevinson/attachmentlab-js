// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { runFullModelSuite } from './fullModelSuite';

describe('full model suite', () => {
  test('smoke-runs the layered model suite and activates planarity/access families distinctly', async () => {
    const result = await runFullModelSuite({
      profile: 'smoke',
      outputRoot: `${process.cwd()}/results/full_model_suite_smoke_test`,
      silent: true,
    });

    expect(result.flatRows.length).toBeGreaterThan(0);
    expect(result.flatRows.some((row) => row.tranche === 'f4_planarity')).toBe(true);

    const split = result.flatRows.find((row) => row.scenarioId === 'planarity_split');
    const reject = result.flatRows.find((row) => row.scenarioId === 'planarity_reject');
    const accessNetwork = result.flatRows.find((row) => row.scenarioId === 'access_network_both');
    const accessSeed = result.flatRows.find((row) => row.scenarioId === 'access_seed_both');

    expect(split?.generatedIntersectionNodes ?? 0).toBeGreaterThan(0);
    expect(split?.splitEvents ?? 0).toBeGreaterThan(0);
    expect(split?.crossingCandidatesAdmitted ?? 0).toBeGreaterThan(reject?.crossingCandidatesAdmitted ?? Infinity);
    expect(accessNetwork?.scenarioLabel).toContain('Network');
    expect(accessSeed?.scenarioLabel).toContain('Seed');
  }, 240_000);
});
