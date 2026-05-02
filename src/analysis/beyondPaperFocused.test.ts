// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { runBeyondPaperFocused } from './beyondPaperFocused';

describe('beyond-paper focused suite', () => {
  test('produces figure-ready planarity and interaction comparisons', async () => {
    const result = await runBeyondPaperFocused({
      profile: 'test',
      outputRoot: `${process.cwd()}/results/beyond_paper_focused_test`,
      silent: true,
    });

    expect(result.summaryRows.length).toBeGreaterThan(0);
    expect(result.planarityFigureRows.length).toBeGreaterThan(0);
    expect(result.interactionFigureRows.length).toBeGreaterThan(0);

    const freeSplit = result.summaryRows.find((row) => row.scenarioId === 'planarity_free_split');
    const freeReject = result.summaryRows.find((row) => row.scenarioId === 'planarity_free_reject');
    const interactionSplit = result.summaryRows.find((row) => row.scenarioId === 'interaction_split_target');
    const interactionReject = result.summaryRows.find((row) => row.scenarioId === 'interaction_reject_none');

    expect(freeSplit?.splitEvents ?? 0).toBeGreaterThan(0);
    expect(freeSplit?.crossingCandidatesAdmitted ?? 0).toBeGreaterThan(freeReject?.crossingCandidatesAdmitted ?? Infinity);
    expect(interactionSplit?.splitEvents ?? 0).toBeGreaterThan(0);
    expect(interactionSplit?.crossingCandidatesAdmitted ?? 0).toBeGreaterThan(interactionReject?.crossingCandidatesAdmitted ?? Infinity);
  }, 240_000);
});
