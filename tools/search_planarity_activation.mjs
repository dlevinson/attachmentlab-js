import path from 'node:path';
import { loadBrowserCore } from './load_browser_core.mjs';

const repoRoot = process.cwd();
const outputPath = path.join(repoRoot, 'results', 'strategy_browser_20260406_refined', 'planarity_activation_search.csv');

async function loadBrowserEngine() {
  return loadBrowserCore(repoRoot);
}

function mergeParams(base, overrides) {
  return { ...base, ...overrides };
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
  const headers = Object.keys(rows[0] || {});
  return [headers.join(','), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))].join('\n');
}

function baseParams(engine, overrides = {}) {
  return engine.sanitizeParams(mergeParams(engine.createDefaultParams(), {
    finalNodeCount: 70,
    rngSeed: 12345,
    trackHistory: false,
    alpha: 1,
    beta: 0,
    phi: 0,
    kappa: 3,
    m0: 6,
    capacityValue: 64,
    seedGraphType: 'complete',
    arrivalMode: 'uniform',
    planarityMode: 'split_crossings',
    meshMode: 'off',
    meshAngleSet: '90',
    meshAdjacencyMode: 'none',
    meshNearestCount: 12,
    meshSpacingFactor: 0,
    arrivalPreferenceMode: 'baseline',
    selectionKernelMode: 'baseline',
  }, overrides));
}

function* candidates(engine) {
  const meshModes = ['off', 'grid_bias'];
  const arrivalModesByMesh = {
    off: ['uniform'],
    grid_bias: ['uniform_lattice', 'network', 'frontier'],
  };
  const seedGraphTypesByMesh = {
    off: ['complete', 'ring'],
    grid_bias: ['complete', 'ring', 'cross', 'grid'],
  };
  const angleSets = ['90', '60'];
  const adjacencyModes = ['rook', 'queen'];
  const kappas = [3, 4];
  const phis = [0, 0.5];
  const nearestCounts = [6, 12, 18];
  const spacingFactors = [0, 0.1];

  for (const meshMode of meshModes) {
    for (const arrivalMode of arrivalModesByMesh[meshMode]) {
      for (const seedGraphType of seedGraphTypesByMesh[meshMode]) {
        for (const kappa of kappas) {
          for (const phi of phis) {
            if (meshMode === 'off') {
              yield {
                label: `${meshMode}|${arrivalMode}|${seedGraphType}|k${kappa}|phi${phi}`,
                params: baseParams(engine, { meshMode, arrivalMode, seedGraphType, kappa, phi }),
              };
              continue;
            }
            for (const meshAngleSet of angleSets) {
              for (const meshAdjacencyMode of adjacencyModes) {
                for (const meshNearestCount of nearestCounts) {
                  for (const meshSpacingFactor of spacingFactors) {
                    yield {
                      label: `${meshMode}|${arrivalMode}|${seedGraphType}|a${meshAngleSet}|${meshAdjacencyMode}|k${kappa}|phi${phi}|q${meshNearestCount}|s${meshSpacingFactor}`,
                      params: baseParams(engine, {
                        meshMode,
                        arrivalMode,
                        seedGraphType,
                        kappa,
                        phi,
                        meshAngleSet,
                        meshAdjacencyMode,
                        meshNearestCount,
                        meshSpacingFactor,
                      }),
                    };
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

async function main() {
  const engine = await loadBrowserEngine();
  const rows = [];
  for (const candidate of candidates(engine)) {
    const run = engine.runSimulation(candidate.params);
    const metrics = engine.computeNetworkMetricsWithContext(
      run.nodes,
      run.edges,
      run.params.degreeThreshold,
      run.latticeMetadata,
      run.splitEvents ?? 0,
    );
    rows.push({
      label: candidate.label,
      finalNodeCount: run.nodes.length,
      status: run.status,
      terminationReason: run.terminationReason || 'completed',
      truncationEvents: run.truncationEvents,
      crossingCount: metrics.crossingCount,
      generatedIntersectionNodes: metrics.generatedIntersectionNodes,
      splitEvents: metrics.splitEvents,
      meanEdgeLength: metrics.meanEdgeLength,
      totalNetworkLength: metrics.totalNetworkLength,
    });
  }
  rows.sort((a, b) => (
    (b.generatedIntersectionNodes - a.generatedIntersectionNodes)
    || (b.splitEvents - a.splitEvents)
    || (b.crossingCount - a.crossingCount)
  ));
  await fs.writeFile(outputPath, toCsv(rows));
  console.log(`Wrote ${rows.length} planarity search rows to ${outputPath}`);
  console.log(rows.slice(0, 15));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
