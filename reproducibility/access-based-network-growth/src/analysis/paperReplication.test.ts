// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { runPaperReplicationSuite } from './paperReplication';

describe('paper replication benchmark', () => {
  test('smoke-runs the shared-core paper replication tranche and preserves paper-like regime ordering', async () => {
    const result = await runPaperReplicationSuite({
      profile: 'test',
      outputRoot: `${process.cwd()}/results/paper_replication_smoke_test`,
      silent: true,
    });

    expect(result.headlineRows).toHaveLength(4);
    expect(result.heterogeneousRows).toHaveLength(3);
    expect(result.headlineRows.every((row) => row.earlyStopRate === 0)).toBe(true);

    const phi0 = result.sensitivityRows.find((row) => row.scenarioId === 'phi_0');
    const phi2 = result.sensitivityRows.find((row) => row.scenarioId === 'phi_2');
    const kappa1 = result.sensitivityRows.find((row) => row.scenarioId === 'kappa_1');
    const kappa4 = result.sensitivityRows.find((row) => row.scenarioId === 'kappa_4');
    const constantCapacity = result.heterogeneousRows.find((row) => row.scenarioId === 'constant_capacity');
    const lognormalCapacity = result.heterogeneousRows.find((row) => row.scenarioId === 'lognormal_capacity');

    expect(phi2?.meanEdgeLength ?? Infinity).toBeLessThan(phi0?.meanEdgeLength ?? -Infinity);
    expect(kappa4?.cyclomaticNumber ?? -Infinity).toBeGreaterThan(kappa1?.cyclomaticNumber ?? Infinity);
    expect(lognormalCapacity?.maxDegree ?? -Infinity).toBeGreaterThan(constantCapacity?.maxDegree ?? Infinity);
  }, 240_000);
});
