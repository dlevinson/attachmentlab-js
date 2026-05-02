import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

export async function loadBrowserCore(repoRoot = process.cwd()) {
  const sourcePath = path.join(repoRoot, 'src', 'standalone', 'browser-core.js');
  const source = await fs.readFile(sourcePath, 'utf8');
  const context = {
    console,
    Math,
    Date,
    JSON,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Map,
    Set,
    RegExp,
    parseInt,
    parseFloat,
    isNaN,
    Infinity,
    NaN,
  };
  context.globalThis = context;
  const wrapped = `${source}
globalThis.__browserEngine = {
  VERY_LARGE,
  scenarioPresets,
  createDefaultParams,
  sanitizeParams,
  deriveSeed,
  initializeSimulation,
  stepSimulation,
  runSimulation,
  validateSimulationParams,
  computeNetworkMetricsWithContext,
  computeTransportAccessibility,
  fitTailModels,
  runBatchConfig,
};
`;
  vm.runInNewContext(wrapped, context, { filename: 'browser-core-harness.js' });
  return context.__browserEngine;
}
