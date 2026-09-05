import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { runSimpleBatch, toCsv, writeResultBundle } from '../src/analysis/benchmarkHarness';
import { summarizeRows, figureRows } from '../src/analysis/beyondPaperFocused';
import type { BatchResult } from '../src/types/model';

// Focused migration of saved transport results affected by the former signed
// seed ceiling. Low unsigned seeds retain their saved simulations. Checkpoints
// are keyed by configuration and all source bytes, making restart safe.
const root = process.cwd();
const outputRoot = path.join(root, 'results', 'transport_extensions');
const source = JSON.parse(await fs.readFile(path.join(outputRoot, 'focused_results.json'), 'utf8')) as Record<string, BatchResult>;
const hash = createHash('sha256');
async function hashSources(directory: string) {
  for (const entry of (await fs.readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const name = path.join(directory, entry.name);
    if (entry.isDirectory()) await hashSources(name);
    else { hash.update(path.relative(root, name)); hash.update(await fs.readFile(name)); }
  }
}
await hashSources(path.join(root, 'src'));
const sourceHash = hash.digest('hex');
const checkpointRoot = path.join(root, '.cache', 'seed-correction');
await fs.mkdir(checkpointRoot, { recursive: true });
for (const [block, batch] of Object.entries(source)) {
  const runs: BatchResult['runs'] = [];
  const summaries: BatchResult['summaries'] = [];
  for (const scenario of batch.config.scenarios) {
    const oldRuns = batch.runs.filter((run) => run.scenarioId === scenario.id);
    const affected = oldRuns.some((run) => run.seed > 2147483647 && run.effectiveSeed !== run.seed);
    if (!affected) {
      console.log(`[seed-correction] preserve ${scenario.id}: ${oldRuns.length} valid seeds`);
      runs.push(...oldRuns.map((run) => ({ ...run, effectiveSeed: run.seed })));
      summaries.push(batch.summaries.find((summary) => summary.scenarioId === scenario.id)!);
      continue;
    }
    const config = { scenarios: [scenario], replications: batch.config.replications,
      accessibilityEvaluation: batch.config.accessibilityEvaluation };
    const key = createHash('sha256').update(sourceHash + JSON.stringify(config)).digest('hex');
    const checkpoint = path.join(checkpointRoot, `${scenario.id}-${key}.json`);
    let result: BatchResult;
    try { result = JSON.parse(await fs.readFile(checkpoint, 'utf8')); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      result = runSimpleBatch({ ...config,
        onProgress: ({ scenarioId, replication, replicationCount }) =>
          console.log(`[seed-correction] ${scenarioId} ${replication}/${replicationCount}`),
      });
      await fs.writeFile(`${checkpoint}.tmp`, JSON.stringify(result));
      await fs.rename(`${checkpoint}.tmp`, checkpoint);
    }
    if (result.runs.length !== batch.config.replications || result.runs.some((run) => run.seed !== run.effectiveSeed)
      || new Set(result.runs.map((run) => run.effectiveSeed)).size !== result.runs.length) {
      throw new Error(`Invalid seed-correction checkpoint for ${scenario.id}`);
    }
    runs.push(...result.runs);
    summaries.push(...result.summaries);
  }
  source[block] = { ...batch, runs, summaries };
}
const planarity = summarizeRows('planarity_core', source.planarityCore.summaries);
const access = summarizeRows('access_interaction', source.accessInteraction.summaries);
await writeResultBundle(outputRoot, {
  'focused_results.json': JSON.stringify(source, null, 2),
  'focused_summary.csv': toCsv([...planarity, ...access]),
  'planarity_core_figure.csv': toCsv(figureRows('planarity_core', planarity,
    ['averageClustering', 'meanEdgeLength', 'crossingCandidatesAdmitted', 'splitEvents', 'generatedIntersectionNodes', 'cyclomaticNumber'])),
  'access_interaction_figure.csv': toCsv(figureRows('access_interaction', access,
    ['meanGravityAccess', 'meanCumulativeAccess', 'crossingCandidatesAdmitted', 'splitEvents', 'averageClustering', 'meanEdgeLength'])),
});
console.log('[seed-correction] complete');
