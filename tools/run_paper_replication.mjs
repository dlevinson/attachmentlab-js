import fs from 'node:fs/promises';
import path from 'node:path';
import { loadBrowserCore } from './load_browser_core.mjs';

const repoRoot = process.cwd();
const outputRoot = path.join(repoRoot, 'results', 'paper_replication_20260407_shared_core');
const VERY_LARGE = 'very_large';

function mergeParams(base, overrides) {
  const merged = { ...base, ...overrides };
  if (base.capacityParams || overrides.capacityParams) {
    merged.capacityParams = {
      ...(base.capacityParams || {}),
      ...(overrides.capacityParams || {}),
    };
  }
  return merged;
}

function scenarioFromPreset(engine, presetId, overrides = {}) {
  const preset = engine.scenarioPresets.find((entry) => entry.id === presetId);
  if (!preset) throw new Error(`Unknown preset: ${presetId}`);
  const params = engine.sanitizeParams(mergeParams(engine.createDefaultParams(), preset.params));
  return {
    id: overrides.id || preset.id,
    label: overrides.label || preset.label,
    params: engine.sanitizeParams(mergeParams(params, overrides.params || {})),
  };
}

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function toCsv(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  return [headers.join(','), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))].join('\n');
}

function metricMean(summary, key) {
  return summary.metrics?.[key]?.mean ?? null;
}

function preferredTail(summary) {
  const entries = Object.entries(summary.preferredTailModelCounts || {});
  if (!entries.length) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function absDiff(a, b) {
  if (a === null || b === null || a === undefined || b === undefined) return null;
  return Math.abs(a - b);
}

function relDiff(a, b) {
  if (a === null || b === null || a === undefined || b === undefined || b === 0) return null;
  return Math.abs((a - b) / b);
}

const paperTargets = {
  headline: {
    ba_benchmark: { maxDegree: 82.31, degreeGini: 0.388, averageClustering: 0.028, meanEdgeLength: 0.521, preferredTail: 'power_law' },
    capacity_only: { maxDegree: 16.0, degreeGini: 0.335, averageClustering: 0.007, meanEdgeLength: 0.521, preferredTail: 'exponential' },
    spatial_only: { maxDegree: 85.5, degreeGini: 0.389, averageClustering: 0.035, meanEdgeLength: 0.351, preferredTail: 'power_law' },
    general_model: { maxDegree: 16.0, degreeGini: 0.336, averageClustering: 0.009, meanEdgeLength: 0.349, preferredTail: 'exponential' },
  },
  sensitivity: {
    phi_0: { meanEdgeLength: 0.526, averageClustering: 0.0075 },
    phi_2: { meanEdgeLength: 0.157, averageClustering: 0.0721 },
    kappa_1: { cyclomaticNumber: 6, averagePathLengthLargestComponent: 8.19, averageClustering: 0.00035 },
    kappa_4: { cyclomaticNumber: 2991, averagePathLengthLargestComponent: 3.58, averageClustering: 0.0151 },
  },
  heterogeneous: {
    constant_capacity: { maxDegree: 16.0, degreeGini: 0.337, shareAtCapacity: 0.0039, averageClustering: 0.0096 },
    uniform_capacity: { maxDegree: 22.94, degreeGini: 0.354, shareAtCapacity: 0.0019, averageClustering: 0.0121 },
    lognormal_capacity: { maxDegree: 48.69, degreeGini: 0.382, shareAtCapacity: 0.0019, averageClustering: 0.0197 },
  },
};

async function main() {
  const engine = await loadBrowserCore(repoRoot);
  await fs.mkdir(outputRoot, { recursive: true });

  const defaultParams = engine.createDefaultParams();
  const strictBaseline = {
    arrivalMode: 'uniform',
    meshMode: 'off',
    planarityMode: 'none',
    arrivalPreferenceMode: 'baseline',
    selectionKernelMode: 'baseline',
    accessSelectionStrength: 0,
    arrivalAccessStrength: 0,
  };

  const headlineConfig = {
    scenarios: [
      scenarioFromPreset(engine, 'ba_benchmark', { params: { ...strictBaseline, finalNodeCount: 1000, m0: 5, seedGraphType: 'complete', trackHistory: false } }),
      scenarioFromPreset(engine, 'capacity_only', { params: { ...strictBaseline, finalNodeCount: 1000, m0: 5, seedGraphType: 'complete', capacityValue: 16, trackHistory: false } }),
      scenarioFromPreset(engine, 'spatial_only', { params: { ...strictBaseline, finalNodeCount: 1000, m0: 5, seedGraphType: 'complete', trackHistory: false } }),
      scenarioFromPreset(engine, 'general_model', { params: { ...strictBaseline, finalNodeCount: 1000, m0: 5, seedGraphType: 'complete', capacityValue: 16, trackHistory: false } }),
    ],
    replications: 16,
  };

  const sensitivityBaseline = engine.sanitizeParams(mergeParams(defaultParams, {
    ...strictBaseline,
    finalNodeCount: 1000,
    m0: 5,
    seedGraphType: 'complete',
    alpha: 1,
    beta: 1,
    phi: 1,
    kappa: 2,
    capacityMode: 'homogeneous',
    capacityValue: 16,
    trackHistory: false,
  }));

  const sensitivityConfig = {
    scenarios: [
      { id: 'phi_0', label: 'Phi 0', params: engine.sanitizeParams(mergeParams(sensitivityBaseline, { phi: 0, beta: 0, capacityValue: VERY_LARGE })) },
      { id: 'phi_0_5', label: 'Phi 0.5', params: engine.sanitizeParams(mergeParams(sensitivityBaseline, { phi: 0.5 })) },
      { id: 'phi_1', label: 'Phi 1', params: engine.sanitizeParams(mergeParams(sensitivityBaseline, { phi: 1 })) },
      { id: 'phi_2', label: 'Phi 2', params: engine.sanitizeParams(mergeParams(sensitivityBaseline, { phi: 2 })) },
      { id: 'kappa_1', label: 'Kappa 1', params: engine.sanitizeParams(mergeParams(sensitivityBaseline, { kappa: 1, m0: 5 })) },
      { id: 'kappa_2', label: 'Kappa 2', params: engine.sanitizeParams(mergeParams(sensitivityBaseline, { kappa: 2, m0: 5 })) },
      { id: 'kappa_4', label: 'Kappa 4', params: engine.sanitizeParams(mergeParams(sensitivityBaseline, { kappa: 4, m0: 5 })) },
    ],
    replications: 12,
  };

  const heterogeneousConfig = {
    scenarios: [
      {
        id: 'constant_capacity',
        label: 'Constant K = 16',
        params: engine.sanitizeParams(mergeParams(sensitivityBaseline, {
          capacityMode: 'homogeneous',
          capacityValue: 16,
          capacityParams: {},
        })),
      },
      {
        id: 'uniform_capacity',
        label: 'Uniform U[8,24]',
        params: engine.sanitizeParams(mergeParams(sensitivityBaseline, {
          capacityMode: 'uniform',
          capacityValue: 16,
          capacityParams: { low: 8, high: 24 },
        })),
      },
      {
        id: 'lognormal_capacity',
        label: 'Lognormal mean ≈ 16',
        params: engine.sanitizeParams(mergeParams(sensitivityBaseline, {
          capacityMode: 'lognormal',
          capacityValue: 16,
          capacityParams: { mean: 2.647588722239781, sigma: 0.5 },
        })),
      },
    ],
    replications: 16,
  };

  const [headlineResult, sensitivityResult, heterogeneousResult] = [
    engine.runBatchConfig(headlineConfig),
    engine.runBatchConfig(sensitivityConfig),
    engine.runBatchConfig(heterogeneousConfig),
  ];

  const headlineComparisonRows = headlineResult.summaries.map((summary) => {
    const target = paperTargets.headline[summary.scenarioId];
    const observedTail = preferredTail(summary);
    return {
      scenarioId: summary.scenarioId,
      scenarioLabel: summary.scenarioLabel,
      maxDegree_observed: metricMean(summary, 'maxDegree'),
      maxDegree_target: target.maxDegree,
      maxDegree_relDiff: relDiff(metricMean(summary, 'maxDegree'), target.maxDegree),
      degreeGini_observed: metricMean(summary, 'degreeGini'),
      degreeGini_target: target.degreeGini,
      degreeGini_relDiff: relDiff(metricMean(summary, 'degreeGini'), target.degreeGini),
      clustering_observed: metricMean(summary, 'averageClustering'),
      clustering_target: target.averageClustering,
      clustering_relDiff: relDiff(metricMean(summary, 'averageClustering'), target.averageClustering),
      meanEdgeLength_observed: metricMean(summary, 'meanEdgeLength'),
      meanEdgeLength_target: target.meanEdgeLength,
      meanEdgeLength_relDiff: relDiff(metricMean(summary, 'meanEdgeLength'), target.meanEdgeLength),
      preferredTail_observed: observedTail,
      preferredTail_target: target.preferredTail,
      preferredTail_match: observedTail === target.preferredTail,
      earlyStopRate: summary.earlyStopRate,
      largestComponentShare: metricMean(summary, 'largestComponentShare'),
    };
  });

  const sensitivityComparisonRows = ['phi_0', 'phi_2', 'kappa_1', 'kappa_4'].map((id) => {
    const summary = sensitivityResult.summaries.find((entry) => entry.scenarioId === id);
    const target = paperTargets.sensitivity[id];
    return {
      scenarioId: id,
      meanEdgeLength_observed: metricMean(summary, 'meanEdgeLength'),
      meanEdgeLength_target: target.meanEdgeLength ?? null,
      meanEdgeLength_relDiff: relDiff(metricMean(summary, 'meanEdgeLength'), target.meanEdgeLength ?? null),
      clustering_observed: metricMean(summary, 'averageClustering'),
      clustering_target: target.averageClustering ?? null,
      clustering_relDiff: relDiff(metricMean(summary, 'averageClustering'), target.averageClustering ?? null),
      cyclomatic_observed: metricMean(summary, 'cyclomaticNumber'),
      cyclomatic_target: target.cyclomaticNumber ?? null,
      cyclomatic_relDiff: relDiff(metricMean(summary, 'cyclomaticNumber'), target.cyclomaticNumber ?? null),
      pathLength_observed: metricMean(summary, 'averagePathLengthLargestComponent'),
      pathLength_target: target.averagePathLengthLargestComponent ?? null,
      pathLength_relDiff: relDiff(metricMean(summary, 'averagePathLengthLargestComponent'), target.averagePathLengthLargestComponent ?? null),
      earlyStopRate: summary?.earlyStopRate ?? null,
    };
  });

  const heterogeneousComparisonRows = heterogeneousResult.summaries.map((summary) => {
    const target = paperTargets.heterogeneous[summary.scenarioId];
    return {
      scenarioId: summary.scenarioId,
      maxDegree_observed: metricMean(summary, 'maxDegree'),
      maxDegree_target: target.maxDegree,
      maxDegree_relDiff: relDiff(metricMean(summary, 'maxDegree'), target.maxDegree),
      degreeGini_observed: metricMean(summary, 'degreeGini'),
      degreeGini_target: target.degreeGini,
      degreeGini_relDiff: relDiff(metricMean(summary, 'degreeGini'), target.degreeGini),
      shareAtCapacity_observed: metricMean(summary, 'shareAtCapacity'),
      shareAtCapacity_target: target.shareAtCapacity,
      shareAtCapacity_relDiff: relDiff(metricMean(summary, 'shareAtCapacity'), target.shareAtCapacity),
      clustering_observed: metricMean(summary, 'averageClustering'),
      clustering_target: target.averageClustering,
      clustering_relDiff: relDiff(metricMean(summary, 'averageClustering'), target.averageClustering),
      earlyStopRate: summary.earlyStopRate,
    };
  });

  const report = `# Paper Replication Report

This report compares the shared core in \`src/standalone/browser-core.js\` against the executed benchmark targets reported in the attached April 7, 2026 paper.

## Inputs

- headline suite: 16 replications at N=1000
- one-factor subset: 12 replications at N=1000
- heterogeneous capacity suite: 16 replications at N=1000
- strict baseline execution path only:
  - arrivalMode = uniform
  - meshMode = off
  - planarityMode = none
  - baseline arrival and target selection

## Headline replication

${headlineComparisonRows.map((row) => `- ${row.scenarioLabel}: max degree ${row.maxDegree_observed?.toFixed(2)} vs ${row.maxDegree_target.toFixed(2)}, Gini ${row.degreeGini_observed?.toFixed(3)} vs ${row.degreeGini_target.toFixed(3)}, clustering ${row.clustering_observed?.toFixed(3)} vs ${row.clustering_target.toFixed(3)}, mean edge length ${row.meanEdgeLength_observed?.toFixed(3)} vs ${row.meanEdgeLength_target.toFixed(3)}, tail ${row.preferredTail_observed} vs ${row.preferredTail_target}.`).join('\n')}

## One-factor checks

${sensitivityComparisonRows.map((row) => `- ${row.scenarioId}: mean edge length ${row.meanEdgeLength_observed?.toFixed?.(3) ?? 'NA'} vs ${row.meanEdgeLength_target ?? 'NA'}, clustering ${row.clustering_observed?.toFixed?.(4) ?? 'NA'} vs ${row.clustering_target ?? 'NA'}, cyclomatic ${row.cyclomatic_observed?.toFixed?.(0) ?? 'NA'} vs ${row.cyclomatic_target ?? 'NA'}, path length ${row.pathLength_observed?.toFixed?.(2) ?? 'NA'} vs ${row.pathLength_target ?? 'NA'}.`).join('\n')}

## Heterogeneous capacity checks

${heterogeneousComparisonRows.map((row) => `- ${row.scenarioId}: max degree ${row.maxDegree_observed?.toFixed(2)} vs ${row.maxDegree_target.toFixed(2)}, Gini ${row.degreeGini_observed?.toFixed(3)} vs ${row.degreeGini_target.toFixed(3)}, share at capacity ${row.shareAtCapacity_observed?.toFixed(4)} vs ${row.shareAtCapacity_target.toFixed(4)}, clustering ${row.clustering_observed?.toFixed(4)} vs ${row.clustering_target.toFixed(4)}.`).join('\n')}

## Preliminary interpretation

- If the regime ordering matches but the levels drift, treat that as quantitative implementation drift rather than conceptual failure.
- Any early-stop rate above zero in this strict paper benchmark indicates a mismatch relative to the executed paper benchmark.
- Tail mismatches should be interpreted cautiously because they are sensitive to finite-size effects and the exact fitting workflow.
`;

  await Promise.all([
    fs.writeFile(path.join(outputRoot, 'headline.json'), JSON.stringify(headlineResult, null, 2)),
    fs.writeFile(path.join(outputRoot, 'sensitivity.json'), JSON.stringify(sensitivityResult, null, 2)),
    fs.writeFile(path.join(outputRoot, 'heterogeneous.json'), JSON.stringify(heterogeneousResult, null, 2)),
    fs.writeFile(path.join(outputRoot, 'headline_comparison.csv'), toCsv(headlineComparisonRows)),
    fs.writeFile(path.join(outputRoot, 'sensitivity_comparison.csv'), toCsv(sensitivityComparisonRows)),
    fs.writeFile(path.join(outputRoot, 'heterogeneous_comparison.csv'), toCsv(heterogeneousComparisonRows)),
    fs.writeFile(path.join(outputRoot, 'PAPER_REPLICATION_REPORT.md'), report),
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
