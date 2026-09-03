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

export interface BeyondPaperFocusedRunOptions {
  outputRoot?: string;
  profile?: 'test' | 'smoke' | 'medium' | 'full';
  silent?: boolean;
}

function profileSettings(profile: 'test' | 'smoke' | 'medium' | 'full') {
  if (profile === 'test') {
    return { n: 100, replications: 1 };
  }
  if (profile === 'smoke') {
    return { n: 140, replications: 2 };
  }
  if (profile === 'medium') {
    return { n: 220, replications: 4 };
  }
  return { n: 320, replications: 6 };
}

function summarizeRows(groupId: string, summaries: ReturnType<typeof runSimpleBatch>['summaries']) {
  return summaries.map((summary) => ({
    group: groupId,
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

function figureRows(
  family: string,
  rows: ReturnType<typeof summarizeRows>,
  metrics: string[],
) {
  return rows.flatMap((row) =>
    metrics.map((metric) => ({
      family,
      scenarioId: row.scenarioId,
      scenarioLabel: row.scenarioLabel,
      metric,
      value: (row as Record<string, unknown>)[metric] ?? null,
    })),
  );
}

export async function runBeyondPaperFocused(options: BeyondPaperFocusedRunOptions = {}) {
  const repoRoot = process.cwd();
  const profile = options.profile ?? 'medium';
  const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
  const outputRoot =
    options.outputRoot ?? path.join(repoRoot, 'results', `beyond_paper_focused_${stamp}_${profile}`);
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
          `[beyond-focused] ${event.scenarioIndex}/${event.scenarioCount} ${event.scenarioId} replication ${event.replication}/${event.replicationCount}`,
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

  log(`[beyond-focused] profile=${profile} running planarity_core`);
  const planarityCore = runSimpleBatch({
    replications: settings.replications,
    onProgress: progress,
    scenarios: [
      {
        id: 'planarity_free_none',
        label: 'Free geometry / none',
        params: sanitizeSimulationParams(mergeParams(planarityBase, { planarityMode: 'none' })),
      },
      {
        id: 'planarity_free_reject',
        label: 'Free geometry / reject',
        params: sanitizeSimulationParams(mergeParams(planarityBase, { planarityMode: 'reject_crossings' })),
      },
      {
        id: 'planarity_free_split',
        label: 'Free geometry / split',
        params: sanitizeSimulationParams(mergeParams(planarityBase, { planarityMode: 'split_crossings' })),
      },
    ],
  });

  log(`[beyond-focused] running access_interaction`);
  const accessInteraction = runSimpleBatch({
    replications: settings.replications,
    accessibilityEvaluation: 'common_exogenous_network',
    onProgress: progress,
    scenarios: [
      {
        id: 'interaction_reject_none',
        label: 'Reject / no access',
        params: sanitizeSimulationParams(
          mergeParams(interactionBase, {
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
        id: 'interaction_split_target',
        label: 'Split / target access',
        params: sanitizeSimulationParams(
          mergeParams(interactionBase, {
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
      },
      {
        id: 'interaction_split_both_opportunity',
        label: 'Split / both with opportunity access',
        params: sanitizeSimulationParams(
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
      },
    ],
  });

  const planarityRows = summarizeRows('planarity_core', planarityCore.summaries);
  const interactionRows = summarizeRows('access_interaction', accessInteraction.summaries);
  const summaryRows = [...planarityRows, ...interactionRows];

  const planarityFigureRows = figureRows('planarity_core', planarityRows, [
    'averageClustering',
    'meanEdgeLength',
    'crossingCandidatesAdmitted',
    'splitEvents',
    'generatedIntersectionNodes',
    'cyclomaticNumber',
  ]);
  const interactionFigureRows = figureRows('access_interaction', interactionRows, [
    'meanGravityAccess',
    'meanCumulativeAccess',
    'crossingCandidatesAdmitted',
    'splitEvents',
    'averageClustering',
    'meanEdgeLength',
  ]);

  const memo = `# Beyond Paper Focused Memo

Profile: ${profile}

## Planarity core

${planarityRows
  .map(
    (row) =>
      `- ${row.scenarioLabel}: clustering ${row.averageClustering?.toFixed(3)}, mean edge length ${row.meanEdgeLength?.toFixed(3)}, admitted crossings ${row.crossingCandidatesAdmitted?.toFixed?.(2) ?? 'NA'}, split events ${row.splitEvents?.toFixed?.(2) ?? 'NA'}, generated intersections ${row.generatedIntersectionNodes?.toFixed?.(2) ?? 'NA'}.`,
  )
  .join('\n')}

## Split-planarity accessibility interaction

${interactionRows
  .map(
    (row) =>
      `- ${row.scenarioLabel}: gravity access ${row.meanGravityAccess?.toFixed?.(3) ?? 'NA'}, cumulative access ${row.meanCumulativeAccess?.toFixed?.(3) ?? 'NA'}, admitted crossings ${row.crossingCandidatesAdmitted?.toFixed?.(2) ?? 'NA'}, split events ${row.splitEvents?.toFixed?.(2) ?? 'NA'}, clustering ${row.averageClustering?.toFixed(3)}.`,
  )
  .join('\n')}
`;

  const synthesis = `# Paper Extension Candidates

Profile: ${profile}

## Claim 1. Split crossings is a junction-forming growth family

The planarity core comparison should be read as three different mechanisms, not
three cosmetic renderings of the same process:

- \`none\` leaves crossing-rich growth unresolved
- \`reject_crossings\` suppresses crossing admissions entirely
- \`split_crossings\` admits local crossing candidates and converts them into
  many generated junctions

## Claim 2. Accessibility semantics become substantive once split planarity is active

Within the same split-capable transport-growth setting:

- \`network\` access produces the highest realized accessibility
- \`opportunity\` access produces an intermediate regime
- \`seed\` access produces the weakest accessibility field

These are not just color-scale differences; they emerge while the split
machinery remains active.
`;

  log(`[beyond-focused] writing result bundle to ${outputRoot}`);
  await writeResultBundle(outputRoot, {
    'focused_results.json': JSON.stringify({ planarityCore, accessInteraction }, null, 2),
    'focused_summary.csv': toCsv(summaryRows),
    'planarity_core_figure.csv': toCsv(planarityFigureRows),
    'access_interaction_figure.csv': toCsv(interactionFigureRows),
  });

  return {
    profile,
    outputRoot,
    planarityCore,
    accessInteraction,
    summaryRows,
    planarityFigureRows,
    interactionFigureRows,
    memo,
    synthesis,
  };
}
