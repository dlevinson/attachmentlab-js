import path from 'node:path';
import {
  mergeParams,
  metricMean,
  preferredTail,
  runSimpleBatch,
  toCsv,
  writeResultBundle,
} from './benchmarkHarness';
import { createDefaultParams, sanitizeSimulationParams } from '../model/simulator';

export interface BeyondPaperSuiteRunOptions {
  outputRoot?: string;
  profile?: 'test' | 'smoke' | 'medium' | 'full';
  silent?: boolean;
}

function profileSettings(profile: 'test' | 'smoke' | 'medium' | 'full') {
  if (profile === 'test') {
    return { n: 80, replications: 1 };
  }
  if (profile === 'smoke') {
    return { n: 120, replications: 2 };
  }
  if (profile === 'medium') {
    return { n: 220, replications: 4 };
  }
  return { n: 320, replications: 6 };
}

function trancheRows(trancheId: string, summaries: ReturnType<typeof runSimpleBatch>['summaries']) {
  return summaries.map((summary) => ({
    tranche: trancheId,
    scenarioId: summary.scenarioId,
    scenarioLabel: summary.scenarioLabel,
    earlyStopRate: summary.earlyStopRate,
    truncationRate: summary.truncationRate,
    meanDegree: metricMean(summary, 'meanDegree'),
    maxDegree: metricMean(summary, 'maxDegree'),
    degreeGini: metricMean(summary, 'degreeGini'),
    averageClustering: metricMean(summary, 'averageClustering'),
    meanEdgeLength: metricMean(summary, 'meanEdgeLength'),
    averagePathLengthLargestComponent: metricMean(summary, 'averagePathLengthLargestComponent'),
    cyclomaticNumber: metricMean(summary, 'cyclomaticNumber'),
    meanCumulativeAccess: metricMean(summary, 'meanCumulativeAccess'),
    meanGravityAccess: metricMean(summary, 'meanGravityAccess'),
    crossingCandidatesEncountered: metricMean(summary, 'crossingCandidatesEncountered'),
    crossingCandidatesAdmitted: metricMean(summary, 'crossingCandidatesAdmitted'),
    generatedIntersectionNodes: metricMean(summary, 'generatedIntersectionNodes'),
    splitEvents: metricMean(summary, 'splitEvents'),
    dominantDirectionShare: metricMean(summary, 'dominantDirectionShare'),
    eastWestBias: metricMean(summary, 'eastWestBias'),
    northSouthBias: metricMean(summary, 'northSouthBias'),
    preferredTail: preferredTail(summary),
  }));
}

export async function runBeyondPaperSuite(options: BeyondPaperSuiteRunOptions = {}) {
  const repoRoot = process.cwd();
  const profile = options.profile ?? 'full';
  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const outputRoot =
    options.outputRoot ?? path.join(repoRoot, 'results', `beyond_paper_suite_${stamp}_${profile}`);
  const settings = profileSettings(profile);
  const log = options.silent ? (..._args: unknown[]) => {} : console.log;
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
          `[beyond-paper] ${event.scenarioIndex}/${event.scenarioCount} ${event.scenarioId} replication ${event.replication}/${event.replicationCount}`,
        );
      };

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

  const meshTransportBase = sanitizeSimulationParams(
    mergeParams(base, {
      finalNodeCount: settings.n,
      m0: 7,
      seedGraphType: 'cross',
      arrivalMode: 'network',
      meshMode: 'grid_bias',
      meshAngleSet: '90',
      meshAdjacencyMode: 'rook',
      planarityMode: 'none',
      capacityValue: 16,
      phi: 1,
      beta: 1,
      meshSpacingFactor: 0,
    }),
  );

  // BP3 needs a mesh setting that still feels transport-like, but does not
  // suppress every local crossing before planarity can act. The interaction
  // tranche therefore uses a denser square-lattice seed, wider local
  // admissibility, and weak cost/capacity pressure so reject/split can express
  // distinct behaviors on the same local candidate pool.
  const meshInteractionBase = sanitizeSimulationParams(
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

  log(`[beyond-paper] profile=${profile} running bp1_planarity`);
  const bp1_planarity = runSimpleBatch({
    replications: settings.replications,
    onProgress: progress,
    scenarios: [
      {
        id: 'planarity_free_none',
        label: 'Free geometry / none',
        params: sanitizeSimulationParams(
          mergeParams(base, {
            finalNodeCount: Math.max(40, Math.floor(settings.n * 0.45)),
            seedGraphType: 'complete',
            arrivalMode: 'uniform',
            meshMode: 'off',
            planarityMode: 'none',
            kappa: 4,
            alpha: 0.5,
            beta: 0,
            phi: 0,
            capacityValue: 64,
            m0: 6,
          }),
        ),
      },
      {
        id: 'planarity_free_reject',
        label: 'Free geometry / reject',
        params: sanitizeSimulationParams(
          mergeParams(base, {
            finalNodeCount: Math.max(40, Math.floor(settings.n * 0.45)),
            seedGraphType: 'complete',
            arrivalMode: 'uniform',
            meshMode: 'off',
            planarityMode: 'reject_crossings',
            kappa: 4,
            alpha: 0.5,
            beta: 0,
            phi: 0,
            capacityValue: 64,
            m0: 6,
          }),
        ),
      },
      {
        id: 'planarity_free_split',
        label: 'Free geometry / split',
        params: sanitizeSimulationParams(
          mergeParams(base, {
            finalNodeCount: Math.max(40, Math.floor(settings.n * 0.45)),
            seedGraphType: 'complete',
            arrivalMode: 'uniform',
            meshMode: 'off',
            planarityMode: 'split_crossings',
            kappa: 4,
            alpha: 0.5,
            beta: 0,
            phi: 0,
            capacityValue: 64,
            m0: 6,
          }),
        ),
      },
      {
        id: 'planarity_mesh_reject',
        label: 'Mesh / reject',
        params: sanitizeSimulationParams(
          mergeParams(meshTransportBase, {
            planarityMode: 'reject_crossings',
            selectionKernelMode: 'baseline',
            arrivalPreferenceMode: 'baseline',
          }),
        ),
      },
      {
        id: 'planarity_mesh_split',
        label: 'Mesh / split',
        params: sanitizeSimulationParams(
          mergeParams(meshTransportBase, {
            planarityMode: 'split_crossings',
            selectionKernelMode: 'baseline',
            arrivalPreferenceMode: 'baseline',
          }),
        ),
      },
    ],
  });

  log(`[beyond-paper] running bp2_access_semantics`);
  const bp2_access_semantics = runSimpleBatch({
    replications: settings.replications,
    onProgress: progress,
    scenarios: [
      {
        id: 'access_network_arrival',
        label: 'Network access / arrival-only',
        params: sanitizeSimulationParams(
          mergeParams(meshTransportBase, {
            accessSemantics: 'network',
            arrivalPreferenceMode: 'access',
            arrivalAccessMetric: 'gravity',
            arrivalAccessStrength: 1,
            selectionKernelMode: 'baseline',
            accessSelectionStrength: 0,
          }),
        ),
      },
      {
        id: 'access_seed_arrival',
        label: 'Seed access / arrival-only',
        params: sanitizeSimulationParams(
          mergeParams(meshTransportBase, {
            accessSemantics: 'seed',
            arrivalPreferenceMode: 'access',
            arrivalAccessMetric: 'gravity',
            arrivalAccessStrength: 1,
            selectionKernelMode: 'baseline',
            accessSelectionStrength: 0,
          }),
        ),
      },
      {
        id: 'access_opportunity_arrival',
        label: 'Opportunity access / arrival-only',
        params: sanitizeSimulationParams(
          mergeParams(meshTransportBase, {
            accessSemantics: 'opportunity',
            arrivalPreferenceMode: 'access',
            arrivalAccessMetric: 'gravity',
            arrivalAccessStrength: 1,
            selectionKernelMode: 'baseline',
            accessSelectionStrength: 0,
          }),
        ),
      },
      {
        id: 'access_network_target',
        label: 'Network access / target-only',
        params: sanitizeSimulationParams(
          mergeParams(meshTransportBase, {
            accessSemantics: 'network',
            arrivalPreferenceMode: 'baseline',
            arrivalAccessStrength: 0,
            selectionKernelMode: 'access',
            accessSelectionMetric: 'gravity',
            accessSelectionStrength: 1,
          }),
        ),
      },
      {
        id: 'access_seed_both',
        label: 'Seed access / both',
        params: sanitizeSimulationParams(
          mergeParams(meshTransportBase, {
            accessSemantics: 'seed',
            arrivalPreferenceMode: 'access',
            arrivalAccessMetric: 'gravity',
            arrivalAccessStrength: 1,
            selectionKernelMode: 'access',
            accessSelectionMetric: 'gravity',
            accessSelectionStrength: 1,
          }),
        ),
      },
      {
        id: 'access_opportunity_both',
        label: 'Opportunity access / both',
        params: sanitizeSimulationParams(
          mergeParams(meshTransportBase, {
            accessSemantics: 'opportunity',
            arrivalPreferenceMode: 'access',
            arrivalAccessMetric: 'gravity',
            arrivalAccessStrength: 1,
            selectionKernelMode: 'access',
            accessSelectionMetric: 'gravity',
            accessSelectionStrength: 1,
          }),
        ),
      },
    ],
  });

  log(`[beyond-paper] running bp3_interaction`);
  const bp3_interaction = runSimpleBatch({
    replications: settings.replications,
    onProgress: progress,
    scenarios: [
      {
        id: 'interaction_reject_none',
        label: 'Reject / no access',
        params: sanitizeSimulationParams(
          mergeParams(meshInteractionBase, {
            planarityMode: 'reject_crossings',
            accessSemantics: 'network',
            arrivalPreferenceMode: 'baseline',
            selectionKernelMode: 'baseline',
            arrivalAccessStrength: 0,
            accessSelectionStrength: 0,
          }),
        ),
      },
      {
        id: 'interaction_reject_arrival',
        label: 'Reject / arrival access',
        params: sanitizeSimulationParams(
          mergeParams(meshInteractionBase, {
            planarityMode: 'reject_crossings',
            accessSemantics: 'seed',
            arrivalPreferenceMode: 'access',
            arrivalAccessMetric: 'gravity',
            arrivalAccessStrength: 1.5,
            selectionKernelMode: 'baseline',
            accessSelectionStrength: 0,
          }),
        ),
      },
      {
        id: 'interaction_split_target',
        label: 'Split / target access',
        params: sanitizeSimulationParams(
          mergeParams(meshInteractionBase, {
            planarityMode: 'split_crossings',
            accessSemantics: 'network',
            arrivalPreferenceMode: 'baseline',
            selectionKernelMode: 'access',
            accessSelectionMetric: 'gravity',
            accessSelectionStrength: 1.5,
          }),
        ),
      },
      {
        id: 'interaction_split_both_seed',
        label: 'Split / both with seed access',
        params: sanitizeSimulationParams(
          mergeParams(meshInteractionBase, {
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
      },
      {
        id: 'interaction_split_both_opportunity',
        label: 'Split / both with opportunity access',
        params: sanitizeSimulationParams(
          mergeParams(meshInteractionBase, {
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
      },
    ],
  });

  const trancheResults = {
    bp1_planarity,
    bp2_access_semantics,
    bp3_interaction,
  };

  const flatRows = [
    ...trancheRows('bp1_planarity', bp1_planarity.summaries),
    ...trancheRows('bp2_access_semantics', bp2_access_semantics.summaries),
    ...trancheRows('bp3_interaction', bp3_interaction.summaries),
  ];

  const memo = `# Beyond Paper Suite Memo

Profile: ${profile}

## BP1. Planarity

${flatRows
  .filter((row) => row.tranche === 'bp1_planarity')
  .map(
    (row) =>
      `- ${row.scenarioLabel}: crossings encountered ${row.crossingCandidatesEncountered?.toFixed?.(2) ?? 'NA'}, admitted ${row.crossingCandidatesAdmitted?.toFixed?.(2) ?? 'NA'}, split events ${row.splitEvents?.toFixed?.(2) ?? 'NA'}, intersection nodes ${row.generatedIntersectionNodes?.toFixed?.(2) ?? 'NA'}, clustering ${row.averageClustering?.toFixed(3)}.`,
  )
  .join('\n')}

## BP2. Accessibility semantics

${flatRows
  .filter((row) => row.tranche === 'bp2_access_semantics')
  .map(
    (row) =>
      `- ${row.scenarioLabel}: gravity access ${row.meanGravityAccess?.toFixed?.(3) ?? 'NA'}, cumulative access ${row.meanCumulativeAccess?.toFixed?.(3) ?? 'NA'}, mean edge length ${row.meanEdgeLength?.toFixed(3)}, clustering ${row.averageClustering?.toFixed(3)}.`,
  )
  .join('\n')}

## BP3. Interaction

${flatRows
  .filter((row) => row.tranche === 'bp3_interaction')
  .map(
    (row) =>
      `- ${row.scenarioLabel}: split events ${row.splitEvents?.toFixed?.(2) ?? 'NA'}, gravity access ${row.meanGravityAccess?.toFixed?.(3) ?? 'NA'}, clustering ${row.averageClustering?.toFixed(3)}, direction share ${row.dominantDirectionShare?.toFixed(3)}.`,
  )
  .join('\n')}
`;

  const synthesis = `# Beyond Paper Synthesis

Profile: ${profile}

This suite is meant to identify which extensions are robust enough to treat as substantive results rather than exploratory UI features.

## What to look for

- Does \`split_crossings\` create more junction formation than \`reject_crossings\`?
- Do \`network\`, \`seed\`, and \`opportunity\` accessibility semantics produce distinct growth regimes?
- Does accessibility weighting interact with planarity in a non-additive way?

## Immediate interpretation rule

If a scenario differs both morphologically and metrically from the matched no-extension comparator, it is a candidate beyond-paper result.
`;

  log(`[beyond-paper] writing result bundle to ${outputRoot}`);
  await writeResultBundle(outputRoot, {
    'suite_results.json': JSON.stringify(trancheResults, null, 2),
    'suite_summary.csv': toCsv(flatRows),
    'BEYOND_PAPER_MEMO.md': memo,
    'BEYOND_PAPER_SYNTHESIS.md': synthesis,
  });

  return {
    profile,
    outputRoot,
    trancheResults,
    flatRows,
    memo,
    synthesis,
  };
}
