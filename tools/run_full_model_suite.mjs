import fs from 'node:fs/promises';
import path from 'node:path';
import { loadBrowserCore } from './load_browser_core.mjs';

const repoRoot = process.cwd();
const outputRoot = path.join(repoRoot, 'results', 'full_model_suite_20260407');
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

function metricMean(summary, key) {
  return summary.metrics?.[key]?.mean ?? null;
}

function preferredTail(summary) {
  const entries = Object.entries(summary.preferredTailModelCounts || {});
  if (!entries.length) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
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

function flattenSummary(tranche, summary) {
  return {
    tranche,
    scenarioId: summary.scenarioId,
    scenarioLabel: summary.scenarioLabel,
    replications: summary.replications,
    earlyStopRate: summary.earlyStopRate,
    truncationRate: summary.truncationRate,
    meanDegree: metricMean(summary, 'meanDegree'),
    maxDegree: metricMean(summary, 'maxDegree'),
    degreeGini: metricMean(summary, 'degreeGini'),
    shareAtCapacity: metricMean(summary, 'shareAtCapacity'),
    averageClustering: metricMean(summary, 'averageClustering'),
    meanEdgeLength: metricMean(summary, 'meanEdgeLength'),
    totalNetworkLength: metricMean(summary, 'totalNetworkLength'),
    cyclomaticNumber: metricMean(summary, 'cyclomaticNumber'),
    averagePathLengthLargestComponent: metricMean(summary, 'averagePathLengthLargestComponent'),
    crossingCandidatesEncountered: metricMean(summary, 'crossingCandidatesEncountered'),
    crossingCandidatesAdmitted: metricMean(summary, 'crossingCandidatesAdmitted'),
    generatedIntersectionNodes: metricMean(summary, 'generatedIntersectionNodes'),
    splitEvents: metricMean(summary, 'splitEvents'),
    dominantDirectionShare: metricMean(summary, 'dominantDirectionShare'),
    eastWestBias: metricMean(summary, 'eastWestBias'),
    northSouthBias: metricMean(summary, 'northSouthBias'),
    preferredTail: preferredTail(summary),
  };
}

async function main() {
  const engine = await loadBrowserCore(repoRoot);
  await fs.mkdir(outputRoot, { recursive: true });

  const base = engine.sanitizeParams({
    ...engine.createDefaultParams(),
    finalNodeCount: 500,
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
  });

  const tranches = {
    f1_baseline: {
      replications: 8,
      scenarios: [
        scenarioFromPreset(engine, 'ba_benchmark', { params: { ...base, finalNodeCount: 500 } }),
        scenarioFromPreset(engine, 'capacity_only', { params: { ...base, finalNodeCount: 500, capacityValue: 16 } }),
        scenarioFromPreset(engine, 'spatial_only', { params: { ...base, finalNodeCount: 500 } }),
        scenarioFromPreset(engine, 'general_model', { params: { ...base, finalNodeCount: 500, capacityValue: 16 } }),
      ],
    },
    f2_arrival: {
      replications: 6,
      scenarios: [
        { id: 'uniform_square', label: 'Uniform square', params: engine.sanitizeParams(mergeParams(base, { arrivalMode: 'uniform', meshMode: 'off', planarityMode: 'none' })) },
        { id: 'uniform_lattice', label: 'Uniform lattice', params: engine.sanitizeParams(mergeParams(base, { arrivalMode: 'uniform_lattice', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'rook', seedGraphType: 'cross' })) },
        { id: 'near_network', label: 'Near existing network', params: engine.sanitizeParams(mergeParams(base, { arrivalMode: 'network', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'rook', seedGraphType: 'cross' })) },
        { id: 'outside_region', label: 'Outside occupied region', params: engine.sanitizeParams(mergeParams(base, { arrivalMode: 'frontier', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'rook', seedGraphType: 'cross' })) },
      ],
    },
    f3_mesh: {
      replications: 6,
      scenarios: [
        { id: 'mesh_90_edge', label: '90 edge-neighbor', params: engine.sanitizeParams(mergeParams(base, { seedGraphType: 'cross', arrivalMode: 'network', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'rook', planarityMode: 'none' })) },
        { id: 'mesh_90_corner', label: '90 edge-plus-corner', params: engine.sanitizeParams(mergeParams(base, { seedGraphType: 'cross', arrivalMode: 'network', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'queen', planarityMode: 'none' })) },
        { id: 'mesh_60_edge', label: '60 nearest-edge', params: engine.sanitizeParams(mergeParams(base, { seedGraphType: 'cross', arrivalMode: 'network', meshMode: 'grid_bias', meshAngleSet: '60', meshAdjacencyMode: 'rook', planarityMode: 'none', m0: 7 })) },
        { id: 'mesh_60_expanded', label: '60 expanded ring', params: engine.sanitizeParams(mergeParams(base, { seedGraphType: 'cross', arrivalMode: 'network', meshMode: 'grid_bias', meshAngleSet: '60', meshAdjacencyMode: 'queen', planarityMode: 'none', m0: 7 })) },
      ],
    },
    f4_planarity: {
      replications: 6,
      scenarios: [
        { id: 'planarity_none', label: 'No planarity', params: engine.sanitizeParams(mergeParams(base, { finalNodeCount: 300, seedGraphType: 'cross', arrivalMode: 'frontier', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'queen', planarityMode: 'none', kappa: 3, phi: 0, beta: 0, capacityValue: VERY_LARGE })) },
        { id: 'planarity_reject', label: 'Reject crossings', params: engine.sanitizeParams(mergeParams(base, { finalNodeCount: 300, seedGraphType: 'cross', arrivalMode: 'frontier', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'queen', planarityMode: 'reject_crossings', kappa: 3, phi: 0, beta: 0, capacityValue: VERY_LARGE })) },
        { id: 'planarity_split', label: 'Split crossings', params: engine.sanitizeParams(mergeParams(base, { finalNodeCount: 300, seedGraphType: 'cross', arrivalMode: 'frontier', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'queen', planarityMode: 'split_crossings', kappa: 3, phi: 0, beta: 0, capacityValue: VERY_LARGE })) },
      ],
    },
    f5_access: {
      replications: 6,
      scenarios: [
        { id: 'access_none', label: 'No access weighting', params: engine.sanitizeParams(mergeParams(base, { finalNodeCount: 400, seedGraphType: 'cross', arrivalMode: 'network', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'rook', planarityMode: 'none', accessSemantics: 'network', arrivalPreferenceMode: 'baseline', selectionKernelMode: 'baseline' })) },
        { id: 'access_network_both', label: 'Network access both', params: engine.sanitizeParams(mergeParams(base, { finalNodeCount: 400, seedGraphType: 'cross', arrivalMode: 'network', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'rook', accessSemantics: 'network', arrivalPreferenceMode: 'access', arrivalAccessMetric: 'gravity', arrivalAccessStrength: 1, selectionKernelMode: 'access', accessSelectionMetric: 'gravity', accessSelectionStrength: 1 })) },
        { id: 'access_seed_both', label: 'Seed access both', params: engine.sanitizeParams(mergeParams(base, { finalNodeCount: 400, seedGraphType: 'cross', arrivalMode: 'network', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'rook', accessSemantics: 'seed', arrivalPreferenceMode: 'access', arrivalAccessMetric: 'gravity', arrivalAccessStrength: 1, selectionKernelMode: 'access', accessSelectionMetric: 'gravity', accessSelectionStrength: 1 })) },
        { id: 'access_opportunity_both', label: 'Opportunity access both', params: engine.sanitizeParams(mergeParams(base, { finalNodeCount: 400, seedGraphType: 'cross', arrivalMode: 'network', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'rook', accessSemantics: 'opportunity', arrivalPreferenceMode: 'access', arrivalAccessMetric: 'gravity', arrivalAccessStrength: 1, selectionKernelMode: 'access', accessSelectionMetric: 'gravity', accessSelectionStrength: 1 })) },
      ],
    },
  };

  const trancheResults = {};
  const flatRows = [];

  for (const [trancheId, config] of Object.entries(tranches)) {
    const result = engine.runBatchConfig(config);
    trancheResults[trancheId] = result;
    result.summaries.forEach((summary) => flatRows.push(flattenSummary(trancheId, summary)));
  }

  const memo = `# Full Model Suite Memo

This suite goes beyond strict paper replication and compares the current shared-core model families directly.

## Tranche coverage

- F1 baseline generalized model
- F2 arrival extensions
- F3 lattice / mesh extensions
- F4 planarity extensions
- F5 accessibility semantics

## Quick signals

${flatRows.filter((row) => row.tranche === 'f1_baseline').map((row) => `- Baseline ${row.scenarioLabel}: max degree ${row.maxDegree?.toFixed(2)}, mean edge length ${row.meanEdgeLength?.toFixed(3)}, clustering ${row.averageClustering?.toFixed(3)}, tail ${row.preferredTail}.`).join('\n')}

${flatRows.filter((row) => row.tranche === 'f4_planarity').map((row) => `- Planarity ${row.scenarioLabel}: crossings encountered ${row.crossingCandidatesEncountered?.toFixed?.(2) ?? 'NA'}, crossings admitted ${row.crossingCandidatesAdmitted?.toFixed?.(2) ?? 'NA'}, split events ${row.splitEvents?.toFixed?.(2) ?? 'NA'}, intersection nodes ${row.generatedIntersectionNodes?.toFixed?.(2) ?? 'NA'}.`).join('\n')}

${flatRows.filter((row) => row.tranche === 'f5_access').map((row) => `- Accessibility ${row.scenarioLabel}: mean edge length ${row.meanEdgeLength?.toFixed(3)}, clustering ${row.averageClustering?.toFixed(3)}, dominant-direction share ${row.dominantDirectionShare?.toFixed(3)}.`).join('\n')}
`;

  await Promise.all([
    fs.writeFile(path.join(outputRoot, 'suite_results.json'), JSON.stringify(trancheResults, null, 2)),
    fs.writeFile(path.join(outputRoot, 'suite_summary.csv'), toCsv(flatRows)),
    fs.writeFile(path.join(outputRoot, 'FULL_MODEL_SUITE_MEMO.md'), memo),
  ]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
