import path from 'node:path';
import { loadBrowserCore } from './load_browser_core.mjs';

const repoRoot = process.cwd();
const outputRoot = path.join(repoRoot, 'results', 'strategy_browser_20260407_cycle3');

async function loadBrowserEngine() {
  return loadBrowserCore(repoRoot);
}

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
  if (!preset) {
    throw new Error(`Unknown preset: ${presetId}`);
  }
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
  const lines = [headers.join(',')];
  rows.forEach((row) => {
    lines.push(headers.map((header) => csvEscape(row[header])).join(','));
  });
  return lines.join('\n');
}

function summarizeMetric(values) {
  const clean = values.filter((value) => typeof value === 'number' && Number.isFinite(value));
  if (clean.length === 0) {
    return { mean: null, sd: null, q05: null, q50: null, q95: null };
  }
  const mean = clean.reduce((sum, value) => sum + value, 0) / clean.length;
  const variance = clean.reduce((sum, value) => sum + (value - mean) ** 2, 0) / clean.length;
  const sorted = [...clean].sort((a, b) => a - b);
  const quantile = (ratio) => sorted[Math.floor((sorted.length - 1) * ratio)];
  return { mean, sd: Math.sqrt(variance), q05: quantile(0.05), q50: quantile(0.5), q95: quantile(0.95) };
}

function summarizeRuns(runs) {
  const metricKeys = Object.keys(runs[0].metrics).filter((key) => typeof runs[0].metrics[key] === 'number');
  const accessKeys = Object.keys(runs[0].access).filter((key) => typeof runs[0].access[key] === 'number');
  const metrics = {};
  metricKeys.forEach((key) => {
    metrics[key] = summarizeMetric(runs.map((run) => run.metrics[key]));
  });
  const access = {};
  accessKeys.forEach((key) => {
    access[key] = summarizeMetric(runs.map((run) => run.access[key]));
  });
  return {
    scenarioId: runs[0].scenarioId,
    scenarioLabel: runs[0].scenarioLabel,
    replications: runs.length,
    earlyStopRate: runs.filter((run) => run.earlyStopped).length / runs.length,
    truncationRate: runs.filter((run) => run.truncationEvents > 0).length / runs.length,
    metrics,
    access,
    terminationReasons: runs.reduce((acc, run) => {
      const key = run.terminationReason || 'completed';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
  };
}

function row(summary) {
  return {
    scenarioId: summary.scenarioId,
    scenarioLabel: summary.scenarioLabel,
    replications: summary.replications,
    earlyStopRate: summary.earlyStopRate,
    truncationRate: summary.truncationRate,
    meanDegree_mean: summary.metrics.meanDegree?.mean ?? null,
    maxDegree_mean: summary.metrics.maxDegree?.mean ?? null,
    degreeGini_mean: summary.metrics.degreeGini?.mean ?? null,
    shareAtCapacity_mean: summary.metrics.shareAtCapacity?.mean ?? null,
    averageClustering_mean: summary.metrics.averageClustering?.mean ?? null,
    averagePathLengthLargestComponent_mean: summary.metrics.averagePathLengthLargestComponent?.mean ?? null,
    meanEdgeLength_mean: summary.metrics.meanEdgeLength?.mean ?? null,
    totalNetworkLength_mean: summary.metrics.totalNetworkLength?.mean ?? null,
    crossingCount_mean: summary.metrics.crossingCount?.mean ?? null,
    generatedIntersectionNodes_mean: summary.metrics.generatedIntersectionNodes?.mean ?? null,
    splitLinkCount_mean: summary.metrics.splitLinkCount?.mean ?? null,
    splitEvents_mean: summary.metrics.splitEvents?.mean ?? null,
    crossingCandidatesEncountered_mean: summary.metrics.crossingCandidatesEncountered?.mean ?? null,
    crossingCandidatesAdmitted_mean: summary.metrics.crossingCandidatesAdmitted?.mean ?? null,
    eastWestBias_mean: summary.metrics.eastWestBias?.mean ?? null,
    northSouthBias_mean: summary.metrics.northSouthBias?.mean ?? null,
    meanGravity_mean: summary.access.meanGravity?.mean ?? null,
    meanCumulative_mean: summary.access.meanCumulative?.mean ?? null,
  };
}

function number(x, digits = 3) {
  return typeof x === 'number' && Number.isFinite(x) ? x.toFixed(digits) : 'NA';
}

function pct(x) {
  return typeof x === 'number' && Number.isFinite(x) ? `${(100 * x).toFixed(1)}%` : 'NA';
}

function baseParams(engine, overrides = {}) {
  const defaults = mergeParams(engine.createDefaultParams(), {
    finalNodeCount: 100,
    rngSeed: 12345,
    trackHistory: false,
    replicationCount: 6,
    arrivalMode: 'uniform',
    planarityMode: 'none',
    meshMode: 'off',
    meshAngleSet: '90',
    meshAdjacencyMode: 'none',
    arrivalPreferenceMode: 'baseline',
    selectionKernelMode: 'baseline',
    arrivalAccessMetric: 'gravity',
    arrivalAccessStrength: 0,
    accessSelectionMetric: 'gravity',
    accessSelectionStrength: 0,
    accessibilityRadius: 0.75,
    accessibilityDecay: 3,
    accessSemantics: 'network',
  });
  return engine.sanitizeParams(mergeParams(defaults, overrides));
}

function buildTranches(engine) {
  const strictBaseline = {
    title: 'Refined R1: Strict baseline kernel',
    purpose: 'Recover interpretable kernel behavior with settings chosen so cost and capacity can actually bind.',
    replications: 4,
    scenarios: [
      scenarioFromPreset(engine, 'ba_benchmark', { params: baseParams(engine, { finalNodeCount: 200, replicationCount: 4, arrivalMode: 'uniform', meshMode: 'off', planarityMode: 'none' }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'strict_phi_0', label: 'Strict baseline phi=0', params: baseParams(engine, { finalNodeCount: 200, beta: 0, phi: 0, capacityValue: 64 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'strict_phi_5', label: 'Strict baseline phi=5', params: baseParams(engine, { finalNodeCount: 200, beta: 0, phi: 5, capacityValue: 64 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'strict_K_4', label: 'Strict baseline K=4 (binding ring seed)', params: baseParams(engine, { finalNodeCount: 200, alpha: 1, beta: 2, phi: 1, kappa: 2, m0: 4, seedGraphType: 'ring', capacityValue: 4 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'strict_K_64', label: 'Strict baseline K=64 (binding ring seed control)', params: baseParams(engine, { finalNodeCount: 200, alpha: 1, beta: 2, phi: 1, kappa: 2, m0: 4, seedGraphType: 'ring', capacityValue: 64 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'strict_kappa_1', label: 'Strict baseline kappa=1', params: baseParams(engine, { finalNodeCount: 200, beta: 0, kappa: 1, m0: 4, capacityValue: 64 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'strict_kappa_3', label: 'Strict baseline kappa=3', params: baseParams(engine, { finalNodeCount: 200, beta: 0, kappa: 3, m0: 5, capacityValue: 64 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'strict_alpha_0', label: 'Strict baseline alpha=0', params: baseParams(engine, { finalNodeCount: 200, beta: 0, alpha: 0, capacityValue: 64 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'strict_alpha_2', label: 'Strict baseline alpha=2', params: baseParams(engine, { finalNodeCount: 200, beta: 0, alpha: 2, capacityValue: 64 }) }),
    ],
  };

  const meshCommon = {
    finalNodeCount: 100,
    alpha: 1,
    beta: 1,
    phi: 1,
    kappa: 2,
    m0: 5,
    capacityValue: 16,
    seedGraphType: 'cross',
    arrivalMode: 'network',
    meshMode: 'grid_bias',
    planarityMode: 'none',
    meshNearestCount: 6,
    meshSpacingFactor: 0.2,
    arrivalPreferenceMode: 'baseline',
    selectionKernelMode: 'baseline',
  };

  const strictMesh = {
    title: 'Refined R2: Strict mesh growth',
    purpose: 'Isolate lattice framing and local admissibility without planarity or access confounds.',
    replications: 4,
    scenarios: [
      scenarioFromPreset(engine, 'general_model', { id: 'mesh_90_network_edge', label: '90 / edge-neighbor / near-network', params: baseParams(engine, { ...meshCommon, meshAngleSet: '90', meshAdjacencyMode: 'rook', arrivalMode: 'network' }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'mesh_90_frontier_edge', label: '90 / edge-neighbor / frontier', params: baseParams(engine, { ...meshCommon, meshAngleSet: '90', meshAdjacencyMode: 'rook', arrivalMode: 'frontier' }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'mesh_90_network_ring', label: '90 / edge-plus-corner / near-network', params: baseParams(engine, { ...meshCommon, meshAngleSet: '90', meshAdjacencyMode: 'queen', arrivalMode: 'network' }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'mesh_60_network_edge', label: '60 / edge-neighbor / near-network', params: baseParams(engine, { ...meshCommon, meshAngleSet: '60', meshAdjacencyMode: 'rook', arrivalMode: 'network' }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'mesh_60_frontier_edge', label: '60 / edge-neighbor / frontier', params: baseParams(engine, { ...meshCommon, meshAngleSet: '60', meshAdjacencyMode: 'rook', arrivalMode: 'frontier' }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'mesh_60_network_ring', label: '60 / expanded local ring / near-network', params: baseParams(engine, { ...meshCommon, meshAngleSet: '60', meshAdjacencyMode: 'queen', arrivalMode: 'network' }) }),
    ],
  };

  const activatedPlanarity = {
    title: 'Refined R3: Activated planarity',
    purpose: 'Use deliberately crossing-prone, smaller-N settings so split mode is actually activated and measurable.',
    replications: 2,
    scenarios: [
      scenarioFromPreset(engine, 'general_model', { id: 'planar_free_none', label: 'Free geometry / none', params: baseParams(engine, { finalNodeCount: 30, alpha: 0.5, beta: 0, phi: 0, kappa: 4, m0: 6, capacityValue: 64, seedGraphType: 'complete', arrivalMode: 'uniform', meshMode: 'off', planarityMode: 'none' }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'planar_free_reject', label: 'Free geometry / reject crossings', params: baseParams(engine, { finalNodeCount: 30, alpha: 0.5, beta: 0, phi: 0, kappa: 4, m0: 6, capacityValue: 64, seedGraphType: 'complete', arrivalMode: 'uniform', meshMode: 'off', planarityMode: 'reject_crossings' }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'planar_free_split', label: 'Free geometry / split crossings', params: baseParams(engine, { finalNodeCount: 30, alpha: 0.5, beta: 0, phi: 0, kappa: 4, m0: 6, capacityValue: 64, seedGraphType: 'complete', arrivalMode: 'uniform', meshMode: 'off', planarityMode: 'split_crossings' }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'planar_mesh_none', label: 'Mesh geometry / none', params: baseParams(engine, { finalNodeCount: 35, alpha: 0.5, beta: 0, phi: 0, kappa: 4, m0: 5, capacityValue: 64, seedGraphType: 'cross', arrivalMode: 'frontier', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'queen', meshNearestCount: 14, meshSpacingFactor: 0, planarityMode: 'none' }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'planar_mesh_reject', label: 'Mesh geometry / reject crossings', params: baseParams(engine, { finalNodeCount: 35, alpha: 0.5, beta: 0, phi: 0, kappa: 4, m0: 5, capacityValue: 64, seedGraphType: 'cross', arrivalMode: 'frontier', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'queen', meshNearestCount: 14, meshSpacingFactor: 0, planarityMode: 'reject_crossings' }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'planar_mesh_split', label: 'Mesh geometry / split crossings', params: baseParams(engine, { finalNodeCount: 35, alpha: 0.5, beta: 0, phi: 0, kappa: 4, m0: 5, capacityValue: 64, seedGraphType: 'cross', arrivalMode: 'frontier', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'queen', meshNearestCount: 14, meshSpacingFactor: 0, planarityMode: 'split_crossings' }) }),
    ],
  };

  const accessFreeCommon = {
    finalNodeCount: 100,
    alpha: 1,
    beta: 1,
    phi: 1,
    kappa: 2,
    m0: 5,
    capacityValue: 16,
    arrivalMode: 'uniform',
    meshMode: 'off',
    planarityMode: 'none',
    accessibilityRadius: 0.75,
    accessibilityDecay: 3,
  };

  const accessMeshCommon = {
    finalNodeCount: 100,
    alpha: 1,
    beta: 1,
    phi: 1,
    kappa: 2,
    m0: 5,
    capacityValue: 16,
    seedGraphType: 'cross',
    arrivalMode: 'network',
    meshMode: 'grid_bias',
    meshAngleSet: '90',
    meshAdjacencyMode: 'rook',
    planarityMode: 'reject_crossings',
    accessibilityRadius: 0.75,
    accessibilityDecay: 3,
  };

  const accessSemantics = {
    title: 'Refined R4: Accessibility semantics',
    purpose: 'Compare network, seed-only, and weighted-opportunity semantics directly under the same weighting rule.',
    replications: 3,
    scenarios: [
      scenarioFromPreset(engine, 'general_model', { id: 'access_free_none', label: 'Free geometry / no access weighting', params: baseParams(engine, { ...accessFreeCommon, arrivalPreferenceMode: 'baseline', selectionKernelMode: 'baseline', accessSemantics: 'network', arrivalAccessStrength: 0, accessSelectionStrength: 0 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'access_free_network', label: 'Free geometry / network access weighting', params: baseParams(engine, { ...accessFreeCommon, arrivalPreferenceMode: 'access', selectionKernelMode: 'access', accessSemantics: 'network', arrivalAccessMetric: 'gravity', accessSelectionMetric: 'gravity', arrivalAccessStrength: 2, accessSelectionStrength: 2 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'access_free_seed', label: 'Free geometry / seed-only access weighting', params: baseParams(engine, { ...accessFreeCommon, arrivalPreferenceMode: 'access', selectionKernelMode: 'access', accessSemantics: 'seed', arrivalAccessMetric: 'gravity', accessSelectionMetric: 'gravity', arrivalAccessStrength: 2, accessSelectionStrength: 2 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'access_free_opportunity', label: 'Free geometry / opportunity access weighting', params: baseParams(engine, { ...accessFreeCommon, arrivalPreferenceMode: 'access', selectionKernelMode: 'access', accessSemantics: 'opportunity', arrivalAccessMetric: 'gravity', accessSelectionMetric: 'gravity', arrivalAccessStrength: 2, accessSelectionStrength: 2 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'access_mesh_none', label: 'Mesh geometry / no access weighting', params: baseParams(engine, { ...accessMeshCommon, arrivalPreferenceMode: 'baseline', selectionKernelMode: 'baseline', accessSemantics: 'network', arrivalAccessStrength: 0, accessSelectionStrength: 0 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'access_mesh_network', label: 'Mesh geometry / network access weighting', params: baseParams(engine, { ...accessMeshCommon, arrivalPreferenceMode: 'access', selectionKernelMode: 'access', accessSemantics: 'network', arrivalAccessMetric: 'gravity', accessSelectionMetric: 'gravity', arrivalAccessStrength: 2, accessSelectionStrength: 2 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'access_mesh_seed', label: 'Mesh geometry / seed-only access weighting', params: baseParams(engine, { ...accessMeshCommon, arrivalPreferenceMode: 'access', selectionKernelMode: 'access', accessSemantics: 'seed', arrivalAccessMetric: 'gravity', accessSelectionMetric: 'gravity', arrivalAccessStrength: 2, accessSelectionStrength: 2 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'access_mesh_opportunity', label: 'Mesh geometry / opportunity access weighting', params: baseParams(engine, { ...accessMeshCommon, arrivalPreferenceMode: 'access', selectionKernelMode: 'access', accessSemantics: 'opportunity', arrivalAccessMetric: 'gravity', accessSelectionMetric: 'gravity', arrivalAccessStrength: 2, accessSelectionStrength: 2 }) }),
    ],
  };

  const targetedStress = {
    title: 'Refined R5: Targeted stress checks',
    purpose: 'Use one strong split case and one strong access case as a final activation check for ambiguous mechanisms.',
    replications: 2,
    scenarios: [
      scenarioFromPreset(engine, 'general_model', { id: 'stress_free_split', label: 'Stress free / split crossings', params: baseParams(engine, { finalNodeCount: 30, alpha: 0.5, beta: 0, phi: 0, kappa: 4, m0: 6, capacityValue: 64, seedGraphType: 'complete', arrivalMode: 'uniform', meshMode: 'off', planarityMode: 'split_crossings' }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'stress_mesh_split', label: 'Stress mesh / split crossings', params: baseParams(engine, { finalNodeCount: 35, alpha: 0.5, beta: 0, phi: 0, kappa: 4, m0: 5, capacityValue: 64, seedGraphType: 'cross', arrivalMode: 'frontier', meshMode: 'grid_bias', meshAngleSet: '90', meshAdjacencyMode: 'queen', meshNearestCount: 14, meshSpacingFactor: 0, planarityMode: 'split_crossings' }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'stress_free_opportunity', label: 'Free geometry / strong opportunity access', params: baseParams(engine, { ...accessFreeCommon, arrivalPreferenceMode: 'access', selectionKernelMode: 'access', accessSemantics: 'opportunity', arrivalAccessMetric: 'gravity', accessSelectionMetric: 'gravity', arrivalAccessStrength: 4, accessSelectionStrength: 4 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'stress_mesh_opportunity', label: 'Mesh geometry / strong opportunity access', params: baseParams(engine, { ...accessMeshCommon, arrivalPreferenceMode: 'access', selectionKernelMode: 'access', accessSemantics: 'opportunity', arrivalAccessMetric: 'gravity', accessSelectionMetric: 'gravity', arrivalAccessStrength: 4, accessSelectionStrength: 4 }) }),
    ],
  };

  return [strictBaseline, strictMesh, activatedPlanarity, accessSemantics, targetedStress];
}

function runTranche(engine, tranche) {
  const runs = [];
  tranche.scenarios.forEach((scenario) => {
    for (let replication = 0; replication < tranche.replications; replication += 1) {
      const seed = engine.deriveSeed(scenario.params.rngSeed, scenario.id, replication);
      const runState = engine.runSimulation({ ...scenario.params, rngSeed: seed });
      const metrics = engine.computeNetworkMetricsWithContext(
        runState.nodes,
        runState.edges,
        runState.params.degreeThreshold,
        runState.latticeMetadata,
        runState.splitEvents ?? 0,
        {
          crossingCandidatesEncountered: runState.crossingCandidatesEncountered ?? 0,
          crossingCandidatesAdmitted: runState.crossingCandidatesAdmitted ?? 0,
        },
      );
      const access = engine.computeTransportAccessibility(runState.nodes, runState.edges, runState.params);
      runs.push({
        scenarioId: scenario.id,
        scenarioLabel: scenario.label,
        replication,
        seed,
        metrics,
        access: {
          meanCumulative: access.meanCumulative,
          meanGravity: access.meanGravity,
          maxCumulative: access.maxCumulative,
          maxGravity: access.maxGravity,
        },
        earlyStopped: runState.status === 'early_stopped',
        terminationReason: runState.terminationReason,
        truncationEvents: runState.truncationEvents,
        totalMissingLinks: runState.totalMissingLinks,
      });
    }
  });
  return {
    tranche: {
      title: tranche.title,
      purpose: tranche.purpose,
      replications: tranche.replications,
      scenarios: tranche.scenarios.map((scenario) => ({ id: scenario.id, label: scenario.label, params: scenario.params })),
    },
    runs,
    summaries: tranche.scenarios.map((scenario) => summarizeRuns(runs.filter((run) => run.scenarioId === scenario.id))),
  };
}

function findingLines(key, summaryMap) {
  switch (key) {
    case 'refined_r1':
      return [
        `Strict baseline isolates the kernel cleanly: compare phi=0 versus phi=5 on mean edge length (${number(summaryMap.strict_phi_0.meanEdgeLength_mean)} vs ${number(summaryMap.strict_phi_5.meanEdgeLength_mean)}).`,
        `Capacity binding is tested with a ring seed and beta=2 so low-K runs separate meaningfully from high-K runs in max degree and saturation (${number(summaryMap.strict_K_4.maxDegree_mean)} / ${pct(summaryMap.strict_K_4.shareAtCapacity_mean)} vs ${number(summaryMap.strict_K_64.maxDegree_mean)} / ${pct(summaryMap.strict_K_64.shareAtCapacity_mean)}).`,
        `Alpha and kappa should now be interpretable without mesh confounds; compare alpha=0 vs alpha=2 and kappa=1 vs kappa=3 directly.`
      ];
    case 'refined_r2':
      return [
        `Strict mesh isolates lattice effects. Compare 90-degree versus 60-degree cases on clustering and directional bias, and compare near-network versus frontier arrivals within the same lattice family.`,
        `If frontier and near-network remain close, then current admissibility screens dominate site-generation differences even inside mesh mode.`,
      ];
    case 'refined_r3':
      return [
        `Activated planarity should now reveal whether split mode genuinely creates intersection nodes; compare split counts, admitted crossing candidates, and crossings for free versus mesh geometry.`,
        `If reject-crossings lowers crossings mainly by stopping growth, that should show up in early-stop and truncation rates alongside split-event differences.`
      ];
    case 'refined_r4':
      return [
        `Accessibility semantics are now compared directly: network, seed-only, and opportunity weighting under the same arrival+target rule.`,
        `If network access dominates seed-only access on gravity while opportunity access changes morphology differently, then the semantic choice matters and should stay explicit in the UI.`
      ];
    case 'refined_r5':
      return [
        `The targeted stress tranche exists as a final activation check: split mode should stay non-dormant in the free and mesh split cases, while strong opportunity weighting should visibly change accessibility summaries.`
      ];
    default:
      return [];
  }
}

function trancheMemo(key, tranche, summaries) {
  const summaryMap = Object.fromEntries(summaries.map((summary) => [summary.scenarioId, row(summary)]));
  const lines = findingLines(key, summaryMap);
  return `# ${tranche.title}

${tranche.purpose}

## Settings

- live browser model extracted from \`web/main.js\`
- replications per scenario: ${tranche.replications}
- scenarios: ${tranche.scenarios.length}

## Reading guide

${lines.map((line) => `- ${line}`).join('\n')}

## Summary table reference

See the paired CSV and JSON outputs for exact scenario-level metrics.
`;
}

function overallReport(resultsByKey) {
  const r1 = Object.fromEntries(resultsByKey.refined_r1.summaries.map((summary) => [summary.scenarioId, row(summary)]));
  const r2 = Object.fromEntries(resultsByKey.refined_r2.summaries.map((summary) => [summary.scenarioId, row(summary)]));
  const r3 = Object.fromEntries(resultsByKey.refined_r3.summaries.map((summary) => [summary.scenarioId, row(summary)]));
  const r4 = Object.fromEntries(resultsByKey.refined_r4.summaries.map((summary) => [summary.scenarioId, row(summary)]));
  const r5 = Object.fromEntries(resultsByKey.refined_r5.summaries.map((summary) => [summary.scenarioId, row(summary)]));
  return `# Browser Strategy Refined Report

This report summarizes the refined second-stage execution against the live browser model in \`web/main.js\`.

## Design

- model source: browser engine extracted from \`web/main.js\`
- goal: recover more interpretable mechanism effects after the first full pass showed strong family interactions
- style: strict families first, then stress tranches to activate dormant mechanisms

## Main findings

### 1. Strict baseline behavior

- phi=0 mean edge length: ${number(r1.strict_phi_0.meanEdgeLength_mean)}
- phi=5 mean edge length: ${number(r1.strict_phi_5.meanEdgeLength_mean)}
- K=4 saturation: ${pct(r1.strict_K_4.shareAtCapacity_mean)}
- K=64 saturation: ${pct(r1.strict_K_64.shareAtCapacity_mean)}

### 2. Strict mesh behavior

- 90 / edge-neighbor / near-network clustering: ${number(r2.mesh_90_network_edge.averageClustering_mean)}
- 60 / edge-neighbor / near-network clustering: ${number(r2.mesh_60_network_edge.averageClustering_mean)}
- 90 / frontier mean edge length: ${number(r2.mesh_90_frontier_edge.meanEdgeLength_mean)}
- 60 / frontier mean edge length: ${number(r2.mesh_60_frontier_edge.meanEdgeLength_mean)}

### 3. Activated planarity

- free split generated intersections: ${number(r3.planar_free_split.generatedIntersectionNodes_mean)}
- mesh split generated intersections: ${number(r3.planar_mesh_split.generatedIntersectionNodes_mean)}
- free split admitted crossing candidates: ${number(r3.planar_free_split.crossingCandidatesAdmitted_mean)}
- mesh split admitted crossing candidates: ${number(r3.planar_mesh_split.crossingCandidatesAdmitted_mean)}

### 4. Accessibility semantics

- free no-access mean gravity: ${number(r4.access_free_none.meanGravity_mean)}
- free network-access mean gravity: ${number(r4.access_free_network.meanGravity_mean)}
- free seed-only mean gravity: ${number(r4.access_free_seed.meanGravity_mean)}
- free opportunity mean gravity: ${number(r4.access_free_opportunity.meanGravity_mean)}
- mesh no-access mean gravity: ${number(r4.access_mesh_none.meanGravity_mean)}
- mesh network-access mean gravity: ${number(r4.access_mesh_network.meanGravity_mean)}
- mesh seed-only mean gravity: ${number(r4.access_mesh_seed.meanGravity_mean)}
- mesh opportunity mean gravity: ${number(r4.access_mesh_opportunity.meanGravity_mean)}

### 5. Targeted stress checks

- stress free split intersections: ${number(r5.stress_free_split.generatedIntersectionNodes_mean)}
- stress mesh split intersections: ${number(r5.stress_mesh_split.generatedIntersectionNodes_mean)}
- stress free opportunity mean gravity: ${number(r5.stress_free_opportunity.meanGravity_mean)}
- stress mesh opportunity mean gravity: ${number(r5.stress_mesh_opportunity.meanGravity_mean)}

## Interpretation

This refined run should be read as a second-stage design pass. Its main purpose is not to close the project, but to separate mechanism families cleanly enough that the next experimental iteration can focus on the genuinely informative levers.
`;
}

function cycleSynthesis(resultsByKey) {
  const r1 = Object.fromEntries(resultsByKey.refined_r1.summaries.map((summary) => [summary.scenarioId, row(summary)]));
  const r3 = Object.fromEntries(resultsByKey.refined_r3.summaries.map((summary) => [summary.scenarioId, row(summary)]));
  const r4 = Object.fromEntries(resultsByKey.refined_r4.summaries.map((summary) => [summary.scenarioId, row(summary)]));
  const r5 = Object.fromEntries(resultsByKey.refined_r5.summaries.map((summary) => [summary.scenarioId, row(summary)]));
  return `# Cycle Synthesis

## What Changed In This Cycle

- strict baseline settings were strengthened so cost and capacity could bind cleanly
- planarity tranches now report crossing-candidate diagnostics as well as split outcomes
- accessibility is tested as a semantic choice, not just a weighting-strength toggle

## Headline Results

- strict baseline phi contrast: ${number(r1.strict_phi_0.meanEdgeLength_mean)} vs ${number(r1.strict_phi_5.meanEdgeLength_mean)} mean edge length
- strict baseline K contrast: ${pct(r1.strict_K_4.shareAtCapacity_mean)} vs ${pct(r1.strict_K_64.shareAtCapacity_mean)} share at capacity
- activated free split intersections: ${number(r3.planar_free_split.generatedIntersectionNodes_mean)}
- activated mesh split intersections: ${number(r3.planar_mesh_split.generatedIntersectionNodes_mean)}
- free network/seed/opportunity gravity means: ${number(r4.access_free_network.meanGravity_mean)} / ${number(r4.access_free_seed.meanGravity_mean)} / ${number(r4.access_free_opportunity.meanGravity_mean)}
- mesh network/seed/opportunity gravity means: ${number(r4.access_mesh_network.meanGravity_mean)} / ${number(r4.access_mesh_seed.meanGravity_mean)} / ${number(r4.access_mesh_opportunity.meanGravity_mean)}
- stress free split intersections: ${number(r5.stress_free_split.generatedIntersectionNodes_mean)}
- stress mesh split intersections: ${number(r5.stress_mesh_split.generatedIntersectionNodes_mean)}

## Reading

This cycle should be read as a correction-and-remeasurement pass. If baseline contrasts are now strong and planarity split counts are nonzero, the browser implementation is much closer to an interpretable layered model family than it was in the earlier pilot runs.
`;
}

async function writeArtifacts(dir, key, tranche, result) {
  const summaryRows = result.summaries.map(row);
  await fs.writeFile(path.join(dir, `${key}.json`), JSON.stringify(result, null, 2));
  await fs.writeFile(path.join(dir, `${key}_summary.csv`), toCsv(summaryRows));
  await fs.writeFile(path.join(dir, `${key}_memo.md`), trancheMemo(key, tranche, result.summaries));
}

async function main() {
  await fs.mkdir(outputRoot, { recursive: true });
  const engine = await loadBrowserEngine();
  const tranches = buildTranches(engine);
  const resultsByKey = {};

  for (let index = 0; index < tranches.length; index += 1) {
    const tranche = tranches[index];
    const key = `refined_r${index + 1}`;
    console.log(`Running ${tranche.title}...`);
    const result = runTranche(engine, tranche);
    resultsByKey[key] = result;
    await writeArtifacts(outputRoot, key, tranche, result);
  }

  await fs.writeFile(path.join(outputRoot, 'REFINED_REPORT.md'), overallReport(resultsByKey));
  await fs.writeFile(path.join(outputRoot, 'CYCLE_SYNTHESIS.md'), cycleSynthesis(resultsByKey));
  console.log(`Refined results written to ${outputRoot}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
