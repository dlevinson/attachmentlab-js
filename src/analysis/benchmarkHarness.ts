import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import type { BatchResult, BatchRunRecord, BatchScenarioSummary, MetricBundle, SimulationParams, TailFitSummary } from '../types/model';
import { deriveSeed } from '../model/random';
import { runSimulation, sanitizeSimulationParams, createDefaultParams } from '../model/simulator';
import { getBrowserParityEngine } from '../model/browserParity';
import { fitTailModels } from '../metrics/tailFits';

export interface SimpleScenario {
  id: string;
  label: string;
  params: Partial<SimulationParams> | SimulationParams;
}

export interface SimpleBatchConfig {
  scenarios: SimpleScenario[];
  replications: number;
  onProgress?: (event: {
    scenarioId: string;
    scenarioLabel: string;
    scenarioIndex: number;
    scenarioCount: number;
    replication: number;
    replicationCount: number;
  }) => void;
}

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

export function mergeParams(base: Partial<SimulationParams> | SimulationParams, overrides: Partial<SimulationParams>) {
  const merged = { ...base, ...overrides };
  const baseCapacityParams = (base as SimulationParams).capacityParams ?? {};
  const overrideCapacityParams = overrides.capacityParams ?? {};
  if (Object.keys(baseCapacityParams).length || Object.keys(overrideCapacityParams).length) {
    merged.capacityParams = {
      ...baseCapacityParams,
      ...overrideCapacityParams,
    };
  }
  return merged;
}

export function scenarioFromPreset(
  presetId: string,
  overrides: { id?: string; label?: string; params?: Partial<SimulationParams> } = {},
): SimpleScenario {
  const engine = getBrowserParityEngine();
  const preset = engine.scenarioPresets.find((entry) => entry.id === presetId);
  if (!preset) {
    throw new Error(`Unknown preset: ${presetId}`);
  }
  const params = sanitizeSimulationParams(mergeParams(createDefaultParams(), preset.params));
  return {
    id: overrides.id || preset.id,
    label: overrides.label || preset.label,
    params: sanitizeSimulationParams(mergeParams(params, overrides.params || {})),
  };
}

export function runSimpleBatch(config: SimpleBatchConfig): BatchResult {
  const engine = getBrowserParityEngine();
  const runs: BatchRunRecord[] = [];

  config.scenarios.forEach((scenario, scenarioIndex) => {
    const scenarioParams = sanitizeSimulationParams(scenario.params);
    for (let replication = 0; replication < config.replications; replication += 1) {
      config.onProgress?.({
        scenarioId: scenario.id,
        scenarioLabel: scenario.label,
        scenarioIndex: scenarioIndex + 1,
        scenarioCount: config.scenarios.length,
        replication: replication + 1,
        replicationCount: config.replications,
      });
      const seed = deriveSeed(scenarioParams.rngSeed, scenario.id, replication);
      const state = runSimulation({ ...scenarioParams, rngSeed: seed });
      const transportAccessibility = engine.computeTransportAccessibility(
        state.nodes,
        state.edges,
        state.params,
      );
      const metrics = {
        ...engine.computeNetworkMetricsWithContext(
          state.nodes,
          state.edges,
          state.params.degreeThreshold,
          state.latticeMetadata,
          state.splitEvents ?? 0,
          {
            crossingCandidatesEncountered: state.crossingCandidatesEncountered ?? 0,
            crossingCandidatesAdmitted: state.crossingCandidatesAdmitted ?? 0,
          },
        ),
        meanCumulativeAccess: transportAccessibility?.available ? transportAccessibility.meanCumulative : null,
        meanGravityAccess: transportAccessibility?.available ? transportAccessibility.meanGravity : null,
      };
      const tail: TailFitSummary = fitTailModels(state.nodes.map((node) => node.degree));
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
    }
  });

  return {
    config: {
      scenarios: config.scenarios.map((scenario) => ({
        ...scenario,
        params: sanitizeSimulationParams(scenario.params),
      })),
      replications: config.replications,
    },
    runs,
    summaries: config.scenarios.map((scenario) => summarizeScenario(runs.filter((run) => run.scenarioId === scenario.id))),
  };
}

export function metricMean(summary: BatchScenarioSummary | undefined, key: keyof MetricBundle) {
  return summary?.metrics?.[key]?.mean ?? null;
}

export function preferredTail(summary: BatchScenarioSummary | undefined) {
  const entries = Object.entries(summary?.preferredTailModelCounts ?? {});
  if (!entries.length) {
    return null;
  }
  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

export function csvEscape(value: unknown) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

export function toCsv(rows: Array<Record<string, unknown>>) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  return [headers.join(','), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(','))].join('\n');
}

export async function writeResultBundle(outputRoot: string, files: Record<string, string>) {
  await fs.mkdir(outputRoot, { recursive: true });
  await Promise.all(
    Object.entries(files).map(([name, content]) => fs.writeFile(path.join(outputRoot, name), content)),
  );
}

export function writeResultBundleSync(outputRoot: string, files: Record<string, string>) {
  fsSync.mkdirSync(outputRoot, { recursive: true });
  Object.entries(files).forEach(([name, content]) => {
    fsSync.writeFileSync(path.join(outputRoot, name), content);
  });
}
