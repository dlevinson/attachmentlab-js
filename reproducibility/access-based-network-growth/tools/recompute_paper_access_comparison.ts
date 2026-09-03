import fs from 'node:fs/promises';
import path from 'node:path';
import { computeComparableNetworkAccessibility } from '../src/metrics/transportAccessibility';
import { runSimulation, sanitizeSimulationParams } from '../src/model/simulator';
import type { EdgeRecord, NodeRecord, SimulationParams, SimulationState } from '../src/types/model';

type SourceRun = {
  scenarioId: string;
  scenarioLabel: string;
  replication: number;
  seed: number;
  metrics: Record<string, number | null>;
};

type SourceScenario = {
  id: string;
  label: string;
  params: SimulationParams;
};

type SourcePayload = {
  accessInteraction: {
    config: { scenarios: SourceScenario[]; replications: number };
    runs: SourceRun[];
  };
};

type CorrectedRun = {
  scenarioId: string;
  scenarioLabel: string;
  replication: number;
  seed: number;
  exogenousNodes: number;
  generatedJunctions: number;
  finalNodes: number;
  finalEdges: number;
  crossingCandidateLinksAdmitted: number;
  splitActiveArrivalSteps: number;
  meanGravityAccess: number;
  meanCumulativeAccess: number;
};

type RepresentativeNode = Pick<NodeRecord, 'id' | 'x' | 'y' | 'degree' | 'generatedBy'> & {
  commonGravityAccess: number | null;
  commonCumulativeAccess: number | null;
};

type RepresentativeEdge = Pick<EdgeRecord, 'id' | 'source' | 'target' | 'generatedBy'> & {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
};

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function sampleSd(values: number[]) {
  if (values.length < 2) return 0;
  const average = mean(values);
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / (values.length - 1));
}

function summarize(runs: CorrectedRun[]) {
  const fields = [
    'exogenousNodes',
    'generatedJunctions',
    'finalNodes',
    'finalEdges',
    'crossingCandidateLinksAdmitted',
    'splitActiveArrivalSteps',
    'meanGravityAccess',
    'meanCumulativeAccess',
  ] as const;
  return Object.fromEntries(
    fields.map((field) => {
      const values = runs.map((run) => run[field]);
      return [field, { mean: mean(values), sd: sampleSd(values), min: Math.min(...values), max: Math.max(...values) }];
    }),
  );
}

function csvEscape(value: unknown) {
  const stringValue = String(value ?? '');
  return /[\n,"]/.test(stringValue) ? `"${stringValue.replaceAll('"', '""')}"` : stringValue;
}

function toCsv(rows: Array<Record<string, unknown>>) {
  if (rows.length === 0) return '';
  const headings = Object.keys(rows[0]);
  return [
    headings.join(','),
    ...rows.map((row) => headings.map((heading) => csvEscape(row[heading])).join(',')),
  ].join('\n');
}

function chooseRepresentative(runs: CorrectedRun[]) {
  const fields = [
    'meanGravityAccess',
    'meanCumulativeAccess',
    'crossingCandidateLinksAdmitted',
    'splitActiveArrivalSteps',
  ] as const;
  const means = Object.fromEntries(fields.map((field) => [field, mean(runs.map((run) => run[field]))])) as Record<string, number>;
  return runs.reduce((best, run) => {
    const distance = fields.reduce((sum, field) => {
      const scale = Math.abs(means[field]) > 1e-12 ? Math.abs(means[field]) : 1;
      return sum + ((run[field] - means[field]) / scale) ** 2;
    }, 0);
    return !best || distance < best.distance ? { run, distance } : best;
  }, null as null | { run: CorrectedRun; distance: number })!.run;
}

function representativeState(state: SimulationState, run: CorrectedRun) {
  const access = computeComparableNetworkAccessibility(state.nodes, state.edges, {
    radius: state.params.accessibilityRadius,
    decay: state.params.accessibilityDecay,
  });
  const nodeById = new Map(state.nodes.map((node) => [node.id, node]));
  const nodes: RepresentativeNode[] = state.nodes.map((node) => ({
    id: node.id,
    x: node.x,
    y: node.y,
    degree: node.degree,
    generatedBy: node.generatedBy ?? 'arrival',
    commonGravityAccess: access.gravityById[node.id] ?? null,
    commonCumulativeAccess: access.cumulativeById[node.id] ?? null,
  }));
  const edges = state.edges.flatMap<RepresentativeEdge>((edge) => {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target) return [];
    return [{
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceX: source.x,
      sourceY: source.y,
      targetX: target.x,
      targetY: target.y,
      generatedBy: edge.generatedBy ?? 'arrival',
    }];
  });
  return { ...run, nodes, edges };
}

async function main() {
  const repoRoot = process.cwd();
  const sourcePath = path.join(
    repoRoot,
    'results',
    'transport_extensions',
    'focused_results.json',
  );
  const outputRoot = path.join(
    repoRoot,
    'results',
    'transport_extensions',
    'corrected_access_comparison',
  );
  const source = JSON.parse(await fs.readFile(sourcePath, 'utf8')) as SourcePayload;
  const scenarios = new Map(source.accessInteraction.config.scenarios.map((scenario) => [scenario.id, scenario]));
  const correctedRuns: CorrectedRun[] = [];
  const states = new Map<string, SimulationState>();

  for (const sourceRun of source.accessInteraction.runs) {
    const scenario = scenarios.get(sourceRun.scenarioId);
    if (!scenario) throw new Error(`Missing scenario configuration: ${sourceRun.scenarioId}`);
    console.log(`[common-access] ${sourceRun.scenarioId} replication ${sourceRun.replication + 1}`);
    const params = sanitizeSimulationParams({ ...scenario.params, rngSeed: sourceRun.seed });
    const state = runSimulation(params);
    const access = computeComparableNetworkAccessibility(state.nodes, state.edges, {
      radius: params.accessibilityRadius,
      decay: params.accessibilityDecay,
    });
    const exogenousNodes = state.nodes.filter((node) => node.generatedBy !== 'split_crossing').length;
    const generatedJunctions = state.nodes.filter((node) => node.generatedBy === 'split_crossing').length;
    const correctedRun: CorrectedRun = {
      scenarioId: sourceRun.scenarioId,
      scenarioLabel: sourceRun.scenarioLabel,
      replication: sourceRun.replication,
      seed: sourceRun.seed,
      exogenousNodes,
      generatedJunctions,
      finalNodes: state.nodes.length,
      finalEdges: state.edges.length,
      crossingCandidateLinksAdmitted: state.crossingCandidatesAdmitted ?? 0,
      splitActiveArrivalSteps: state.splitEvents ?? 0,
      meanGravityAccess: access.meanGravity,
      meanCumulativeAccess: access.meanCumulative,
    };
    if (exogenousNodes !== params.finalNodeCount) {
      throw new Error(`${sourceRun.scenarioId} replication ${sourceRun.replication}: expected ${params.finalNodeCount} exogenous nodes, found ${exogenousNodes}`);
    }
    correctedRuns.push(correctedRun);
    states.set(`${sourceRun.scenarioId}:${sourceRun.replication}`, state);
  }

  const summaries = source.accessInteraction.config.scenarios.map((scenario) => {
    const scenarioRuns = correctedRuns.filter((run) => run.scenarioId === scenario.id);
    return {
      scenarioId: scenario.id,
      scenarioLabel: scenario.label,
      replications: scenarioRuns.length,
      metrics: summarize(scenarioRuns),
    };
  });
  const representatives = source.accessInteraction.config.scenarios.map((scenario) => {
    const selected = chooseRepresentative(correctedRuns.filter((run) => run.scenarioId === scenario.id));
    const state = states.get(`${selected.scenarioId}:${selected.replication}`);
    if (!state) throw new Error(`Missing rerun state for ${selected.scenarioId}:${selected.replication}`);
    return representativeState(state, selected);
  });

  const summaryRows = summaries.map((summary) => ({
    scenarioId: summary.scenarioId,
    scenarioLabel: summary.scenarioLabel,
    replications: summary.replications,
    gravityMean: summary.metrics.meanGravityAccess.mean,
    gravitySd: summary.metrics.meanGravityAccess.sd,
    cumulativeMean: summary.metrics.meanCumulativeAccess.mean,
    cumulativeSd: summary.metrics.meanCumulativeAccess.sd,
    admittedCandidateLinksMean: summary.metrics.crossingCandidateLinksAdmitted.mean,
    admittedCandidateLinksSd: summary.metrics.crossingCandidateLinksAdmitted.sd,
    splitActiveStepsMean: summary.metrics.splitActiveArrivalSteps.mean,
    splitActiveStepsSd: summary.metrics.splitActiveArrivalSteps.sd,
    generatedJunctionsMean: summary.metrics.generatedJunctions.mean,
    generatedJunctionsSd: summary.metrics.generatedJunctions.sd,
  }));

  const methods = {
    origins: 'All exogenously supplied seed and arrival nodes',
    destinations: 'All exogenously supplied seed and arrival nodes, unit weight',
    junctionTreatment: 'Split-generated junctions retained as traversable graph nodes and assigned zero origin and destination weight',
    shortestPathCost: 'Edge length',
    cumulativeRadius: source.accessInteraction.config.scenarios[0].params.accessibilityRadius,
    gravityDecay: source.accessInteraction.config.scenarios[0].params.accessibilityDecay,
  };
  await fs.mkdir(outputRoot, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(outputRoot, 'corrected_access_results.json'), JSON.stringify({ methods, correctedRuns, summaries }, null, 2)),
    fs.writeFile(path.join(outputRoot, 'corrected_access_summary.csv'), toCsv(summaryRows)),
    fs.writeFile(path.join(outputRoot, 'corrected_access_runs.csv'), toCsv(correctedRuns)),
    fs.writeFile(path.join(outputRoot, 'corrected_access_representatives.json'), JSON.stringify({ methods, states: representatives }, null, 2)),
  ]);
  console.log(`[common-access] wrote corrected outputs to ${outputRoot}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
