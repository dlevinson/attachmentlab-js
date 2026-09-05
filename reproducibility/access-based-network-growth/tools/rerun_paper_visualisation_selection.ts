import fs from 'node:fs/promises';
import path from 'node:path';
import { runSimpleBatch, toCsv, type SimpleBatchConfig } from '../src/analysis/benchmarkHarness';

// Rerun only the four six-realisation Figure 2 pools, from their saved design.
// The separate Python tables and TypeScript exploratory suites are untouched.
const outputRoot = path.join(process.cwd(), 'results', 'baseline_visualisation');
const source = JSON.parse(await fs.readFile(path.join(outputRoot, 'headline.json'), 'utf8'));
const result = runSimpleBatch({
  ...source.config as SimpleBatchConfig,
  onProgress: ({ scenarioId, replication, replicationCount }) =>
    console.log(`[visualisation] ${scenarioId} ${replication}/${replicationCount}`),
});
await fs.writeFile(path.join(outputRoot, 'headline.json'), JSON.stringify(result, null, 2));
const rows = result.summaries.map((summary) => ({
  scenarioId: summary.scenarioId,
  scenarioLabel: summary.scenarioLabel,
  replications: summary.replications,
  ...Object.fromEntries(Object.entries(summary.metrics).flatMap(([key, value]) =>
    [[`${key}_mean`, value.mean], [`${key}_sd`, value.sd]])),
}));
await fs.writeFile(path.join(outputRoot, 'headline_summary.csv'), toCsv(rows));
