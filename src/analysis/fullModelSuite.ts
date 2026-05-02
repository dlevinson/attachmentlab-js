import path from 'node:path';
import {
  mergeParams,
  metricMean,
  preferredTail,
  runSimpleBatch,
  scenarioFromPreset,
  toCsv,
  writeResultBundle,
} from './benchmarkHarness';
import { createDefaultParams, sanitizeSimulationParams } from '../model/simulator';

export interface FullModelSuiteRunOptions {
  outputRoot?: string;
  profile?: 'smoke' | 'medium' | 'full';
  silent?: boolean;
}

function profileSettings(profile: 'smoke' | 'medium' | 'full') {
  if (profile === 'smoke') {
    return { baseN: 120, meshN: 80, planarityN: 24, accessN: 120, baselineReplications: 3, trancheReplications: 2 };
  }
  if (profile === 'medium') {
    return { baseN: 180, meshN: 120, planarityN: 28, accessN: 180, baselineReplications: 4, trancheReplications: 3 };
  }
  return { baseN: 250, meshN: 180, planarityN: 30, accessN: 250, baselineReplications: 6, trancheReplications: 4 };
}

export async function runFullModelSuite(options: FullModelSuiteRunOptions = {}) {
  const repoRoot = process.cwd();
  const outputRoot = options.outputRoot ?? path.join(repoRoot, 'results', 'full_model_suite_20260407');
  const profile = options.profile ?? 'full';
  const settings = profileSettings(profile);
  const log = options.silent ? (..._args: unknown[]) => {} : console.log;
  const progress = options.silent
    ? undefined
    : (event: {
        scenarioId: string;
        scenarioLabel: string;
        scenarioIndex: number;
        scenarioCount: number;
        replication: number;
        replicationCount: number;
      }) => {
        log(
          `[full-suite] ${event.scenarioIndex}/${event.scenarioCount} ${event.scenarioId} replication ${event.replication}/${event.replicationCount}`,
        );
      };

  const base = sanitizeSimulationParams({
    ...createDefaultParams(),
    finalNodeCount: settings.baseN,
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

  log(`[full-suite] profile=${profile} running f1_baseline (${settings.baselineReplications} reps)`);
  const f1_baseline = runSimpleBatch({
    replications: settings.baselineReplications,
    onProgress: progress,
    scenarios: [
      scenarioFromPreset('ba_benchmark', { params: { ...base, finalNodeCount: settings.baseN } }),
      scenarioFromPreset('capacity_only', { params: { ...base, finalNodeCount: settings.baseN, capacityValue: 16 } }),
      scenarioFromPreset('spatial_only', { params: { ...base, finalNodeCount: settings.baseN } }),
      scenarioFromPreset('general_model', { params: { ...base, finalNodeCount: settings.baseN, capacityValue: 16 } }),
    ],
  });

  log(`[full-suite] running f2_arrival (${settings.trancheReplications} reps)`);
  const f2_arrival = runSimpleBatch({
    replications: settings.trancheReplications,
    onProgress: progress,
    scenarios: [
      { id: 'uniform_square', label: 'Uniform square', params: sanitizeSimulationParams(mergeParams(base, { arrivalMode: 'uniform', meshMode: 'off', planarityMode: 'none' })) },
      { id: 'uniform_lattice', label: 'Uniform lattice', params: sanitizeSimulationParams(mergeParams(base, { finalNodeCount: settings.meshN, arrivalMode: 'uniform_lattice', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'rook', seedGraphType: 'cross' })) },
      { id: 'near_network', label: 'Near existing network', params: sanitizeSimulationParams(mergeParams(base, { finalNodeCount: settings.meshN, arrivalMode: 'network', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'rook', seedGraphType: 'cross' })) },
      { id: 'outside_region', label: 'Outside occupied region', params: sanitizeSimulationParams(mergeParams(base, { finalNodeCount: settings.meshN, arrivalMode: 'frontier', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'rook', seedGraphType: 'cross' })) },
    ],
  });

  log(`[full-suite] running f3_mesh (${settings.trancheReplications} reps)`);
  const f3_mesh = runSimpleBatch({
    replications: settings.trancheReplications,
    onProgress: progress,
    scenarios: [
      { id: 'mesh_90_edge', label: '90 edge-neighbor', params: sanitizeSimulationParams(mergeParams(base, { finalNodeCount: settings.meshN, seedGraphType: 'cross', arrivalMode: 'network', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'rook', planarityMode: 'none' })) },
      { id: 'mesh_90_corner', label: '90 edge-plus-corner', params: sanitizeSimulationParams(mergeParams(base, { finalNodeCount: settings.meshN, seedGraphType: 'cross', arrivalMode: 'network', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'queen', planarityMode: 'none' })) },
      { id: 'mesh_60_edge', label: '60 nearest-edge', params: sanitizeSimulationParams(mergeParams(base, { finalNodeCount: settings.meshN, seedGraphType: 'cross', arrivalMode: 'network', meshMode: 'grid_bias', meshAngleSet: '60', meshAdjacencyMode: 'rook', planarityMode: 'none', m0: 7 })) },
      { id: 'mesh_60_expanded', label: '60 expanded ring', params: sanitizeSimulationParams(mergeParams(base, { finalNodeCount: settings.meshN, seedGraphType: 'cross', arrivalMode: 'network', meshMode: 'grid_bias', meshAngleSet: '60', meshAdjacencyMode: 'queen', planarityMode: 'none', m0: 7 })) },
    ],
  });

  log(`[full-suite] running f4_planarity (${settings.trancheReplications} reps)`);
  const f4_planarity = runSimpleBatch({
    replications: settings.trancheReplications,
    onProgress: progress,
    scenarios: [
      { id: 'planarity_none', label: 'No planarity', params: sanitizeSimulationParams(mergeParams(base, { finalNodeCount: settings.planarityN, seedGraphType: 'complete', arrivalMode: 'uniform', meshMode: 'off', planarityMode: 'none', kappa: 4, phi: 0, beta: 0, capacityValue: 64, m0: 6, alpha: 0.5 })) },
      { id: 'planarity_reject', label: 'Reject crossings', params: sanitizeSimulationParams(mergeParams(base, { finalNodeCount: settings.planarityN, seedGraphType: 'complete', arrivalMode: 'uniform', meshMode: 'off', planarityMode: 'reject_crossings', kappa: 4, phi: 0, beta: 0, capacityValue: 64, m0: 6, alpha: 0.5 })) },
      { id: 'planarity_split', label: 'Split crossings', params: sanitizeSimulationParams(mergeParams(base, { finalNodeCount: settings.planarityN, seedGraphType: 'complete', arrivalMode: 'uniform', meshMode: 'off', planarityMode: 'split_crossings', kappa: 4, phi: 0, beta: 0, capacityValue: 64, m0: 6, alpha: 0.5 })) },
    ],
  });

  log(`[full-suite] running f5_access (${settings.trancheReplications} reps)`);
  const f5_access = runSimpleBatch({
    replications: settings.trancheReplications,
    onProgress: progress,
    scenarios: [
      { id: 'access_none', label: 'No access weighting', params: sanitizeSimulationParams(mergeParams(base, { finalNodeCount: settings.accessN, seedGraphType: 'cross', arrivalMode: 'network', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'rook', planarityMode: 'none', accessSemantics: 'network', arrivalPreferenceMode: 'baseline', selectionKernelMode: 'baseline' })) },
      { id: 'access_network_both', label: 'Network access both', params: sanitizeSimulationParams(mergeParams(base, { finalNodeCount: settings.accessN, seedGraphType: 'cross', arrivalMode: 'network', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'rook', accessSemantics: 'network', arrivalPreferenceMode: 'access', arrivalAccessMetric: 'gravity', arrivalAccessStrength: 1, selectionKernelMode: 'access', accessSelectionMetric: 'gravity', accessSelectionStrength: 1 })) },
      { id: 'access_seed_both', label: 'Seed access both', params: sanitizeSimulationParams(mergeParams(base, { finalNodeCount: settings.accessN, seedGraphType: 'cross', arrivalMode: 'network', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'rook', accessSemantics: 'seed', arrivalPreferenceMode: 'access', arrivalAccessMetric: 'gravity', arrivalAccessStrength: 1, selectionKernelMode: 'access', accessSelectionMetric: 'gravity', accessSelectionStrength: 1 })) },
      { id: 'access_opportunity_both', label: 'Opportunity access both', params: sanitizeSimulationParams(mergeParams(base, { finalNodeCount: settings.accessN, seedGraphType: 'cross', arrivalMode: 'network', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'rook', accessSemantics: 'opportunity', arrivalPreferenceMode: 'access', arrivalAccessMetric: 'gravity', arrivalAccessStrength: 1, selectionKernelMode: 'access', accessSelectionMetric: 'gravity', accessSelectionStrength: 1 })) },
    ],
  });

  const trancheResults = {
    f1_baseline,
    f2_arrival,
    f3_mesh,
    f4_planarity,
    f5_access,
  };

  const flatRows = Object.entries(trancheResults).flatMap(([trancheId, result]) =>
    result.summaries.map((summary) => ({
      tranche: trancheId,
      scenarioId: summary.scenarioId,
      scenarioLabel: summary.scenarioLabel,
      earlyStopRate: summary.earlyStopRate,
      truncationRate: summary.truncationRate,
      meanDegree: metricMean(summary, 'meanDegree'),
      maxDegree: metricMean(summary, 'maxDegree'),
      degreeGini: metricMean(summary, 'degreeGini'),
      shareAtCapacity: metricMean(summary, 'shareAtCapacity'),
      averageClustering: metricMean(summary, 'averageClustering'),
      meanEdgeLength: metricMean(summary, 'meanEdgeLength'),
      averagePathLengthLargestComponent: metricMean(summary, 'averagePathLengthLargestComponent'),
      cyclomaticNumber: metricMean(summary, 'cyclomaticNumber'),
      crossingCandidatesEncountered: metricMean(summary, 'crossingCandidatesEncountered'),
      crossingCandidatesAdmitted: metricMean(summary, 'crossingCandidatesAdmitted'),
      generatedIntersectionNodes: metricMean(summary, 'generatedIntersectionNodes'),
      splitEvents: metricMean(summary, 'splitEvents'),
      dominantDirectionShare: metricMean(summary, 'dominantDirectionShare'),
      eastWestBias: metricMean(summary, 'eastWestBias'),
      northSouthBias: metricMean(summary, 'northSouthBias'),
      preferredTail: preferredTail(summary),
    })),
  );

  const memo = `# Full Model Suite Memo

Profile: ${profile}

## Baseline family

${flatRows.filter((row) => row.tranche === 'f1_baseline').map((row) => `- ${row.scenarioLabel}: max degree ${row.maxDegree?.toFixed(2)}, edge length ${row.meanEdgeLength?.toFixed(3)}, clustering ${row.averageClustering?.toFixed(3)}, tail ${row.preferredTail}.`).join('\n')}

## Planarity family

${flatRows.filter((row) => row.tranche === 'f4_planarity').map((row) => `- ${row.scenarioLabel}: encountered ${row.crossingCandidatesEncountered?.toFixed?.(2) ?? 'NA'}, admitted ${row.crossingCandidatesAdmitted?.toFixed?.(2) ?? 'NA'}, split events ${row.splitEvents?.toFixed?.(2) ?? 'NA'}, intersection nodes ${row.generatedIntersectionNodes?.toFixed?.(2) ?? 'NA'}.`).join('\n')}

## Accessibility family

${flatRows.filter((row) => row.tranche === 'f5_access').map((row) => `- ${row.scenarioLabel}: edge length ${row.meanEdgeLength?.toFixed(3)}, clustering ${row.averageClustering?.toFixed(3)}, direction share ${row.dominantDirectionShare?.toFixed(3)}.`).join('\n')}
`;

  log(`[full-suite] writing result bundle to ${outputRoot}`);
  await writeResultBundle(outputRoot, {
    'suite_results.json': JSON.stringify(trancheResults, null, 2),
    'suite_summary.csv': toCsv(flatRows),
    'FULL_MODEL_SUITE_MEMO.md': memo,
  });

  return {
    profile,
    outputRoot,
    trancheResults,
    flatRows,
    memo,
  };
}
