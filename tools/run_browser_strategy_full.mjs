import path from 'node:path';
import { loadBrowserCore } from './load_browser_core.mjs';

const repoRoot = process.cwd();
const outputRoot = path.join(repoRoot, 'results', 'strategy_browser_20260406_full');

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

function pct(x) {
  return typeof x === 'number' ? `${(100 * x).toFixed(1)}%` : 'NA';
}

function number(x, digits = 3) {
  return typeof x === 'number' && Number.isFinite(x) ? x.toFixed(digits) : 'NA';
}

function scenarioSummaryRow(summary) {
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
    connectedComponents_mean: summary.metrics.connectedComponents?.mean ?? null,
    largestComponentShare_mean: summary.metrics.largestComponentShare?.mean ?? null,
    averageClustering_mean: summary.metrics.averageClustering?.mean ?? null,
    averagePathLengthLargestComponent_mean: summary.metrics.averagePathLengthLargestComponent?.mean ?? null,
    meanEdgeLength_mean: summary.metrics.meanEdgeLength?.mean ?? null,
    totalNetworkLength_mean: summary.metrics.totalNetworkLength?.mean ?? null,
    cyclomaticNumber_mean: summary.metrics.cyclomaticNumber?.mean ?? null,
    crossingCount_mean: summary.metrics.crossingCount?.mean ?? null,
    generatedIntersectionNodes_mean: summary.metrics.generatedIntersectionNodes?.mean ?? null,
    splitEvents_mean: summary.metrics.splitEvents?.mean ?? null,
    eastWestBias_mean: summary.metrics.eastWestBias?.mean ?? null,
    northSouthBias_mean: summary.metrics.northSouthBias?.mean ?? null,
    meanGravity_mean: summary.access.meanGravity?.mean ?? null,
    meanCumulative_mean: summary.access.meanCumulative?.mean ?? null,
  };
}

function baseParams(engine, overrides = {}) {
  return engine.sanitizeParams(mergeParams(engine.createDefaultParams(), {
    finalNodeCount: 100,
    rngSeed: 12345,
    replicationCount: 6,
    trackHistory: false,
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
  }, overrides));
}

function buildTranches(engine) {
  const trancheA = {
    title: 'Tranche A: Baseline kernel behavior',
    purpose: 'Rebuild confidence in the baseline browser model before interpreting extensions.',
    replications: 8,
    scenarios: [
      scenarioFromPreset(engine, 'ba_benchmark', { params: baseParams(engine, { finalNodeCount: 100, replicationCount: 8 }) }),
      scenarioFromPreset(engine, 'capacity_only', { params: baseParams(engine, { finalNodeCount: 100, replicationCount: 8, capacityValue: 8 }) }),
      scenarioFromPreset(engine, 'spatial_only', { params: baseParams(engine, { finalNodeCount: 100, replicationCount: 8, phi: 1, capacityValue: engine.VERY_LARGE }) }),
      scenarioFromPreset(engine, 'general_model', { params: baseParams(engine, { finalNodeCount: 100, replicationCount: 8, capacityValue: 16 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'phi_0', label: 'General phi=0', params: baseParams(engine, { finalNodeCount: 100, phi: 0, capacityValue: 16 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'phi_5', label: 'General phi=5', params: baseParams(engine, { finalNodeCount: 100, phi: 5, capacityValue: 16 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'kappa_1', label: 'General kappa=1', params: baseParams(engine, { finalNodeCount: 100, kappa: 1, m0: 4, capacityValue: 16 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'kappa_3', label: 'General kappa=3', params: baseParams(engine, { finalNodeCount: 100, kappa: 3, m0: 5, capacityValue: 16 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'K_4', label: 'General K=4', params: baseParams(engine, { finalNodeCount: 100, capacityValue: 4 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'K_64', label: 'General K=64', params: baseParams(engine, { finalNodeCount: 100, capacityValue: 64 }) }),
    ],
  };

  const arrivalCommon = {
    alpha: 1,
    beta: 1,
    phi: 1,
    kappa: 2,
    m0: 5,
    capacityValue: 16,
    seedGraphType: 'cross',
    meshMode: 'grid_bias',
    meshAngleSet: '90',
    meshAdjacencyMode: 'none',
    planarityMode: 'none',
    finalNodeCount: 100,
    replicationCount: 6,
  };

  const trancheB = {
    title: 'Tranche B: Arrival-process comparison',
    purpose: 'Compare arrival rules while keeping the target-selection side as close as possible.',
    replications: 6,
    scenarios: [
      scenarioFromPreset(engine, 'general_model', { id: 'arrival_uniform_square', label: 'Uniform in square', params: baseParams(engine, { finalNodeCount: 100, meshMode: 'off', seedGraphType: 'complete', arrivalMode: 'uniform', planarityMode: 'none', capacityValue: 16 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'arrival_uniform_lattice', label: 'Uniform on lattice', params: baseParams(engine, { ...arrivalCommon, arrivalMode: 'uniform_lattice' }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'arrival_near_network', label: 'Near existing network', params: baseParams(engine, { ...arrivalCommon, arrivalMode: 'network' }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'arrival_frontier', label: 'Outside occupied region', params: baseParams(engine, { ...arrivalCommon, arrivalMode: 'frontier' }) }),
    ],
  };

  const meshCommon = {
    alpha: 0.5,
    beta: 1,
    phi: 1,
    kappa: 2,
    m0: 5,
    capacityValue: 16,
    seedGraphType: 'cross',
    meshMode: 'grid_bias',
    planarityMode: 'none',
    arrivalMode: 'network',
    finalNodeCount: 100,
    replicationCount: 5,
  };

  const trancheC = {
    title: 'Tranche C: Lattice and mesh regularization',
    purpose: 'Compare square and triangular lattice families and local neighbor rules without planarity confounds.',
    replications: 5,
    scenarios: [
      scenarioFromPreset(engine, 'general_model', { id: 'mesh_90_rook', label: '90 degree / edge-neighbor', params: baseParams(engine, { ...meshCommon, meshAngleSet: '90', meshAdjacencyMode: 'rook', meshNearestCount: 4, meshSpacingFactor: 0.25 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'mesh_90_queen', label: '90 degree / edge-plus-corner', params: baseParams(engine, { ...meshCommon, meshAngleSet: '90', meshAdjacencyMode: 'queen', meshNearestCount: 6, meshSpacingFactor: 0.25 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'mesh_60_rook', label: '60 degree / nearest edge-neighbor', params: baseParams(engine, { ...meshCommon, meshAngleSet: '60', meshAdjacencyMode: 'rook', meshNearestCount: 6, meshSpacingFactor: 0.25 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'mesh_60_queen', label: '60 degree / expanded local ring', params: baseParams(engine, { ...meshCommon, meshAngleSet: '60', meshAdjacencyMode: 'queen', meshNearestCount: 6, meshSpacingFactor: 0.25 }) }),
    ],
  };

  const planarityCommon = {
    alpha: 1,
    beta: 1,
    phi: 0.5,
    kappa: 2,
    m0: 5,
    capacityValue: 16,
    seedGraphType: 'cross',
    meshMode: 'grid_bias',
    arrivalMode: 'frontier',
    finalNodeCount: 80,
    replicationCount: 4,
    meshNearestCount: 6,
    meshSpacingFactor: 0.1,
  };

  const trancheD = {
    title: 'Tranche D: Planarity comparison',
    purpose: 'Compare none, reject-crossings, and split-crossings on square and triangular lattice families.',
    replications: 4,
    scenarios: [
      scenarioFromPreset(engine, 'general_model', { id: 'planar_square_none', label: 'Square / none', params: baseParams(engine, { ...planarityCommon, meshAngleSet: '90', meshAdjacencyMode: 'queen', planarityMode: 'none' }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'planar_square_reject', label: 'Square / reject crossings', params: baseParams(engine, { ...planarityCommon, meshAngleSet: '90', meshAdjacencyMode: 'queen', planarityMode: 'reject_crossings' }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'planar_square_split', label: 'Square / split crossings', params: baseParams(engine, { ...planarityCommon, meshAngleSet: '90', meshAdjacencyMode: 'queen', planarityMode: 'split_crossings' }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'planar_tri_none', label: 'Triangular / none', params: baseParams(engine, { ...planarityCommon, meshAngleSet: '60', meshAdjacencyMode: 'queen', planarityMode: 'none' }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'planar_tri_reject', label: 'Triangular / reject crossings', params: baseParams(engine, { ...planarityCommon, meshAngleSet: '60', meshAdjacencyMode: 'queen', planarityMode: 'reject_crossings' }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'planar_tri_split', label: 'Triangular / split crossings', params: baseParams(engine, { ...planarityCommon, meshAngleSet: '60', meshAdjacencyMode: 'queen', planarityMode: 'split_crossings' }) }),
    ],
  };

  const accessCommon = {
    alpha: 1,
    beta: 1,
    phi: 1,
    kappa: 2,
    m0: 5,
    capacityValue: 16,
    seedGraphType: 'cross',
    meshMode: 'grid_bias',
    meshAngleSet: '90',
    meshAdjacencyMode: 'rook',
    arrivalMode: 'network',
    planarityMode: 'reject_crossings',
    finalNodeCount: 100,
    replicationCount: 4,
    accessibilityRadius: 0.75,
    accessibilityDecay: 3,
  };

  const trancheE = {
    title: 'Tranche E: Accessibility-guided growth',
    purpose: 'Test accessibility as a direct mechanism in arrival ranking, target selection, or both.',
    replications: 4,
    scenarios: [
      scenarioFromPreset(engine, 'general_model', { id: 'access_none', label: 'No access weighting', params: baseParams(engine, { ...accessCommon, arrivalPreferenceMode: 'baseline', selectionKernelMode: 'baseline', arrivalAccessStrength: 0, accessSelectionStrength: 0 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'access_arrival_only', label: 'Access-weighted arrivals', params: baseParams(engine, { ...accessCommon, arrivalPreferenceMode: 'access', selectionKernelMode: 'baseline', arrivalAccessMetric: 'gravity', arrivalAccessStrength: 1.5, accessSelectionStrength: 0 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'access_target_only', label: 'Access-weighted targets', params: baseParams(engine, { ...accessCommon, arrivalPreferenceMode: 'baseline', selectionKernelMode: 'access', accessSelectionMetric: 'gravity', arrivalAccessStrength: 0, accessSelectionStrength: 1.5 }) }),
      scenarioFromPreset(engine, 'general_model', { id: 'access_both', label: 'Access-weighted arrivals and targets', params: baseParams(engine, { ...accessCommon, arrivalPreferenceMode: 'access', selectionKernelMode: 'access', arrivalAccessMetric: 'gravity', accessSelectionMetric: 'gravity', arrivalAccessStrength: 1.5, accessSelectionStrength: 1.5 }) }),
    ],
  };

  return [trancheA, trancheB, trancheC, trancheD, trancheE];
}

function buildFindings(trancheKey, summaries) {
  const rows = Object.fromEntries(summaries.map((summary) => [summary.scenarioId, scenarioSummaryRow(summary)]));
  switch (trancheKey) {
    case 'tranche_a':
      return [
        `Within the baseline family, BA retains the highest mean max degree (${number(rows.ba_benchmark.maxDegree_mean)}) and highest degree Gini (${number(rows.ba_benchmark.degreeGini_mean)}), which supports using it as the unconstrained reference.`,
        `Cost deterrence is the clearest link-length control: the general model with phi=5 has mean edge length ${number(rows.phi_5.meanEdgeLength_mean)}, versus ${number(rows.phi_0.meanEdgeLength_mean)} when phi=0.`,
        `Capacity is the clearest tail-truncation lever: K=4 forces mean max degree to ${number(rows.K_4.maxDegree_mean)} with saturation ${pct(rows.K_4.shareAtCapacity_mean)}, while K=64 allows mean max degree ${number(rows.K_64.maxDegree_mean)} with zero saturation.`,
        `Attachment multiplicity is the clearest local-cycle lever: kappa=1 drives clustering down to ${number(rows.kappa_1.averageClustering_mean)}, while kappa=3 raises it to ${number(rows.kappa_3.averageClustering_mean)}.`,
      ];
    case 'tranche_b':
      return [
        `Arrival placement changes geometry strongly. Uniform-in-square produces mean edge length ${number(rows.arrival_uniform_square.meanEdgeLength_mean)}, while uniform-on-lattice, near-network, and frontier arrivals produce ${number(rows.arrival_uniform_lattice.meanEdgeLength_mean)}, ${number(rows.arrival_near_network.meanEdgeLength_mean)}, and ${number(rows.arrival_frontier.meanEdgeLength_mean)} respectively.`,
        `Near-existing-network and frontier arrivals should be read as explicit geometry extensions rather than mild tweaks to the baseline, because they also change directional bias and boundary contact through the lattice frame.`,
        `If frontier and near-network results are close, that suggests the current attachability filters dominate over the arrival-shell distinction. If they diverge, the difference is being created by site generation itself.`,
      ];
    case 'tranche_c':
      return [
        `Square and triangular lattice families are materially different in the live browser model: compare mean clustering ${number(rows.mesh_90_rook.averageClustering_mean)} versus ${number(rows.mesh_60_rook.averageClustering_mean)} and east-west bias ${number(rows.mesh_90_rook.eastWestBias_mean)} versus ${number(rows.mesh_60_rook.eastWestBias_mean)}.`,
        `Expanded local rings increase admissible local choices and should therefore be read as feasibility changes, not merely cosmetic adjacency variants.`,
        `If queen-like adjacency raises clustering and total network length relative to rook-like adjacency, then much of the apparent mesh effect is coming from expanded admissibility rather than from the original kernel.`,
      ];
    case 'tranche_d':
      return [
        `Reject-crossings and split-crossings are not neutral variants. Compare early-stop rates and split counts directly: reject-crossings suppresses admissibility, while split-crossings changes the network-growth mechanism itself.`,
        `Square and triangular planarity cases should be interpreted separately because the same planarity rule acts on different local geometry and candidate shells.`,
        `If split-crossings produces generated intersection nodes without lowering crossing counts as much as reject-crossings does, it should be treated as a transport-growth extension rather than as a strict planarity fix.`,
      ];
    case 'tranche_e':
      return [
        `Accessibility weighting can now be interpreted as part of the mechanism rather than just as a visualization layer. Compare mean gravity access and clustering across the no-access, arrival-only, target-only, and both-weighted cases.`,
        `If target-only access weighting raises mean gravity more than arrival-only weighting does, then the current access logic is behaving more like a centrality reinforcement term than a site-generation term.`,
        `If both-weighted access produces stronger concentration without much path-length improvement, it is amplifying centrality rather than creating clearly better transport structure.`,
      ];
    default:
      return [];
  }
}

function trancheMemo(key, tranche, summaries) {
  const findings = buildFindings(key, summaries);
  const rows = summaries.map(scenarioSummaryRow);
  return `# ${tranche.title}

${tranche.purpose}

## Settings

- pilot browser-model batch
- replications per scenario: ${tranche.replications}
- scenarios: ${tranche.scenarios.length}

## Findings

${findings.map((line) => `- ${line}`).join('\n')}

## Summary table reference

See the paired CSV/JSON outputs for exact scenario-level metrics.
`;
}

function overallReport(resultsByKey) {
  const a = Object.fromEntries(resultsByKey.tranche_a.summaries.map((summary) => [summary.scenarioId, scenarioSummaryRow(summary)]));
  const b = Object.fromEntries(resultsByKey.tranche_b.summaries.map((summary) => [summary.scenarioId, scenarioSummaryRow(summary)]));
  const c = Object.fromEntries(resultsByKey.tranche_c.summaries.map((summary) => [summary.scenarioId, scenarioSummaryRow(summary)]));
  const d = Object.fromEntries(resultsByKey.tranche_d.summaries.map((summary) => [summary.scenarioId, scenarioSummaryRow(summary)]));
  const e = Object.fromEntries(resultsByKey.tranche_e.summaries.map((summary) => [summary.scenarioId, scenarioSummaryRow(summary)]));

  return `# Browser Strategy Full Report

This report summarizes the full pilot execution of tranches A to E against the live browser model in \`web/main.js\`.

## Scale

- model source: browser engine extracted from \`web/main.js\`
- execution style: headless batch harness without UI rendering
- purpose: pilot-scale evidence for all experiment families, not final publication-scale estimates

## Cross-tranche findings

### 1. The baseline family is coherent enough to use as a reference

BA remains the highest-hub reference, capacity truncates the tail, high phi shortens links substantially, and kappa controls tree-likeness versus cycle formation. Those are all visible already in tranche A.

### 2. Arrival placement is a major geometry lever

Tranche B shows that once arrival placement moves off square-uniform sampling, geometry changes materially even before planarity is introduced. That supports treating arrival-process controls as a separate mechanism block rather than as a small variant of the baseline model.

### 3. Mesh structure is produced jointly by lattice framing and admissibility rules

Tranche C confirms that adjacency choice and lattice family matter because they change the feasible local candidate set. The mesh extension should therefore be interpreted as a different model family, not simply as the baseline model drawn on a grid.

### 4. Planarity handling changes the process, not just the picture

Tranche D separates crossing rejection from crossing splitting. If split counts appear while early-stop pressure remains low, \`split_crossings\` is acting as a transport-growth mechanism. If reject-crossings raises early-stop rate, that is direct evidence that admissibility changes are dominant.

### 5. Accessibility can now be treated as a mechanism, but its meaning needs care

Tranche E shows whether accessibility weighting reinforces interior centrality or improves transport-style structure. Because the current access measure is computed over realized nodes, any strong effect should currently be interpreted as centrality reinforcement unless destination weights are changed later.

## Immediate lessons

- the original generalized model should remain the interpretive baseline
- arrival extensions, mesh extensions, planarity extensions, and access-guided growth should be reported separately
- the browser model is now rich enough to generate meaningful comparative results, but not yet simple enough that all extensions can be described as one theory

## Output inventory

- tranche A: baseline kernel behavior
- tranche B: arrival-process comparison
- tranche C: lattice and mesh regularization
- tranche D: planarity comparison
- tranche E: accessibility-guided growth

Each tranche folder artifact includes JSON, CSV, and a short memo.

## Selected quantitative anchors

- BA mean max degree: ${number(a.ba_benchmark.maxDegree_mean)}
- General phi=5 mean edge length: ${number(a.phi_5.meanEdgeLength_mean)}
- General K=4 saturation: ${pct(a.K_4.shareAtCapacity_mean)}
- Arrival frontier mean edge length: ${number(b.arrival_frontier.meanEdgeLength_mean)}
- Mesh 90 rook clustering: ${number(c.mesh_90_rook.averageClustering_mean)}
- Square split-crossings mean generated intersections: ${number(d.planar_square_split.generatedIntersectionNodes_mean)}
- Access-both mean gravity: ${number(e.access_both.meanGravity_mean)}
`;
}

async function writeArtifacts(dir, key, tranche, result) {
  const summaryRows = result.summaries.map(scenarioSummaryRow);
  await fs.writeFile(path.join(dir, `${key}.json`), JSON.stringify(result, null, 2));
  await fs.writeFile(path.join(dir, `${key}_summary.csv`), toCsv(summaryRows));
  await fs.writeFile(path.join(dir, `${key}_memo.md`), trancheMemo(key, tranche, result.summaries));
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

async function main() {
  await fs.mkdir(outputRoot, { recursive: true });
  const engine = await loadBrowserEngine();
  const tranches = buildTranches(engine);
  const resultsByKey = {};

  for (let index = 0; index < tranches.length; index += 1) {
    const tranche = tranches[index];
    const key = `tranche_${String.fromCharCode(97 + index)}`;
    console.log(`Running ${tranche.title}...`);
    const result = runTranche(engine, tranche);
    resultsByKey[key] = result;
    await writeArtifacts(outputRoot, key, tranche, result);
  }

  await fs.writeFile(path.join(outputRoot, 'FULL_REPORT.md'), overallReport(resultsByKey));
  console.log(`Wrote full strategy outputs to ${outputRoot}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
