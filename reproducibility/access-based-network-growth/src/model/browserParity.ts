import browserCoreSource from '../standalone/browser-core.js?raw';
import type { MetricBundle, ScenarioPreset, SimulationParams, SimulationState } from '../types/model';

interface BrowserParityEngine {
  scenarioPresets: Array<ScenarioPreset & { params: Partial<SimulationParams> }>;
  createDefaultParams: () => SimulationParams;
  sanitizeParams: (params: Partial<SimulationParams> | SimulationParams) => SimulationParams;
  deriveSeed: (baseSeed: number, ...parts: Array<string | number>) => number;
  initializeSimulation: (params: SimulationParams) => SimulationState;
  stepSimulation: (state: SimulationState) => SimulationState;
  runSimulation: (params: SimulationParams) => SimulationState;
  validateSimulationParams: (params: SimulationParams) => Array<{ level: 'warning' | 'error'; message: string }>;
  computeTransportAccessibility: (nodes: SimulationState['nodes'], edges: SimulationState['edges'], params: SimulationParams) => {
    cumulativeById: Record<string, number>;
    gravityById: Record<string, number>;
    meanCumulative: number | null;
    meanGravity: number | null;
    maxCumulative: number | null;
    maxGravity: number | null;
    maxCumulativeNodeId: string | null;
    maxGravityNodeId: string | null;
    semantics?: string;
    available: boolean;
  };
  computePotentialSiteAccessibility: (state: SimulationState, params: SimulationParams) => {
    available: boolean;
    rows: Array<{
      u: number;
      v: number;
      cumulative: number | null;
      gravity: number | null;
      realizableNow: boolean;
    }>;
  };
  computeNetworkMetricsWithContext: (
    nodes: SimulationState['nodes'],
    edges: SimulationState['edges'],
    degreeThreshold?: number,
    latticeMetadata?: unknown,
    splitEvents?: number,
    planarityDiagnostics?: { crossingCandidatesEncountered?: number; crossingCandidatesAdmitted?: number },
  ) => MetricBundle;
  fitTailModels: (degrees: number[], minTailSize?: number) => unknown;
  runBatchConfig: (config: unknown, progressCallback?: ((progress: number) => void) | null) => unknown;
}

let cachedEngine: BrowserParityEngine | null = null;

function buildEngineContext() {
  const context = {
    console,
    Math,
    Date,
    JSON,
    Number,
    String,
    Boolean,
    Array,
    Object,
    Map,
    Set,
    RegExp,
    parseInt,
    parseFloat,
    isNaN,
    Infinity,
    NaN,
  };
  return context;
}

export function getBrowserParityEngine(): BrowserParityEngine {
  if (cachedEngine) {
    return cachedEngine;
  }
  const evaluator = new Function(
    'context',
    `
      const console = context.console;
      const Math = context.Math;
      const Date = context.Date;
      const JSON = context.JSON;
      const Number = context.Number;
      const String = context.String;
      const Boolean = context.Boolean;
      const Array = context.Array;
      const Object = context.Object;
      const Map = context.Map;
      const Set = context.Set;
      const RegExp = context.RegExp;
      const parseInt = context.parseInt;
      const parseFloat = context.parseFloat;
      const isNaN = context.isNaN;
      const Infinity = context.Infinity;
      const NaN = context.NaN;
      const globalThis = context;
      ${browserCoreSource}
      return {
        scenarioPresets,
        createDefaultParams,
        sanitizeParams,
        deriveSeed,
        initializeSimulation,
        stepSimulation,
        runSimulation,
        validateSimulationParams,
        computeTransportAccessibility,
        computePotentialSiteAccessibility,
        computeNetworkMetricsWithContext,
        fitTailModels,
        runBatchConfig,
      };
    `,
  );

  cachedEngine = evaluator(buildEngineContext()) as BrowserParityEngine;
  return cachedEngine;
}
