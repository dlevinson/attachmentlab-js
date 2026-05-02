// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { runBeyondPaperSuite } from './beyondPaperSuite';

describe('beyond-paper suite', () => {
  test('smoke-runs planarity, accessibility, and interaction tranches', async () => {
    const result = await runBeyondPaperSuite({
      profile: 'test',
      outputRoot: `${process.cwd()}/results/beyond_paper_suite_test`,
      silent: true,
    });

    expect(result.flatRows.length).toBeGreaterThan(0);
    expect(result.flatRows.some((row) => row.tranche === 'bp1_planarity')).toBe(true);
    expect(result.flatRows.some((row) => row.tranche === 'bp2_access_semantics')).toBe(true);
    expect(result.flatRows.some((row) => row.tranche === 'bp3_interaction')).toBe(true);

    const split = result.flatRows.find((row) => row.scenarioId === 'planarity_free_split');
    const reject = result.flatRows.find((row) => row.scenarioId === 'planarity_free_reject');
    const seedBoth = result.flatRows.find((row) => row.scenarioId === 'access_seed_both');
    const opportunityBoth = result.flatRows.find((row) => row.scenarioId === 'access_opportunity_both');
    const interactionReject = result.flatRows.find((row) => row.scenarioId === 'interaction_reject_none');
    const interactionSplit = result.flatRows.find((row) => row.scenarioId === 'interaction_split_target');

    expect(split?.splitEvents ?? 0).toBeGreaterThan(0);
    expect(split?.generatedIntersectionNodes ?? 0).toBeGreaterThan(0);
    expect(split?.crossingCandidatesAdmitted ?? 0).toBeGreaterThan(reject?.crossingCandidatesAdmitted ?? Infinity);
    expect(interactionSplit?.splitEvents ?? 0).toBeGreaterThan(0);
    expect(interactionSplit?.crossingCandidatesAdmitted ?? 0).toBeGreaterThan(interactionReject?.crossingCandidatesAdmitted ?? Infinity);
    expect(seedBoth?.scenarioLabel).toContain('Seed');
    expect(opportunityBoth?.scenarioLabel).toContain('Opportunity');
  }, 240_000);
});
