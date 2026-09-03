import fs from 'node:fs/promises';
import path from 'node:path';
import { createDefaultParams, runSimulation, sanitizeSimulationParams } from '../src/model/simulator';
import { getBrowserParityEngine } from '../src/model/browserParity';
import { mergeParams } from '../src/analysis/benchmarkHarness';

type FocusedRunRecord = {
  scenarioId: string;
  scenarioLabel: string;
  replication: number;
  seed: number;
  metrics: Record<string, number | null>;
};

type FocusedPayload = {
  config: unknown;
  runs: FocusedRunRecord[];
  summaries: Array<Record<string, unknown>>;
};

type FocusedResults = {
  planarityCore: FocusedPayload;
  accessInteraction: FocusedPayload;
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
  group: 'planarityCore' | 'accessInteraction';
  replication: number;
  seed: number;
  semantics: string;
  metrics: Record<string, number | null>;
  nodes: RepresentativeNode[];
  edges: RepresentativeEdge[];
};

function profileSettings(profile: 'test' | 'smoke' | 'medium' | 'full') {
  if (profile === 'test') return { n: 100 };
  if (profile === 'smoke') return { n: 140 };
  if (profile === 'medium') return { n: 220 };
  return { n: 320 };
}

function buildFocusedScenarioParams(profile: 'test' | 'smoke' | 'medium' | 'full') {
  const settings = profileSettings(profile);
  const base = sanitizeSimulationParams({
    ...createDefaultParams(),
    finalNodeCount: settings.n,
    m0: 5,
    seedGraphType: 'complete',
    arrivalMode: 'uniform',
    meshMode: 'off',
    planarityMode: 'none',
    arrivalPreferenceMode: 'baseline',
    selectionKernelMode: 'baseline',
    accessSemantics: 'network',
    arrivalAccessStrength: 0,
    accessSelectionStrength: 0,
    trackHistory: false,
  });

  const planarityBase = sanitizeSimulationParams(
    mergeParams(base, {
      finalNodeCount: Math.max(40, Math.floor(settings.n * 0.45)),
      seedGraphType: 'complete',
      arrivalMode: 'uniform',
      meshMode: 'off',
      kappa: 4,
      alpha: 0.5,
      beta: 0,
      phi: 0,
      capacityValue: 64,
      m0: 6,
    }),
  );

  const interactionBase = sanitizeSimulationParams(
    mergeParams(base, {
      finalNodeCount: settings.n,
      m0: 9,
      seedGraphType: 'grid',
      arrivalMode: 'frontier',
      meshMode: 'grid_bias',
      meshAngleSet: '90',
      meshAdjacencyMode: 'queen',
      meshNearestCount: 12,
      planarityMode: 'none',
      kappa: 4,
      alpha: 0.5,
      beta: 0,
      phi: 0,
      capacityValue: 64,
      meshSpacingFactor: 0,
    }),
  );

  return {
    planarity_free_none: sanitizeSimulationParams(mergeParams(planarityBase, { planarityMode: 'none' })),
    planarity_free_reject: sanitizeSimulationParams(
      mergeParams(planarityBase, { planarityMode: 'reject_crossings' }),
    ),
    planarity_free_split: sanitizeSimulationParams(
      mergeParams(planarityBase, { planarityMode: 'split_crossings' }),
    ),
    interaction_reject_none: sanitizeSimulationParams(
      mergeParams(interactionBase, {
        planarityMode: 'reject_crossings',
        accessSemantics: 'network',
        arrivalPreferenceMode: 'baseline',
        selectionKernelMode: 'baseline',
        arrivalAccessStrength: 0,
        accessSelectionStrength: 0,
      }),
    ),
    interaction_split_target: sanitizeSimulationParams(
      mergeParams(interactionBase, {
        planarityMode: 'split_crossings',
        accessSemantics: 'network',
        arrivalPreferenceMode: 'baseline',
        selectionKernelMode: 'access',
        accessSelectionMetric: 'gravity',
        accessSelectionStrength: 1.5,
      }),
    ),
    interaction_split_both_seed: sanitizeSimulationParams(
      mergeParams(interactionBase, {
        planarityMode: 'split_crossings',
        accessSemantics: 'seed',
        arrivalPreferenceMode: 'access',
        arrivalAccessMetric: 'gravity',
        arrivalAccessStrength: 1.5,
        selectionKernelMode: 'access',
        accessSelectionMetric: 'gravity',
        accessSelectionStrength: 1.5,
      }),
    ),
    interaction_split_both_opportunity: sanitizeSimulationParams(
      mergeParams(interactionBase, {
        planarityMode: 'split_crossings',
        accessSemantics: 'opportunity',
        arrivalPreferenceMode: 'access',
        arrivalAccessMetric: 'gravity',
        arrivalAccessStrength: 1.5,
        selectionKernelMode: 'access',
        accessSelectionMetric: 'gravity',
        accessSelectionStrength: 1.5,
      }),
    ),
  };
}

function scenarioMetricKeys(group: 'planarityCore' | 'accessInteraction') {
  return group === 'planarityCore'
    ? ['averageClustering', 'meanEdgeLength', 'crossingCandidatesAdmitted', 'generatedIntersectionNodes']
    : ['meanGravityAccess', 'meanCumulativeAccess', 'crossingCandidatesAdmitted', 'splitEvents'];
}

function chooseRepresentativeRun(runs: FocusedRunRecord[], group: 'planarityCore' | 'accessInteraction') {
  const keys = scenarioMetricKeys(group);
  const means = Object.fromEntries(
    keys.map((key) => [
      key,
      runs.reduce((sum, run) => sum + Number(run.metrics[key] ?? 0), 0) / runs.length,
    ]),
  ) as Record<string, number>;

  return runs.reduce(
    (best, run) => {
      const distance = keys.reduce((sum, key) => {
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
    null as null | { run: FocusedRunRecord; distance: number },
  )!.run;
}

async function main() {
  const repoRoot = process.cwd();
  const outputRoot = path.join(repoRoot, 'results', 'transport_extensions');
  const sourcePath = path.join(outputRoot, 'focused_results.json');
  const source = JSON.parse(await fs.readFile(sourcePath, 'utf8')) as FocusedResults;
  const scenarioParams = buildFocusedScenarioParams('medium');
  const engine = getBrowserParityEngine();

  const states: RepresentativeState[] = [];

  ([
    ['planarityCore', source.planarityCore],
    ['accessInteraction', source.accessInteraction],
  ] as const).forEach(([group, payload]) => {
    const byScenario = new Map<string, FocusedRunRecord[]>();
    payload.runs.forEach((run) => {
      const bucket = byScenario.get(run.scenarioId) ?? [];
      bucket.push(run);
      byScenario.set(run.scenarioId, bucket);
    });

    for (const [scenarioId, runs] of byScenario.entries()) {
      const chosen = chooseRepresentativeRun(runs, group);
      console.log(
        `[representatives] ${group} ${scenarioId} replication ${chosen.replication + 1} seed ${chosen.seed}`,
      );
      const params = sanitizeSimulationParams({ ...scenarioParams[scenarioId as keyof typeof scenarioParams], rngSeed: chosen.seed });
      const state = runSimulation(params);
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
        scenarioId,
        scenarioLabel: chosen.scenarioLabel,
        group,
        replication: chosen.replication,
        seed: chosen.seed,
        semantics: params.accessSemantics,
        metrics: chosen.metrics,
        nodes,
        edges,
      });
    }
  });

  await fs.writeFile(
    path.join(outputRoot, 'representative_states.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), profile: 'medium', states }, null, 2),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
