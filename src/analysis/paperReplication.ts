import path from 'node:path';
import fs from 'node:fs/promises';
import {
  mergeParams,
  metricMean,
  preferredTail,
  scenarioFromPreset,
  toCsv,
  writeResultBundle,
  writeResultBundleSync,
} from './benchmarkHarness';
import { createDefaultParams, sanitizeSimulationParams } from '../model/simulator';
import { deriveSeed } from '../model/random';
import { runSimulation } from '../model/simulator';
import { getBrowserParityEngine } from '../model/browserParity';
import { fitTailModels } from '../metrics/tailFits';
import type { BatchResult, BatchRunRecord, BatchScenarioSummary } from '../types/model';

const VERY_LARGE = 'very_large';

export const paperTargets = {
  headline: {
    ba_benchmark: { maxDegree: 82.31, degreeGini: 0.388, averageClustering: 0.028, meanEdgeLength: 0.521, preferredTail: 'power_law' },
    capacity_only: { maxDegree: 16.0, degreeGini: 0.335, averageClustering: 0.007, meanEdgeLength: 0.521, preferredTail: 'exponential' },
    spatial_only: { maxDegree: 85.5, degreeGini: 0.389, averageClustering: 0.035, meanEdgeLength: 0.351, preferredTail: 'power_law' },
    general_model: { maxDegree: 16.0, degreeGini: 0.336, averageClustering: 0.009, meanEdgeLength: 0.349, preferredTail: 'exponential' },
  },
  sensitivity: {
    phi_0: { meanEdgeLength: 0.526, averageClustering: 0.0075 },
    phi_2: { meanEdgeLength: 0.157, averageClustering: 0.0721 },
    kappa_1: { cyclomaticNumber: 6, averagePathLengthLargestComponent: 8.19, averageClustering: 0.00035 },
    kappa_4: { cyclomaticNumber: 2991, averagePathLengthLargestComponent: 3.58, averageClustering: 0.0151 },
  },
  heterogeneous: {
    constant_capacity: { maxDegree: 16.0, degreeGini: 0.337, shareAtCapacity: 0.0039, averageClustering: 0.0096 },
    uniform_capacity: { maxDegree: 22.94, degreeGini: 0.354, shareAtCapacity: 0.0019, averageClustering: 0.0121 },
    lognormal_capacity: { maxDegree: 48.69, degreeGini: 0.382, shareAtCapacity: 0.0019, averageClustering: 0.0197 },
  },
} as const;

export interface PaperReplicationRunOptions {
  outputRoot?: string;
  profile?: 'test' | 'smoke' | 'medium' | 'full';
  silent?: boolean;
  resume?: boolean;
  heartbeatMs?: number;
}

interface PaperRow {
  scenarioId: string;
  scenarioLabel: string;
  maxDegree?: number | null;
  degreeGini?: number | null;
  averageClustering?: number | null;
  meanEdgeLength?: number | null;
  preferredTail?: string | null;
  earlyStopRate?: number;
  cyclomaticNumber?: number | null;
  averagePathLengthLargestComponent?: number | null;
  shareAtCapacity?: number | null;
}

function relDiff(a: number | null, b: number | null) {
  if (a === null || b === null || !Number.isFinite(a) || !Number.isFinite(b) || b === 0) {
    return null;
  }
  return Math.abs((a - b) / b);
}

function profileSettings(profile: 'test' | 'smoke' | 'medium' | 'full') {
  if (profile === 'test') {
    return { n: 120, headlineReplications: 1, sensitivityReplications: 1, heterogeneousReplications: 1 };
  }
  if (profile === 'smoke') {
    return { n: 200, headlineReplications: 2, sensitivityReplications: 2, heterogeneousReplications: 2 };
  }
  if (profile === 'medium') {
    return { n: 500, headlineReplications: 6, sensitivityReplications: 4, heterogeneousReplications: 6 };
  }
  return { n: 1000, headlineReplications: 16, sensitivityReplications: 12, heterogeneousReplications: 16 };
}

function summarizeRuns(runs: BatchRunRecord[], scenarioId: string, scenarioLabel: string): BatchScenarioSummary {
  const metricKeys = Object.keys(runs[0].metrics) as Array<keyof BatchRunRecord['metrics']>;
  const metrics = Object.fromEntries(
    metricKeys
      .filter((key) => typeof runs[0].metrics[key] === 'number')
      .map((key) => {
        const values = runs.map((run) => run.metrics[key] as number);
        const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
        const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
        const sorted = [...values].sort((a, b) => a - b);
        const q = (ratio: number) => sorted[Math.floor((sorted.length - 1) * ratio)];
        return [key, { mean, sd: Math.sqrt(variance), q05: q(0.05), q50: q(0.5), q95: q(0.95) }];
      }),
  );
  const preferredTailModelCounts = runs.reduce<Record<string, number>>((counts, run) => {
    counts[run.tail.preferredModel] = (counts[run.tail.preferredModel] ?? 0) + 1;
    return counts;
  }, {});
  return {
    scenarioId,
    scenarioLabel,
    replications: runs.length,
    earlyStopRate: runs.filter((run) => run.earlyStopped).length / runs.length,
    truncationRate: runs.filter((run) => run.truncationEvents > 0).length / runs.length,
    metrics,
    preferredTailModelCounts,
  };
}

export async function runPaperReplicationSuite(options: PaperReplicationRunOptions = {}) {
  const repoRoot = process.cwd();
  const profile = options.profile ?? 'full';
  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const outputRoot = options.outputRoot ?? path.join(repoRoot, 'results', `paper_replication_${stamp}_${profile}`);
  const checkpointPath = path.join(outputRoot, 'checkpoint_runs.json');
  const statusPath = path.join(outputRoot, 'run_status.json');
  const heartbeatMs = options.heartbeatMs ?? 30_000;
  const settings = profileSettings(profile);
  const log = options.silent ? (..._args: unknown[]) => {} : console.log;
  const engine = getBrowserParityEngine();
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
          `[paper] ${event.scenarioIndex}/${event.scenarioCount} ${event.scenarioId} replication ${event.replication}/${event.replicationCount}`,
        );
      };
  const defaultParams = createDefaultParams();
  const strictBaseline = {
    arrivalMode: 'uniform' as const,
    meshMode: 'off' as const,
    planarityMode: 'none' as const,
    arrivalPreferenceMode: 'baseline' as const,
    selectionKernelMode: 'baseline' as const,
    arrivalAccessStrength: 0,
    accessSelectionStrength: 0,
    trackHistory: false,
  };
  const headlineScenarios = [
    scenarioFromPreset('ba_benchmark', { params: { ...strictBaseline, finalNodeCount: settings.n, m0: 5, seedGraphType: 'complete' } }),
    scenarioFromPreset('capacity_only', { params: { ...strictBaseline, finalNodeCount: settings.n, m0: 5, seedGraphType: 'complete', capacityValue: 16 } }),
    scenarioFromPreset('spatial_only', { params: { ...strictBaseline, finalNodeCount: settings.n, m0: 5, seedGraphType: 'complete' } }),
    scenarioFromPreset('general_model', { params: { ...strictBaseline, finalNodeCount: settings.n, m0: 5, seedGraphType: 'complete', capacityValue: 16 } }),
  ];

  const sensitivityBaseline = sanitizeSimulationParams(
    mergeParams(defaultParams, {
      ...strictBaseline,
      finalNodeCount: settings.n,
      m0: 5,
      seedGraphType: 'complete',
      alpha: 1,
      beta: 1,
      phi: 1,
      kappa: 2,
      capacityMode: 'homogeneous',
      capacityValue: 16,
    }),
  );

  const sensitivityScenarios = [
    { id: 'phi_0', label: 'Phi 0', params: sanitizeSimulationParams(mergeParams(sensitivityBaseline, { phi: 0, beta: 0, capacityValue: VERY_LARGE })) },
    { id: 'phi_0_5', label: 'Phi 0.5', params: sanitizeSimulationParams(mergeParams(sensitivityBaseline, { phi: 0.5 })) },
    { id: 'phi_1', label: 'Phi 1', params: sanitizeSimulationParams(mergeParams(sensitivityBaseline, { phi: 1 })) },
    { id: 'phi_2', label: 'Phi 2', params: sanitizeSimulationParams(mergeParams(sensitivityBaseline, { phi: 2 })) },
    { id: 'kappa_1', label: 'Kappa 1', params: sanitizeSimulationParams(mergeParams(sensitivityBaseline, { kappa: 1, m0: 5 })) },
    { id: 'kappa_2', label: 'Kappa 2', params: sanitizeSimulationParams(mergeParams(sensitivityBaseline, { kappa: 2, m0: 5 })) },
    { id: 'kappa_4', label: 'Kappa 4', params: sanitizeSimulationParams(mergeParams(sensitivityBaseline, { kappa: 4, m0: 5 })) },
  ];
  const heterogeneousScenarios = [
    { id: 'constant_capacity', label: 'Constant K = 16', params: sanitizeSimulationParams(mergeParams(sensitivityBaseline, { capacityMode: 'homogeneous', capacityValue: 16, capacityParams: {} })) },
    { id: 'uniform_capacity', label: 'Uniform U[8,24]', params: sanitizeSimulationParams(mergeParams(sensitivityBaseline, { capacityMode: 'uniform', capacityValue: 16, capacityParams: { low: 8, high: 24 } })) },
    { id: 'lognormal_capacity', label: 'Lognormal mean ≈ 16', params: sanitizeSimulationParams(mergeParams(sensitivityBaseline, { capacityMode: 'lognormal', capacityValue: 16, capacityParams: { mean: 2.647588722239781, sigma: 0.5 } })) },
  ];

  const headlineRuns: BatchRunRecord[] = [];
  const sensitivityRuns: BatchRunRecord[] = [];
  const heterogeneousRuns: BatchRunRecord[] = [];
  const status = {
    program: 'paper_replication',
    profile,
    outputRoot,
    pid: process.pid,
    state: 'running',
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastHeartbeatAt: new Date().toISOString(),
    completedAt: null as string | null,
    failedAt: null as string | null,
    errorMessage: null as string | null,
    currentGroup: 'headline',
    currentScenarioId: null as string | null,
    currentScenarioLabel: null as string | null,
    currentReplication: 0,
    currentReplicationCount: 0,
    completedGroups: [] as string[],
    completedScenarioIds: [] as string[],
  };

  function currentRowsFromRuns(runs: BatchRunRecord[], fields: 'headline' | 'sensitivity' | 'heterogeneous'): PaperRow[] {
    const byScenario = new Map<string, BatchRunRecord[]>();
    runs.forEach((run) => {
      const bucket = byScenario.get(run.scenarioId) ?? [];
      bucket.push(run);
      byScenario.set(run.scenarioId, bucket);
    });
    return [...byScenario.entries()].map(([scenarioId, scenarioRuns]) => {
      const summary = {
        scenarioId,
        scenarioLabel: scenarioRuns[0].scenarioLabel,
        replications: scenarioRuns.length,
        earlyStopRate: scenarioRuns.filter((run) => run.earlyStopped).length / scenarioRuns.length,
        truncationRate: scenarioRuns.filter((run) => run.truncationEvents > 0).length / scenarioRuns.length,
        metrics: Object.fromEntries(
          Object.keys(scenarioRuns[0].metrics)
            .filter((key) => typeof scenarioRuns[0].metrics[key as keyof typeof scenarioRuns[0]['metrics']] === 'number')
            .map((key) => {
              const values = scenarioRuns.map((run) => run.metrics[key as keyof typeof run.metrics] as number);
              const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
              return [key, { mean }];
            }),
        ),
        preferredTailModelCounts: scenarioRuns.reduce<Record<string, number>>((counts, run) => {
          counts[run.tail.preferredModel] = (counts[run.tail.preferredModel] ?? 0) + 1;
          return counts;
        }, {}),
      };
      if (fields === 'headline') {
        return {
          scenarioId,
          scenarioLabel: summary.scenarioLabel,
          maxDegree: metricMean(summary as never, 'maxDegree'),
          degreeGini: metricMean(summary as never, 'degreeGini'),
          averageClustering: metricMean(summary as never, 'averageClustering'),
          meanEdgeLength: metricMean(summary as never, 'meanEdgeLength'),
          preferredTail: preferredTail(summary as never),
          earlyStopRate: summary.earlyStopRate,
        };
      }
      if (fields === 'sensitivity') {
        return {
          scenarioId,
          scenarioLabel: summary.scenarioLabel,
          meanEdgeLength: metricMean(summary as never, 'meanEdgeLength'),
          averageClustering: metricMean(summary as never, 'averageClustering'),
          cyclomaticNumber: metricMean(summary as never, 'cyclomaticNumber'),
          averagePathLengthLargestComponent: metricMean(summary as never, 'averagePathLengthLargestComponent'),
          earlyStopRate: summary.earlyStopRate,
        };
      }
      return {
        scenarioId,
        scenarioLabel: summary.scenarioLabel,
        maxDegree: metricMean(summary as never, 'maxDegree'),
        degreeGini: metricMean(summary as never, 'degreeGini'),
        shareAtCapacity: metricMean(summary as never, 'shareAtCapacity'),
        averageClustering: metricMean(summary as never, 'averageClustering'),
        earlyStopRate: summary.earlyStopRate,
      };
    });
  }

  async function maybeLoadResume() {
    if (!options.resume) {
      return;
    }
    try {
      const [checkpointText, priorStatusText] = await Promise.all([
        fs.readFile(checkpointPath, 'utf8'),
        fs.readFile(statusPath, 'utf8'),
      ]);
      const checkpoint = JSON.parse(checkpointText) as {
        headlineRuns?: BatchRunRecord[];
        sensitivityRuns?: BatchRunRecord[];
        heterogeneousRuns?: BatchRunRecord[];
      };
      const priorStatus = JSON.parse(priorStatusText) as typeof status;
      headlineRuns.push(...(checkpoint.headlineRuns ?? []));
      sensitivityRuns.push(...(checkpoint.sensitivityRuns ?? []));
      heterogeneousRuns.push(...(checkpoint.heterogeneousRuns ?? []));
      status.startedAt = priorStatus.startedAt ?? status.startedAt;
      status.completedGroups = priorStatus.completedGroups ?? [];
      status.completedScenarioIds = priorStatus.completedScenarioIds ?? [];
      status.currentGroup = priorStatus.currentGroup ?? status.currentGroup;
      status.currentScenarioId = priorStatus.currentScenarioId ?? status.currentScenarioId;
      status.currentScenarioLabel = priorStatus.currentScenarioLabel ?? status.currentScenarioLabel;
      status.currentReplication = priorStatus.currentReplication ?? 0;
      status.currentReplicationCount = priorStatus.currentReplicationCount ?? 0;
      status.pid = process.pid;
      status.state = 'running';
      status.updatedAt = new Date().toISOString();
      status.lastHeartbeatAt = new Date().toISOString();
      log(`[paper] resuming from ${outputRoot}`);
    } catch {
      log(`[paper] resume requested but no usable checkpoint found; starting fresh`);
    }
  }

  function writeStatusOnly() {
    status.updatedAt = new Date().toISOString();
    status.lastHeartbeatAt = status.updatedAt;
    writeResultBundleSync(outputRoot, {
      'run_status.json': JSON.stringify(status, null, 2),
    });
  }

  function writeProgress() {
    status.updatedAt = new Date().toISOString();
    status.lastHeartbeatAt = status.updatedAt;
    writeResultBundleSync(outputRoot, {
      'run_status.json': JSON.stringify(status, null, 2),
      'partial_headline_summary.csv': toCsv(currentRowsFromRuns(headlineRuns, 'headline') as Array<Record<string, unknown>>),
      'partial_sensitivity_summary.csv': toCsv(currentRowsFromRuns(sensitivityRuns, 'sensitivity') as Array<Record<string, unknown>>),
      'partial_heterogeneous_summary.csv': toCsv(currentRowsFromRuns(heterogeneousRuns, 'heterogeneous') as Array<Record<string, unknown>>),
      'checkpoint_runs.json': JSON.stringify(
        {
          headlineRuns,
          sensitivityRuns,
          heterogeneousRuns,
        },
        null,
        2,
      ),
    });
  }

  const heartbeat = setInterval(() => {
    writeStatusOnly();
  }, heartbeatMs);

  function runScenarioGroup(
    groupName: 'headline' | 'sensitivity' | 'heterogeneous',
    scenarios: Array<{ id: string; label: string; params: ReturnType<typeof sanitizeSimulationParams> }>,
    replications: number,
    targetRuns: BatchRunRecord[],
  ) {
    status.currentGroup = groupName;
    log(`[paper] running ${groupName} scenarios (${replications} reps each)`);
    for (const scenario of scenarios) {
      const priorRuns = targetRuns.filter((run) => run.scenarioId === scenario.id);
      if (priorRuns.length >= replications) {
        if (!status.completedScenarioIds.includes(scenario.id)) {
          status.completedScenarioIds.push(scenario.id);
        }
        writeProgress();
        continue;
      }
      status.currentScenarioId = scenario.id;
      status.currentScenarioLabel = scenario.label;
      status.currentReplication = priorRuns.length;
      status.currentReplicationCount = replications;
      writeProgress();
      for (let replication = priorRuns.length; replication < replications; replication += 1) {
        progress?.({
          scenarioId: scenario.id,
          scenarioLabel: scenario.label,
          scenarioIndex: 1,
          scenarioCount: 1,
          replication: replication + 1,
          replicationCount: replications,
        });
        status.currentReplication = replication + 1;
        status.currentReplicationCount = replications;
        writeProgress();
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
        targetRuns.push({
          scenarioId: scenario.id,
          scenarioLabel: scenario.label,
          replication,
          seed,
          metrics,
          earlyStopped: state.status === 'early_stopped',
          terminationReason: state.terminationReason,
          truncationEvents: state.truncationEvents,
          totalMissingLinks: state.totalMissingLinks,
          tail: fitTailModels(state.nodes.map((node) => node.degree)),
        });
        writeProgress();
      }
      status.completedScenarioIds.push(scenario.id);
      writeProgress();
    }
    status.completedGroups.push(groupName);
    writeProgress();
  }

  await maybeLoadResume();
  log(`[paper] profile=${profile} n=${settings.n}`);

  try {
    runScenarioGroup('headline', headlineScenarios, settings.headlineReplications, headlineRuns);
    runScenarioGroup('sensitivity', sensitivityScenarios, settings.sensitivityReplications, sensitivityRuns);
    runScenarioGroup('heterogeneous', heterogeneousScenarios, settings.heterogeneousReplications, heterogeneousRuns);
  } catch (error) {
    clearInterval(heartbeat);
    status.state = 'failed';
    status.failedAt = new Date().toISOString();
    status.errorMessage = error instanceof Error ? error.message : String(error);
    writeProgress();
    throw error;
  }

  const headlineResult: BatchResult = {
    config: { scenarios: headlineScenarios, replications: settings.headlineReplications },
    runs: headlineRuns,
    summaries: headlineScenarios.map((scenario) => summarizeRuns(headlineRuns.filter((run) => run.scenarioId === scenario.id), scenario.id, scenario.label)),
  };
  const sensitivityResult: BatchResult = {
    config: { scenarios: sensitivityScenarios, replications: settings.sensitivityReplications },
    runs: sensitivityRuns,
    summaries: sensitivityScenarios.map((scenario) => summarizeRuns(sensitivityRuns.filter((run) => run.scenarioId === scenario.id), scenario.id, scenario.label)),
  };
  const heterogeneousResult: BatchResult = {
    config: { scenarios: heterogeneousScenarios, replications: settings.heterogeneousReplications },
    runs: heterogeneousRuns,
    summaries: heterogeneousScenarios.map((scenario) => summarizeRuns(heterogeneousRuns.filter((run) => run.scenarioId === scenario.id), scenario.id, scenario.label)),
  };

  const headlineRows = headlineResult.summaries.map((summary) => ({
    scenarioId: summary.scenarioId,
    scenarioLabel: summary.scenarioLabel,
    maxDegree: metricMean(summary, 'maxDegree'),
    degreeGini: metricMean(summary, 'degreeGini'),
    averageClustering: metricMean(summary, 'averageClustering'),
    meanEdgeLength: metricMean(summary, 'meanEdgeLength'),
    preferredTail: preferredTail(summary),
    earlyStopRate: summary.earlyStopRate,
  }));

  const sensitivityRows = sensitivityResult.summaries.map((summary) => ({
    scenarioId: summary.scenarioId,
    scenarioLabel: summary.scenarioLabel,
    meanEdgeLength: metricMean(summary, 'meanEdgeLength'),
    averageClustering: metricMean(summary, 'averageClustering'),
    cyclomaticNumber: metricMean(summary, 'cyclomaticNumber'),
    averagePathLengthLargestComponent: metricMean(summary, 'averagePathLengthLargestComponent'),
    earlyStopRate: summary.earlyStopRate,
  }));

  const heterogeneousRows = heterogeneousResult.summaries.map((summary) => ({
    scenarioId: summary.scenarioId,
    scenarioLabel: summary.scenarioLabel,
    maxDegree: metricMean(summary, 'maxDegree'),
    degreeGini: metricMean(summary, 'degreeGini'),
    shareAtCapacity: metricMean(summary, 'shareAtCapacity'),
    averageClustering: metricMean(summary, 'averageClustering'),
    earlyStopRate: summary.earlyStopRate,
  }));

  const headlineComparisonRows = headlineRows.map((row) => {
    const target = paperTargets.headline[row.scenarioId as keyof typeof paperTargets.headline];
    return {
      ...row,
      targetMaxDegree: target.maxDegree,
      targetDegreeGini: target.degreeGini,
      targetAverageClustering: target.averageClustering,
      targetMeanEdgeLength: target.meanEdgeLength,
      targetPreferredTail: target.preferredTail,
      maxDegreeRelDiff: relDiff(row.maxDegree, target.maxDegree),
      degreeGiniRelDiff: relDiff(row.degreeGini, target.degreeGini),
      averageClusteringRelDiff: relDiff(row.averageClustering, target.averageClustering),
      meanEdgeLengthRelDiff: relDiff(row.meanEdgeLength, target.meanEdgeLength),
      preferredTailMatch: row.preferredTail === target.preferredTail,
    };
  });

  const sensitivityComparisonRows = sensitivityRows
    .filter((row) => row.scenarioId in paperTargets.sensitivity)
    .map((row) => {
      const target = paperTargets.sensitivity[row.scenarioId as keyof typeof paperTargets.sensitivity];
      return {
        ...row,
        targetMeanEdgeLength: target.meanEdgeLength ?? null,
        targetAverageClustering: target.averageClustering ?? null,
        targetCyclomaticNumber: target.cyclomaticNumber ?? null,
        targetAveragePathLengthLargestComponent: target.averagePathLengthLargestComponent ?? null,
        meanEdgeLengthRelDiff: relDiff(row.meanEdgeLength, target.meanEdgeLength ?? null),
        averageClusteringRelDiff: relDiff(row.averageClustering, target.averageClustering ?? null),
        cyclomaticRelDiff: relDiff(row.cyclomaticNumber, target.cyclomaticNumber ?? null),
        averagePathLengthRelDiff: relDiff(row.averagePathLengthLargestComponent, target.averagePathLengthLargestComponent ?? null),
      };
    });

  const heterogeneousComparisonRows = heterogeneousRows.map((row) => {
    const target = paperTargets.heterogeneous[row.scenarioId as keyof typeof paperTargets.heterogeneous];
    return {
      ...row,
      targetMaxDegree: target.maxDegree,
      targetDegreeGini: target.degreeGini,
      targetShareAtCapacity: target.shareAtCapacity,
      targetAverageClustering: target.averageClustering,
      maxDegreeRelDiff: relDiff(row.maxDegree, target.maxDegree),
      degreeGiniRelDiff: relDiff(row.degreeGini, target.degreeGini),
      shareAtCapacityRelDiff: relDiff(row.shareAtCapacity, target.shareAtCapacity),
      averageClusteringRelDiff: relDiff(row.averageClustering, target.averageClustering),
    };
  });

  const report = `# Paper Replication Report

Profile: ${profile}

## Headline scenarios

${headlineComparisonRows.map((row) => `- ${row.scenarioLabel}: max degree ${row.maxDegree?.toFixed(2)}, Gini ${row.degreeGini?.toFixed(3)}, clustering ${row.averageClustering?.toFixed(3)}, mean edge length ${row.meanEdgeLength?.toFixed(3)}, tail ${row.preferredTail}, early-stop rate ${row.earlyStopRate.toFixed(3)}.`).join('\n')}

## One-factor subset

${sensitivityComparisonRows.map((row) => `- ${row.scenarioId}: mean edge length ${row.meanEdgeLength?.toFixed(3)}, clustering ${row.averageClustering?.toFixed(4)}, cyclomatic ${row.cyclomaticNumber?.toFixed(0)}, path length ${row.averagePathLengthLargestComponent?.toFixed?.(2) ?? 'NA'}, early-stop rate ${row.earlyStopRate.toFixed(3)}.`).join('\n')}

## Heterogeneous capacity

${heterogeneousComparisonRows.map((row) => `- ${row.scenarioId}: max degree ${row.maxDegree?.toFixed(2)}, Gini ${row.degreeGini?.toFixed(3)}, share at capacity ${row.shareAtCapacity?.toFixed(4)}, clustering ${row.averageClustering?.toFixed(4)}, early-stop rate ${row.earlyStopRate.toFixed(3)}.`).join('\n')}
`;

  log(`[paper] writing result bundle to ${outputRoot}`);
  clearInterval(heartbeat);
  status.state = 'completed';
  status.completedAt = new Date().toISOString();
  status.currentScenarioId = null;
  status.currentScenarioLabel = null;
  status.currentReplication = 0;
  status.currentReplicationCount = 0;
  status.errorMessage = null;
  await writeResultBundle(outputRoot, {
    'run_status.json': JSON.stringify(status, null, 2),
    'checkpoint_runs.json': JSON.stringify({ headlineRuns, sensitivityRuns, heterogeneousRuns }, null, 2),
    'headline.json': JSON.stringify(headlineResult, null, 2),
    'sensitivity.json': JSON.stringify(sensitivityResult, null, 2),
    'heterogeneous.json': JSON.stringify(heterogeneousResult, null, 2),
    'headline_summary.csv': toCsv(headlineRows),
    'sensitivity_summary.csv': toCsv(sensitivityRows),
    'heterogeneous_summary.csv': toCsv(heterogeneousRows),
    'headline_comparison.csv': toCsv(headlineComparisonRows),
    'sensitivity_comparison.csv': toCsv(sensitivityComparisonRows),
    'heterogeneous_comparison.csv': toCsv(heterogeneousComparisonRows),
    'PAPER_REPLICATION_REPORT.md': report,
  });

  return {
    profile,
    outputRoot,
    headlineResult,
    sensitivityResult,
    heterogeneousResult,
    headlineRows,
    sensitivityRows,
    heterogeneousRows,
    headlineComparisonRows,
    sensitivityComparisonRows,
    heterogeneousComparisonRows,
    report,
  };
}
