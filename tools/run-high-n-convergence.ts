import path from 'node:path';
import {
  metricMean,
  preferredTail,
  runSimpleBatch,
  scenarioFromPreset,
  toCsv,
  writeResultBundle,
} from '../src/analysis/benchmarkHarness';
import { paperTargets } from '../src/analysis/paperReplication';

interface ConvergenceCell {
  scenarioId: 'ba_benchmark' | 'general_model';
  scenarioLabel: string;
  finalNodeCount: number;
  replications: number;
  maxDegree: number | null;
  degreeGini: number | null;
  averageClustering: number | null;
  meanEdgeLength: number | null;
  preferredTail: string | null;
  earlyStopRate: number;
  targetAverageClustering: number;
  targetMeanEdgeLength: number;
  clusteringRelDiff: number | null;
  meanEdgeLengthRelDiff: number | null;
}

function relDiff(a: number | null, b: number | null) {
  if (a === null || b === null || !Number.isFinite(a) || !Number.isFinite(b) || b === 0) {
    return null;
  }
  return Math.abs((a - b) / b);
}

async function main() {
  const repoRoot = process.cwd();
  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const outputRoot = path.join(repoRoot, 'results', `high_n_convergence_${stamp}`);
  const args = new Set(process.argv.slice(2));
  const sizes = args.has('--full')
    ? [
        { n: 1000, replications: 16 },
        { n: 2000, replications: 8 },
        { n: 5000, replications: 4 },
      ]
    : [
        { n: 1000, replications: 4 },
        { n: 2000, replications: 2 },
      ];

  const rows: ConvergenceCell[] = [];
  const raw: Record<string, unknown> = {};

  for (const { n, replications } of sizes) {
    console.log(`[convergence] running n=${n} replications=${replications}`);
    const result = runSimpleBatch({
      replications,
      onProgress: (event) => {
        console.log(
          `[convergence] N=${n} ${event.scenarioId} replication ${event.replication}/${event.replicationCount}`,
        );
      },
      scenarios: [
        scenarioFromPreset('ba_benchmark', {
          params: {
            finalNodeCount: n,
            m0: 5,
            seedGraphType: 'complete',
            arrivalMode: 'uniform',
            meshMode: 'off',
            planarityMode: 'none',
            arrivalPreferenceMode: 'baseline',
            selectionKernelMode: 'baseline',
            arrivalAccessStrength: 0,
            accessSelectionStrength: 0,
            trackHistory: false,
          },
        }),
        scenarioFromPreset('general_model', {
          params: {
            finalNodeCount: n,
            m0: 5,
            seedGraphType: 'complete',
            arrivalMode: 'uniform',
            meshMode: 'off',
            planarityMode: 'none',
            arrivalPreferenceMode: 'baseline',
            selectionKernelMode: 'baseline',
            arrivalAccessStrength: 0,
            accessSelectionStrength: 0,
            trackHistory: false,
          },
        }),
      ],
    });

    raw[`n_${n}`] = result;

    result.summaries.forEach((summary) => {
      const target = paperTargets.headline[summary.scenarioId as 'ba_benchmark' | 'general_model'];
      rows.push({
        scenarioId: summary.scenarioId as 'ba_benchmark' | 'general_model',
        scenarioLabel: summary.scenarioLabel,
        finalNodeCount: n,
        replications,
        maxDegree: metricMean(summary, 'maxDegree'),
        degreeGini: metricMean(summary, 'degreeGini'),
        averageClustering: metricMean(summary, 'averageClustering'),
        meanEdgeLength: metricMean(summary, 'meanEdgeLength'),
        preferredTail: preferredTail(summary),
        earlyStopRate: summary.earlyStopRate,
        targetAverageClustering: target.averageClustering,
        targetMeanEdgeLength: target.meanEdgeLength,
        clusteringRelDiff: relDiff(metricMean(summary, 'averageClustering'), target.averageClustering),
        meanEdgeLengthRelDiff: relDiff(metricMean(summary, 'meanEdgeLength'), target.meanEdgeLength),
      });
    });

    await writeResultBundle(outputRoot, {
      'partial_convergence_results.json': JSON.stringify(raw, null, 2),
      'partial_convergence_summary.csv': toCsv(rows),
    });
  }

  const byScenario = new Map<string, ConvergenceCell[]>();
  rows.forEach((row) => {
    const bucket = byScenario.get(row.scenarioId) ?? [];
    bucket.push(row);
    byScenario.set(row.scenarioId, bucket);
  });

  const memo = `# High-N Convergence Memo

This memo tests whether the remaining clustering gap in the strict baseline appears to shrink at larger executed size for selected headline scenarios.

Scenarios:

- BA benchmark
- General model

Sizes and replications:

${sizes.map(({ n, replications }) => `- N=${n}, ${replications} replications`).join('\n')}

## BA benchmark

${(byScenario.get('ba_benchmark') ?? []).sort((a, b) => a.finalNodeCount - b.finalNodeCount).map((row) => `- N=${row.finalNodeCount}: clustering ${row.averageClustering?.toFixed(4)} vs target ${row.targetAverageClustering.toFixed(3)} (rel diff ${row.clusteringRelDiff?.toFixed(3)}), mean edge length ${row.meanEdgeLength?.toFixed(3)} vs target ${row.targetMeanEdgeLength.toFixed(3)}, max degree ${row.maxDegree?.toFixed(2)}, Gini ${row.degreeGini?.toFixed(3)}, tail ${row.preferredTail}.`).join('\n')}

## General model

${(byScenario.get('general_model') ?? []).sort((a, b) => a.finalNodeCount - b.finalNodeCount).map((row) => `- N=${row.finalNodeCount}: clustering ${row.averageClustering?.toFixed(4)} vs target ${row.targetAverageClustering.toFixed(3)} (rel diff ${row.clusteringRelDiff?.toFixed(3)}), mean edge length ${row.meanEdgeLength?.toFixed(3)} vs target ${row.targetMeanEdgeLength.toFixed(3)}, max degree ${row.maxDegree?.toFixed(2)}, Gini ${row.degreeGini?.toFixed(3)}, tail ${row.preferredTail}.`).join('\n')}

## Interpretation

Use this table to judge whether clustering is converging toward the paper as N increases, while edge length and other baseline metrics remain stable.
`;

  console.log(`[convergence] writing result bundle to ${outputRoot}`);
  await writeResultBundle(outputRoot, {
    'convergence_results.json': JSON.stringify(raw, null, 2),
    'convergence_summary.csv': toCsv(rows),
    'HIGH_N_CONVERGENCE_MEMO.md': memo,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
