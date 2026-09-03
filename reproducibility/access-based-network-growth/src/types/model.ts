export type RunStatus = 'idle' | 'running' | 'paused' | 'done' | 'early_stopped';
export type CapacityMode = 'homogeneous' | 'uniform' | 'lognormal';
export type ImpedanceMode = 'power' | 'exponential';
export type SeedGraphType = 'complete' | 'ring' | 'grid' | 'cross' | 'custom';
export type NodeColorMode = 'degree' | 'residual_capacity' | 'age' | 'component' | 'saturated';
export type AccessSemantics = 'network' | 'seed' | 'opportunity';
export type ArrivalMode = 'uniform' | 'uniform_lattice' | 'network' | 'frontier';
export type MeshMode = 'off' | 'grid_bias';
export type MeshAngleSet = '30' | '45' | '60' | '90';
export type MeshAdjacencyMode = 'none' | 'rook' | 'queen';
export type PlanarityMode = 'none' | 'reject_crossings' | 'split_crossings';
export type PreferenceMode = 'baseline' | 'access';
export type AccessMetric = 'gravity' | 'cumulative';

export interface CustomSeedNode {
  id?: string;
  x: number;
  y: number;
  capacity?: number;
}

export interface CustomSeedGraph {
  nodes: CustomSeedNode[];
  edges: Array<[number, number]>;
}

export interface CapacityParams {
  value?: number | 'very_large';
  low?: number;
  high?: number;
  mean?: number;
  sigma?: number;
}

export interface SimulationParams {
  finalNodeCount: number;
  alpha: number;
  beta: number;
  phi: number;
  lambda?: number;
  impedanceMode: ImpedanceMode;
  planarityMode: PlanarityMode;
  meshMode: MeshMode;
  meshAngleSet: MeshAngleSet;
  meshAdjacencyMode: MeshAdjacencyMode;
  meshNearestCount: number;
  meshOrthogonalBias: number;
  meshSpacingFactor: number;
  arrivalMode: ArrivalMode;
  arrivalDistanceFactor: number;
  arrivalDistanceSdFactor: number;
  accessibilityRadius: number;
  accessibilityDecay: number;
  arrivalPreferenceMode: PreferenceMode;
  arrivalAccessMetric: AccessMetric;
  arrivalAccessStrength: number;
  selectionKernelMode: PreferenceMode;
  accessSelectionMetric: AccessMetric;
  accessSelectionStrength: number;
  kappa: number;
  m0: number;
  eps: number;
  seedGraphType: SeedGraphType;
  capacityMode: CapacityMode;
  capacityValue?: number | 'very_large';
  capacityParams?: CapacityParams;
  rngSeed: number;
  animationSpeedMs: number;
  replicationCount: number;
  trackHistory: boolean;
  degreeThreshold: number;
  accessSemantics: AccessSemantics;
  customSeedGraph?: CustomSeedGraph;
  notes: string;
}

export interface NodeRecord {
  id: string;
  x: number;
  y: number;
  birthStep: number;
  degree: number;
  capacity: number;
  residualCapacity: number;
  saturated: boolean;
  weight?: number;
  typeShare?: number;
  accessValue?: number;
  accessCumulative?: number;
  accessGravity?: number;
  generatedBy?: 'seed' | 'arrival' | 'split_crossing';
  lonely?: boolean;
  latticeU?: number;
  latticeV?: number;
}

export interface EdgeRecord {
  id: string;
  source: string;
  target: string;
  length: number;
  birthStep: number;
  generatedBy?: 'seed' | 'arrival' | 'split_link' | 'intersection_split' | 'reference';
}

export interface SelectionRound {
  feasibleNodeIds: string[];
  probabilities: number[];
  weights: number[];
  selectedId?: string;
}

export interface LastStepDetails {
  newNodeId: string;
  selectedTargetIds: string[];
  truncationOccurred: boolean;
  missingLinks: number;
  selectionRounds: SelectionRound[];
  createdIntersectionIds?: string[];
  retryCount?: number;
  arrivalCommitted?: boolean;
  failureReason?: string;
  arrivalSource?: string | null;
  arrivalSiteAudit?: unknown;
  candidateDiagnostics?: unknown;
}

export interface HistorySnapshot {
  step: number;
  nodeCount: number;
  edgeCount: number;
  metrics: MetricBundle;
}

export interface SimulationState {
  params: SimulationParams;
  nodes: NodeRecord[];
  edges: EdgeRecord[];
  currentStep: number;
  nextNodeIndex?: number;
  status: RunStatus;
  terminationReason?: string;
  truncationEvents: number;
  totalMissingLinks: number;
  splitEvents?: number;
  crossingCandidatesEncountered?: number;
  crossingCandidatesAdmitted?: number;
  rngSeed: number;
  rngState: number;
  history: HistorySnapshot[];
  lastStepDetails?: LastStepDetails;
  warnings: string[];
  latticeMetadata?: unknown;
  referenceLinks?: EdgeRecord[];
}

export interface MetricBundle {
  nodeCount: number;
  edgeCount: number;
  generatedIntersectionNodes: number;
  splitLinkCount: number;
  splitEvents: number;
  crossingCandidatesEncountered: number;
  crossingCandidatesAdmitted: number;
  lonelyNodeCount: number;
  meanDegree: number;
  maxDegree: number;
  degreeGini: number;
  shareAtCapacity: number;
  connectedComponents: number;
  largestComponentSize: number;
  largestComponentShare: number;
  averageClustering: number;
  averagePathLengthLargestComponent: number | null;
  diameterLargestComponent: number | null;
  degreeAssortativity: number | null;
  meanEdgeLength: number;
  medianEdgeLength: number;
  totalNetworkLength: number;
  fractionLeaves: number;
  fractionDegreeAboveThreshold: number;
  cyclomaticNumber: number;
  triangleCount: number;
  squareCount: number;
  crossingCount: number | null;
  crossingRate: number | null;
  approximatePlanar: boolean | null;
  dominantDirectionSector: string;
  dominantDirectionShare: number;
  eastWestBias: number;
  northSouthBias: number;
  meanCumulativeAccess?: number | null;
  meanGravityAccess?: number | null;
  componentAssignments: Record<string, number>;
}

export interface BatchScenario {
  id: string;
  label: string;
  params: SimulationParams;
}

export interface BatchConfig {
  scenarios: BatchScenario[];
  replications: number;
  accessibilityEvaluation?: 'configured' | 'common_exogenous_network';
}

export interface BatchRunRecord {
  scenarioId: string;
  scenarioLabel: string;
  replication: number;
  seed: number;
  metrics: MetricBundle;
  earlyStopped: boolean;
  terminationReason?: string;
  truncationEvents: number;
  totalMissingLinks: number;
  tail: TailFitSummary;
}

export interface BatchScenarioSummary {
  scenarioId: string;
  scenarioLabel: string;
  replications: number;
  earlyStopRate: number;
  truncationRate: number;
  metrics: Record<string, { mean: number; sd: number; q05: number; q50: number; q95: number }>;
  preferredTailModelCounts: Record<string, number>;
}

export interface BatchResult {
  config: BatchConfig;
  runs: BatchRunRecord[];
  summaries: BatchScenarioSummary[];
}

export interface SavedBatchResult {
  id: string;
  createdAt: string;
  label: string;
  result: BatchResult;
}

export interface ValidationMessage {
  level: 'warning' | 'error';
  message: string;
}

export interface ScenarioPreset {
  id: string;
  label: string;
  description: string;
  params: Partial<SimulationParams>;
}

export interface TailFitSummary {
  support: number[];
  ccdf: number[];
  tailN: number;
  kMin: number | null;
  powerAlpha: number | null;
  powerKs: number | null;
  powerAic: number | null;
  expLambda: number | null;
  expAic: number | null;
  lognormalMu: number | null;
  lognormalSigma: number | null;
  lognormalAic: number | null;
  preferredModel: 'power_law' | 'exponential' | 'lognormal' | 'insufficient_tail' | 'fit_failed';
}

export interface ScenarioDocument {
  version: 1;
  name: string;
  params: SimulationParams;
}
