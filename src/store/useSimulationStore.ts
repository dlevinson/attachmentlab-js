import { create } from 'zustand';
import type {
  BatchResult,
  NodeColorMode,
  SavedBatchResult,
  ScenarioPreset,
  SimulationParams,
  SimulationState,
  TailFitSummary,
} from '../types/model';
import { computeNetworkMetrics } from '../metrics/networkMetrics';
import { fitTailModels } from '../metrics/tailFits';
import { scenarioPresets } from '../presets/scenarios';
import { createDefaultParams, initializeSimulation, runSimulation, stepSimulation } from '../model/simulator';
import { getBrowserParityEngine } from '../model/browserParity';
import { mergeScenarioParams } from '../utils/import';

interface BatchUiState {
  isRunning: boolean;
  progress: number;
  result: BatchResult | null;
  saved: SavedBatchResult[];
}

interface ComparisonSlot {
  id: string;
  label: string;
  state: SimulationState;
}

interface UiState {
  nodeColorMode: NodeColorMode;
  edgeColorByLength: boolean;
  showBoundary: boolean;
  showCrossingCount: boolean;
  highlightSaturated: boolean;
  highlightNewest: boolean;
  showAttachmentWeights: boolean;
  paperMode: boolean;
  activePrimaryTab: 'simulation' | 'comparison' | 'batch' | 'paper';
  activeChartTab: 'degree' | 'ccdf' | 'edgeLength' | 'timeSeries' | 'scatter' | 'batch';
  figureCaptionDraft: string;
}

interface StoreState {
  params: SimulationParams;
  simulation: SimulationState;
  metrics: ReturnType<typeof computeNetworkMetrics>;
  tail: TailFitSummary;
  presets: ScenarioPreset[];
  baseline: ComparisonSlot | null;
  comparisons: ComparisonSlot[];
  batch: BatchUiState;
  ui: UiState;
  isPlaying: boolean;
  setParam: <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => void;
  loadPreset: (presetId: string) => void;
  resetSimulation: () => void;
  step: () => void;
  runOnce: () => void;
  setPlaying: (value: boolean) => void;
  setNodeColorMode: (value: NodeColorMode) => void;
  setUiFlag: <K extends keyof UiState>(key: K, value: UiState[K]) => void;
  saveBaseline: () => void;
  saveComparison: () => void;
  removeComparison: (id: string) => void;
  importScenario: (params: Partial<SimulationParams>) => void;
  setBatchProgress: (progress: number) => void;
  setBatchResult: (result: BatchResult | null) => void;
  setSavedBatchResults: (saved: SavedBatchResult[]) => void;
}

function deriveMetrics(state: SimulationState) {
  const engine = getBrowserParityEngine();
  return engine.computeNetworkMetricsWithContext(
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
}

function deriveTail(state: SimulationState) {
  return fitTailModels(state.nodes.map((node) => node.degree));
}

const initialParams = createDefaultParams();
const initialSimulation = initializeSimulation(initialParams);

export const useSimulationStore = create<StoreState>((set, get) => ({
  params: initialParams,
  simulation: initialSimulation,
  metrics: deriveMetrics(initialSimulation),
  tail: deriveTail(initialSimulation),
  presets: scenarioPresets,
  baseline: null,
  comparisons: [],
  batch: {
    isRunning: false,
    progress: 0,
    result: null,
    saved: [],
  },
  ui: {
    nodeColorMode: 'degree',
    edgeColorByLength: false,
    showBoundary: true,
    showCrossingCount: false,
    highlightSaturated: true,
    highlightNewest: true,
    showAttachmentWeights: false,
    paperMode: false,
    activePrimaryTab: 'simulation',
    activeChartTab: 'degree',
    figureCaptionDraft: '',
  },
  isPlaying: false,
  setParam: (key, value) => {
    set((state) => {
      const params = { ...state.params, [key]: value };
      const simulation = initializeSimulation(params);
      return {
        params,
        simulation,
        metrics: deriveMetrics(simulation),
        tail: deriveTail(simulation),
      };
    });
  },
  loadPreset: (presetId) => {
    const preset = get().presets.find((entry) => entry.id === presetId);
    if (!preset) {
      return;
    }
    const params = mergeScenarioParams({ ...get().params, ...preset.params });
    const simulation = initializeSimulation(params);
    set({
      params,
      simulation,
      metrics: deriveMetrics(simulation),
      tail: deriveTail(simulation),
    });
  },
  resetSimulation: () => {
    const simulation = initializeSimulation(get().params);
    set({
      simulation,
      metrics: deriveMetrics(simulation),
      tail: deriveTail(simulation),
      isPlaying: false,
    });
  },
  step: () => {
    const simulation = stepSimulation(get().simulation);
    set({
      simulation,
      metrics: deriveMetrics(simulation),
      tail: deriveTail(simulation),
    });
  },
  runOnce: () => {
    const simulation = runSimulation(get().params);
    set({
      simulation,
      metrics: deriveMetrics(simulation),
      tail: deriveTail(simulation),
      isPlaying: false,
    });
  },
  setPlaying: (value) => set({ isPlaying: value }),
  setNodeColorMode: (value) =>
    set((state) => ({
      ui: {
        ...state.ui,
        nodeColorMode: value,
      },
    })),
  setUiFlag: (key, value) =>
    set((state) => ({
      ui: {
        ...state.ui,
        [key]: value,
      },
    })),
  saveBaseline: () => {
    const state = get().simulation;
    set({
      baseline: {
        id: 'baseline',
        label: 'Baseline',
        state,
      },
    });
  },
  saveComparison: () => {
    const comparisonId = `comparison-${Date.now()}`;
    set((state) => ({
      comparisons: [
        ...state.comparisons,
        {
          id: comparisonId,
          label: `Scenario ${state.comparisons.length + 1}`,
          state: state.simulation,
        },
      ],
    }));
  },
  removeComparison: (id) =>
    set((state) => ({
      comparisons: state.comparisons.filter((entry) => entry.id !== id),
    })),
  importScenario: (params) => {
    const merged = mergeScenarioParams(params);
    const simulation = initializeSimulation(merged);
    set({
      params: merged,
      simulation,
      metrics: deriveMetrics(simulation),
      tail: deriveTail(simulation),
    });
  },
  setBatchProgress: (progress) =>
    set((state) => ({
      batch: {
        ...state.batch,
        isRunning: progress > 0 && progress < 1,
        progress,
      },
    })),
  setBatchResult: (result) =>
    set((state) => ({
      batch: {
        ...state.batch,
        result,
        isRunning: false,
        progress: result ? 1 : 0,
      },
    })),
  setSavedBatchResults: (saved) =>
    set((state) => ({
      batch: {
        ...state.batch,
        saved,
      },
    })),
}));
