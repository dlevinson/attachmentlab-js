import type { BatchConfig, BatchResult, BatchRunRecord, BatchScenarioSummary, MetricBundle } from '../types/model';
import { deriveSeed } from '../model/random';
import { runSimulation } from '../model/simulator';
import { computeNetworkMetrics } from '../metrics/networkMetrics';
import { fitTailModels } from '../metrics/tailFits';
import { getBrowserParityEngine } from '../model/browserParity';

function summarizeMetric(values: number[]) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const q = (ratio: number) => sorted[Math.floor((sorted.length - 1) * ratio)];
  return {
    mean,
    sd: Math.sqrt(variance),
    q05: q(0.05),
    q50: q(0.5),
    q95: q(0.95),
  };
}

function summarizeScenario(runs: BatchRunRecord[]): BatchScenarioSummary {
  const metricKeys = Object.keys(runs[0].metrics) as Array<keyof MetricBundle>;
  const metrics = Object.fromEntries(
    metricKeys
      .filter((key) => typeof runs[0].metrics[key] === 'number')
      .map((key) => [key, summarizeMetric(runs.map((run) => run.metrics[key] as number))]),
  );

  const preferredTailModelCounts: Record<string, number> = {};
  runs.forEach((run) => {
    preferredTailModelCounts[run.tail.preferredModel] = (preferredTailModelCounts[run.tail.preferredModel] ?? 0) + 1;
  });

  return {
    scenarioId: runs[0].scenarioId,
    scenarioLabel: runs[0].scenarioLabel,
    replications: runs.length,
    earlyStopRate: runs.filter((run) => run.earlyStopped).length / runs.length,
    truncationRate: runs.filter((run) => run.truncationEvents > 0).length / runs.length,
    metrics,
    preferredTailModelCounts,
  };
}

self.onmessage = (event: MessageEvent<{ config: BatchConfig }>) => {
  const { config } = event.data;
  const engine = getBrowserParityEngine();
  const runs: BatchRunRecord[] = [];
  const total = config.scenarios.length * config.replications;
  let completed = 0;

  config.scenarios.forEach((scenario) => {
    for (let replication = 0; replication < config.replications; replication += 1) {
      const seed = deriveSeed(scenario.params.rngSeed, scenario.id, replication);
      const state = runSimulation({ ...scenario.params, rngSeed: seed });
      const metrics = engine.computeNetworkMetricsWithContext(
        state.nodes,
        state.edges,
        state.params.degreeThreshold,
        state.latticeMetadata,
        state.splitEvents ?? 0,
        {
          crossingCandidatesEncountered: state.crossingCandidatesEncountered ?? 0,
          crossingCandidatesAdmitted: state.crossingCandidatesAdmitted ?? 0,
        },
      );
      const tail = fitTailModels(state.nodes.map((node) => node.degree));
      runs.push({
        scenarioId: scenario.id,
        scenarioLabel: scenario.label,
        replication,
        seed,
        metrics,
        earlyStopped: state.status === 'early_stopped',
        terminationReason: state.terminationReason,
        truncationEvents: state.truncationEvents,
        totalMissingLinks: state.totalMissingLinks,
        tail,
      });
      completed += 1;
      self.postMessage({ type: 'progress', progress: completed / total });
    }
  });

  const summaries = config.scenarios.map((scenario) =>
    summarizeScenario(runs.filter((run) => run.scenarioId === scenario.id)),
  );

  const result: BatchResult = {
    config,
    runs,
    summaries,
  };

  self.postMessage({ type: 'result', result });
};
