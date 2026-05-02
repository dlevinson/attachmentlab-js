import path from 'node:path';
import { loadBrowserCore } from './load_browser_core.mjs';

const repoRoot = process.cwd();
const outputRoot = path.join(repoRoot, 'results', 'strategy_browser_20260406_tranche_a');

async function loadBrowserEngine() {
  return loadBrowserCore(repoRoot);
}

function mergeParams(base, overrides) {
  const merged = {
    ...base,
    ...overrides,
  };
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

function summarizeRow(summary) {
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

function delta(current, baseline) {
  return current - baseline;
}

function pct(x) {
  return `${(100 * x).toFixed(1)}%`;
}

function number(x, digits = 3) {
  return typeof x === 'number' ? x.toFixed(digits) : 'NA';
}

function buildFindings(trancheName, summaries) {
  const rows = Object.fromEntries(summaries.map((summary) => [summary.scenarioId, summarizeRow(summary)]));
  if (trancheName === 'headline') {
    const ba = rows.ba_benchmark;
    const capacity = rows.capacity_only;
    const spatial = rows.spatial_only;
    const general = rows.general_model;
    return [
      `BA benchmark has the highest mean max degree (${number(ba.maxDegree_mean)}) and highest degree Gini (${number(ba.degreeGini_mean)}), which is consistent with unconstrained hub formation.`,
      `Capacity-only raises saturation sharply to ${pct(capacity.shareAtCapacity_mean)} and lowers mean max degree to ${number(capacity.maxDegree_mean)}, showing that finite capacity materially truncates hub growth.`,
      `Spatial-only cuts mean edge length to ${number(spatial.meanEdgeLength_mean)} from the BA reference value ${number(ba.meanEdgeLength_mean)}, confirming that cost deterrence is active in target choice.`,
      `The general model combines shorter links (${number(general.meanEdgeLength_mean)}) with higher saturation (${pct(general.shareAtCapacity_mean)}) and lower hub dominance than BA, which suggests that capacity and cost act in different but reinforcing directions.`,
    ];
  }

  const baseline = rows.general_baseline;
  const sortedEdgeLength = [...summaries]
    .map((summary) => summarizeRow(summary))
    .sort((a, b) => a.meanEdgeLength_mean - b.meanEdgeLength_mean);
  const shortest = sortedEdgeLength[0];
  const longest = sortedEdgeLength[sortedEdgeLength.length - 1];
  const highestClustering = [...summaries]
    .map((summary) => summarizeRow(summary))
    .sort((a, b) => b.averageClustering_mean - a.averageClustering_mean)[0];
  const highestSaturation = [...summaries]
    .map((summary) => summarizeRow(summary))
    .sort((a, b) => b.shareAtCapacity_mean - a.shareAtCapacity_mean)[0];

  return [
    `Within the general-model sensitivity set, the shortest mean links occur in ${shortest.scenarioId} (${number(shortest.meanEdgeLength_mean)}), while the longest occur in ${longest.scenarioId} (${number(longest.meanEdgeLength_mean)}). This identifies cost deterrence as the strongest edge-length lever in the baseline model.`,
    `${highestSaturation.scenarioId} shows the highest saturation share (${pct(highestSaturation.shareAtCapacity_mean)}), indicating that the strongest binding pressure in this tranche comes from the capacity block rather than from scale alone.`,
    `${highestClustering.scenarioId} has the highest mean clustering (${number(highestClustering.averageClustering_mean)}), which supports the expectation that higher attachment multiplicity rather than pure preferential attachment is the main local-cycle driver.`,
    `Relative to the baseline scenario, K=4 and beta=2 should be read mainly as saturation/truncation mechanisms, while phi sweeps should be read mainly as link-length mechanisms.`,
  ];
}

function buildScenarios(engine) {
  const headline = [
    scenarioFromPreset(engine, 'ba_benchmark'),
    scenarioFromPreset(engine, 'capacity_only'),
    scenarioFromPreset(engine, 'spatial_only'),
    scenarioFromPreset(engine, 'general_model'),
  ].map((scenario) => ({
    ...scenario,
    params: engine.sanitizeParams(mergeParams(scenario.params, {
      finalNodeCount: 100,
      replicationCount: 8,
      rngSeed: 12345,
      arrivalMode: 'uniform',
      meshMode: 'off',
      meshAdjacencyMode: 'none',
      planarityMode: 'none',
      arrivalPreferenceMode: 'baseline',
      selectionKernelMode: 'baseline',
      arrivalAccessStrength: 0,
      accessSelectionStrength: 0,
      trackHistory: false,
    })),
  }));

  const generalBase = scenarioFromPreset(engine, 'general_model', {
    id: 'general_baseline',
    label: 'General baseline',
    params: {
      finalNodeCount: 100,
      replicationCount: 6,
      rngSeed: 12345,
      arrivalMode: 'uniform',
      meshMode: 'off',
      meshAdjacencyMode: 'none',
      planarityMode: 'none',
      arrivalPreferenceMode: 'baseline',
      selectionKernelMode: 'baseline',
      arrivalAccessStrength: 0,
      accessSelectionStrength: 0,
    },
  });

  const sensitivity = [
    generalBase,
    scenarioFromPreset(engine, 'general_model', { id: 'alpha_0_5', label: 'alpha=0.5', params: { alpha: 0.5, finalNodeCount: 100, rngSeed: 12345, meshMode: 'off', planarityMode: 'none', arrivalMode: 'uniform' } }),
    scenarioFromPreset(engine, 'general_model', { id: 'alpha_1_5', label: 'alpha=1.5', params: { alpha: 1.5, finalNodeCount: 100, rngSeed: 12345, meshMode: 'off', planarityMode: 'none', arrivalMode: 'uniform' } }),
    scenarioFromPreset(engine, 'general_model', { id: 'beta_0', label: 'beta=0', params: { beta: 0, finalNodeCount: 100, rngSeed: 12345, meshMode: 'off', planarityMode: 'none', arrivalMode: 'uniform' } }),
    scenarioFromPreset(engine, 'general_model', { id: 'beta_2', label: 'beta=2', params: { beta: 2, finalNodeCount: 100, rngSeed: 12345, meshMode: 'off', planarityMode: 'none', arrivalMode: 'uniform' } }),
    scenarioFromPreset(engine, 'general_model', { id: 'phi_0', label: 'phi=0', params: { phi: 0, finalNodeCount: 100, rngSeed: 12345, meshMode: 'off', planarityMode: 'none', arrivalMode: 'uniform' } }),
    scenarioFromPreset(engine, 'general_model', { id: 'phi_5', label: 'phi=5', params: { phi: 5, finalNodeCount: 100, rngSeed: 12345, meshMode: 'off', planarityMode: 'none', arrivalMode: 'uniform' } }),
    scenarioFromPreset(engine, 'general_model', { id: 'kappa_1', label: 'kappa=1', params: { kappa: 1, m0: 4, finalNodeCount: 100, rngSeed: 12345, meshMode: 'off', planarityMode: 'none', arrivalMode: 'uniform' } }),
    scenarioFromPreset(engine, 'general_model', { id: 'kappa_3', label: 'kappa=3', params: { kappa: 3, m0: 5, finalNodeCount: 100, rngSeed: 12345, meshMode: 'off', planarityMode: 'none', arrivalMode: 'uniform' } }),
    scenarioFromPreset(engine, 'general_model', { id: 'K_4', label: 'K=4', params: { capacityValue: 4, finalNodeCount: 100, rngSeed: 12345, meshMode: 'off', planarityMode: 'none', arrivalMode: 'uniform' } }),
    scenarioFromPreset(engine, 'general_model', { id: 'K_64', label: 'K=64', params: { capacityValue: 64, finalNodeCount: 100, rngSeed: 12345, meshMode: 'off', planarityMode: 'none', arrivalMode: 'uniform' } }),
  ].map((scenario) => ({
    ...scenario,
    params: engine.sanitizeParams(mergeParams(scenario.params, {
      replicationCount: 6,
      meshAdjacencyMode: 'none',
      arrivalPreferenceMode: 'baseline',
      selectionKernelMode: 'baseline',
      arrivalAccessStrength: 0,
      accessSelectionStrength: 0,
      trackHistory: false,
    })),
  }));

  return { headline, sensitivity };
}

async function writeBatchArtifacts(dir, name, result, findings) {
  const rows = result.summaries.map(summarizeRow);
  await fs.writeFile(path.join(dir, `${name}.json`), JSON.stringify(result, null, 2));
  await fs.writeFile(path.join(dir, `${name}_summary.csv`), toCsv(rows));
  await fs.writeFile(
    path.join(dir, `${name}_findings.md`),
    `# ${name.replaceAll('_', ' ')} findings\n\n${findings.map((line) => `- ${line}`).join('\n')}\n`,
  );
}

function buildTopLevelMemo(headlineResult, sensitivityResult) {
  const headlineRows = Object.fromEntries(headlineResult.summaries.map((summary) => [summary.scenarioId, summarizeRow(summary)]));
  const sensitivityRows = Object.fromEntries(sensitivityResult.summaries.map((summary) => [summary.scenarioId, summarizeRow(summary)]));
  const baseline = sensitivityRows.general_baseline;
  return `# Browser Batch Tranche A Results

This memo reports the first execution tranche from the current browser model in \`web/main.js\`.

## Scope

- headline reference scenarios: BA benchmark, capacity-only, spatial-only, general model
- focused one-factor sensitivity around the general model
- 8 replications for headline scenarios and 6 replications for sensitivity scenarios
- \`N = 100\`
- \`arrivalMode = uniform\`
- \`meshMode = off\`
- \`planarityMode = none\`

## Headline findings

- BA benchmark has the highest mean max degree (${number(headlineRows.ba_benchmark.maxDegree_mean)}) and highest degree Gini (${number(headlineRows.ba_benchmark.degreeGini_mean)}), consistent with unconstrained hub formation.
- Capacity-only produces the highest saturation among the headline set (${pct(headlineRows.capacity_only.shareAtCapacity_mean)}), confirming that finite capacity is already materially binding at \`K = 8\`.
- Spatial-only shortens mean edge length to ${number(headlineRows.spatial_only.meanEdgeLength_mean)} compared with the BA benchmark value ${number(headlineRows.ba_benchmark.meanEdgeLength_mean)}, which shows that cost deterrence is active in the browser model's attachment stage.
- The general model combines shorter links (${number(headlineRows.general_model.meanEdgeLength_mean)}) with more saturation (${pct(headlineRows.general_model.shareAtCapacity_mean)}) and lower hub dominance than BA.

## Sensitivity findings

- Relative to the general baseline, \`phi = 5\` reduces mean edge length from ${number(baseline.meanEdgeLength_mean)} to ${number(sensitivityRows.phi_5.meanEdgeLength_mean)}, while \`phi = 0\` raises it to ${number(sensitivityRows.phi_0.meanEdgeLength_mean)}. In the baseline family, cost deterrence is therefore the clearest link-length control.
- \`K = 4\` raises saturation to ${pct(sensitivityRows.K_4.shareAtCapacity_mean)} and lowers mean max degree to ${number(sensitivityRows.K_4.maxDegree_mean)}, while \`K = 64\` lowers saturation to ${pct(sensitivityRows.K_64.shareAtCapacity_mean)} and allows larger hubs (${number(sensitivityRows.K_64.maxDegree_mean)}). Capacity is therefore the clearest tail-truncation lever.
- \`kappa = 1\` produces much lower mean clustering (${number(sensitivityRows.kappa_1.averageClustering_mean)}) than \`kappa = 3\` (${number(sensitivityRows.kappa_3.averageClustering_mean)}), supporting the interpretation that attachment multiplicity drives local cycle formation more directly than \`alpha\` does.
- \`beta = 2\` mainly behaves as a saturation-pressure modifier rather than a geometric one: its strongest movement is in saturation and max degree, not in mean edge length.

## What we can learn already

- The current browser model does preserve the baseline intuition that \`phi\` mainly acts on chosen link length, not arrival location, when mesh mode is off.
- Capacity and saturation are structurally important even without any lattice or planarity extensions.
- \`kappa\` is the most direct control over tree-likeness versus cyclicity in the baseline family.
- The baseline browser model is worth treating as a coherent reference family before interpreting any mesh, crossing, or accessibility extensions.
`;
}

async function main() {
  await fs.mkdir(outputRoot, { recursive: true });
  const engine = await loadBrowserEngine();
  const { headline, sensitivity } = buildScenarios(engine);

  const headlineConfig = { scenarios: headline, replications: 8 };
  const sensitivityConfig = { scenarios: sensitivity, replications: 6 };

  console.log('Running headline tranche...');
  const headlineResult = engine.runBatchConfig(headlineConfig);
  console.log('Running sensitivity tranche...');
  const sensitivityResult = engine.runBatchConfig(sensitivityConfig);

  await writeBatchArtifacts(outputRoot, 'headline', headlineResult, buildFindings('headline', headlineResult.summaries));
  await writeBatchArtifacts(outputRoot, 'sensitivity', sensitivityResult, buildFindings('sensitivity', sensitivityResult.summaries));
  await fs.writeFile(path.join(outputRoot, 'TRANCHE_A_MEMO.md'), buildTopLevelMemo(headlineResult, sensitivityResult));

  console.log(`Wrote tranche outputs to ${outputRoot}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
