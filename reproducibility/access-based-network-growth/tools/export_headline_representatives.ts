import fs from 'node:fs/promises';
import path from 'node:path';
import { runSimulation, sanitizeSimulationParams } from '../src/model/simulator';
import { getBrowserParityEngine } from '../src/model/browserParity';

type HeadlineRunRecord = {
  scenarioId: string;
  scenarioLabel: string;
  replication: number;
  seed: number;
  metrics: Record<string, number | null>;
};

type HeadlineScenario = {
  id: string;
  label: string;
  params: Record<string, unknown>;
};

type HeadlineBundle = {
  config: {
    scenarios: HeadlineScenario[];
    replications: number;
  };
  runs: HeadlineRunRecord[];
  summaries: Array<Record<string, unknown>>;
};

type RepresentativeNode = {
  id: string;
  x: number;
  y: number;
  degree: number;
  generatedBy: string;
  accessCumulative: number;
  accessGravity: number;
};

type RepresentativeEdge = {
  id: string;
  source: string;
  target: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  generatedBy: string;
};

type RepresentativeState = {
  scenarioId: string;
  scenarioLabel: string;
  replication: number;
  seed: number;
  effectiveSeed: number;
  metrics: Record<string, number | null>;
  nodes: RepresentativeNode[];
  edges: RepresentativeEdge[];
};

const METRIC_KEYS = ['maxDegree', 'degreeGini', 'averageClustering', 'meanEdgeLength'] as const;

function chooseRepresentativeRun(runs: HeadlineRunRecord[]) {
  const means = Object.fromEntries(
    METRIC_KEYS.map((key) => [
      key,
      runs.reduce((sum, run) => sum + Number(run.metrics[key] ?? 0), 0) / runs.length,
    ]),
  ) as Record<(typeof METRIC_KEYS)[number], number>;

  return runs.reduce(
    (best, run) => {
      const distance = METRIC_KEYS.reduce((sum, key) => {
        const target = means[key];
        const value = Number(run.metrics[key] ?? 0);
        const scale = Math.abs(target) > 1e-9 ? Math.abs(target) : 1;
        return sum + ((value - target) / scale) ** 2;
      }, 0);
      if (!best || distance < best.distance) {
        return { run, distance };
      }
      return best;
    },
    null as null | { run: HeadlineRunRecord; distance: number },
  )!.run;
}

async function main() {
  const repoRoot = process.cwd();
  const outputRoot = path.join(repoRoot, 'results', 'baseline_visualisation');
  const sourcePath = path.join(outputRoot, 'headline.json');
  const source = JSON.parse(await fs.readFile(sourcePath, 'utf8')) as HeadlineBundle;
  const engine = getBrowserParityEngine();
  const states: RepresentativeState[] = [];

  const byScenario = new Map<string, HeadlineRunRecord[]>();
  source.runs.forEach((run) => {
    const bucket = byScenario.get(run.scenarioId) ?? [];
    bucket.push(run);
    byScenario.set(run.scenarioId, bucket);
  });

  for (const scenario of source.config.scenarios) {
    const runs = byScenario.get(scenario.id) ?? [];
    if (!runs.length) continue;
    const chosen = chooseRepresentativeRun(runs);
    console.log(
      `[headline-representatives] ${scenario.id} replication ${chosen.replication + 1} seed ${chosen.seed}`,
    );
    const params = sanitizeSimulationParams({
      ...(scenario.params as object),
      rngSeed: chosen.seed,
    });
    const state = runSimulation(params);
    if (state.params.rngSeed !== chosen.seed) throw new Error(`Seed changed for ${scenario.id}`);
    const access = engine.computeTransportAccessibility(state.nodes, state.edges, state.params);
    const nodeById = new Map(state.nodes.map((node) => [node.id, node]));
    const nodes: RepresentativeNode[] = state.nodes.map((node) => ({
      id: node.id,
      x: node.x,
      y: node.y,
      degree: node.degree,
      generatedBy: node.generatedBy ?? 'arrival',
      accessCumulative: access.cumulativeById[node.id] ?? node.accessCumulative ?? 0,
      accessGravity: access.gravityById[node.id] ?? node.accessGravity ?? 0,
    }));
    const edges = state.edges
      .flatMap<RepresentativeEdge>((edge) => {
        const sourceNode = nodeById.get(edge.source);
        const targetNode = nodeById.get(edge.target);
        if (!sourceNode || !targetNode) return [];
        return [{
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceX: sourceNode.x,
          sourceY: sourceNode.y,
          targetX: targetNode.x,
          targetY: targetNode.y,
          generatedBy: edge.generatedBy ?? 'arrival',
        }];
      });

    states.push({
      scenarioId: scenario.id,
      scenarioLabel: chosen.scenarioLabel,
      replication: chosen.replication,
      seed: chosen.seed,
      effectiveSeed: state.params.rngSeed,
      metrics: chosen.metrics,
      nodes,
      edges,
    });
  }

  await fs.writeFile(
    path.join(outputRoot, 'headline_representative_states.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), states }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
