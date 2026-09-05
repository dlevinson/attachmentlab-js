// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Source files:
// - src/standalone/browser-core.js
// - src/standalone/browser-app.js
// Rebuild with: npm run build:web-standalone

// Shared standalone engine source. Built into web/main.js; imported raw by TS parity wrappers.

// Audit note:
// Comments in this standalone file describe what the current implementation
// actually does today, including exploratory lattice and planarity extensions.
// They are not normative statements of what the research model ought to do.
//
// Model taxonomy used in this browser implementation:
// 1. baseline generalized model
// 2. arrival extensions
// 3. lattice / mesh extensions
// 4. planarity / accessibility extensions
//
// Baseline behavior should remain:
// - arrivalMode = uniform
// - meshMode = off
// - planarityMode = none
// - arrivalPreferenceMode = baseline
// - selectionKernelMode = baseline
// Exploratory controls are intended to affect execution only when explicitly on.
const VERY_LARGE = 'very_large';
const NON_CROSSING_RETRY_LIMIT = 24;
const STORAGE_KEYS = {
  batchResults: 'general-attachment-lab.web.batch-results',
};
const PARAM_LIMITS = {
  finalNodeCount: { min: 2, max: 5000 },
  alpha: { min: 0, max: 10 },
  beta: { min: 0, max: 10 },
  phi: { min: 0, max: 10 },
  lambda: { min: 0, max: 10 },
  arrivalDistanceFactor: { min: 0.25, max: 3 },
  arrivalDistanceSdFactor: { min: 0, max: 2 },
  meshAngleBias: { min: 0, max: 8 },
  meshNearestCount: { min: 1, max: 32 },
  meshOrthogonalBias: { min: 0, max: 8 },
  meshSpacingFactor: { min: 0, max: 2 },
  accessibilityRadius: { min: 0.05, max: 10 },
  accessibilityDecay: { min: 0.1, max: 10 },
  arrivalAccessStrength: { min: 0, max: 8 },
  accessSelectionStrength: { min: 0, max: 8 },
  kappa: { min: 1, max: 12 },
  m0: { min: 2, max: 100 },
  capacityValue: { min: 1, max: 1000 },
  rngSeed: { min: 1, max: 4294967295 },
  animationSpeedMs: { min: 10, max: 5000 },
  replicationCount: { min: 1, max: 200 },
  capacityLow: { min: 0, max: 1000 },
  capacityHigh: { min: 0, max: 1000 },
  capacityMean: { min: 0, max: 10 },
  capacitySigma: { min: 0, max: 3 },
};

const scenarioPresets = [
  {
    id: 'ba_benchmark',
    label: 'BA benchmark',
    description: 'Classical preferential attachment with effectively unlimited capacity and no spatial deterrence.',
    params: {
      finalNodeCount: 250,
      alpha: 1,
      beta: 0,
      phi: 0,
      lambda: 1,
      kappa: 2,
      m0: 5,
      seedGraphType: 'complete',
      arrivalMode: 'uniform',
      planarityMode: 'none',
      meshMode: 'off',
      meshAdjacencyMode: 'none',
      capacityMode: 'homogeneous',
      capacityValue: VERY_LARGE,
      impedanceMode: 'power',
      arrivalPreferenceMode: 'baseline',
      selectionKernelMode: 'baseline',
      arrivalAccessStrength: 0,
      accessSelectionStrength: 0,
    },
  },
  {
    id: 'capacity_only',
    label: 'Capacity only',
    description: 'Finite capacity curbs hub growth without spatial cost.',
    params: {
      finalNodeCount: 250,
      alpha: 1,
      beta: 1,
      phi: 0,
      lambda: 1,
      kappa: 2,
      m0: 5,
      seedGraphType: 'complete',
      arrivalMode: 'uniform',
      planarityMode: 'none',
      meshMode: 'off',
      meshAdjacencyMode: 'none',
      capacityMode: 'homogeneous',
      capacityValue: 8,
      impedanceMode: 'power',
      arrivalPreferenceMode: 'baseline',
      selectionKernelMode: 'baseline',
      arrivalAccessStrength: 0,
      accessSelectionStrength: 0,
    },
  },
  {
    id: 'spatial_only',
    label: 'Spatial only',
    description: 'Cost deterrence shortens edges while preserving preferential attachment.',
    params: {
      finalNodeCount: 250,
      alpha: 1,
      beta: 0,
      phi: 1,
      lambda: 1,
      kappa: 2,
      m0: 5,
      seedGraphType: 'complete',
      arrivalMode: 'uniform',
      planarityMode: 'none',
      meshMode: 'off',
      meshAdjacencyMode: 'none',
      capacityMode: 'homogeneous',
      capacityValue: VERY_LARGE,
      impedanceMode: 'power',
      arrivalPreferenceMode: 'baseline',
      selectionKernelMode: 'baseline',
      arrivalAccessStrength: 0,
      accessSelectionStrength: 0,
    },
  },
  {
    id: 'general_model',
    label: 'General model',
    description: 'Scale, capacity, and distance all contribute to attachment.',
    params: {
      finalNodeCount: 250,
      alpha: 1,
      beta: 1,
      phi: 1,
      lambda: 1,
      kappa: 2,
      m0: 5,
      seedGraphType: 'complete',
      arrivalMode: 'uniform',
      planarityMode: 'none',
      meshMode: 'off',
      meshAdjacencyMode: 'none',
      capacityMode: 'homogeneous',
      capacityValue: 16,
      impedanceMode: 'power',
      arrivalPreferenceMode: 'baseline',
      selectionKernelMode: 'baseline',
      arrivalAccessStrength: 0,
      accessSelectionStrength: 0,
    },
  },
  {
    id: 'gridish_local_mesh',
    label: 'Grid-ish exploratory',
    description: 'Weak preference, sharp saturation, and strong local cost push toward mesh-like growth.',
    params: {
      alpha: 0.1,
      beta: 2,
      phi: 4,
      kappa: 2,
      m0: 4,
      seedGraphType: 'cross',
      arrivalMode: 'network',
      arrivalDistanceFactor: 1,
      capacityMode: 'homogeneous',
      capacityValue: 4,
      impedanceMode: 'power',
      planarityMode: 'reject_crossings',
      meshMode: 'grid_bias',
      meshAngleSet: '90',
      meshAdjacencyMode: 'rook',
      meshNearestCount: 4,
      meshOrthogonalBias: 4,
      meshSpacingFactor: 0.85,
    },
  },
];

function createDefaultParams() {
  return {
    finalNodeCount: 250,
    alpha: 1,
    beta: 1,
    phi: 1,
    lambda: 1,
    impedanceMode: 'power',
    planarityMode: 'none',
    meshMode: 'off',
    meshAngleSet: '90',
    meshAdjacencyMode: 'none',
    meshNearestCount: 6,
    meshOrthogonalBias: 0,
    meshSpacingFactor: 0,
    arrivalMode: 'uniform',
    arrivalDistanceFactor: 1,
    arrivalDistanceSdFactor: 0.35,
    accessibilityRadius: 0.75,
    accessibilityDecay: 3,
    accessSemantics: 'network',
    arrivalPreferenceMode: 'baseline',
    arrivalAccessMetric: 'gravity',
    arrivalAccessStrength: 0,
    selectionKernelMode: 'baseline',
    accessSelectionMetric: 'gravity',
    accessSelectionStrength: 0,
    kappa: 2,
    m0: 5,
    eps: 1e-9,
    seedGraphType: 'complete',
    capacityMode: 'homogeneous',
    capacityValue: 16,
    capacityParams: {},
    rngSeed: 12345,
    animationSpeedMs: 180,
    replicationCount: 20,
    trackHistory: true,
    degreeThreshold: 10,
    notes: '',
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createRng(seed) {
  const normalized = (seed >>> 0) || 1;
  return { seed: normalized, state: normalized };
}

function nextRandom(rng) {
  rng.state = (rng.state + 0x6d2b79f5) >>> 0;
  let t = rng.state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function randomUniform(rng, min = 0, max = 1) {
  return min + (max - min) * nextRandom(rng);
}

function randomPoint(rng) {
  return [nextRandom(rng), nextRandom(rng)];
}

function averageEdgeLength(edges) {
  if (edges.length === 0) {
    return 0.12;
  }
  return edges.reduce((sum, edge) => sum + edge.length, 0) / edges.length;
}

function meshAngleStepDegrees(params) {
  const raw = Number(params.meshAngleSet ?? 90);
  if ([30, 45, 60, 90].includes(raw)) {
    return raw;
  }
  return 90;
}

function latticeBasisStepDegrees(params) {
  const meshStep = meshAngleStepDegrees(params);
  if (meshStep === 30 || meshStep === 60) {
    return 60;
  }
  return 90;
}

function allowedMeshAngles(params) {
  const step = meshAngleStepDegrees(params);
  const angles = [];
  for (let degrees = 0; degrees < 360; degrees += step) {
    angles.push((degrees * Math.PI) / 180);
  }
  return angles;
}

function smallestAngleDifference(a, b) {
  const diff = Math.atan2(Math.sin(a - b), Math.cos(a - b));
  return Math.abs(diff);
}

function snapAngleToAllowed(angle, params) {
  const allowed = allowedMeshAngles(params);
  return allowed.reduce((best, candidate) => (
    best === null || smallestAngleDifference(angle, candidate) < smallestAngleDifference(angle, best)
      ? candidate
      : best
  ), null) ?? angle;
}

function meshBasisForAngle(primaryAngle, params) {
  const step = (latticeBasisStepDegrees(params) * Math.PI) / 180;
  let secondaryAngle = primaryAngle + step;
  let determinant = Math.sin(secondaryAngle - primaryAngle);
  if (Math.abs(determinant) <= 1e-6) {
    secondaryAngle = primaryAngle + Math.PI / 2;
    determinant = Math.sin(secondaryAngle - primaryAngle);
  }
  return {
    basis1: { x: Math.cos(primaryAngle), y: Math.sin(primaryAngle) },
    basis2: { x: Math.cos(secondaryAngle), y: Math.sin(secondaryAngle) },
    determinant,
  };
}

function solveBasisCoefficients(vector, basis1, basis2, determinant) {
  if (Math.abs(determinant) <= 1e-9) {
    return { u: 0, v: 0 };
  }
  return {
    u: (vector.x * basis2.y - vector.y * basis2.x) / determinant,
    v: (-vector.x * basis1.y + vector.y * basis1.x) / determinant,
  };
}

function pointFromBasis(origin, basis1, basis2, u, v, spacing) {
  return {
    x: origin.x + spacing * (u * basis1.x + v * basis2.x),
    y: origin.y + spacing * (u * basis1.y + v * basis2.y),
  };
}

function withLatticeCell(point, u, v) {
  return { ...point, u, v };
}

function dominantAllowedAngle(state, center) {
  const allowed = allowedMeshAngles(state.params);
  const latticeNodes = state.nodes.filter((node) => Number.isFinite(node.latticeU) && Number.isFinite(node.latticeV));
  const sourceNodes = latticeNodes.length > 0 ? latticeNodes : state.nodes;
  return allowed.reduce((best, angle) => {
    const projections = sourceNodes.map((node) => (node.x - center.x) * Math.cos(angle) + (node.y - center.y) * Math.sin(angle));
    const range = projections.length > 0 ? Math.max(...projections) - Math.min(...projections) : 0;
    return !best || range > best.range ? { angle, range } : best;
  }, null)?.angle ?? 0;
}

function generatePointLatticeSeedCells(count, params, primaryAngle = 0) {
  const { basis1, basis2 } = meshBasisForAngle(primaryAngle, params);
  const cells = [];
  const seen = new Set();
  for (let shell = 0; cells.length < count; shell += 1) {
    const shellCells = [];
    for (let u = -shell; u <= shell; u += 1) {
      for (let v = -shell; v <= shell; v += 1) {
        if (latticeShellDistance(u, v, params) !== shell) {
          continue;
        }
        const key = `${u},${v}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        const px = u * basis1.x + v * basis2.x;
        const py = u * basis1.y + v * basis2.y;
        shellCells.push({
          u,
          v,
          radius: Math.hypot(px, py),
          angle: Math.atan2(py, px),
          axisPenalty: Number(!(u === 0 || v === 0 || u === v || u === -v)),
        });
      }
    }
    shellCells
      .sort((left, right) =>
        left.radius - right.radius
        || left.axisPenalty - right.axisPenalty
        || left.angle - right.angle)
      .forEach((cell) => {
        if (cells.length < count) {
          cells.push({ u: cell.u, v: cell.v });
        }
      });
  }
  return cells;
}

function generateRingLatticeSeedCells(count, params, primaryAngle = 0) {
  const { basis1, basis2 } = meshBasisForAngle(primaryAngle, params);
  const cells = [];
  const seen = new Set();
  for (let shell = 1; cells.length < count; shell += 1) {
    const shellCells = [];
    for (let u = -shell; u <= shell; u += 1) {
      for (let v = -shell; v <= shell; v += 1) {
        if (latticeShellDistance(u, v, params) !== shell) {
          continue;
        }
        const key = `${u},${v}`;
        if (seen.has(key)) {
          continue;
        }
        seen.add(key);
        const px = u * basis1.x + v * basis2.x;
        const py = u * basis1.y + v * basis2.y;
        shellCells.push({
          u,
          v,
          shell,
          angle: Math.atan2(py, px),
        });
      }
    }
    shellCells
      .sort((left, right) => left.shell - right.shell || left.angle - right.angle)
      .forEach((cell) => {
        if (cells.length < count) {
          cells.push({ u: cell.u, v: cell.v });
        }
      });
  }
  return cells;
}

function generateGridSeedCells(count) {
  const size = Math.ceil(Math.sqrt(count));
  const cells = [];
  for (let index = 0; index < count; index += 1) {
    const row = Math.floor(index / size);
    const column = index % size;
    cells.push({ u: column, v: row });
  }
  return cells;
}

function centeredSeedAnchor(cells, basis1, basis2, spacing, center = { x: 0.5, y: 0.5 }) {
  if (cells.length === 0) {
    return { ...center };
  }
  const meanU = cells.reduce((sum, cell) => sum + cell.u, 0) / cells.length;
  const meanV = cells.reduce((sum, cell) => sum + cell.v, 0) / cells.length;
  return {
    x: center.x - spacing * (meanU * basis1.x + meanV * basis2.x),
    y: center.y - spacing * (meanU * basis1.y + meanV * basis2.y),
  };
}

function seedSpacingForCells(cells, basis1, basis2, params, primaryAngle = 0) {
  if (cells.length === 0) {
    return Math.max(0.02, targetAwareLatticeSpacing(params, primaryAngle));
  }
  const meanU = cells.reduce((sum, cell) => sum + cell.u, 0) / cells.length;
  const meanV = cells.reduce((sum, cell) => sum + cell.v, 0) / cells.length;
  const maxRadius = Math.max(
    ...cells.map((cell) => {
      const dx = (cell.u - meanU) * basis1.x + (cell.v - meanV) * basis2.x;
      const dy = (cell.u - meanU) * basis1.y + (cell.v - meanV) * basis2.y;
      return Math.hypot(dx, dy);
    }),
    1,
  );
  const seedSpacing = Math.min(0.14, 0.28 / maxRadius);
  return Math.max(0.02, Math.min(seedSpacing, targetAwareLatticeSpacing(params, primaryAngle)));
}

function pointLatticeSeedMaxDegree(params) {
  const cells = generatePointLatticeSeedCells(params.m0, params, 0);
  const cellKeys = new Set(cells.map((cell) => `${cell.u},${cell.v}`));
  const offsets = canonicalSeedNeighborOffsets(params);
  const degreeByKey = new Map(cells.map((cell) => [`${cell.u},${cell.v}`, 0]));
  cells.forEach((cell) => {
    offsets.forEach(([du, dv]) => {
      const neighborKey = `${cell.u + du},${cell.v + dv}`;
      const selfKey = `${cell.u},${cell.v}`;
      if (!cellKeys.has(neighborKey)) {
        return;
      }
      degreeByKey.set(selfKey, (degreeByKey.get(selfKey) ?? 0) + 1);
      degreeByKey.set(neighborKey, (degreeByKey.get(neighborKey) ?? 0) + 1);
    });
  });
  return Math.max(0, ...degreeByKey.values());
}

function gridSeedMaxDegree(params) {
  const cells = generateGridSeedCells(params.m0);
  const cellKeys = new Set(cells.map((cell) => `${cell.u},${cell.v}`));
  const offsets = params.meshMode === 'grid_bias' ? canonicalSeedNeighborOffsets(params) : [[1, 0], [0, 1]];
  const degreeByKey = new Map(cells.map((cell) => [`${cell.u},${cell.v}`, 0]));
  cells.forEach((cell) => {
    offsets.forEach(([du, dv]) => {
      const neighborKey = `${cell.u + du},${cell.v + dv}`;
      const selfKey = `${cell.u},${cell.v}`;
      if (!cellKeys.has(neighborKey)) {
        return;
      }
      degreeByKey.set(selfKey, (degreeByKey.get(selfKey) ?? 0) + 1);
      degreeByKey.set(neighborKey, (degreeByKey.get(neighborKey) ?? 0) + 1);
    });
  });
  return Math.max(0, ...degreeByKey.values());
}

function targetAwareLatticeSpacing(params, primaryAngle = 0) {
  const targetNodes = Math.max(params.finalNodeCount ?? params.m0 ?? 1, params.m0 ?? 1, 1);
  const { determinant } = meshBasisForAngle(primaryAngle, params);
  const cellAreaFactor = Math.max(Math.abs(determinant), 1e-6);
  const usableArea = 0.72;
  return Math.sqrt(usableArea / (targetNodes * cellAreaFactor));
}

function generateCrossSeedCells(count) {
  const cells = [];
  const seen = new Set();
  for (let shell = 0; cells.length < count; shell += 1) {
    const shellCells = [];
    for (let u = -shell; u <= shell; u += 1) {
      const remaining = shell - Math.abs(u);
      const candidates = remaining === 0 ? [[u, 0]] : [[u, remaining], [u, -remaining]];
      candidates.forEach(([candidateU, candidateV]) => {
        const key = `${candidateU},${candidateV}`;
        if (!seen.has(key)) {
          seen.add(key);
          shellCells.push({ u: candidateU, v: candidateV });
        }
      });
    }
    shellCells.sort((left, right) => {
      const leftAxis = Number(!(left.u === 0 || left.v === 0));
      const rightAxis = Number(!(right.u === 0 || right.v === 0));
      return leftAxis - rightAxis || Math.atan2(left.v, left.u) - Math.atan2(right.v, right.u);
    });
    shellCells.forEach((cell) => {
      if (cells.length < count) {
        cells.push(cell);
      }
    });
  }
  return cells;
}

function latticeCoordinatesForPoint(point, latticeMetadata, params) {
  if (!latticeMetadata) {
    return null;
  }
  const { anchor, spacing, primaryAngle } = latticeMetadata;
  const { basis1, basis2, determinant } = meshBasisForAngle(primaryAngle ?? 0, params);
  const coefficients = solveBasisCoefficients({ x: point.x - anchor.x, y: point.y - anchor.y }, basis1, basis2, determinant);
  return { u: Math.round(coefficients.u), v: Math.round(coefficients.v), spacing };
}

function assignLatticeCoordinates(node, latticeMetadata, params) {
  const coordinates = latticeCoordinatesForPoint(node, latticeMetadata, params);
  if (!coordinates) {
    delete node.latticeU;
    delete node.latticeV;
    return node;
  }
  node.latticeU = coordinates.u;
  node.latticeV = coordinates.v;
  return node;
}

function assignArrivalLatticeCoordinates(node, arrivalChoice, latticeMetadata, params) {
  if (arrivalChoice && Number.isFinite(arrivalChoice.latticeU) && Number.isFinite(arrivalChoice.latticeV)) {
    node.latticeU = arrivalChoice.latticeU;
    node.latticeV = arrivalChoice.latticeV;
    return node;
  }
  return assignLatticeCoordinates(node, latticeMetadata, params);
}

function expectedLatticePointForNode(node, latticeMetadata, params) {
  if (!latticeMetadata) {
    return null;
  }
  if (![node.latticeU, node.latticeV].every(Number.isFinite)) {
    return null;
  }
  const { anchor, spacing, primaryAngle } = latticeMetadata;
  const { basis1, basis2 } = meshBasisForAngle(primaryAngle ?? 0, params);
  return pointFromBasis(anchor, basis1, basis2, node.latticeU, node.latticeV, spacing);
}

function passesMeshLocality(arrivingNode, candidateNode, params, latticeMetadata) {
  if (params.meshMode !== 'grid_bias' || (params.meshAdjacencyMode ?? 'none') === 'none') {
    return true;
  }
  const expectedArrival = expectedLatticePointForNode(arrivingNode, latticeMetadata, params);
  const expectedCandidate = expectedLatticePointForNode(candidateNode, latticeMetadata, params);
  if (!expectedArrival || !expectedCandidate) {
    return true;
  }
  const expectedDistance = euclideanDistance(expectedArrival.x, expectedArrival.y, expectedCandidate.x, expectedCandidate.y);
  const actualDistance = euclideanDistance(arrivingNode.x, arrivingNode.y, candidateNode.x, candidateNode.y);
  const baseSpacing = latticeMetadata?.spacing ?? expectedDistance;
  const tolerance = Math.max(baseSpacing * 0.2, expectedDistance * 0.35, 0.02);
  return actualDistance <= expectedDistance + tolerance;
}

function isMeshAdjacentCandidate(arrivingNode, candidateNode, params) {
  if (params.meshMode !== 'grid_bias' || (params.meshAdjacencyMode ?? 'none') === 'none') {
    return true;
  }
  if (![arrivingNode.latticeU, arrivingNode.latticeV].every(Number.isFinite)) {
    return false;
  }
  if (![candidateNode.latticeU, candidateNode.latticeV].every(Number.isFinite)) {
    return false;
  }
  const du = candidateNode.latticeU - arrivingNode.latticeU;
  const dv = candidateNode.latticeV - arrivingNode.latticeV;
  return latticeNeighborOffsets(params).some(([offsetU, offsetV]) => offsetU === du && offsetV === dv);
}

function latticeNeighborOffsets(params) {
  if (latticeBasisStepDegrees(params) === 60) {
    const triangularOffsets = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
    if ((params.meshAdjacencyMode ?? 'none') === 'queen') {
      return [...triangularOffsets, [1, 1], [-1, -1], [2, -1], [-2, 1], [1, -2], [-1, 2]];
    }
    return triangularOffsets;
  }
  return (params.meshAdjacencyMode ?? 'none') === 'queen'
    ? [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
    : [[1, 0], [-1, 0], [0, 1], [0, -1]];
}

function canonicalSeedNeighborOffsets(params) {
  return latticeNeighborOffsets(params).filter(([du, dv]) => du > 0 || (du === 0 && dv > 0));
}

function latticeShellDistance(u, v, params) {
  if (latticeBasisStepDegrees(params) === 60) {
    return Math.max(Math.abs(u), Math.abs(v), Math.abs(u + v));
  }
  return Math.max(Math.abs(u), Math.abs(v));
}

function latticeOccupancyMap(state) {
  const occupied = new Map();
  state.nodes
    .filter((node) => Number.isFinite(node.latticeU) && Number.isFinite(node.latticeV))
    .forEach((node) => {
      occupied.set(`${node.latticeU},${node.latticeV}`, { u: node.latticeU, v: node.latticeV, node });
    });
  return occupied;
}

function arrivalSpacingNodes(state) {
  if (state.params.meshMode !== 'grid_bias') {
    return state.nodes;
  }
  const latticeNodes = state.nodes.filter((node) =>
    Number.isFinite(node.latticeU)
    && Number.isFinite(node.latticeV)
    && node.generatedBy !== 'split_crossing');
  if (latticeNodes.length > 0) {
    return latticeNodes;
  }
  const nonSplitNodes = state.nodes.filter((node) => node.generatedBy !== 'split_crossing');
  return nonSplitNodes.length > 0 ? nonSplitNodes : state.nodes;
}

// A node is treated as frontier only if it is unsaturated, has lattice
// coordinates, and has at least one unoccupied in-bounds neighbor cell in the
// current lattice family. Boundary directions outside the unit square do not
// count as frontier opportunities.
function unsaturatedFrontierNodes(state) {
  const geometry = projectedLatticeGeometry(state);
  if (!geometry) {
    return [];
  }
  const { anchor, spacing, basis1, basis2 } = geometry;
  const occupied = latticeOccupancyMap(state);
  const offsets = latticeNeighborOffsets(state.params);
  return state.nodes.filter((node) => {
    if (!Number.isFinite(node.latticeU) || !Number.isFinite(node.latticeV)) {
      return false;
    }
    if (!(node.degree < node.capacity - 1e-9)) {
      return false;
    }
    return offsets.some(([du, dv]) => {
      const nextU = node.latticeU + du;
      const nextV = node.latticeV + dv;
      if (occupied.has(`${nextU},${nextV}`)) {
        return false;
      }
      const point = pointFromBasis(anchor, basis1, basis2, nextU, nextV, spacing);
      return point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1;
    });
  });
}

// This helper asks a narrower question than the base model:
// given a lattice cell candidate, how many existing nodes are both capacity-
// available and admissible under the current mesh adjacency rule, and, for
// reject-crossings mode, also pass the geometric crossing screen?
function countAttachableMeshNeighbors(state, candidatePoint) {
  const arrivingNode = {
    id: '__candidate__',
    x: candidatePoint.x,
    y: candidatePoint.y,
    latticeU: candidatePoint.u,
    latticeV: candidatePoint.v,
  };
  const byId = nodeMap(state.nodes);
  const attachableNeighborIds = state.nodes
    .filter((node) => node.degree < node.capacity - 1e-9)
    .filter((node) => isMeshAdjacentCandidate(arrivingNode, node, state.params))
    .filter((node) => passesMeshLocality(arrivingNode, node, state.params, state.latticeMetadata))
    .filter((node) => {
      if (state.params.planarityMode !== 'reject_crossings') {
        return true;
      }
      return !edgeWouldCrossExisting(arrivingNode, node, byId, state.edges);
    })
    .map((node) => node.id);
  return {
    attachableNeighborCount: attachableNeighborIds.length,
    attachableNeighborIds,
  };
}

// The projected lattice is anchored either to stored seed metadata or to the
// current node centroid. In mesh mode this turns exploratory angle families
// into an explicit lattice coordinate system used by later arrival heuristics.
// Note that state.lastLatticeAngle is read here but is not currently persisted
// elsewhere in this standalone file.
function projectedLatticeGeometry(state, preferredAngle = null) {
  if (state.params.meshMode !== 'grid_bias' || state.nodes.length === 0) {
    return null;
  }
  const latticeNodes = state.nodes.filter((node) => Number.isFinite(node.latticeU) && Number.isFinite(node.latticeV));
  const sourceNodes = latticeNodes.length > 0 ? latticeNodes : state.nodes;
  const center = {
    x: sourceNodes.reduce((sum, node) => sum + node.x, 0) / sourceNodes.length,
    y: sourceNodes.reduce((sum, node) => sum + node.y, 0) / sourceNodes.length,
  };
  const anchor = state.latticeMetadata?.anchor ?? center;
  const baseSpacing = state.latticeMetadata?.spacing ?? averageEdgeLength(state.edges);
  const spacing = Math.max(0.02, baseSpacing * (state.params.arrivalDistanceFactor ?? 1));
  const primaryAngle = preferredAngle ?? state.lastLatticeAngle ?? state.latticeMetadata?.primaryAngle ?? dominantAllowedAngle(state, center);
  const { basis1, basis2, determinant } = meshBasisForAngle(primaryAngle, state.params);
  return { center, anchor, spacing, primaryAngle, basis1, basis2, determinant };
}

function projectedLatticePoints(state) {
  const geometry = projectedLatticeGeometry(state);
  if (!geometry) {
    return [];
  }
  const { anchor, spacing, basis1, basis2 } = geometry;
  const maxCoeff = Math.max(6, Math.ceil(1 / Math.max(spacing, 0.02)) + 4);
  const points = [];
  for (let u = -maxCoeff; u <= maxCoeff; u += 1) {
    for (let v = -maxCoeff; v <= maxCoeff; v += 1) {
      const point = pointFromBasis(anchor, basis1, basis2, u, v, spacing);
      if (point.x >= 0 && point.x <= 1 && point.y >= 0 && point.y <= 1) {
        points.push(withLatticeCell(point, u, v));
      }
    }
  }
  return points;
}

// "Projected" candidates are outward-shell lattice cells: one step beyond the
// current maximum occupied shell, filtered to in-bounds cells that are not too
// close to existing nodes under the current spacing rule.
function analyzeProjectedLatticeSites(state, preferredAngle = null) {
  const geometry = projectedLatticeGeometry(state, preferredAngle);
  if (!geometry) {
    return { candidates: [], audit: null };
  }
  const { center, anchor, spacing, basis1, basis2, determinant } = geometry;
  const latticeNodes = unsaturatedFrontierNodes(state);
  const sourceNodes = latticeNodes.length > 0 ? latticeNodes : state.nodes.filter((node) => Number.isFinite(node.latticeU) && Number.isFinite(node.latticeV));
  if (sourceNodes.length === 0) {
    return {
      candidates: [],
      audit: {
        considered: 0,
        outOfBounds: 0,
        inwardOrCurrentShell: 0,
        spacingBlocked: 0,
        zeroAttachable: 0,
        candidates: 0,
        samples: [],
      },
    };
  }
  const occupied = latticeOccupancyMap(state);
  let maxShell = 0;
  sourceNodes.forEach((node) => {
    const u = Number.isFinite(node.latticeU) ? node.latticeU : Math.round(solveBasisCoefficients({ x: node.x - anchor.x, y: node.y - anchor.y }, basis1, basis2, determinant).u);
    const v = Number.isFinite(node.latticeV) ? node.latticeV : Math.round(solveBasisCoefficients({ x: node.x - anchor.x, y: node.y - anchor.y }, basis1, basis2, determinant).v);
    maxShell = Math.max(maxShell, latticeShellDistance(u, v, state.params));
  });

  const minimumSeparation = Math.max(spacing * 0.35, spacing * (state.params.meshSpacingFactor ?? 0));
  const spacingNodes = arrivalSpacingNodes(state);
  const seen = new Set();
  const candidates = [];
  const offsets = latticeNeighborOffsets(state.params);
  const audit = {
    considered: 0,
    outOfBounds: 0,
    inwardOrCurrentShell: 0,
    spacingBlocked: 0,
    zeroAttachable: 0,
    candidates: 0,
    samples: [],
  };

  function noteSample(reason, point, extra = {}) {
    if (audit.samples.length >= 12) {
      return;
    }
    audit.samples.push({
      reason,
      u: point.u,
      v: point.v,
      x: point.x,
      y: point.y,
      ...extra,
    });
  }

  occupied.forEach(({ u, v }) => {
    offsets.forEach(([du, dv]) => {
      const nextU = u + du;
      const nextV = v + dv;
      const key = `${nextU},${nextV}`;
      if (occupied.has(key) || seen.has(key)) {
        return;
      }
      seen.add(key);
      audit.considered += 1;
      const point = pointFromBasis(anchor, basis1, basis2, nextU, nextV, spacing);
      if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) {
        audit.outOfBounds += 1;
        noteSample('out_of_bounds', { u: nextU, v: nextV, x: point.x, y: point.y });
        return;
      }
      if (latticeShellDistance(nextU, nextV, state.params) <= maxShell) {
        audit.inwardOrCurrentShell += 1;
        noteSample('not_outward_shell', { u: nextU, v: nextV, x: point.x, y: point.y });
        return;
      }
      const nearest = nearestExistingNode(point, spacingNodes);
      const nearestDistance = nearest ? nearest.distance : Infinity;
      if (nearestDistance < minimumSeparation - 1e-9) {
        const blocker = nearest?.node;
        audit.spacingBlocked += 1;
        noteSample(
          nearestDistance <= 1e-6 ? 'coordinate_collision' : 'spacing_blocked',
          { u: nextU, v: nextV, x: point.x, y: point.y },
          {
            nearestDistance,
            blockerId: blocker?.id,
            blockerLatticeU: blocker?.latticeU,
            blockerLatticeV: blocker?.latticeV,
            blockerGeneratedBy: blocker?.generatedBy || 'arrival',
          },
        );
        return;
      }
      const attachable = countAttachableMeshNeighbors(state, { x: point.x, y: point.y, u: nextU, v: nextV });
      if (attachable.attachableNeighborCount === 0) {
        audit.zeroAttachable += 1;
        noteSample('zero_attachable', { u: nextU, v: nextV, x: point.x, y: point.y }, { nearestDistance });
        return;
      }
      const angle = Math.atan2(point.y - center.y, point.x - center.x);
      const snapped = snapAngleToAllowed(angle, state.params);
      candidates.push({
        u: nextU,
        v: nextV,
        x: point.x,
        y: point.y,
        radial: Math.hypot(point.x - center.x, point.y - center.y),
        angle,
        deviation: smallestAngleDifference(angle, snapped),
        nearestDistance,
        attachableNeighborCount: attachable.attachableNeighborCount,
        attachableNeighborIds: attachable.attachableNeighborIds,
        frontierNeighbors: [
          ...offsets.map(([neighborDu, neighborDv]) => occupied.get(`${nextU + neighborDu},${nextV + neighborDv}`)),
        ].filter(Boolean).map((entry) => entry.node.id),
        spacing,
      });
      audit.candidates += 1;
      noteSample('candidate', { u: nextU, v: nextV, x: point.x, y: point.y }, {
        nearestDistance,
        attachableNeighborCount: attachable.attachableNeighborCount,
      });
    });
  });

  return {
    candidates: candidates.sort((left, right) =>
      right.attachableNeighborCount - left.attachableNeighborCount
      || right.radial - left.radial
      || left.deviation - right.deviation
    ),
    audit,
  };
}

function projectedLatticeCandidates(state, preferredAngle = null) {
  return analyzeProjectedLatticeSites(state, preferredAngle).candidates;
}

// "Near existing network" mode does not sample uniformly over all lattice
// frontier sites. It scores every unoccupied adjacent lattice cell using a
// custom heuristic that rewards current attachability, future growth options,
// and outward shell gain, then sorts candidates by that heuristic.
function analyzeNetworkLatticeSites(state) {
  const geometry = projectedLatticeGeometry(state);
  if (!geometry) {
    return {
      candidates: [],
      audit: null,
    };
  }
  const { center, anchor, spacing, basis1, basis2 } = geometry;
  const occupied = latticeOccupancyMap(state);
  if (occupied.size === 0) {
    return {
      candidates: [],
      audit: {
        considered: 0,
        outOfBounds: 0,
        spacingBlocked: 0,
        zeroAttachable: 0,
        candidates: 0,
        samples: [],
      },
    };
  }
  const seen = new Set();
  const candidates = [];
  const offsets = latticeNeighborOffsets(state.params);
  const minimumSeparation = Math.max(spacing * 0.25, spacing * (state.params.meshSpacingFactor ?? 0));
  const spacingNodes = arrivalSpacingNodes(state);
  const audit = {
    considered: 0,
    outOfBounds: 0,
    spacingBlocked: 0,
    zeroAttachable: 0,
    candidates: 0,
    samples: [],
  };

  function noteSample(reason, point, extra = {}) {
    if (audit.samples.length >= 12) {
      return;
    }
    audit.samples.push({
      reason,
      u: point.u,
      v: point.v,
      x: point.x,
      y: point.y,
      ...extra,
    });
  }

  occupied.forEach(({ u, v }) => {
    offsets.forEach(([du, dv]) => {
      const nextU = u + du;
      const nextV = v + dv;
      const key = `${nextU},${nextV}`;
      if (occupied.has(key) || seen.has(key)) {
        return;
      }
      seen.add(key);
      audit.considered += 1;
      const point = pointFromBasis(anchor, basis1, basis2, nextU, nextV, spacing);
      if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) {
        audit.outOfBounds += 1;
        noteSample('out_of_bounds', { u: nextU, v: nextV, x: point.x, y: point.y });
        return;
      }
      const nearest = nearestExistingNode(point, spacingNodes);
      const nearestDistance = nearest ? nearest.distance : Infinity;
      if (nearestDistance < minimumSeparation - 1e-9) {
        const blocker = nearest?.node;
        audit.spacingBlocked += 1;
        noteSample(
          nearestDistance <= 1e-6 ? 'coordinate_collision' : 'spacing_blocked',
          { u: nextU, v: nextV, x: point.x, y: point.y },
          {
            nearestDistance,
            blockerId: blocker?.id,
            blockerLatticeU: blocker?.latticeU,
            blockerLatticeV: blocker?.latticeV,
            blockerGeneratedBy: blocker?.generatedBy || 'arrival',
          },
        );
        return;
      }
      const candidateRadial = Math.hypot(point.x - center.x, point.y - center.y);
      const candidateShell = latticeShellDistance(nextU, nextV, state.params);
      const occupiedNeighbors = offsets
        .map(([neighborDu, neighborDv]) => occupied.get(`${nextU + neighborDu},${nextV + neighborDv}`))
        .filter(Boolean);
      const attachable = countAttachableMeshNeighbors(state, { x: point.x, y: point.y, u: nextU, v: nextV });
      if (attachable.attachableNeighborCount === 0) {
        audit.zeroAttachable += 1;
        noteSample('zero_attachable', { u: nextU, v: nextV, x: point.x, y: point.y }, { nearestDistance });
        return;
      }
      const sourceShell = occupiedNeighbors.length > 0
        ? Math.max(...occupiedNeighbors.map((entry) => latticeShellDistance(entry.u, entry.v, state.params)))
        : latticeShellDistance(u, v, state.params);
      const sourceRadial = occupiedNeighbors.length > 0
        ? Math.max(...occupiedNeighbors.map((entry) => Math.hypot(entry.node.x - center.x, entry.node.y - center.y)))
        : Math.hypot(point.x - center.x, point.y - center.y);
      const futureGrowthCount = offsets.filter(([futureDu, futureDv]) => {
        const futureU = nextU + futureDu;
        const futureV = nextV + futureDv;
        if (occupied.has(`${futureU},${futureV}`)) {
          return false;
        }
        const futurePoint = pointFromBasis(anchor, basis1, basis2, futureU, futureV, spacing);
        return futurePoint.x >= 0 && futurePoint.x <= 1 && futurePoint.y >= 0 && futurePoint.y <= 1;
      }).length;
      candidates.push({
        u: nextU,
        v: nextV,
        x: point.x,
        y: point.y,
        occupiedNeighborCount: occupiedNeighbors.length,
        attachableNeighborCount: attachable.attachableNeighborCount,
        attachableNeighborIds: attachable.attachableNeighborIds,
        futureGrowthCount,
        nearestDistance,
        radial: candidateRadial,
        outwardGain: candidateRadial - sourceRadial,
        shellGain: candidateShell - sourceShell,
        shell: candidateShell,
      });
      audit.candidates += 1;
      noteSample('candidate', { u: nextU, v: nextV, x: point.x, y: point.y }, {
        nearestDistance,
        attachableNeighborCount: attachable.attachableNeighborCount,
        futureGrowthCount,
      });
    });
  });

  return {
    candidates: candidates.sort((left, right) =>
      right.attachableNeighborCount - left.attachableNeighborCount
      || right.futureGrowthCount - left.futureGrowthCount
      || right.shellGain - left.shellGain
      || right.shell - left.shell
      || right.outwardGain - left.outwardGain
      || right.occupiedNeighborCount - left.occupiedNeighborCount
      || left.nearestDistance - right.nearestDistance
      || left.radial - right.radial
    ),
    audit,
  };
}

function networkBiasedLatticeCandidates(state) {
  return analyzeNetworkLatticeSites(state).candidates;
}

function networkBiasedLatticeSiteAudit(state) {
  return analyzeNetworkLatticeSites(state).audit;
}

function bestRescueLatticeCandidate(state) {
  if (state.params.meshMode !== 'grid_bias') {
    return null;
  }
  const evaluated = [];
  const seen = new Set();

  const networkCandidates = networkBiasedLatticeCandidates(state).map((candidate) => ({
    ...candidate,
    source: 'network',
  }));
  networkCandidates.forEach((candidate) => {
    const key = `${candidate.u},${candidate.v}`;
    if (seen.has(key) || candidate.attachableNeighborCount <= 0) {
      return;
    }
    seen.add(key);
    evaluated.push(candidate);
  });

  projectedLatticeCandidates(state).forEach((candidate) => {
    const key = `${candidate.u},${candidate.v}`;
    if (seen.has(key)) {
      return;
    }
    const attachable = countAttachableMeshNeighbors(state, candidate);
    if (attachable.attachableNeighborCount <= 0) {
      return;
    }
    seen.add(key);
    evaluated.push({
      ...candidate,
      attachableNeighborCount: attachable.attachableNeighborCount,
      attachableNeighborIds: attachable.attachableNeighborIds,
      futureGrowthCount: 0,
      shellGain: 0,
      outwardGain: 0,
      source: 'projected',
    });
  });

  if (evaluated.length === 0) {
    return null;
  }

  evaluated.sort((left, right) =>
    right.attachableNeighborCount - left.attachableNeighborCount
    || right.futureGrowthCount - left.futureGrowthCount
    || right.shellGain - left.shellGain
    || right.shell - left.shell
    || right.outwardGain - left.outwardGain
    || right.occupiedNeighborCount - left.occupiedNeighborCount
    || left.nearestDistance - right.nearestDistance
    || left.radial - right.radial
    || left.nearestDistance - right.nearestDistance);

  return evaluated[0];
}

function nearestExistingDistance(point, nodes) {
  if (!nodes || nodes.length === 0) {
    return Infinity;
  }
  let nearest = Infinity;
  nodes.forEach((node) => {
    const distance = euclideanDistance(point.x, point.y, node.x, node.y);
    if (distance < nearest) {
      nearest = distance;
    }
  });
  return nearest;
}

function nearestExistingNode(point, nodes) {
  if (!nodes || nodes.length === 0) {
    return null;
  }
  let best = null;
  nodes.forEach((node) => {
    const distance = euclideanDistance(point.x, point.y, node.x, node.y);
    if (!best || distance < best.distance) {
      best = { node, distance };
    }
  });
  return best;
}

function randomLogNormal(rng, mean, sigma) {
  const u1 = Math.max(nextRandom(rng), 1e-12);
  const u2 = Math.max(nextRandom(rng), 1e-12);
  const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.exp(mean + sigma * normal);
}

function randomNormal(rng, mean = 0, sd = 1) {
  const u1 = Math.max(nextRandom(rng), 1e-12);
  const u2 = Math.max(nextRandom(rng), 1e-12);
  const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + sd * normal;
}

function weightedChoiceIndex(weights, rng) {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (!Number.isFinite(total) || total <= 0) {
    return Math.floor(nextRandom(rng) * weights.length);
  }
  const threshold = nextRandom(rng) * total;
  let cumulative = 0;
  for (let index = 0; index < weights.length; index += 1) {
    cumulative += weights[index];
    if (threshold <= cumulative || index === weights.length - 1) {
      return index;
    }
  }
  return weights.length - 1;
}

function deriveSeed(baseSeed, ...parts) {
  const payload = `${baseSeed}|${parts.join('|')}`;
  let hash = 2166136261;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) || 1;
}

function resolveCapacityValue(value, params) {
  if (value === VERY_LARGE || value === undefined || value === null) {
    return params.finalNodeCount + params.m0 + params.kappa + 10;
  }
  return Number(value);
}

function minimumCapacityForBirth(m0, kappa, isSeed) {
  return isSeed ? m0 - 1 : kappa;
}

function sampleCapacity(rng, params, isSeed) {
  const minimum = minimumCapacityForBirth(params.m0, params.kappa, isSeed);
  if (params.capacityMode === 'uniform') {
    return Math.max(randomUniform(rng, params.capacityParams.low ?? minimum, params.capacityParams.high ?? minimum + 4), minimum);
  }
  if (params.capacityMode === 'lognormal') {
    return Math.max(randomLogNormal(rng, params.capacityParams.mean ?? 1.5, params.capacityParams.sigma ?? 0.35), minimum);
  }
  return Math.max(resolveCapacityValue(params.capacityValue ?? params.capacityParams.value, params), minimum);
}

function updateCapacityState(node) {
  node.weight = Number.isFinite(node.weight) ? node.weight : 1;
  node.typeShare = Number.isFinite(node.typeShare) ? Math.max(0, Math.min(1, node.typeShare)) : 0.5;
  node.accessValue = Number.isFinite(node.accessValue) ? node.accessValue : 0;
  node.accessCumulative = Number.isFinite(node.accessCumulative) ? node.accessCumulative : 0;
  node.accessGravity = Number.isFinite(node.accessGravity) ? node.accessGravity : 0;
  node.residualCapacity = Math.max(node.capacity - node.degree, 0);
  node.saturated = node.residualCapacity <= 1e-9;
  return node;
}

function applyAccessibilityToNodes(nodes, accessibility) {
  nodes.forEach((node) => {
    const cumulative = accessibility?.cumulativeById?.[node.id] ?? 0;
    const gravity = accessibility?.gravityById?.[node.id] ?? 0;
    node.accessCumulative = cumulative;
    node.accessGravity = gravity;
    // Current standalone scalar access value defaults to gravity access.
    node.accessValue = gravity;
  });
}

function euclideanDistance(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

function nodeIdFromIndex(index) {
  return `node-${index}`;
}

function edgeIdFor(source, target) {
  const [a, b] = [source, target].sort();
  return `edge-${a}-${b}`;
}

function nodeMap(nodes) {
  return new Map(nodes.map((node) => [node.id, node]));
}

function cross2d(ax, ay, bx, by) {
  return ax * by - ay * bx;
}

function segmentIntersectionPoint(a1, a2, b1, b2) {
  const r = { x: a2.x - a1.x, y: a2.y - a1.y };
  const s = { x: b2.x - b1.x, y: b2.y - b1.y };
  const denominator = cross2d(r.x, r.y, s.x, s.y);
  if (Math.abs(denominator) <= 1e-12) {
    return null;
  }
  const qp = { x: b1.x - a1.x, y: b1.y - a1.y };
  const t = cross2d(qp.x, qp.y, s.x, s.y) / denominator;
  const u = cross2d(qp.x, qp.y, r.x, r.y) / denominator;
  if (t <= 1e-9 || t >= 1 - 1e-9 || u <= 1e-9 || u >= 1 - 1e-9) {
    return null;
  }
  return {
    x: a1.x + t * r.x,
    y: a1.y + t * r.y,
    t,
    u,
  };
}

function edgeWouldCrossExisting(sourceNode, targetNode, nodesById, edges) {
  for (const edge of edges) {
    if ([edge.source, edge.target].includes(sourceNode.id) || [edge.source, edge.target].includes(targetNode.id)) {
      continue;
    }
    const source = nodesById.get(edge.source);
    const target = nodesById.get(edge.target);
    if (!source || !target) {
      continue;
    }
    if (segmentIntersectionPoint(sourceNode, targetNode, source, target)) {
      return true;
    }
  }
  return false;
}

function findCrossingsForConnection(sourceNode, targetNode, nodesById, edges) {
  const crossings = [];
  edges.forEach((edge) => {
    if ([edge.source, edge.target].includes(sourceNode.id) || [edge.source, edge.target].includes(targetNode.id)) {
      return;
    }
    const source = nodesById.get(edge.source);
    const target = nodesById.get(edge.target);
    if (!source || !target) {
      return;
    }
    const intersection = segmentIntersectionPoint(sourceNode, targetNode, source, target);
    if (intersection) {
      crossings.push({
        edgeId: edge.id,
        x: intersection.x,
        y: intersection.y,
        t: intersection.t,
      });
    }
  });
  return crossings.sort((a, b) => a.t - b.t);
}

function incrementNodeDegree(byId, nodeId, delta) {
  const node = byId.get(nodeId);
  if (!node) {
    return;
  }
  node.degree = Math.max(0, node.degree + delta);
  if (node.degree > 0) {
    node.lonely = false;
  }
  updateCapacityState(node);
}

function recordReferenceLink(state, sourceId, targetId, birthStep, generatedBy = 'arrival') {
  const byId = nodeMap(state.nodes);
  const source = byId.get(sourceId);
  const target = byId.get(targetId);
  if (!source || !target) {
    return null;
  }
  const link = {
    id: `reference-${birthStep}-${sourceId}-${targetId}-${state.referenceLinks.length}`,
    source: sourceId,
    target: targetId,
    length: euclideanDistance(source.x, source.y, target.x, target.y),
    birthStep,
    generatedBy,
  };
  state.referenceLinks.push(link);
  return link;
}

function removeEdgeFromState(state, edgeId) {
  const index = state.edges.findIndex((edge) => edge.id === edgeId);
  if (index < 0) {
    return null;
  }
  const [edge] = state.edges.splice(index, 1);
  const byId = nodeMap(state.nodes);
  incrementNodeDegree(byId, edge.source, -1);
  incrementNodeDegree(byId, edge.target, -1);
  return edge;
}

function addEdgeToState(state, sourceId, targetId, birthStep, generatedBy = 'arrival') {
  if (!sourceId || !targetId || sourceId === targetId) {
    return null;
  }
  const id = edgeIdFor(sourceId, targetId);
  if (state.edges.some((edge) => edge.id === id)) {
    return null;
  }
  const byId = nodeMap(state.nodes);
  const source = byId.get(sourceId);
  const target = byId.get(targetId);
  if (!source || !target) {
    return null;
  }
  incrementNodeDegree(byId, sourceId, 1);
  incrementNodeDegree(byId, targetId, 1);
  const edge = {
    id,
    source: sourceId,
    target: targetId,
    length: euclideanDistance(source.x, source.y, target.x, target.y),
    birthStep,
    generatedBy,
  };
  state.edges.push(edge);
  return edge;
}

function createGeneratedIntersectionNode(state, x, y, birthStep, rng) {
  const node = updateCapacityState({
    id: nodeIdFromIndex(state.nextNodeIndex),
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
    birthStep,
    degree: 0,
    capacity: sampleCapacity(rng, state.params, false),
    residualCapacity: 0,
    saturated: false,
    generatedBy: 'split_crossing',
    lonely: false,
    weight: 1,
    typeShare: 0.5,
  });
  state.nextNodeIndex += 1;
  state.nodes.push(node);
  return node;
}

function applyConnectionWithPlanarity(state, sourceId, targetId, birthStep, rng) {
  const byId = nodeMap(state.nodes);
  const sourceNode = byId.get(sourceId);
  const targetNode = byId.get(targetId);
  if (!sourceNode || !targetNode) {
    return { addedEdges: [], createdIntersections: [] };
  }

  if (state.params.planarityMode !== 'split_crossings') {
    const edge = addEdgeToState(state, sourceId, targetId, birthStep, 'arrival');
    return { addedEdges: edge ? [edge] : [], createdIntersections: [] };
  }

  const crossings = findCrossingsForConnection(sourceNode, targetNode, byId, state.edges);
  if (crossings.length === 0) {
    const edge = addEdgeToState(state, sourceId, targetId, birthStep, 'arrival');
    return { addedEdges: edge ? [edge] : [], createdIntersections: [] };
  }

  const addedEdges = [];
  const createdIntersections = [];
  let chainStartId = sourceId;

  crossings.forEach((crossing) => {
    const removed = removeEdgeFromState(state, crossing.edgeId);
    if (!removed) {
      return;
    }
    const intersection = createGeneratedIntersectionNode(state, crossing.x, crossing.y, birthStep, rng);
    createdIntersections.push(intersection.id);
    const firstSplit = addEdgeToState(state, removed.source, intersection.id, birthStep, 'split_crossing');
    const secondSplit = addEdgeToState(state, intersection.id, removed.target, birthStep, 'split_crossing');
    const chainEdge = addEdgeToState(state, chainStartId, intersection.id, birthStep, 'split_crossing');
    if (firstSplit) {
      addedEdges.push(firstSplit);
    }
    if (secondSplit) {
      addedEdges.push(secondSplit);
    }
    if (chainEdge) {
      addedEdges.push(chainEdge);
    }
    chainStartId = intersection.id;
  });

  const finalEdge = addEdgeToState(state, chainStartId, targetId, birthStep, 'arrival');
  if (finalEdge) {
    addedEdges.push(finalEdge);
  }
  return { addedEdges, createdIntersections };
}

function expectedSeedMaxDegree(params) {
  if (params.seedGraphType === 'complete') {
    return Math.max(params.m0 - 1, 0);
  }
  if (params.seedGraphType === 'ring') {
    return params.m0 <= 2 ? Math.max(params.m0 - 1, 0) : 2;
  }
  if (params.seedGraphType === 'grid') {
    return gridSeedMaxDegree(params);
  }
  if (params.seedGraphType === 'cross') {
    return pointLatticeSeedMaxDegree(params);
  }
  return Math.max(params.m0 - 1, 0);
}

function clampNumber(value, min, max, fallback = min) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

function clampInteger(value, min, max, fallback = min) {
  return Math.round(clampNumber(value, min, max, fallback));
}

function sanitizeParams(params) {
  const next = clone(params);
  next.finalNodeCount = clampInteger(next.finalNodeCount, PARAM_LIMITS.finalNodeCount.min, PARAM_LIMITS.finalNodeCount.max, 250);
  next.alpha = clampNumber(next.alpha, PARAM_LIMITS.alpha.min, PARAM_LIMITS.alpha.max, 1);
  next.beta = clampNumber(next.beta, PARAM_LIMITS.beta.min, PARAM_LIMITS.beta.max, 1);
  next.phi = clampNumber(next.phi, PARAM_LIMITS.phi.min, PARAM_LIMITS.phi.max, 1);
  next.lambda = clampNumber(next.lambda ?? 1, PARAM_LIMITS.lambda.min, PARAM_LIMITS.lambda.max, 1);
  next.arrivalDistanceFactor = clampNumber(next.arrivalDistanceFactor ?? 1, PARAM_LIMITS.arrivalDistanceFactor.min, PARAM_LIMITS.arrivalDistanceFactor.max, 1);
  next.arrivalDistanceSdFactor = clampNumber(next.arrivalDistanceSdFactor ?? 0.35, PARAM_LIMITS.arrivalDistanceSdFactor.min, PARAM_LIMITS.arrivalDistanceSdFactor.max, 0.35);
  next.meshAngleSet = ['30', '45', '60', '90'].includes(String(next.meshAngleSet)) ? String(next.meshAngleSet) : '90';
  next.meshNearestCount = clampInteger(next.meshNearestCount ?? 6, PARAM_LIMITS.meshNearestCount.min, PARAM_LIMITS.meshNearestCount.max, 6);
  next.meshOrthogonalBias = clampNumber(next.meshOrthogonalBias ?? 0, PARAM_LIMITS.meshOrthogonalBias.min, PARAM_LIMITS.meshOrthogonalBias.max, 0);
  next.meshSpacingFactor = clampNumber(next.meshSpacingFactor ?? 0, PARAM_LIMITS.meshSpacingFactor.min, PARAM_LIMITS.meshSpacingFactor.max, 0);
  next.accessibilityRadius = clampNumber(next.accessibilityRadius ?? 0.75, PARAM_LIMITS.accessibilityRadius.min, PARAM_LIMITS.accessibilityRadius.max, 0.75);
  next.accessibilityDecay = clampNumber(next.accessibilityDecay ?? 3, PARAM_LIMITS.accessibilityDecay.min, PARAM_LIMITS.accessibilityDecay.max, 3);
  next.accessSemantics = ['network', 'seed', 'opportunity'].includes(String(next.accessSemantics)) ? String(next.accessSemantics) : 'network';
  next.arrivalPreferenceMode = next.arrivalPreferenceMode === 'access' ? 'access' : 'baseline';
  next.arrivalAccessMetric = next.arrivalAccessMetric === 'cumulative' ? 'cumulative' : 'gravity';
  next.arrivalAccessStrength = clampNumber(next.arrivalAccessStrength ?? 0, PARAM_LIMITS.arrivalAccessStrength.min, PARAM_LIMITS.arrivalAccessStrength.max, 0);
  next.selectionKernelMode = next.selectionKernelMode === 'access' ? 'access' : 'baseline';
  next.accessSelectionMetric = next.accessSelectionMetric === 'cumulative' ? 'cumulative' : 'gravity';
  next.accessSelectionStrength = clampNumber(next.accessSelectionStrength ?? 0, PARAM_LIMITS.accessSelectionStrength.min, PARAM_LIMITS.accessSelectionStrength.max, 0);
  next.kappa = clampInteger(next.kappa, PARAM_LIMITS.kappa.min, Math.min(PARAM_LIMITS.kappa.max, Math.max(next.finalNodeCount - 1, 1)), 2);
  next.m0 = clampInteger(
    next.m0,
    Math.max(PARAM_LIMITS.m0.min, next.kappa + 1),
    Math.min(PARAM_LIMITS.m0.max, next.finalNodeCount),
    Math.max(5, next.kappa + 1),
  );
  if (typeof next.capacityValue === 'number') {
    next.capacityValue = clampInteger(
      next.capacityValue,
      Math.max(PARAM_LIMITS.capacityValue.min, next.kappa, next.m0 - 1),
      PARAM_LIMITS.capacityValue.max,
      16,
    );
  }
  next.rngSeed = clampInteger(next.rngSeed, PARAM_LIMITS.rngSeed.min, PARAM_LIMITS.rngSeed.max, 12345);
  next.animationSpeedMs = clampInteger(next.animationSpeedMs, PARAM_LIMITS.animationSpeedMs.min, PARAM_LIMITS.animationSpeedMs.max, 180);
  next.replicationCount = clampInteger(next.replicationCount, PARAM_LIMITS.replicationCount.min, PARAM_LIMITS.replicationCount.max, 20);
  next.capacityParams = { ...(next.capacityParams || {}) };
  if (next.capacityMode === 'uniform') {
    next.capacityParams.low = clampInteger(next.capacityParams.low ?? 4, PARAM_LIMITS.capacityLow.min, PARAM_LIMITS.capacityLow.max, 4);
    next.capacityParams.high = clampInteger(next.capacityParams.high ?? 12, PARAM_LIMITS.capacityHigh.min, PARAM_LIMITS.capacityHigh.max, 12);
    if (next.capacityParams.high < next.capacityParams.low) {
      next.capacityParams.high = next.capacityParams.low;
    }
  }
  if (next.capacityMode === 'lognormal') {
    next.capacityParams.mean = clampNumber(next.capacityParams.mean ?? 1.5, PARAM_LIMITS.capacityMean.min, PARAM_LIMITS.capacityMean.max, 1.5);
    next.capacityParams.sigma = clampNumber(next.capacityParams.sigma ?? 0.35, PARAM_LIMITS.capacitySigma.min, PARAM_LIMITS.capacitySigma.max, 0.35);
  }
  return next;
}

function validateSimulationParams(params) {
  const messages = [];
  const seedMaxDegree = expectedSeedMaxDegree(params);

  if (params.finalNodeCount < params.m0) {
    messages.push({ level: 'error', message: 'Final node count must be at least m0.' });
  }
  if (params.m0 < params.kappa + 1) {
    messages.push({ level: 'error', message: 'm0 must be at least kappa + 1.' });
  }
  if (params.kappa < 1) {
    messages.push({ level: 'error', message: 'kappa must be at least 1.' });
  }
  if ([params.alpha, params.beta, params.phi, params.lambda ?? 1].some((value) => Number(value) < 0)) {
    messages.push({ level: 'error', message: 'alpha, beta, phi, and lambda must be non-negative.' });
  }
  if (params.capacityMode === 'homogeneous' && typeof params.capacityValue === 'number' && params.capacityValue < Math.max(params.kappa, params.m0 - 1)) {
    messages.push({ level: 'error', message: 'Homogeneous capacity must be at least max(kappa, m0 - 1).' });
  }
  if (params.capacityMode === 'homogeneous' && typeof params.capacityValue === 'number' && params.capacityValue < seedMaxDegree) {
    messages.push({ level: 'error', message: `Homogeneous capacity K must be at least the seed graph's maximum degree (${seedMaxDegree}) for the chosen seed.` });
  }
  if (params.seedGraphType === 'complete' && params.m0 >= 5) {
    messages.push({ level: 'warning', message: 'A complete seed with m0 >= 5 is non-planar by construction, so edge crossings at the start are expected.' });
  }
  if (params.capacityMode === 'homogeneous' && typeof params.capacityValue === 'number' && params.capacityValue < params.kappa + 1) {
    messages.push({ level: 'warning', message: 'Capacity is only slightly above kappa, so early stopping or truncation is likely.' });
  }
  if (
    params.finalNodeCount > params.m0
    && params.capacityMode === 'homogeneous'
    && typeof params.capacityValue === 'number'
    && params.capacityValue === seedMaxDegree
  ) {
    messages.push({ level: 'warning', message: 'This seed graph starts at or above the chosen homogeneous capacity, so growth may stop immediately.' });
  }
  if (params.alpha === 0 && params.beta === 0 && params.phi === 0) {
    messages.push({ level: 'warning', message: 'All exponents are zero, so attachment becomes nearly uniform among feasible nodes.' });
  }
  if (params.capacityMode === 'homogeneous' && typeof params.capacityValue === 'number' && params.capacityValue < params.kappa) {
    messages.push({ level: 'warning', message: 'K is below kappa, so most arrivals cannot realize all requested links.' });
  }
  if (params.impedanceMode === 'exponential' && (params.lambda ?? 1) === 0) {
    messages.push({ level: 'warning', message: 'Exponential impedance with lambda = 0 removes distance deterrence.' });
  }
  if (params.impedanceMode === 'power' && params.phi > 6) {
    messages.push({ level: 'warning', message: 'Very high phi makes attachment extremely local and can slow the browser view; values around 3 to 5 are usually easier to inspect.' });
  }
  if (params.impedanceMode === 'exponential' && (params.lambda ?? 1) > 6) {
    messages.push({ level: 'warning', message: 'Very high lambda makes attachment extremely local and can slow the browser view; moderate values are usually easier to inspect.' });
  }
  if (
    (params.arrivalMode === 'frontier' || params.arrivalMode === 'network')
    && params.seedGraphType !== 'grid'
    && params.seedGraphType !== 'ring'
    && params.seedGraphType !== 'cross'
    && params.meshMode !== 'grid_bias'
  ) {
    messages.push({ level: 'warning', message: 'Frontier arrivals are easiest to interpret with a grid or ring seed; with a complete random seed the occupied region is less structured.' });
  }
  if (params.planarityMode === 'split_crossings') {
    messages.push({ level: 'warning', message: 'Split-crossings inserts new intersection nodes beyond the target arrival count N, so total node count can exceed the current step count.' });
  }
  if (params.meshMode === 'grid_bias') {
    messages.push({ level: 'warning', message: `Mesh regularization is active, so nearest-candidate filtering, allowed-angle snapping (${meshAngleStepDegrees(params)} degrees), and arrival spacing are modifying the baseline attachment process.` });
    if (params.seedGraphType === 'cross' && latticeBasisStepDegrees(params) === 60 && params.m0 < 7) {
      messages.push({ level: 'warning', message: 'A point-lattice seed on the triangular family is most symmetric with m0 = 7 (center plus six nearest neighbors); smaller m0 values truncate that first shell.' });
    }
    if ((params.meshAdjacencyMode ?? 'none') !== 'none') {
      messages.push({ level: 'warning', message: `Mesh adjacency is ${params.meshAdjacencyMode}, so feasible targets are restricted to immediate lattice neighbors of the new arrival cell.` });
    }
    if (params.arrivalMode === 'uniform') {
      messages.push({ level: 'warning', message: 'Uniform in square ignores lattice-biased arrival placement. Use Near existing network, Outside occupied region, or Uniform on lattice for more structured mesh experiments.' });
    }
  }
  if (params.selectionKernelMode === 'access') {
    messages.push({ level: 'warning', message: `Access-weighted target selection is active, using ${params.accessSelectionMetric} ${String(params.accessSemantics || 'network')} accessibility with strength ${Number(params.accessSelectionStrength ?? 0).toFixed(2)}.` });
  }
  if (params.arrivalPreferenceMode === 'access') {
    messages.push({ level: 'warning', message: `Access-weighted arrival-site ranking is active, using ${params.arrivalAccessMetric} ${String(params.accessSemantics || 'network')} accessibility with strength ${Number(params.arrivalAccessStrength ?? 0).toFixed(2)}.` });
  }
  return messages;
}

// Seed construction supports several exploratory seeds. For the lattice-based
// "cross" seed, the code generates cells in lattice coordinates and then
// connects only canonical neighbor offsets. This cleanup pass stops silently
// raising seed capacities after the seed is wired; invalid homogeneous K values
// are rejected in validation instead.
function createSeedGraph(params, rng) {
  const positions = [];
  const seedCells = [];
  let latticeMetadata = null;
  if (params.seedGraphType === 'grid') {
    const cells = generateGridSeedCells(params.m0);
    if (params.meshMode === 'grid_bias') {
      const primaryAngle = 0;
      const { basis1, basis2 } = meshBasisForAngle(primaryAngle, params);
      const spacing = seedSpacingForCells(cells, basis1, basis2, params, primaryAngle);
      const anchor = centeredSeedAnchor(cells, basis1, basis2, spacing);
      cells.forEach((cell) => {
        seedCells.push(cell);
        const point = pointFromBasis(anchor, basis1, basis2, cell.u, cell.v, spacing);
        positions.push([point.x, point.y]);
      });
      latticeMetadata = {
        anchor,
        spacing,
        primaryAngle,
      };
    } else {
      const size = Math.ceil(Math.sqrt(params.m0));
      const span = Math.min(0.36, Math.max(0.18, 0.18 * Math.max(size - 1, 1)));
      const start = 0.5 - span / 2;
      const denom = Math.max(size - 1, 1);
      cells.forEach((cell) => {
        seedCells.push(cell);
        positions.push([start + (cell.u / denom) * span, start + (cell.v / denom) * span]);
      });
      latticeMetadata = {
        anchor: { x: start, y: start },
        spacing: denom > 0 ? span / denom : span,
        primaryAngle: 0,
      };
    }
  } else if (params.seedGraphType === 'cross') {
    const cells = generatePointLatticeSeedCells(params.m0, params, 0);
    const { basis1, basis2 } = meshBasisForAngle(0, params);
    const maxRadius = Math.max(
      ...cells.map((cell) => Math.hypot(cell.u * basis1.x + cell.v * basis2.x, cell.u * basis1.y + cell.v * basis2.y)),
      1,
    );
    const seedSpacing = Math.min(0.14, 0.28 / maxRadius);
    const spacing = Math.max(0.02, Math.min(seedSpacing, targetAwareLatticeSpacing(params, 0)));
    const anchor = { x: 0.5, y: 0.5 };
    cells.forEach((cell) => {
      seedCells.push(cell);
      const point = pointFromBasis(anchor, basis1, basis2, cell.u, cell.v, spacing);
      positions.push([point.x, point.y]);
    });
    latticeMetadata = {
      anchor,
      spacing,
      primaryAngle: 0,
    };
  } else if (params.seedGraphType === 'ring' && params.meshMode === 'grid_bias') {
    const primaryAngle = 0;
    const cells = generateRingLatticeSeedCells(params.m0, params, primaryAngle);
    const { basis1, basis2 } = meshBasisForAngle(primaryAngle, params);
    const spacing = seedSpacingForCells(cells, basis1, basis2, params, primaryAngle);
    const anchor = centeredSeedAnchor(cells, basis1, basis2, spacing);
    cells.forEach((cell) => {
      seedCells.push(cell);
      const point = pointFromBasis(anchor, basis1, basis2, cell.u, cell.v, spacing);
      positions.push([point.x, point.y]);
    });
    latticeMetadata = {
      anchor,
      spacing,
      primaryAngle,
    };
  } else if (params.seedGraphType === 'ring') {
    const radius = 0.38;
    for (let index = 0; index < params.m0; index += 1) {
      const angle = (Math.PI * 2 * index) / params.m0;
      positions.push([0.5 + radius * Math.cos(angle), 0.5 + radius * Math.sin(angle)]);
    }
  } else if (params.seedGraphType === 'complete' && params.meshMode === 'grid_bias') {
    const primaryAngle = 0;
    const cells = generatePointLatticeSeedCells(params.m0, params, primaryAngle);
    const { basis1, basis2 } = meshBasisForAngle(primaryAngle, params);
    const spacing = seedSpacingForCells(cells, basis1, basis2, params, primaryAngle);
    const anchor = centeredSeedAnchor(cells, basis1, basis2, spacing);
    cells.forEach((cell) => {
      seedCells.push(cell);
      const point = pointFromBasis(anchor, basis1, basis2, cell.u, cell.v, spacing);
      positions.push([point.x, point.y]);
    });
    latticeMetadata = {
      anchor,
      spacing,
      primaryAngle,
    };
  } else {
    for (let index = 0; index < params.m0; index += 1) {
      positions.push(randomPoint(rng));
    }
  }

  const nodes = positions.map(([x, y], index) =>
    updateCapacityState({
      id: nodeIdFromIndex(index),
      x,
      y,
      birthStep: 0,
      degree: 0,
      capacity: sampleCapacity(rng, params, true),
      residualCapacity: 0,
      saturated: false,
      latticeU: seedCells[index]?.u,
      latticeV: seedCells[index]?.v,
      weight: 1,
      typeShare: 0.5,
    }),
  );

  const edges = [];

  function connect(sourceIndex, targetIndex) {
    const source = nodes[sourceIndex];
    const target = nodes[targetIndex];
    if (!source || !target || source.id === target.id) {
      return;
    }
    const id = edgeIdFor(source.id, target.id);
    if (edges.some((edge) => edge.id === id)) {
      return;
    }
    source.degree += 1;
    target.degree += 1;
    updateCapacityState(source);
    updateCapacityState(target);
    edges.push({
      id,
      source: source.id,
      target: target.id,
      length: euclideanDistance(source.x, source.y, target.x, target.y),
      birthStep: 0,
    });
  }

  if (params.seedGraphType === 'ring') {
    for (let index = 0; index < params.m0; index += 1) {
      connect(index, (index + 1) % params.m0);
    }
  } else if (params.seedGraphType === 'grid' || params.seedGraphType === 'cross') {
    const indexByCell = new Map(seedCells.map((cell, index) => [`${cell.u},${cell.v}`, index]));
    const offsets = params.seedGraphType === 'cross'
      ? canonicalSeedNeighborOffsets(params)
      : (params.meshMode === 'grid_bias' ? canonicalSeedNeighborOffsets(params) : [[1, 0], [0, 1]]);
    seedCells.forEach((cell, index) => {
      offsets.forEach(([du, dv]) => {
        const neighborIndex = indexByCell.get(`${cell.u + du},${cell.v + dv}`);
        if (Number.isInteger(neighborIndex)) {
          connect(index, neighborIndex);
        }
      });
    });
  } else {
    for (let source = 0; source < params.m0; source += 1) {
      for (let target = source + 1; target < params.m0; target += 1) {
        connect(source, target);
      }
    }
  }

  nodes.forEach((node) => {
    updateCapacityState(node);
    if (node.degree > node.capacity + 1e-9) {
      throw new Error(`Seed node ${node.id} exceeds its capacity under the current seed and capacity settings.`);
    }
  });

  return { nodes, edges, latticeMetadata };
}

function computeAttachmentLogWeight(node, cost, params) {
  const remainingCapacity = Math.max(node.capacity - node.degree, 0);
  const logScaleTerm = params.alpha * Math.log(node.degree + params.eps);
  const logSaturationTerm = params.beta * Math.log(Math.max(remainingCapacity, params.eps));
  if (params.impedanceMode === 'exponential') {
    return logScaleTerm + logSaturationTerm - (params.lambda ?? 1) * cost;
  }
  return logScaleTerm + logSaturationTerm - params.phi * Math.log(cost + params.eps);
}

function accessSelectionLogAdjustment(nodeId, accessContext) {
  if (!accessContext || !accessContext.lookup || !accessContext.strength) {
    return 0;
  }
  return accessContext.strength * Math.log1p(accessContext.lookup[nodeId] ?? 0);
}

function computeMeshLogAdjustment(arrivingNode, node, params) {
  if (params.meshMode !== 'grid_bias') {
    return 0;
  }
  const dx = node.x - arrivingNode.x;
  const dy = node.y - arrivingNode.y;
  const angle = Math.atan2(dy, dx);
  if (!Number.isFinite(angle)) {
    return 0;
  }
  const snapped = snapAngleToAllowed(angle, params);
  const deviation = smallestAngleDifference(angle, snapped);
  return -((params.meshOrthogonalBias ?? 0) * deviation / Math.PI) * 2;
}

function computeAttachmentWeight(node, cost, params) {
  return Math.exp(Math.min(computeAttachmentLogWeight(node, cost, params), 700));
}

function computeFeasibleProbabilities(arrivingNode, candidateNodes, params, accessContext = null) {
  // Probability normalization is intentionally capacity-only. Exploratory mesh,
  // locality, and planarity screens should happen before this function, not in
  // the baseline kernel math itself.
  const feasible = candidateNodes
    .filter((node) => node.degree < node.capacity - 1e-9)
    .map((node) => {
      const cost = euclideanDistance(arrivingNode.x, arrivingNode.y, node.x, node.y);
      const accessValue = accessContext?.lookup?.[node.id] ?? 0;
      const logWeight = computeAttachmentLogWeight(node, cost, params)
        + computeMeshLogAdjustment(arrivingNode, node, params)
        + accessSelectionLogAdjustment(node.id, accessContext);
      return { nodeId: node.id, weight: 0, probability: 0, logWeight, accessValue, cost };
    });

  if (feasible.length === 0) {
    return feasible;
  }
  const maxLogWeight = Math.max(...feasible.map((entry) => entry.logWeight));
  feasible.forEach((entry) => {
    const scaledWeight = Math.exp(entry.logWeight - maxLogWeight);
    entry.weight = Number.isFinite(scaledWeight) ? scaledWeight : 0;
  });
  let total = feasible.reduce((sum, entry) => sum + entry.weight, 0);
  if (!Number.isFinite(total) || total <= 0) {
    total = feasible.length;
    feasible.forEach((entry) => { entry.weight = 1; });
  }
  feasible.forEach((entry) => {
    entry.probability = entry.weight / total;
  });
  return feasible;
}

function distanceToSquareBoundary(point, dx, dy) {
  const candidates = [];
  if (dx > 1e-9) {
    candidates.push((1 - point.x) / dx);
  } else if (dx < -1e-9) {
    candidates.push((0 - point.x) / dx);
  }
  if (dy > 1e-9) {
    candidates.push((1 - point.y) / dy);
  } else if (dy < -1e-9) {
    candidates.push((0 - point.y) / dy);
  }
  const positives = candidates.filter((value) => Number.isFinite(value) && value > 0);
  return positives.length > 0 ? Math.min(...positives) : 0;
}

function positiveArrivalDistance(rng, mean, sd) {
  if (sd <= 1e-9) {
    return Math.max(mean, 0.02);
  }
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const sample = randomNormal(rng, mean, sd);
    if (sample > 0.02) {
      return sample;
    }
  }
  return Math.max(mean, 0.02);
}

function frontierArrivalPoint(state, rng) {
  // "Outside occupied region" is heuristic. In mesh mode it first tries a
  // snapped-angle projected lattice shell, then exterior lattice points, then
  // any lattice point with large separation, and finally falls back to a
  // uniform random point if all structured attempts fail.
  const center = {
    x: state.nodes.reduce((sum, node) => sum + node.x, 0) / state.nodes.length,
    y: state.nodes.reduce((sum, node) => sum + node.y, 0) / state.nodes.length,
  };
  const meanDistance = Math.max(0.02, averageEdgeLength(state.edges) * (state.params.arrivalDistanceFactor ?? 1));
  const sdDistance = Math.max(0, meanDistance * (state.params.arrivalDistanceSdFactor ?? 0.35));
  const spacingFloor = state.params.meshMode === 'grid_bias'
    ? Math.max(0, meanDistance * (state.params.meshSpacingFactor ?? 0))
    : 0;

  if (state.params.meshMode === 'grid_bias') {
    const arrivalAccessContext = buildArrivalAccessContext(state.params);
    const spacingNodes = arrivalSpacingNodes(state);
    const allowed = allowedMeshAngles(state.params);
    const targetAngle = allowed[Math.floor(nextRandom(rng) * allowed.length)] ?? 0;
    const projectedAnalysis = analyzeProjectedLatticeSites(state, targetAngle);
    const candidates = projectedAnalysis.candidates;
    if (candidates.length > 0) {
      const siteAccessLookup = arrivalAccessContext
        ? siteAccessibilityLookup(
          computeSiteAccessibilityRows(state, state.params, { available: true, source: 'frontier_projected', candidates }),
          arrivalAccessContext.metric,
        )
        : new Map();
      const targetDistance = positiveArrivalDistance(rng, meanDistance, sdDistance);
      const ranked = candidates
        .map((candidate) => {
          const angularPenalty = smallestAngleDifference(candidate.angle, targetAngle);
          const distancePenalty = Math.abs(candidate.nearestDistance - targetDistance) / Math.max(targetDistance, 0.02);
          const accessValue = siteAccessLookup.get(`${candidate.u},${candidate.v}`) ?? 0;
          const score = angularPenalty * 2.2 + distancePenalty - candidate.radial * 0.08
            - (arrivalAccessContext ? arrivalAccessContext.strength * Math.log1p(accessValue) : 0);
          return { ...candidate, score, tieNoise: nextRandom(rng) };
        })
        .sort((left, right) => left.score - right.score || left.tieNoise - right.tieNoise);
      const pool = ranked.slice(0, Math.min(6, ranked.length));
      const chosen = pool[Math.floor(nextRandom(rng) * pool.length)] || ranked[0];
      if (chosen) {
        return { point: [chosen.x, chosen.y], latticeU: chosen.u, latticeV: chosen.v, siteAudit: projectedAnalysis.audit, source: 'frontier_projected' };
      }
    }
    // Keep frontier mode on the same attachable-site logic as network mode.
    // If there are no outward-shell sites that can actually attach, fall back
    // to the local network candidate pool rather than to looser lattice-wide
    // heuristics.
    const networkAnalysis = analyzeNetworkLatticeSites(state);
    if (networkAnalysis.candidates.length > 0) {
      const siteAccessLookup = arrivalAccessContext
        ? siteAccessibilityLookup(
          computeSiteAccessibilityRows(state, state.params, { available: true, source: 'frontier_network_fallback', candidates: networkAnalysis.candidates }),
          arrivalAccessContext.metric,
        )
        : new Map();
      const pool = [...networkAnalysis.candidates]
        .map((candidate) => ({
          ...candidate,
          tieNoise: nextRandom(rng),
          siteAccessValue: siteAccessLookup.get(`${candidate.u},${candidate.v}`) ?? 0,
        }))
        .sort((left, right) =>
          right.attachableNeighborCount - left.attachableNeighborCount
          || right.futureGrowthCount - left.futureGrowthCount
          || right.shellGain - left.shellGain
          || right.shell - left.shell
          || (arrivalAccessContext ? right.siteAccessValue - left.siteAccessValue : 0)
          || right.outwardGain - left.outwardGain
          || right.occupiedNeighborCount - left.occupiedNeighborCount
          || left.nearestDistance - right.nearestDistance
          || left.radial - right.radial
          || left.tieNoise - right.tieNoise
        )
        .slice(0, Math.min(8, networkAnalysis.candidates.length));
      const chosen = pool[Math.floor(nextRandom(rng) * pool.length)] || networkAnalysis.candidates[0];
      if (chosen) {
        return {
          point: [chosen.x, chosen.y],
          latticeU: chosen.u,
          latticeV: chosen.v,
          source: 'frontier_network_fallback',
          siteAudit: {
            preferred: projectedAnalysis.audit,
            fallback: networkAnalysis.audit,
          },
        };
      }
    }
    return { point: null, siteAudit: projectedAnalysis.audit, source: 'frontier_empty' };
  }

  for (let attempt = 0; attempt < 96; attempt += 1) {
    const frontierNode = state.nodes.reduce((best, node) => {
      const radial = Math.hypot(node.x - center.x, node.y - center.y);
      return !best || radial > best.radial ? { node, radial } : best;
    }, null)?.node;
    if (!frontierNode) {
      break;
    }
    const radialAngle = Math.atan2(frontierNode.y - center.y, frontierNode.x - center.x);
    const directionAngle = state.params.meshMode === 'grid_bias'
      ? snapAngleToAllowed(radialAngle, state.params)
      : randomUniform(rng, 0, Math.PI * 2);
    const dx = Math.cos(directionAngle);
    const dy = Math.sin(directionAngle);
    const available = distanceToSquareBoundary(frontierNode, dx, dy);
    if (available <= 0.02) {
      continue;
    }
    const sampledDistance = positiveArrivalDistance(rng, meanDistance, sdDistance);
    if (sampledDistance >= available) {
      continue;
    }
    if (state.params.meshMode === 'grid_bias') {
      const spacing = Math.max(meanDistance, 0.02);
      const { basis1, basis2, determinant } = meshBasisForAngle(directionAngle, state.params);
      const frontierVector = { x: frontierNode.x - center.x, y: frontierNode.y - center.y };
      const frontierCoeffs = solveBasisCoefficients(frontierVector, basis1, basis2, determinant);
      const outwardSteps = Math.max(1, Math.round(sampledDistance / spacing));
      const lateralOffsets = [0, 1, -1, 2, -2];
      for (const offset of lateralOffsets) {
        const point = pointFromBasis(
          center,
          basis1,
          basis2,
          Math.round(frontierCoeffs.u) + outwardSteps,
          Math.round(frontierCoeffs.v) + offset,
          spacing,
        );
        if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) {
          continue;
        }
        if (spacingFloor > 0 && nearestExistingDistance(point, spacingNodes) < spacingFloor) {
          continue;
        }
        return { point: [point.x, point.y], source: 'frontier_continuous_mesh' };
      }
    } else {
      const x = frontierNode.x + dx * sampledDistance;
      const y = frontierNode.y + dy * sampledDistance;
      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        if (spacingFloor > 0 && nearestExistingDistance({ x, y }, state.nodes) < spacingFloor) {
          continue;
        }
        return { point: [x, y], source: 'frontier_continuous' };
      }
    }
  }

  return { point: randomPoint(rng), source: 'frontier_random_fallback' };
}

// Arrival placement is mode-dependent and heuristic-heavy:
// - "network" in mesh mode scores candidate lattice cells by attachability,
//   future growth, shell gain, and outward gain.
// - "frontier" delegates to frontierArrivalPoint().
// - "uniform_lattice" samples broadly from the current projected lattice.
// - "uniform" is true square-uniform placement, even when mesh mode is on.
// - final fallback is unrestricted uniform random placement in the square.
// The returned object also records which path produced the point so UI/audit
// output can distinguish strict local candidates from broader fallback paths.
function chooseArrivalPoint(state, rng) {
  if (state.params.arrivalMode === 'network' && state.params.meshMode === 'grid_bias') {
    const analysis = analyzeNetworkLatticeSites(state);
    const candidates = analysis.candidates;
    if (candidates.length > 0) {
      const arrivalAccessContext = buildArrivalAccessContext(state.params);
      const siteAccessLookup = arrivalAccessContext
        ? siteAccessibilityLookup(
          computeSiteAccessibilityRows(state, state.params, { available: true, source: 'network_candidates', candidates }),
          arrivalAccessContext.metric,
        )
        : new Map();
      const maxAttachable = Math.max(...candidates.map((candidate) => candidate.attachableNeighborCount), 0);
      const desiredLinks = Math.min(state.params.kappa, Math.max(maxAttachable, 0));
      const meanDistance = Math.max(0.02, averageEdgeLength(state.edges) * (state.params.arrivalDistanceFactor ?? 1));
      const ranked = candidates
        .map((candidate) => ({
          ...candidate,
          tieNoise: nextRandom(rng),
          siteAccessValue: siteAccessLookup.get(`${candidate.u},${candidate.v}`) ?? 0,
          score: Math.abs(candidate.nearestDistance - meanDistance)
            - candidate.attachableNeighborCount * 2.2
            - candidate.futureGrowthCount * 1.8
            - Math.max(candidate.shellGain, 0) * 2.5
            - (arrivalAccessContext ? arrivalAccessContext.strength * Math.log1p(siteAccessLookup.get(`${candidate.u},${candidate.v}`) ?? 0) : 0)
            - Math.max(candidate.outwardGain, 0) * 1.2
            - candidate.occupiedNeighborCount * 0.2
            + candidate.radial * 0.01,
        }))
        .sort((left, right) => left.score - right.score || left.tieNoise - right.tieNoise);
      const outwardFocused = ranked.filter((candidate) => candidate.shellGain > 0 || candidate.outwardGain > 1e-9);
      const preferredPool = outwardFocused.length > 0 ? outwardFocused : ranked;
      const focused = desiredLinks > 0
        ? preferredPool.filter((candidate) => candidate.attachableNeighborCount >= desiredLinks)
        : ranked;
      const candidatePool = focused.length > 0 ? focused : preferredPool;
      const pool = candidatePool.slice(0, Math.min(8, candidatePool.length));
      const chosen = pool[Math.floor(nextRandom(rng) * pool.length)] || candidatePool[0] || ranked[0];
      if (chosen) {
        return { point: [chosen.x, chosen.y], source: 'network_candidates', siteAudit: analysis.audit, latticeU: chosen.u, latticeV: chosen.v };
      }
    }
    // For "Near existing network", do not silently degrade into broader
    // projected/frontier/random placement. If no attachable local lattice site
    // exists, return no point and let the step stop explicitly.
    return { point: null, source: 'network_candidates_empty', siteAudit: analysis.audit };
  }
  if (state.params.arrivalMode === 'frontier') {
    const frontierChoice = frontierArrivalPoint(state, rng);
    return frontierChoice;
  }
  if (state.params.arrivalMode === 'uniform_lattice' && state.params.meshMode === 'grid_bias') {
    const spacingNodes = arrivalSpacingNodes(state);
    const latticePoints = projectedLatticePoints(state).filter((point) =>
      nearestExistingDistance(point, spacingNodes) >= Math.max(0.01, averageEdgeLength(state.edges) * (state.params.meshSpacingFactor ?? 0)),
    );
    if (latticePoints.length > 0) {
      const arrivalAccessContext = buildArrivalAccessContext(state.params);
      const siteAccessLookup = arrivalAccessContext
        ? siteAccessibilityLookup(
          computeSiteAccessibilityRows(state, state.params, { available: true, source: 'uniform_lattice', candidates: latticePoints }),
          arrivalAccessContext.metric,
        )
        : new Map();
      const ranked = latticePoints
        .map((point) => ({
          ...point,
          tieNoise: nextRandom(rng),
          siteAccessValue: siteAccessLookup.get(`${point.u},${point.v}`) ?? 0,
        }))
        .sort((left, right) =>
          (arrivalAccessContext ? right.siteAccessValue - left.siteAccessValue : 0)
          || left.tieNoise - right.tieNoise
        );
      const pool = ranked.slice(0, Math.min(12, ranked.length));
      const chosen = pool[Math.floor(nextRandom(rng) * pool.length)] || ranked[0];
      return { point: [chosen.x, chosen.y], source: 'uniform_lattice', latticeU: chosen.u, latticeV: chosen.v };
    }
  }
  return { point: randomPoint(rng), source: 'uniform_square' };
}

function diagnoseArrivalCandidates(arrivingNode, candidateNodes, params, existingEdges = [], latticeMetadata = null, selectionRounds = [], accessContext = null) {
  const diagnostics = [];
  const workingNodes = candidateNodes.map((node) => ({ ...node }));
  const workingNodeMap = nodeMap(workingNodes);
  const adjacentCapacityCandidates = [];
  const localAdjacentCapacityCandidates = [];
  const nonCrossingAdjacentCapacityCandidates = [];

  workingNodes.forEach((node) => {
    const distance = euclideanDistance(arrivingNode.x, arrivingNode.y, node.x, node.y);
    const hasCapacity = node.degree < node.capacity - 1e-9;
    const adjacent = isMeshAdjacentCandidate(arrivingNode, node, params);
    const local = passesMeshLocality(arrivingNode, node, params, latticeMetadata);
    const crossing = params.planarityMode === 'reject_crossings'
      ? edgeWouldCrossExisting(arrivingNode, node, workingNodeMap, existingEdges)
      : false;
    const entry = {
      nodeId: node.id,
      distance,
      degree: node.degree,
      capacity: node.capacity,
      residualCapacity: node.residualCapacity,
      hasCapacity,
      adjacent,
      local,
      crossing,
      round1Feasible: false,
      droppedByNearestQ: false,
    };
    if (hasCapacity && adjacent && local) {
      localAdjacentCapacityCandidates.push(entry);
    }
    if (hasCapacity && adjacent) {
      adjacentCapacityCandidates.push(entry);
      if (local && !crossing) {
        nonCrossingAdjacentCapacityCandidates.push(entry);
      }
    }
    diagnostics.push(entry);
  });

  const nearestQ = Math.min(params.meshNearestCount ?? 6, Math.max(localAdjacentCapacityCandidates.length, nonCrossingAdjacentCapacityCandidates.length, 0));
  const nearestAdjacentIds = new Set(
    [...localAdjacentCapacityCandidates]
      .sort((left, right) => left.distance - right.distance)
      .slice(0, nearestQ)
      .map((entry) => entry.nodeId),
  );
  const nearestNonCrossingIds = new Set(
    [...nonCrossingAdjacentCapacityCandidates]
      .sort((left, right) => left.distance - right.distance)
      .slice(0, nearestQ)
      .map((entry) => entry.nodeId),
  );

  const round1FeasibleNodes = workingNodes.filter((node) =>
    diagnostics.some((entry) => entry.nodeId === node.id && (
      params.meshMode === 'grid_bias'
        ? (
          params.planarityMode === 'reject_crossings'
            ? nearestNonCrossingIds.has(node.id)
            : nearestAdjacentIds.has(node.id)
        )
        : (node.degree < node.capacity - 1e-9)
    ))
  );
  const round1Probabilities = computeFeasibleProbabilities(arrivingNode, round1FeasibleNodes, params, accessContext);
  const probabilityById = new Map(round1Probabilities.map((entry) => [entry.nodeId, entry]));
  const round1SelectedId = selectionRounds[0]?.selectedId ?? null;

  diagnostics.forEach((entry) => {
    if (params.meshMode === 'grid_bias') {
      if (params.planarityMode === 'reject_crossings') {
        entry.droppedByNearestQ = entry.hasCapacity && entry.adjacent && entry.local && !entry.crossing && !nearestNonCrossingIds.has(entry.nodeId);
        entry.round1Feasible = entry.hasCapacity && entry.adjacent && entry.local && !entry.crossing && nearestNonCrossingIds.has(entry.nodeId);
      } else {
        entry.droppedByNearestQ = entry.hasCapacity && entry.adjacent && entry.local && !nearestAdjacentIds.has(entry.nodeId);
        entry.round1Feasible = entry.hasCapacity && entry.adjacent && entry.local && nearestAdjacentIds.has(entry.nodeId);
      }
    } else {
      entry.round1Feasible = entry.hasCapacity && !entry.crossing;
      entry.droppedByNearestQ = false;
    }
    entry.withinNearestAdjacentQ = nearestAdjacentIds.has(entry.nodeId);
    entry.withinNearestNonCrossingQ = nearestNonCrossingIds.has(entry.nodeId);
    entry.round1Weight = probabilityById.get(entry.nodeId)?.weight ?? null;
    entry.round1Probability = probabilityById.get(entry.nodeId)?.probability ?? null;
    entry.accessValue = probabilityById.get(entry.nodeId)?.accessValue ?? 0;
    entry.round1Selected = round1SelectedId === entry.nodeId;
  });

  const sorted = [...diagnostics].sort((left, right) =>
    Number(right.round1Feasible) - Number(left.round1Feasible)
    || Number(right.hasCapacity && right.adjacent && !right.crossing) - Number(left.hasCapacity && left.adjacent && !left.crossing)
    || Number(right.hasCapacity && right.adjacent) - Number(left.hasCapacity && left.adjacent)
    || left.distance - right.distance
  );

  return {
    counts: {
      total: diagnostics.length,
      capacityAvailable: diagnostics.filter((entry) => entry.hasCapacity).length,
      adjacentAvailable: diagnostics.filter((entry) => entry.hasCapacity && entry.adjacent).length,
      localAdjacentAvailable: diagnostics.filter((entry) => entry.hasCapacity && entry.adjacent && entry.local).length,
      crossingLocalAvailable: diagnostics.filter((entry) => entry.hasCapacity && entry.adjacent && entry.local && entry.crossing).length,
      nonCrossingAdjacentAvailable: diagnostics.filter((entry) => entry.hasCapacity && entry.adjacent && entry.local && !entry.crossing).length,
      round1Feasible: diagnostics.filter((entry) => entry.round1Feasible).length,
    },
    nearestQ,
    entries: sorted,
  };
}

// Sequential selection is without replacement, but current implementation may
// narrow the candidate set beyond the base model through mesh adjacency,
// nearest-q filtering, and reject-crossings screening before probabilities are
// computed. Empty-set reasons are recorded for later lonely-node diagnostics.
function selectSequentialNeighbors(arrivingNode, candidateNodes, params, rng, existingEdges = [], latticeMetadata = null, accessContext = null) {
  const selectedTargetIds = [];
  const selectionRounds = [];
  let truncationOccurred = false;
  let missingLinks = 0;
  let emptyReason = undefined;
  let crossingCandidateCount = 0;

  const workingNodes = candidateNodes.map((node) => ({ ...node }));
  const workingNodeMap = nodeMap(workingNodes);
  const workingEdges = existingEdges.map((edge) => ({ ...edge }));

  function planarityFeasible(nodes) {
    if (params.planarityMode !== 'reject_crossings') {
      return meshFiltered(nodes);
    }
    return meshFiltered(nodes.filter((node) => !edgeWouldCrossExisting(arrivingNode, node, workingNodeMap, workingEdges)));
  }

  function meshFiltered(nodes) {
    if (params.meshMode !== 'grid_bias') {
      return nodes;
    }
    const adjacent = nodes
      .filter((node) => isMeshAdjacentCandidate(arrivingNode, node, params))
      .filter((node) => passesMeshLocality(arrivingNode, node, params, latticeMetadata));
    if (adjacent.length === 0) {
      return [];
    }
    const sorted = [...adjacent].sort((a, b) =>
      euclideanDistance(arrivingNode.x, arrivingNode.y, a.x, a.y) - euclideanDistance(arrivingNode.x, arrivingNode.y, b.x, b.y));
    return sorted.slice(0, Math.min(params.meshNearestCount ?? 6, sorted.length));
  }

  const initiallyFeasible = planarityFeasible(workingNodes.filter((node) => node.degree < node.capacity - 1e-9));
  if (params.planarityMode === 'split_crossings') {
    crossingCandidateCount = meshFiltered(workingNodes.filter((node) => node.degree < node.capacity - 1e-9))
      .filter((node) => edgeWouldCrossExisting(arrivingNode, node, workingNodeMap, workingEdges))
      .length;
  }
  if (initiallyFeasible.length === 0) {
    const capacityAvailable = workingNodes.filter((node) => node.degree < node.capacity - 1e-9);
    const adjacentAvailable = meshFiltered(capacityAvailable);
    const nonCrossingAvailable = params.planarityMode === 'reject_crossings'
      ? meshFiltered(capacityAvailable.filter((node) => !edgeWouldCrossExisting(arrivingNode, node, workingNodeMap, workingEdges)))
      : adjacentAvailable;
    if (capacityAvailable.length === 0) {
      emptyReason = 'no_capacity_targets';
    } else if (adjacentAvailable.length === 0) {
      emptyReason = 'no_adjacent_targets';
    } else if (params.planarityMode === 'reject_crossings' && nonCrossingAvailable.length === 0) {
      emptyReason = 'no_non_crossing_targets';
    } else {
      emptyReason = 'no_feasible_targets';
    }
    return { selectedTargetIds, selectionRounds, truncationOccurred, missingLinks, emptyReason, crossingCandidateCount };
  }

  if (initiallyFeasible.length < params.kappa) {
    truncationOccurred = true;
    missingLinks = params.kappa - initiallyFeasible.length;
  }

  const linksToAdd = Math.min(params.kappa, initiallyFeasible.length);

  for (let roundIndex = 0; roundIndex < linksToAdd; roundIndex += 1) {
    const available = planarityFeasible(workingNodes.filter((node) => node.degree < node.capacity - 1e-9 && !selectedTargetIds.includes(node.id)));
    if (available.length === 0) {
      if (selectedTargetIds.length < params.kappa) {
        truncationOccurred = true;
        missingLinks = Math.max(missingLinks, params.kappa - selectedTargetIds.length);
      }
      break;
    }

    const candidates = computeFeasibleProbabilities(arrivingNode, available, params, accessContext);
    if (candidates.length === 0) {
      if (selectedTargetIds.length < params.kappa) {
        truncationOccurred = true;
        missingLinks = Math.max(missingLinks, params.kappa - selectedTargetIds.length);
      }
      break;
    }
    const weights = candidates.map((candidate) => candidate.weight);
    const choiceIndex = weightedChoiceIndex(weights, rng);
    const selected = candidates[choiceIndex];

    selectionRounds.push({
      feasibleNodeIds: candidates.map((candidate) => candidate.nodeId),
      probabilities: candidates.map((candidate) => candidate.probability),
      weights,
      selectedId: selected.nodeId,
    });

    selectedTargetIds.push(selected.nodeId);
    const target = workingNodeMap.get(selected.nodeId);
    if (target) {
      target.degree += 1;
      updateCapacityState(target);
      workingEdges.push({
        id: edgeIdFor(arrivingNode.id, target.id),
        source: arrivingNode.id,
        target: target.id,
        length: euclideanDistance(arrivingNode.x, arrivingNode.y, target.x, target.y),
        birthStep: arrivingNode.birthStep,
      });
    }
  }

  if (selectedTargetIds.length < params.kappa && initiallyFeasible.length >= params.kappa) {
    truncationOccurred = true;
    missingLinks = Math.max(missingLinks, params.kappa - selectedTargetIds.length);
  }

  return { selectedTargetIds, selectionRounds, truncationOccurred, missingLinks, emptyReason, crossingCandidateCount };
}

function gini(values) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return 0;
  }
  let weighted = 0;
  for (let index = 0; index < sorted.length; index += 1) {
    weighted += (index + 1) * sorted[index];
  }
  return (2 * weighted) / (sorted.length * total) - (sorted.length + 1) / sorted.length;
}

function buildAdjacency(nodes, edges) {
  const adjacency = new Map();
  nodes.forEach((node) => adjacency.set(node.id, new Set()));
  edges.forEach((edge) => {
    adjacency.get(edge.source).add(edge.target);
    adjacency.get(edge.target).add(edge.source);
  });
  return adjacency;
}

function connectedComponents(nodes, adjacency) {
  const seen = new Set();
  const components = [];
  nodes.forEach((node) => {
    if (seen.has(node.id)) {
      return;
    }
    const component = [];
    const queue = [node.id];
    seen.add(node.id);
    while (queue.length > 0) {
      const current = queue.shift();
      component.push(current);
      adjacency.get(current).forEach((neighbor) => {
        if (!seen.has(neighbor)) {
          seen.add(neighbor);
          queue.push(neighbor);
        }
      });
    }
    components.push(component);
  });
  return components;
}

function averageClustering(nodes, adjacency) {
  if (nodes.length === 0) {
    return 0;
  }
  let total = 0;
  nodes.forEach((node) => {
    const neighbors = [...adjacency.get(node.id)];
    const degree = neighbors.length;
    if (degree < 2) {
      return;
    }
    let triangles = 0;
    for (let i = 0; i < neighbors.length; i += 1) {
      for (let j = i + 1; j < neighbors.length; j += 1) {
        if (adjacency.get(neighbors[i]).has(neighbors[j])) {
          triangles += 1;
        }
      }
    }
    total += (2 * triangles) / (degree * (degree - 1));
  });
  return total / nodes.length;
}

function bfsDistances(start, allowed, adjacency) {
  const distances = new Map([[start, 0]]);
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift();
    const distance = distances.get(current);
    adjacency.get(current).forEach((neighbor) => {
      if (!allowed.has(neighbor) || distances.has(neighbor)) {
        return;
      }
      distances.set(neighbor, distance + 1);
      queue.push(neighbor);
    });
  }
  return distances;
}

function largestComponentStats(componentIds, adjacency) {
  if (componentIds.length <= 1) {
    return { averagePathLength: 0, diameter: 0 };
  }
  if (componentIds.length > 700) {
    return { averagePathLength: null, diameter: null };
  }
  const allowed = new Set(componentIds);
  let total = 0;
  let count = 0;
  let diameter = 0;
  componentIds.forEach((nodeId) => {
    const distances = bfsDistances(nodeId, allowed, adjacency);
    distances.forEach((distance, targetId) => {
      if (targetId === nodeId) {
        return;
      }
      total += distance;
      count += 1;
      if (distance > diameter) {
        diameter = distance;
      }
    });
  });
  return { averagePathLength: count > 0 ? total / count : 0, diameter };
}

function degreeAssortativity(edges, degreeById) {
  if (edges.length === 0) {
    return null;
  }
  const xs = edges.map((edge) => degreeById.get(edge.source) ?? 0);
  const ys = edges.map((edge) => degreeById.get(edge.target) ?? 0);
  const meanX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
  const meanY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  for (let index = 0; index < xs.length; index += 1) {
    const dx = xs[index] - meanX;
    const dy = ys[index] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  const denominator = Math.sqrt(denomX * denomY);
  return denominator > 0 ? numerator / denominator : null;
}

function median(values) {
  if (values.length === 0) {
    return 0;
  }
  const mid = Math.floor(values.length / 2);
  return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid];
}

function countSquares(adjacency) {
  const nodeIds = [...adjacency.keys()];
  let squares = 0;
  for (let i = 0; i < nodeIds.length; i += 1) {
    for (let j = i + 1; j < nodeIds.length; j += 1) {
      const commonNeighbors = [...adjacency.get(nodeIds[i])].filter((neighbor) => adjacency.get(nodeIds[j]).has(neighbor));
      if (commonNeighbors.length >= 2) {
        squares += (commonNeighbors.length * (commonNeighbors.length - 1)) / 2;
      }
    }
  }
  return Math.floor(squares / 2);
}

function ccw(ax, ay, bx, by, cx, cy) {
  return (cy - ay) * (bx - ax) > (by - ay) * (cx - ax);
}

function segmentsCross(a1, a2, b1, b2) {
  return ccw(a1.x, a1.y, b1.x, b1.y, b2.x, b2.y) !== ccw(a2.x, a2.y, b1.x, b1.y, b2.x, b2.y)
    && ccw(a1.x, a1.y, a2.x, a2.y, b1.x, b1.y) !== ccw(a1.x, a1.y, a2.x, a2.y, b2.x, b2.y);
}

function crossingDiagnostics(nodes, edges) {
  if (edges.length > 500) {
    return { crossingCount: null, crossingRate: null, approximatePlanar: null };
  }
  const byId = new Map(nodes.map((node) => [node.id, node]));
  let crossings = 0;
  for (let i = 0; i < edges.length; i += 1) {
    for (let j = i + 1; j < edges.length; j += 1) {
      const a = edges[i];
      const b = edges[j];
      if ([a.source, a.target].some((id) => id === b.source || id === b.target)) {
        continue;
      }
      if (segmentIntersectionPoint(byId.get(a.source), byId.get(a.target), byId.get(b.source), byId.get(b.target))) {
        crossings += 1;
      }
    }
  }
  const possiblePairs = (edges.length * (edges.length - 1)) / 2;
  return {
    crossingCount: crossings,
    crossingRate: possiblePairs > 0 ? crossings / possiblePairs : 0,
    approximatePlanar: crossings === 0,
  };
}

function computeNetworkMetrics(nodes, edges, degreeThreshold = 10) {
  return computeNetworkMetricsWithContext(nodes, edges, degreeThreshold, null, 0);
}

function computeDirectionBias(nodes, latticeMetadata = null) {
  const sample = nodes.filter((node) => node.generatedBy !== 'split_crossing' && node.birthStep > 0);
  const usable = sample.length > 0 ? sample : nodes.filter((node) => node.generatedBy !== 'split_crossing');
  if (usable.length === 0) {
    return {
      sectorCounts: {},
      dominantSector: 'NA',
      dominantSectorShare: 0,
      eastWestBias: 0,
      northSouthBias: 0,
    };
  }
  const anchor = latticeMetadata?.anchor ?? {
    x: usable.reduce((sum, node) => sum + node.x, 0) / usable.length,
    y: usable.reduce((sum, node) => sum + node.y, 0) / usable.length,
  };
  const labels = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'];
  const counts = Object.fromEntries(labels.map((label) => [label, 0]));
  usable.forEach((node) => {
    const dx = node.x - anchor.x;
    const dy = node.y - anchor.y;
    const angle = Math.atan2(dy, dx);
    const normalized = (angle + Math.PI * 2 + Math.PI / 8) % (Math.PI * 2);
    const sector = Math.floor(normalized / (Math.PI / 4)) % 8;
    counts[labels[sector]] += 1;
  });
  const dominant = labels.reduce((best, label) => (!best || counts[label] > counts[best] ? label : best), null);
  const east = counts.E + counts.NE + counts.SE;
  const west = counts.W + counts.NW + counts.SW;
  const north = counts.N + counts.NE + counts.NW;
  const south = counts.S + counts.SE + counts.SW;
  return {
    sectorCounts: counts,
    dominantSector: dominant ?? 'NA',
    dominantSectorShare: dominant ? counts[dominant] / usable.length : 0,
    eastWestBias: usable.length > 0 ? (east - west) / usable.length : 0,
    northSouthBias: usable.length > 0 ? (north - south) / usable.length : 0,
  };
}

function computeNetworkMetricsWithContext(nodes, edges, degreeThreshold = 10, latticeMetadata = null, splitEvents = 0, planarityDiagnostics = null) {
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  const degrees = nodes.map((node) => node.degree);
  const adjacency = buildAdjacency(nodes, edges);
  const components = connectedComponents(nodes, adjacency);
  const largestComponent = components.reduce((best, current) => (current.length > best.length ? current : best), []);
  const degreeById = new Map(nodes.map((node) => [node.id, node.degree]));
  const componentAssignments = {};
  components.forEach((component, index) => {
    component.forEach((nodeId) => {
      componentAssignments[nodeId] = index;
    });
  });

  const triangleCount = nodes.reduce((sum, node) => {
    const neighbors = [...adjacency.get(node.id)];
    let triangles = 0;
    for (let i = 0; i < neighbors.length; i += 1) {
      for (let j = i + 1; j < neighbors.length; j += 1) {
        if (adjacency.get(neighbors[i]).has(neighbors[j])) {
          triangles += 1;
        }
      }
    }
    return sum + triangles;
  }, 0) / 3;

  const lccStats = largestComponentStats(largestComponent, adjacency);
  const crossings = crossingDiagnostics(nodes, edges);
  const sortedEdgeLengths = edges.map((edge) => edge.length).sort((a, b) => a - b);
  const directionBias = computeDirectionBias(nodes, latticeMetadata);
  const splitLinkCount = edges.filter((edge) => edge.generatedBy === 'split_crossing').length;

  return {
    nodeCount,
    edgeCount,
    generatedIntersectionNodes: nodes.filter((node) => node.generatedBy === 'split_crossing').length,
    splitLinkCount,
    splitEvents,
    crossingCandidatesEncountered: planarityDiagnostics?.crossingCandidatesEncountered ?? 0,
    crossingCandidatesAdmitted: planarityDiagnostics?.crossingCandidatesAdmitted ?? 0,
    lonelyNodeCount: nodes.filter((node) => node.lonely).length,
    meanDegree: nodeCount > 0 ? (2 * edgeCount) / nodeCount : 0,
    maxDegree: degrees.length > 0 ? Math.max(...degrees) : 0,
    degreeGini: gini(degrees),
    shareAtCapacity: nodeCount > 0 ? nodes.filter((node) => node.saturated).length / nodeCount : 0,
    connectedComponents: components.length,
    largestComponentSize: largestComponent.length,
    largestComponentShare: nodeCount > 0 ? largestComponent.length / nodeCount : 0,
    averageClustering: averageClustering(nodes, adjacency),
    averagePathLengthLargestComponent: lccStats.averagePathLength,
    diameterLargestComponent: lccStats.diameter,
    degreeAssortativity: degreeAssortativity(edges, degreeById),
    meanEdgeLength: edgeCount > 0 ? edges.reduce((sum, edge) => sum + edge.length, 0) / edgeCount : 0,
    medianEdgeLength: edgeCount > 0 ? median(sortedEdgeLengths) : 0,
    totalNetworkLength: edges.reduce((sum, edge) => sum + edge.length, 0),
    fractionLeaves: nodeCount > 0 ? degrees.filter((degree) => degree === 1).length / nodeCount : 0,
    fractionDegreeAboveThreshold: nodeCount > 0 ? degrees.filter((degree) => degree >= degreeThreshold).length / nodeCount : 0,
    cyclomaticNumber: edgeCount - nodeCount + components.length,
    triangleCount,
    squareCount: countSquares(adjacency),
    crossingCount: crossings.crossingCount,
    crossingRate: crossings.crossingRate,
    approximatePlanar: crossings.approximatePlanar,
    componentAssignments,
    directionSectorCounts: directionBias.sectorCounts,
    dominantDirectionSector: directionBias.dominantSector,
    dominantDirectionShare: directionBias.dominantSectorShare,
    eastWestBias: directionBias.eastWestBias,
    northSouthBias: directionBias.northSouthBias,
  };
}

function buildWeightedAdjacency(nodes, edges) {
  const adjacency = new Map();
  nodes.forEach((node) => adjacency.set(node.id, []));
  edges.forEach((edge) => {
    if (!adjacency.has(edge.source) || !adjacency.has(edge.target)) {
      return;
    }
    adjacency.get(edge.source).push({ id: edge.target, weight: edge.length });
    adjacency.get(edge.target).push({ id: edge.source, weight: edge.length });
  });
  return adjacency;
}

function dijkstraDistances(startId, adjacency) {
  const distances = new Map();
  const visited = new Set();
  distances.set(startId, 0);
  while (true) {
    let currentId = null;
    let currentDistance = Infinity;
    distances.forEach((distance, nodeId) => {
      if (!visited.has(nodeId) && distance < currentDistance) {
        currentId = nodeId;
        currentDistance = distance;
      }
    });
    if (currentId === null) {
      break;
    }
    visited.add(currentId);
    (adjacency.get(currentId) || []).forEach((neighbor) => {
      const nextDistance = currentDistance + neighbor.weight;
      if (nextDistance < (distances.get(neighbor.id) ?? Infinity)) {
        distances.set(neighbor.id, nextDistance);
      }
    });
  }
  return distances;
}

function computeTransportAccessibility(nodes, edges, params) {
  if (nodes.length === 0) {
    return {
      cumulativeById: {},
      gravityById: {},
      meanCumulative: 0,
      meanGravity: 0,
      maxCumulative: 0,
      maxGravity: 0,
      maxCumulativeNodeId: null,
      maxGravityNodeId: null,
      available: true,
    };
  }
  if (nodes.length > 600) {
    return {
      cumulativeById: {},
      gravityById: {},
      meanCumulative: null,
      meanGravity: null,
      maxCumulative: null,
      maxGravity: null,
      maxCumulativeNodeId: null,
      maxGravityNodeId: null,
      available: false,
      message: 'Transport accessibility is disabled above 600 nodes in the standalone browser build to keep the UI responsive.',
    };
  }

  const adjacency = buildWeightedAdjacency(nodes, edges);
  const cumulativeById = {};
  const gravityById = {};
  const radius = params.accessibilityRadius ?? 0.75;
  const decay = params.accessibilityDecay ?? 3;
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const semantics = params.accessSemantics === 'seed'
    ? 'seed'
    : params.accessSemantics === 'opportunity'
      ? 'opportunity'
      : 'network';

  function destinationWeight(node) {
    if (semantics === 'seed') {
      return node.birthStep === 0 ? 1 : 0;
    }
    if (semantics === 'opportunity') {
      return Math.max(0, (node.weight ?? 1) * (1 - (node.typeShare ?? 0.5)));
    }
    return 1;
  }

  nodes.forEach((node) => {
    const distances = dijkstraDistances(node.id, adjacency);
    let cumulative = 0;
    let gravity = 0;
    distances.forEach((distance, otherId) => {
      if (otherId === node.id) {
        return;
      }
      const destination = nodeById.get(otherId);
      const opportunityWeight = destination ? destinationWeight(destination) : 0;
      if (opportunityWeight <= 0) {
        return;
      }
      if (distance <= radius) {
        cumulative += opportunityWeight;
      }
      gravity += opportunityWeight * Math.exp(-decay * distance);
    });
    cumulativeById[node.id] = cumulative;
    gravityById[node.id] = gravity;
  });

  const cumulativeEntries = Object.entries(cumulativeById);
  const gravityEntries = Object.entries(gravityById);
  const bestCumulative = cumulativeEntries.reduce((best, entry) => (!best || entry[1] > best[1] ? entry : best), null);
  const bestGravity = gravityEntries.reduce((best, entry) => (!best || entry[1] > best[1] ? entry : best), null);

  return {
    cumulativeById,
    gravityById,
    meanCumulative: cumulativeEntries.reduce((sum, entry) => sum + entry[1], 0) / nodes.length,
    meanGravity: gravityEntries.reduce((sum, entry) => sum + entry[1], 0) / nodes.length,
    maxCumulative: bestCumulative ? bestCumulative[1] : 0,
    maxGravity: bestGravity ? bestGravity[1] : 0,
    maxCumulativeNodeId: bestCumulative ? bestCumulative[0] : null,
    maxGravityNodeId: bestGravity ? bestGravity[0] : null,
    semantics,
    available: true,
  };
}

function buildAccessSelectionContext(accessibility, params) {
  if (!accessibility?.available || params.selectionKernelMode !== 'access' || (params.accessSelectionStrength ?? 0) <= 0) {
    return null;
  }
  const metric = params.accessSelectionMetric === 'cumulative' ? 'cumulative' : 'gravity';
  const lookup = metric === 'cumulative' ? accessibility.cumulativeById : accessibility.gravityById;
  return {
    metric,
    lookup,
    strength: params.accessSelectionStrength ?? 0,
  };
}

function buildArrivalAccessContext(params) {
  if (params.arrivalPreferenceMode !== 'access' || (params.arrivalAccessStrength ?? 0) <= 0) {
    return null;
  }
  return {
    metric: params.arrivalAccessMetric === 'cumulative' ? 'cumulative' : 'gravity',
    strength: params.arrivalAccessStrength ?? 0,
  };
}

function pickProvisionalTargetsForSite(state, candidate, params) {
  const byId = nodeMap(state.nodes);
  const attachableIds = (candidate.attachableNeighborIds ?? countAttachableMeshNeighbors(state, candidate).attachableNeighborIds ?? [])
    .map((nodeId) => ({
      nodeId,
      distance: euclideanDistance(candidate.x, candidate.y, byId.get(nodeId)?.x ?? candidate.x, byId.get(nodeId)?.y ?? candidate.y),
    }))
    .sort((left, right) => left.distance - right.distance)
    .slice(0, Math.min(params.kappa, candidate.attachableNeighborCount ?? params.kappa))
    .map((entry) => entry.nodeId);
  return attachableIds;
}

function computeSiteAccessibilityRows(state, params, pool) {
  if (!pool.available) {
    return {
      available: false,
      source: pool.source,
      message: pool.message,
      rows: [],
    };
  }
  if (state.nodes.length > 600) {
    return {
      available: false,
      source: pool.source,
      message: 'Potential-site accessibility is disabled above 600 realized nodes in the standalone browser build.',
      rows: [],
    };
  }

  const adjacency = buildWeightedAdjacency(state.nodes, state.edges);
  const distanceCache = new Map();
  const byId = nodeMap(state.nodes);
  const radius = params.accessibilityRadius ?? 0.75;
  const decay = params.accessibilityDecay ?? 3;
  const rows = pool.candidates.map((candidate) => {
    const provisionalTargetIds = pickProvisionalTargetsForSite(state, candidate, params);
    if (provisionalTargetIds.length === 0) {
      return {
        u: candidate.u,
        v: candidate.v,
        x: candidate.x,
        y: candidate.y,
        nearestDistance: candidate.nearestDistance ?? nearestExistingDistance(candidate, state.nodes),
        attachableNeighborCount: candidate.attachableNeighborCount ?? 0,
        provisionalTargetIds: [],
        cumulative: null,
        gravity: null,
        realizableNow: false,
        isCurrentCandidate: Boolean(candidate.isCurrentCandidate),
      };
    }
    const edgeLengthById = new Map(provisionalTargetIds.map((nodeId) => [nodeId, euclideanDistance(candidate.x, candidate.y, byId.get(nodeId).x, byId.get(nodeId).y)]));
    const getDistances = (nodeId) => {
      if (!distanceCache.has(nodeId)) {
        distanceCache.set(nodeId, dijkstraDistances(nodeId, adjacency));
      }
      return distanceCache.get(nodeId);
    };
    let cumulative = 0;
    let gravity = 0;
    state.nodes.forEach((node) => {
      let best = Infinity;
      provisionalTargetIds.forEach((targetId) => {
        const networkDistance = getDistances(targetId).get(node.id);
        if (!Number.isFinite(networkDistance)) {
          return;
        }
        best = Math.min(best, edgeLengthById.get(targetId) + networkDistance);
      });
      if (!Number.isFinite(best)) {
        return;
      }
      if (best <= radius) {
        cumulative += 1;
      }
      gravity += Math.exp(-decay * best);
    });
    return {
      u: candidate.u,
      v: candidate.v,
      x: candidate.x,
      y: candidate.y,
      nearestDistance: candidate.nearestDistance ?? nearestExistingDistance(candidate, state.nodes),
      attachableNeighborCount: candidate.attachableNeighborCount ?? provisionalTargetIds.length,
      provisionalTargetIds,
      cumulative,
      gravity,
      realizableNow: true,
      isCurrentCandidate: Boolean(candidate.isCurrentCandidate),
    };
  });

  const realizableRows = rows.filter((row) => row.realizableNow);
  const bestCumulative = realizableRows.reduce((best, row) => (!best || row.cumulative > best.cumulative ? row : best), null);
  const bestGravity = realizableRows.reduce((best, row) => (!best || row.gravity > best.gravity ? row : best), null);
  return {
    available: true,
    source: pool.source,
    rows,
    realizableCount: realizableRows.length,
    meanCumulative: realizableRows.length > 0 ? realizableRows.reduce((sum, row) => sum + row.cumulative, 0) / realizableRows.length : 0,
    meanGravity: realizableRows.length > 0 ? realizableRows.reduce((sum, row) => sum + row.gravity, 0) / realizableRows.length : 0,
    bestCumulative,
    bestGravity,
  };
}

function currentArrivalCandidatePool(state) {
  if (state.params.meshMode !== 'grid_bias') {
    return { available: false, source: 'none', candidates: [], message: 'Candidate-site accessibility is only computed for lattice-biased mesh mode.' };
  }
  if (state.params.arrivalMode === 'network') {
    const analysis = analyzeNetworkLatticeSites(state);
    return { available: true, source: 'network_candidates', candidates: analysis.candidates };
  }
  if (state.params.arrivalMode === 'frontier') {
    const projected = analyzeProjectedLatticeSites(state);
    if (projected.candidates.length > 0) {
      return { available: true, source: 'frontier_projected', candidates: projected.candidates };
    }
    const fallback = analyzeNetworkLatticeSites(state);
    return { available: true, source: 'frontier_network_fallback', candidates: fallback.candidates };
  }
  if (state.params.arrivalMode === 'uniform_lattice') {
    const spacingNodes = arrivalSpacingNodes(state);
    const spacingCutoff = Math.max(0.01, averageEdgeLength(state.edges) * (state.params.meshSpacingFactor ?? 0));
    const candidates = projectedLatticePoints(state)
      .filter((point) => nearestExistingDistance(point, spacingNodes) >= spacingCutoff)
      .map((point) => {
        const attachable = countAttachableMeshNeighbors(state, point);
        return {
          ...point,
          nearestDistance: nearestExistingDistance(point, spacingNodes),
          attachableNeighborCount: attachable.attachableNeighborCount,
          attachableNeighborIds: attachable.attachableNeighborIds,
        };
      })
      .filter((entry) => entry.attachableNeighborCount > 0);
    return { available: true, source: 'uniform_lattice', candidates };
  }
  return { available: false, source: 'none', candidates: [], message: 'Potential-site accessibility is not defined for true square-uniform arrivals.' };
}

function computeCandidateSiteAccessibility(state, params) {
  return computeSiteAccessibilityRows(state, params, currentArrivalCandidatePool(state));
}

function currentPotentialSitePool(state) {
  if (state.params.meshMode !== 'grid_bias') {
    return { available: false, source: 'none', candidates: [], message: 'Potential-site accessibility is only computed for lattice-biased mesh mode.' };
  }
  const geometry = projectedLatticeGeometry(state);
  if (!geometry) {
    return { available: false, source: 'none', candidates: [], message: 'Projected lattice geometry is unavailable for the current run.' };
  }
  const occupied = latticeOccupancyMap(state);
  const spacingNodes = arrivalSpacingNodes(state);
  const spacingCutoff = Math.max(0.01, averageEdgeLength(state.edges) * (state.params.meshSpacingFactor ?? 0));
  const activeCandidateKeys = new Set(currentArrivalCandidatePool(state).candidates.map((candidate) => `${candidate.u},${candidate.v}`));
  const candidates = projectedLatticePoints(state)
    .filter((point) => !occupied.has(`${point.u},${point.v}`))
    .map((point) => {
      const nearestDistance = nearestExistingDistance(point, spacingNodes);
      const attachable = countAttachableMeshNeighbors(state, point);
      return {
        ...point,
        nearestDistance,
        attachableNeighborCount: attachable.attachableNeighborCount,
        attachableNeighborIds: attachable.attachableNeighborIds,
        spacingAllowed: nearestDistance >= spacingCutoff,
        isCurrentCandidate: activeCandidateKeys.has(`${point.u},${point.v}`),
      };
    });
  return {
    available: true,
    source: 'projected_lattice',
    candidates,
  };
}

function computePotentialSiteAccessibility(state, params) {
  return computeSiteAccessibilityRows(state, params, currentPotentialSitePool(state));
}

function siteAccessibilityLookup(siteAccess, metric) {
  if (!siteAccess?.available || !siteAccess.rows) {
    return new Map();
  }
  const key = metric === 'cumulative' ? 'cumulative' : 'gravity';
  return new Map(
    siteAccess.rows
      .filter((row) => row.realizableNow && Number.isFinite(row[key]))
      .map((row) => [`${row.u},${row.v}`, row[key]])
  );
}

function empiricalCcdf(degrees) {
  const values = degrees.filter((degree) => degree > 0).sort((a, b) => a - b);
  const support = [...new Set(values)];
  return {
    support,
    ccdf: support.map((value) => values.filter((degree) => degree >= value).length / values.length),
  };
}

function hurwitzZeta(alpha, kMin) {
  let sum = 0;
  let last = 0;
  for (let k = kMin; k < kMin + 10000; k += 1) {
    sum += k ** (-alpha);
    if (Math.abs(sum - last) < 1e-10 && k > kMin + 200) {
      break;
    }
    last = sum;
  }
  return sum;
}

function powerLawAlphaMle(sample, kMin) {
  return 1 + sample.length / sample.reduce((sum, value) => sum + Math.log(value / (kMin - 0.5)), 0);
}

function powerLawKs(sample, alpha, kMin) {
  const unique = [...new Set(sample)].sort((a, b) => a - b);
  const zeta = hurwitzZeta(alpha, kMin);
  let maxDistance = 0;
  unique.forEach((value) => {
    const empirical = sample.filter((entry) => entry <= value).length / sample.length;
    let cumulative = 0;
    for (let k = kMin; k <= value; k += 1) {
      cumulative += k ** (-alpha) / zeta;
    }
    maxDistance = Math.max(maxDistance, Math.abs(empirical - cumulative));
  });
  return maxDistance;
}

function powerLawAic(sample, alpha, kMin) {
  const zeta = hurwitzZeta(alpha, kMin);
  if (!Number.isFinite(zeta) || zeta <= 0) {
    return null;
  }
  const logLik = -alpha * sample.reduce((sum, value) => sum + Math.log(value), 0) - sample.length * Math.log(zeta);
  return 2 - 2 * logLik;
}

function exponentialFit(sample, kMin) {
  const shifted = sample.map((value) => value - kMin);
  const scale = shifted.reduce((sum, value) => sum + value, 0) / shifted.length;
  if (scale <= 0) {
    return { lambda: null, aic: null };
  }
  const lambda = 1 / scale;
  const logLik = shifted.reduce((sum, value) => sum + Math.log(lambda) - lambda * value, 0);
  return { lambda, aic: 2 - 2 * logLik };
}

function lognormalFit(sample) {
  const positive = sample.filter((value) => value > 0);
  if (positive.length === 0) {
    return { mu: null, sigma: null, aic: null };
  }
  const logs = positive.map((value) => Math.log(value));
  const mu = logs.reduce((sum, value) => sum + value, 0) / logs.length;
  const variance = logs.reduce((sum, value) => sum + (value - mu) ** 2, 0) / logs.length;
  const sigma = Math.sqrt(Math.max(variance, 1e-12));
  const logLik = logs.reduce((sum, logValue, index) => {
    return sum - Math.log(positive[index] * sigma * Math.sqrt(2 * Math.PI)) - ((logValue - mu) ** 2) / (2 * sigma * sigma);
  }, 0);
  return { mu, sigma, aic: 4 - 2 * logLik };
}

function fitTailModels(degrees, minTailSize = 20) {
  const values = degrees.filter((degree) => degree > 0);
  const { support, ccdf } = empiricalCcdf(values);
  if (values.length < minTailSize) {
    return {
      support,
      ccdf,
      tailN: values.length,
      kMin: null,
      powerAlpha: null,
      powerKs: null,
      powerAic: null,
      expLambda: null,
      expAic: null,
      lognormalMu: null,
      lognormalSigma: null,
      lognormalAic: null,
      preferredModel: 'insufficient_tail',
    };
  }
  let best;
  [...new Set(values)].sort((a, b) => a - b).forEach((kMin) => {
    const tail = values.filter((value) => value >= kMin);
    if (tail.length < minTailSize) {
      return;
    }
    const alpha = powerLawAlphaMle(tail, kMin);
    const ks = powerLawKs(tail, alpha, kMin);
    const aic = powerLawAic(tail, alpha, kMin);
    if (!Number.isFinite(alpha) || !Number.isFinite(ks)) {
      return;
    }
    if (!best || ks < best.ks) {
      best = { kMin, alpha, ks, aic, tail };
    }
  });
  if (!best) {
    return {
      support,
      ccdf,
      tailN: values.length,
      kMin: null,
      powerAlpha: null,
      powerKs: null,
      powerAic: null,
      expLambda: null,
      expAic: null,
      lognormalMu: null,
      lognormalSigma: null,
      lognormalAic: null,
      preferredModel: 'fit_failed',
    };
  }
  const exp = exponentialFit(best.tail, best.kMin);
  const lognormal = lognormalFit(best.tail);
  const comparison = [
    ['power_law', best.aic],
    ['exponential', exp.aic],
    ['lognormal', lognormal.aic],
  ].filter((entry) => entry[1] !== null).sort((a, b) => a[1] - b[1]);

  return {
    support,
    ccdf,
    tailN: best.tail.length,
    kMin: best.kMin,
    powerAlpha: best.alpha,
    powerKs: best.ks,
    powerAic: best.aic,
    expLambda: exp.lambda,
    expAic: exp.aic,
    lognormalMu: lognormal.mu,
    lognormalSigma: lognormal.sigma,
    lognormalAic: lognormal.aic,
    preferredModel: comparison[0] ? comparison[0][0] : 'fit_failed',
  };
}

function historySnapshot(state) {
  return {
    step: state.currentStep,
    nodeCount: state.nodes.length,
    edgeCount: state.edges.length,
    metrics: computeNetworkMetricsWithContext(
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
  };
}

function initializeSimulation(params) {
  const errors = validateSimulationParams(params).filter((entry) => entry.level === 'error');
  if (errors.length > 0) {
    throw new Error(errors.map((entry) => entry.message).join(' '));
  }

  const rng = createRng(params.rngSeed);
  const { nodes, edges, latticeMetadata } = createSeedGraph(params, rng);
  const state = {
    params: clone(params),
    nodes,
    edges,
    latticeMetadata,
    referenceLinks: edges.map((edge, index) => ({ ...edge, id: `reference-seed-${index}`, generatedBy: 'seed' })),
    currentStep: nodes.length,
    nextNodeIndex: nodes.length,
    status: 'idle',
    terminationReason: undefined,
    truncationEvents: 0,
    totalMissingLinks: 0,
    splitEvents: 0,
    crossingCandidatesEncountered: 0,
    crossingCandidatesAdmitted: 0,
    rngSeed: params.rngSeed,
    rngState: rng.state,
    history: [],
    lastStepDetails: undefined,
    warnings: validateSimulationParams(params).filter((entry) => entry.level === 'warning').map((entry) => entry.message),
  };
  if (params.trackHistory) {
    state.history.push(historySnapshot(state));
  }
  if (state.nodes.length >= params.finalNodeCount) {
    state.status = 'done';
    state.terminationReason = 'completed';
  }
  return state;
}

// One simulation step currently retries placement in reject-crossings mode and,
// in split-crossings mode, can create extra intersection nodes that do not
// increment currentStep. This cleanup tranche removes rescue-site substitution
// and lonely-node insertion from normal execution so failed arrivals now stop
// explicitly with a recorded reason.
function stepSimulation(input) {
  const state = clone(input);
  const rng = createRng(state.rngSeed);
  rng.state = state.rngState;

  if (state.status === 'done' || state.status === 'early_stopped') {
    return state;
  }
  if (state.currentStep >= state.params.finalNodeCount) {
    state.status = 'done';
    state.terminationReason = 'completed';
    return state;
  }

  const feasible = state.nodes.filter((node) => node.degree < node.capacity - 1e-9);
  const currentAccessibility = computeTransportAccessibility(state.nodes, state.edges, state.params);
  const accessSelectionContext = buildAccessSelectionContext(currentAccessibility, state.params);
  if (feasible.length === 0) {
    state.status = 'early_stopped';
    state.terminationReason = 'no_feasible_nodes';
    state.rngState = rng.state;
    return state;
  }

  let arrivingNode = null;
  let selection = null;
  let retryCount = 0;
  let arrivalSource = null;
  let arrivalSiteAudit = null;
  for (let attempt = 0; attempt < (state.params.planarityMode === 'reject_crossings' ? NON_CROSSING_RETRY_LIMIT : 1); attempt += 1) {
    const arrivalChoice = chooseArrivalPoint(state, rng);
    arrivalSource = arrivalChoice?.source || 'unknown';
    arrivalSiteAudit = arrivalChoice?.siteAudit || null;
    if (!arrivalChoice || !arrivalChoice.point) {
      selection = {
        selectedTargetIds: [],
      selectionRounds: [],
      truncationOccurred: false,
      missingLinks: state.params.kappa,
      emptyReason: state.params.arrivalMode === 'network' ? 'no_network_arrival_sites' : 'no_arrival_sites',
      crossingCandidateCount: 0,
    };
      retryCount = attempt;
      break;
    }
    const [x, y] = arrivalChoice.point;
    const candidate = updateCapacityState({
      id: nodeIdFromIndex(state.nextNodeIndex),
      x,
      y,
      birthStep: state.currentStep,
      degree: 0,
      capacity: sampleCapacity(rng, state.params, false),
      residualCapacity: 0,
      saturated: false,
      lonely: false,
      weight: 1,
      typeShare: 0.5,
    });
    assignArrivalLatticeCoordinates(candidate, arrivalChoice, state.latticeMetadata, state.params);
    const candidateSelection = selectSequentialNeighbors(candidate, state.nodes, state.params, rng, state.edges, state.latticeMetadata, accessSelectionContext);
    arrivingNode = candidate;
    selection = candidateSelection;
    retryCount = attempt;
    if (candidateSelection.selectedTargetIds.length > 0 || state.params.planarityMode !== 'reject_crossings') {
      break;
    }
  }
  const candidateDiagnostics = arrivingNode
    ? diagnoseArrivalCandidates(arrivingNode, state.nodes, state.params, state.edges, state.latticeMetadata, selection?.selectionRounds || [], accessSelectionContext)
    : null;

  if (!selection || selection.selectedTargetIds.length === 0) {
    const failureReason = selection?.emptyReason || 'no_feasible_targets';
    state.status = 'early_stopped';
    state.terminationReason = failureReason;
    state.lastStepDetails = {
      newNodeId: arrivingNode?.id || nodeIdFromIndex(state.nextNodeIndex),
      selectedTargetIds: [],
      truncationOccurred: false,
      missingLinks: state.params.kappa,
      selectionRounds: selection ? selection.selectionRounds : [],
      createdIntersectionIds: [],
      retryCount,
      arrivalCommitted: false,
      failureReason,
      arrivalSource,
      arrivalSiteAudit,
      candidateDiagnostics,
    };
    state.rngState = rng.state;
    return state;
  }
  if (selection.truncationOccurred) {
    state.truncationEvents += 1;
    state.totalMissingLinks += selection.missingLinks;
  }
  state.crossingCandidatesEncountered += selection.crossingCandidateCount ?? 0;

  state.nextNodeIndex += 1;
  state.nodes.push(arrivingNode);
  const createdIntersections = [];
  selection.selectedTargetIds.forEach((targetId) => {
    recordReferenceLink(state, arrivingNode.id, targetId, state.currentStep, 'arrival');
    const targetNode = nodeMap(state.nodes).get(targetId);
    if (targetNode && edgeWouldCrossExisting(arrivingNode, targetNode, nodeMap(state.nodes), state.edges)) {
      state.crossingCandidatesAdmitted += 1;
    }
    const connection = applyConnectionWithPlanarity(state, arrivingNode.id, targetId, state.currentStep, rng);
    createdIntersections.push(...connection.createdIntersections);
  });
  if (createdIntersections.length > 0) {
    state.splitEvents += 1;
  }
  updateCapacityState(arrivingNode);
  state.currentStep += 1;
  state.lastStepDetails = {
    newNodeId: arrivingNode.id,
    selectedTargetIds: selection.selectedTargetIds,
    truncationOccurred: selection.truncationOccurred,
    missingLinks: selection.missingLinks,
    selectionRounds: selection.selectionRounds,
    createdIntersectionIds: createdIntersections,
    retryCount,
    arrivalCommitted: true,
    arrivalSource,
    arrivalSiteAudit,
    candidateDiagnostics,
  };
  state.rngState = rng.state;

  if (state.params.trackHistory) {
    state.history.push(historySnapshot(state));
  }

  if (state.currentStep >= state.params.finalNodeCount) {
    state.status = 'done';
    state.terminationReason = 'completed';
  } else {
    state.status = 'paused';
  }
  return state;
}

function runSimulation(params) {
  let state = initializeSimulation(params);
  while (state.status !== 'done' && state.status !== 'early_stopped') {
    state = stepSimulation(state);
  }
  return state;
}

function scenarioDocument(params, name = 'shared-scenario') {
  return { version: 1, name, params };
}

function parseScenarioDocument(text) {
  const raw = JSON.parse(text);
  if (raw.version !== 1 || !raw.params) {
    throw new Error('Unsupported scenario document.');
  }
  return raw;
}

function mergeScenarioParams(params) {
  const defaults = createDefaultParams();
  return {
    ...defaults,
    ...params,
    capacityParams: {
      ...defaults.capacityParams,
      ...(params.capacityParams || {}),
    },
  };
}

function csvFromNodes(nodes) {
  const rows = ['id,x,y,birthStep,degree,capacity,residualCapacity,saturated,weight,typeShare,attractionShare,accessValue,accessCumulative,accessGravity,generatedBy,latticeU,latticeV'];
  nodes.forEach((node) => {
    rows.push([
      node.id,
      node.x,
      node.y,
      node.birthStep,
      node.degree,
      node.capacity,
      node.residualCapacity,
      node.saturated,
      node.weight ?? 1,
      node.typeShare ?? 0.5,
      1 - (node.typeShare ?? 0.5),
      node.accessValue ?? 0,
      node.accessCumulative ?? 0,
      node.accessGravity ?? 0,
      node.generatedBy || 'arrival',
      Number.isFinite(node.latticeU) ? node.latticeU : '',
      Number.isFinite(node.latticeV) ? node.latticeV : '',
    ].join(','));
  });
  return rows.join('\n');
}

function csvFromEdges(edges) {
  const rows = ['id,source,target,length,birthStep'];
  edges.forEach((edge) => {
    rows.push([edge.id, edge.source, edge.target, edge.length, edge.birthStep].join(','));
  });
  return rows.join('\n');
}

function gmnsNodeCsv(state) {
  const rows = ['node_id,x_coord,y_coord,node_type,zone_id,birth_step,degree,capacity,residual_capacity,is_centroid,generated_by,lattice_u,lattice_v,is_split_node,weight,production_share,attraction_share,access_value,access_cumulative,access_gravity'];
  state.nodes.forEach((node) => {
    rows.push([
      node.id,
      node.x.toFixed(6),
      node.y.toFixed(6),
      node.generatedBy === 'split_crossing' ? 'intersection' : 'network',
      '',
      node.birthStep,
      node.degree,
      Number(node.capacity).toFixed(6),
      Number(node.residualCapacity).toFixed(6),
      0,
      node.generatedBy || 'arrival',
      Number.isFinite(node.latticeU) ? node.latticeU : '',
      Number.isFinite(node.latticeV) ? node.latticeV : '',
      node.generatedBy === 'split_crossing' ? 1 : 0,
      Number(node.weight ?? 1).toFixed(6),
      Number(node.typeShare ?? 0.5).toFixed(6),
      Number(1 - (node.typeShare ?? 0.5)).toFixed(6),
      Number(node.accessValue ?? 0).toFixed(6),
      Number(node.accessCumulative ?? 0).toFixed(6),
      Number(node.accessGravity ?? 0).toFixed(6),
    ].join(','));
  });
  return rows.join('\n');
}

function gmnsLinkCsv(state) {
  const byId = nodeMap(state.nodes);
  const rows = ['link_id,from_node_id,to_node_id,dir_flag,length,facility_type,free_speed,capacity,lanes,birth_step,generated_by,geometry'];
  state.edges.forEach((edge) => {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    const geometry = source && target ? `"LINESTRING (${source.x.toFixed(6)} ${source.y.toFixed(6)}, ${target.x.toFixed(6)} ${target.y.toFixed(6)})"` : '""';
    rows.push([
      edge.id,
      edge.source,
      edge.target,
      0,
      Number(edge.length).toFixed(6),
      edge.generatedBy === 'split_crossing' ? 'split' : 'network',
      '',
      '',
      '',
      edge.birthStep,
      edge.generatedBy || 'arrival',
      geometry,
    ].join(','));
  });
  return rows.join('\n');
}

function renderedPointFromUnit(point) {
  const zoom = state.cy?.zoom?.() ?? 1;
  const pan = state.cy?.pan?.() ?? { x: 0, y: 0 };
  return {
    x: point.x * 1000 * zoom + pan.x,
    y: (1 - point.y) * 1000 * zoom + pan.y,
  };
}

function chooseScaleBarUnits(pixelsPerUnit) {
  const options = [0.05, 0.1, 0.2, 0.25, 0.5];
  let best = options[0];
  let bestScore = Infinity;
  options.forEach((value) => {
    const px = value * pixelsPerUnit;
    const score = Math.abs(px - 90);
    if (px >= 40 && px <= 160 && score < bestScore) {
      best = value;
      bestScore = score;
    }
  });
  return best;
}

function graphSvg(state, options = {}) {
  const width = options.width || 900;
  const height = options.height || 900;
  const padding = 40;
  const x = (value) => padding + value * (width - padding * 2);
  const y = (value) => height - padding - value * (height - padding * 2);
  const lines = state.edges.map((edge) => {
    const source = state.nodes.find((node) => node.id === edge.source);
    const target = state.nodes.find((node) => node.id === edge.target);
    return `<line x1="${x(source.x)}" y1="${y(source.y)}" x2="${x(target.x)}" y2="${y(target.y)}" stroke="#7a8aa1" stroke-width="1.1" />`;
  }).join('');
  const circles = state.nodes.map((node) => {
    const radius = 3 + Math.sqrt(node.degree);
    return `<circle cx="${x(node.x)}" cy="${y(node.y)}" r="${radius.toFixed(2)}" fill="${node.saturated ? '#b42318' : '#0b4f6c'}" />`;
  }).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />
  <rect x="${padding}" y="${padding}" width="${width - padding * 2}" height="${height - padding * 2}" fill="none" stroke="#98a2b3" stroke-width="1" />
  ${lines}
  ${circles}
</svg>`;
}

function summarizeMetric(values) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const sorted = [...values].sort((a, b) => a - b);
  const quantile = (ratio) => sorted[Math.floor((sorted.length - 1) * ratio)];
  return { mean, sd: Math.sqrt(variance), q05: quantile(0.05), q50: quantile(0.5), q95: quantile(0.95) };
}

function summarizeBatchScenario(runs) {
  const metricKeys = Object.keys(runs[0].metrics).filter((key) => typeof runs[0].metrics[key] === 'number');
  const metrics = {};
  metricKeys.forEach((key) => {
    metrics[key] = summarizeMetric(runs.map((run) => run.metrics[key]));
  });
  const preferredTailModelCounts = {};
  runs.forEach((run) => {
    preferredTailModelCounts[run.tail.preferredModel] = (preferredTailModelCounts[run.tail.preferredModel] || 0) + 1;
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

function runBatchConfig(config, progressCallback) {
  const runs = [];
  const total = config.scenarios.length * config.replications;
  let completed = 0;
  config.scenarios.forEach((scenario) => {
    for (let replication = 0; replication < config.replications; replication += 1) {
      const seed = deriveSeed(scenario.params.rngSeed, scenario.id, replication);
      const runState = runSimulation({ ...scenario.params, rngSeed: seed });
      const metrics = computeNetworkMetricsWithContext(
        runState.nodes,
        runState.edges,
        runState.params.degreeThreshold,
        runState.latticeMetadata,
        runState.splitEvents ?? 0,
        {
          crossingCandidatesEncountered: runState.crossingCandidatesEncountered ?? 0,
          crossingCandidatesAdmitted: runState.crossingCandidatesAdmitted ?? 0,
        },
      );
      const tail = fitTailModels(runState.nodes.map((node) => node.degree));
      runs.push({
        scenarioId: scenario.id,
        scenarioLabel: scenario.label,
        replication,
        seed,
        metrics,
        earlyStopped: runState.status === 'early_stopped',
        terminationReason: runState.terminationReason,
        truncationEvents: runState.truncationEvents,
        totalMissingLinks: runState.totalMissingLinks,
        tail,
      });
      completed += 1;
      if (progressCallback) {
        progressCallback(completed / total);
      }
    }
  });
  const summaries = config.scenarios.map((scenario) => summarizeBatchScenario(runs.filter((run) => run.scenarioId === scenario.id)));
  return { config, runs, summaries };
}

// Standalone browser UI source. Built into web/main.js.

const d3 = window.d3;
const cytoscape = window.cytoscape;

  const COMPONENT_COLORS = ['#0b4f6c', '#c05621', '#2f855a', '#805ad5', '#d69e2e', '#e53e3e'];
  const state = {
    params: createDefaultParams(),
    simulation: null,
    metrics: null,
    tail: null,
    transportAccessibility: null,
    candidateAccessibility: null,
    potentialAccessibility: null,
    ui: {
      activePrimaryTab: 'simulation',
      activeChartTab: 'degree',
      nodeColorMode: 'degree',
      edgeColorByLength: false,
      showBoundary: true,
      showLatticeOverlay: true,
      showCoordinates: false,
      showScaleBar: true,
      highlightSaturated: true,
      highlightNewest: true,
      showAttachmentWeights: false,
      paperMode: false,
      arrivalNotationExpanded: false,
      connectivityNotationExpanded: false,
      figureCaptionDraft: '',
      selectedPresetId: '',
      sidebarSections: {
        simulationScope: true,
        networkInitialization: true,
        arrivalModel: true,
        connectivityModel: true,
        batchNotes: false,
      },
      collapsedPanels: {
        sidebar: false,
        runControls: true,
        mainPanel: false,
        chartPanel: false,
        metricsPanel: false,
        insightsPanel: false,
        accessibilityPanel: false,
      },
    },
    baseline: null,
    comparisons: [],
    batch: { progress: 0, running: false, result: null, saved: [] },
    playTimer: null,
    runTimer: null,
    cy: null,
  };

  const app = document.getElementById('app');
  app.innerHTML = `
    <main id="app-shell" class="app-shell">
      <header class="app-header card">
        <div>
          <h1>General Attachment Lab</h1>
          <p>Browser-deliverable research tool for generalized preferential attachment with true-coordinate Cytoscape rendering and D3 charts.</p>
        </div>
        <div class="control-row">
          <button id="toggle-paper">Paper mode</button>
          <button id="export-bundle">Export data bundle</button>
          <button id="copy-graph-json">Copy graph JSON</button>
        </div>
      </header>
      <nav id="primary-tabs" class="primary-tabs"></nav>
      <section class="layout">
        <aside id="sidebar" class="card panel"></aside>
        <div class="center-column">
          <section id="main-panel" class="card panel"></section>
          <section id="run-controls" class="card panel"></section>
          <section id="chart-panel" class="card panel"></section>
        </div>
        <div class="right-column">
          <section id="metrics-panel" class="card panel"></section>
          <section id="insights-panel" class="card panel"></section>
          <section id="accessibility-panel" class="card panel"></section>
        </div>
      </section>
      <div id="accessibility-live" class="sr-only" aria-live="polite" aria-atomic="true"></div>
    </main>
  `;

  const refs = {
    shell: document.getElementById('app-shell'),
    primaryTabs: document.getElementById('primary-tabs'),
    sidebar: document.getElementById('sidebar'),
    runControls: document.getElementById('run-controls'),
    mainPanel: document.getElementById('main-panel'),
    chartPanel: document.getElementById('chart-panel'),
    metricsPanel: document.getElementById('metrics-panel'),
    insightsPanel: document.getElementById('insights-panel'),
    accessibilityPanel: document.getElementById('accessibility-panel'),
    accessibilityLive: document.getElementById('accessibility-live'),
  };

  function initializeAppState() {
    const hash = window.location.hash.startsWith('#scenario=') ? window.location.hash.slice('#scenario='.length) : null;
    if (hash) {
      try {
        const json = new TextDecoder().decode(Uint8Array.from(window.atob(hash), (char) => char.charCodeAt(0)));
        state.params = sanitizeParams(mergeScenarioParams(parseScenarioDocument(json).params));
      } catch {
        state.params = createDefaultParams();
      }
    }
    state.ui.selectedPresetId = detectMatchingPresetId(state.params);
    resetSimulation();
    state.batch.saved = readStoredBatchResults();
  }

  function detectMatchingPresetId(params) {
    const preset = scenarioPresets.find((entry) =>
      Object.entries(entry.params).every(([key, value]) => JSON.stringify(params[key]) === JSON.stringify(value)),
    );
    return preset ? preset.id : '';
  }

  function setHashFromParams() {
    const bytes = new TextEncoder().encode(JSON.stringify(scenarioDocument(state.params)));
    const encoded = window.btoa(String.fromCharCode(...bytes));
    window.history.replaceState({}, '', `#scenario=${encoded}`);
  }

  function resetSimulation() {
    state.simulation = initializeSimulation(state.params);
    state.metrics = computeNetworkMetricsWithContext(
      state.simulation.nodes,
      state.simulation.edges,
      state.params.degreeThreshold,
      state.simulation.latticeMetadata,
      state.simulation.splitEvents,
      {
        crossingCandidatesEncountered: state.simulation.crossingCandidatesEncountered ?? 0,
        crossingCandidatesAdmitted: state.simulation.crossingCandidatesAdmitted ?? 0,
      },
    );
    state.tail = fitTailModels(state.simulation.nodes.map((node) => node.degree));
    state.transportAccessibility = computeTransportAccessibility(state.simulation.nodes, state.simulation.edges, state.params);
    applyAccessibilityToNodes(state.simulation.nodes, state.transportAccessibility);
    state.candidateAccessibility = computeCandidateSiteAccessibility(state.simulation, state.params);
    state.potentialAccessibility = computePotentialSiteAccessibility(state.simulation, state.params);
    stopPlaying();
    stopRunning();
  }

  function refreshDerived() {
    state.metrics = computeNetworkMetricsWithContext(
      state.simulation.nodes,
      state.simulation.edges,
      state.params.degreeThreshold,
      state.simulation.latticeMetadata,
      state.simulation.splitEvents,
      {
        crossingCandidatesEncountered: state.simulation.crossingCandidatesEncountered ?? 0,
        crossingCandidatesAdmitted: state.simulation.crossingCandidatesAdmitted ?? 0,
      },
    );
    state.tail = fitTailModels(state.simulation.nodes.map((node) => node.degree));
    state.transportAccessibility = computeTransportAccessibility(state.simulation.nodes, state.simulation.edges, state.params);
    applyAccessibilityToNodes(state.simulation.nodes, state.transportAccessibility);
    state.candidateAccessibility = computeCandidateSiteAccessibility(state.simulation, state.params);
    state.potentialAccessibility = computePotentialSiteAccessibility(state.simulation, state.params);
    render();
  }

  function stopPlaying() {
    if (state.playTimer) {
      window.clearTimeout(state.playTimer);
      state.playTimer = null;
    }
  }

  function stopRunning() {
    if (state.runTimer) {
      window.clearTimeout(state.runTimer);
      state.runTimer = null;
    }
  }

  function playTick() {
    if (state.simulation.status === 'done' || state.simulation.status === 'early_stopped') {
      stopPlaying();
      renderRunControls();
      return;
    }
    state.simulation = stepSimulation(state.simulation);
    refreshDerived();
    state.playTimer = window.setTimeout(playTick, state.params.animationSpeedMs);
  }

  function startPlaying() {
    stopRunning();
    stopPlaying();
    state.playTimer = window.setTimeout(playTick, state.params.animationSpeedMs);
  }

  function runOnceTick() {
    const chunkSize = state.params.finalNodeCount > 1000 ? 8 : 20;
    let steps = 0;
    while (steps < chunkSize && state.simulation.status !== 'done' && state.simulation.status !== 'early_stopped') {
      state.simulation = stepSimulation(state.simulation);
      steps += 1;
    }

    if (state.simulation.status !== 'done' && state.simulation.status !== 'early_stopped') {
      state.simulation.status = 'running';
      renderRunControls();
      state.runTimer = window.setTimeout(runOnceTick, 0);
      return;
    }

    stopRunning();
    refreshDerived();
  }

  function startRunOnce() {
    stopPlaying();
    stopRunning();
    state.simulation.status = 'running';
    renderRunControls();
    state.runTimer = window.setTimeout(runOnceTick, 0);
  }

  function setParam(key, value) {
    if (key === 'capacityParams') {
      state.params.capacityParams = value;
    } else {
      state.params[key] = value;
    }
    state.params = sanitizeParams(state.params);
    state.ui.selectedPresetId = '';
    setHashFromParams();
    resetSimulation();
    render();
  }

  function applyPreset(presetId) {
    const preset = scenarioPresets.find((entry) => entry.id === presetId);
    if (!preset) {
      return;
    }
    state.params = sanitizeParams(mergeScenarioParams(preset.params));
    state.ui.selectedPresetId = presetId;
    setHashFromParams();
    resetSimulation();
    render();
  }

  function saveBaseline() {
    state.baseline = { label: 'Baseline', state: clone(state.simulation) };
    render();
  }

  function saveComparison() {
    state.comparisons.push({ id: `comparison-${Date.now()}`, label: `Scenario ${state.comparisons.length + 1}`, state: clone(state.simulation) });
    render();
  }

  function removeComparison(id) {
    state.comparisons = state.comparisons.filter((entry) => entry.id !== id);
    render();
  }

  function exportText(filename, content, mimeType = 'text/plain;charset=utf-8') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function exportCurrentBundle() {
    exportText('nodes.csv', csvFromNodes(state.simulation.nodes), 'text/csv;charset=utf-8');
    exportText('edges.csv', csvFromEdges(state.simulation.edges), 'text/csv;charset=utf-8');
    exportText('gmns_node.csv', gmnsNodeCsv(state.simulation), 'text/csv;charset=utf-8');
    exportText('gmns_link.csv', gmnsLinkCsv(state.simulation), 'text/csv;charset=utf-8');
    if (state.transportAccessibility?.available) {
      const rows = ['id,cumulative_access,gravity_access'];
      state.simulation.nodes.forEach((node) => {
        rows.push([node.id, state.transportAccessibility.cumulativeById[node.id] ?? 0, state.transportAccessibility.gravityById[node.id] ?? 0].join(','));
      });
      exportText('transport-accessibility.csv', rows.join('\n'), 'text/csv;charset=utf-8');
    }
    if (state.candidateAccessibility?.available) {
      const rows = ['lattice_u,lattice_v,x,y,attachable_neighbor_count,provisional_targets,realizable_now,candidate_cumulative_access,candidate_gravity_access'];
      state.candidateAccessibility.rows.forEach((row) => {
        rows.push([
          row.u, row.v, row.x.toFixed(6), row.y.toFixed(6), row.attachableNeighborCount, `"${row.provisionalTargetIds.join('|')}"`,
          row.realizableNow ? 1 : 0,
          row.realizableNow ? row.cumulative.toFixed(6) : '',
          row.realizableNow ? row.gravity.toFixed(6) : '',
        ].join(','));
      });
      exportText('candidate-site-accessibility.csv', rows.join('\n'), 'text/csv;charset=utf-8');
    }
    if (state.potentialAccessibility?.available) {
      const rows = ['lattice_u,lattice_v,x,y,is_current_candidate,attachable_neighbor_count,provisional_targets,realizable_now,potential_cumulative_access,potential_gravity_access'];
      state.potentialAccessibility.rows.forEach((row) => {
        rows.push([
          row.u, row.v, row.x.toFixed(6), row.y.toFixed(6), row.isCurrentCandidate ? 1 : 0, row.attachableNeighborCount, `"${row.provisionalTargetIds.join('|')}"`,
          row.realizableNow ? 1 : 0,
          row.realizableNow ? row.cumulative.toFixed(6) : '',
          row.realizableNow ? row.gravity.toFixed(6) : '',
        ].join(','));
      });
      exportText('potential-site-accessibility.csv', rows.join('\n'), 'text/csv;charset=utf-8');
    }
    exportText('metrics.json', JSON.stringify(state.metrics, null, 2), 'application/json');
  }

  async function exportSvgAsPng(filename, svgMarkup, width = 1200, height = 700) {
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    const anchor = document.createElement('a');
    anchor.href = canvas.toDataURL('image/png');
    anchor.download = filename;
    anchor.click();
  }

  async function copyGraphJson() {
    if (!navigator.clipboard) {
      return;
    }
    await navigator.clipboard.writeText(JSON.stringify({
      params: state.params,
      nodes: state.simulation.nodes,
      edges: state.simulation.edges,
      status: state.simulation.status,
      terminationReason: state.simulation.terminationReason,
      truncationEvents: state.simulation.truncationEvents,
      totalMissingLinks: state.simulation.totalMissingLinks,
    }, null, 2));
  }

  function readStoredBatchResults() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.batchResults) || '[]');
    } catch {
      return [];
    }
  }

  function storeBatchResults() {
    localStorage.setItem(STORAGE_KEYS.batchResults, JSON.stringify(state.batch.saved));
  }

  function panelHeader(title, panelKey, extra = '') {
    const collapsed = state.ui.collapsedPanels[panelKey];
    return `
      <div class="panel__header">
        <h2>${escapeHtml(title)}</h2>
        <div class="panel__header-actions">
          ${extra}
          <button class="panel-toggle" type="button" data-panel-toggle="${panelKey}" aria-expanded="${collapsed ? 'false' : 'true'}" title="${collapsed ? 'Expand panel' : 'Collapse panel'}">${collapsed ? '&#9656;' : '&#9662;'}</button>
        </div>
      </div>
    `;
  }

  function panelBody(panelKey, body) {
    return state.ui.collapsedPanels[panelKey] ? '' : body;
  }

  function wirePanelToggle(container) {
    const button = container.querySelector('[data-panel-toggle]');
    if (!button) {
      return;
    }
    button.addEventListener('click', () => {
      const key = button.dataset.panelToggle;
      state.ui.collapsedPanels[key] = !state.ui.collapsedPanels[key];
      render();
    });
  }

  function sidebarSubpanel(title, hint, body) {
    return `
      <section class="sidebar-subpanel">
        <h4 class="sidebar-subpanel__title">${escapeHtml(title)}</h4>
        ${hint ? `<p class="sidebar-subpanel__hint">${escapeHtml(hint)}</p>` : ''}
        ${body}
      </section>
    `;
  }

  function renderPrimaryTabs() {
    const tabs = [
      ['simulation', 'Simulation'],
      ['comparison', 'Comparison'],
      ['batch', 'Batch'],
      ['paper', 'Paper mode'],
    ];
    refs.primaryTabs.innerHTML = tabs.map(([id, label]) => `<button data-tab="${id}" class="${state.ui.activePrimaryTab === id ? 'active' : ''}">${label}</button>`).join('');
    refs.primaryTabs.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => {
        state.ui.activePrimaryTab = button.dataset.tab;
        render();
      });
    });
  }

function arrivalNotationMarkup() {
    const arrivalRule = state.params.arrivalMode === 'uniform'
      ? '(x_n, y_n) ~ Uniform([0,1]^2)'
      : state.params.arrivalMode === 'uniform_lattice'
        ? '(u_n, v_n) chosen from lattice sites in the unit square, then mapped to (x_n, y_n)'
        : state.params.arrivalMode === 'network'
          ? '(u_n, v_n) chosen from admissible sites near the existing network frontier'
          : '(u_n, v_n) chosen from admissible projected outward-shell sites';
    return `
      <details class="equation-card" id="arrival-notation-card" ${state.ui.arrivalNotationExpanded ? 'open' : ''}>
        <summary>
          <div>
            <h3>Arrival Model notation</h3>
            <p class="equation-subtitle">How new nodes are placed before any links are chosen.</p>
          </div>
        </summary>
        <div class="equation-body">
          <div class="equation-code">${escapeHtml(arrivalRule)}</div>
          <ul class="equation-list">
            <li><strong>n</strong>: arriving node at the current step.</li>
            <li><strong>(x_n, y_n)</strong>: realized spatial coordinates of the arriving node in the unit square.</li>
            <li><strong>(u_n, v_n)</strong>: projected lattice coordinates used only in lattice-biased exploratory arrival modes.</li>
            <li><strong>Seed graph</strong> widget: chooses the initial node set and initial connectivity before growth begins.</li>
            <li><strong>Arrival mode</strong> widget: chooses whether arrivals are square-uniform, lattice-uniform, near the existing network, or on the outward shell.</li>
            <li><strong>mesh mode</strong>: optional exploratory lattice regularization layered on top of the baseline arrival process.</li>
            <li><strong>mesh angle set</strong>: allowed lattice-angle family for projected sites, such as 30, 45, 60, or 90 degrees.</li>
            <li><strong>arrival distance</strong> widget: mean outward step length used by the frontier heuristics.</li>
            <li><strong>arrival distance sd</strong> widget: spread of those outward step lengths.</li>
            <li><strong>mesh spacing</strong> widget: minimum separation factor used to keep arrivals from landing too close to occupied sites.</li>
            <li><strong>Arrival preference</strong> widget: baseline structural ranking of candidate sites or accessibility-weighted site ranking.</li>
            <li><strong>Access semantics</strong> widget: chooses whether accessibility is measured to all realized nodes, seed nodes only, or weighted opportunity mass.</li>
            <li><strong>Arrival access metric</strong> widget: cumulative or gravity accessibility used for accessibility-weighted site ranking.</li>
            <li><strong>arrival access strength</strong> widget: strength of the accessibility term in site ranking.</li>
          </ul>
        </div>
      </details>
    `;
}

function connectivityNotationMarkup() {
    const powerKernel = 'w_ni = (k_i + eps)^alpha * max(K_i - k_i, 0)^beta * (c_ni + eps)^(-phi)';
    const expKernel = 'w_ni = (k_i + eps)^alpha * max(K_i - k_i, 0)^beta * exp(-lambda * c_ni)';
    const probabilityRule = 'P_ni = w_ni / sum_j w_nj, over feasible existing candidates j';
    return `
      <details class="equation-card" id="connectivity-notation-card" ${state.ui.connectivityNotationExpanded ? 'open' : ''}>
        <summary>
          <div>
            <h3>Connectivity Model notation</h3>
            <p class="equation-subtitle">How an arrival chooses existing nodes to connect to.</p>
          </div>
        </summary>
        <div class="equation-body">
          <p class="note">Sequential without-replacement target selection over the current feasible existing nodes.</p>
          <div class="equation-code">${escapeHtml(state.params.impedanceMode === 'exponential' ? expKernel : powerKernel)}</div>
          <div class="equation-code">${escapeHtml(probabilityRule)}</div>
          <ul class="equation-list">
            <li><strong>w_ni</strong>: attachment weight from arriving node <em>n</em> to candidate <em>i</em>.</li>
            <li><strong>P_ni</strong>: normalized attachment probability over the feasible candidate set.</li>
            <li><strong>alpha</strong>: preferential-attachment strength on current degree.</li>
            <li><strong>beta</strong>: capacity-saturation strength on remaining capacity.</li>
            <li><strong>phi</strong>: cost-deterrence exponent in the power-cost form.</li>
            <li><strong>lambda</strong>: distance-decay rate in the exponential-cost form.</li>
            <li><strong>k_i</strong>: current degree of candidate node <em>i</em>.</li>
            <li><strong>K_i</strong>: capacity of candidate node <em>i</em>.</li>
            <li><strong>c_ni</strong>: Euclidean distance from arriving node <em>n</em> to candidate node <em>i</em>.</li>
            <li><strong>eps</strong>: small positive regularization constant.</li>
            <li><strong>N</strong> widget: target number of arrival steps to realize.</li>
            <li><strong>kappa</strong> widget: number of links each new node attempts to form.</li>
            <li><strong>m0</strong> widget: seed-graph size.</li>
            <li><strong>K</strong> widget: homogeneous node capacity when capacity mode is constant.</li>
            <li><strong>Capacity mode</strong> widget: homogeneous, uniform, or lognormal capacity at birth.</li>
            <li><strong>Impedance type</strong> widget: power-cost or exponential-distance kernel.</li>
            <li><strong>Planarity mode</strong> widget: none, reject crossings, or split crossings.</li>
            <li><strong>Mesh adjacency</strong> widget: restricts feasible targets to local lattice neighbors in lattice-biased runs.</li>
            <li><strong>mesh nearest q</strong> widget: keeps only the nearest <em>q</em> admissible targets before probability normalization.</li>
            <li><strong>mesh angle bias</strong> widget: penalizes target links that deviate from the allowed lattice-angle family.</li>
            <li><strong>Selection rule</strong> widget: baseline kernel or access-weighted kernel.</li>
            <li><strong>Access semantics</strong> widget: network access, seed-only access, or weighted opportunity access used by the accessibility layer and access-weighted extensions.</li>
            <li><strong>Access metric</strong> widget: cumulative or gravity accessibility used in access-weighted target choice.</li>
            <li><strong>access strength</strong> widget: strength of the accessibility term in target choice.</li>
          </ul>
        </div>
      </details>
    `;
}

  function renderSidebar() {
    const warnings = validateSimulationParams(state.params).filter((entry) => entry.level === 'warning').map((entry) => entry.message);
    const triangularFamily = latticeBasisStepDegrees(state.params) === 60;
    const batchOnlyDisabled = state.ui.activePrimaryTab !== 'batch';
    const meshDisabled = state.params.meshMode !== 'grid_bias';
    const powerImpedanceDisabled = state.params.impedanceMode !== 'power';
    const exponentialImpedanceDisabled = state.params.impedanceMode !== 'exponential';
    const arrivalAccessDisabled = state.params.arrivalPreferenceMode !== 'access';
    const selectionAccessDisabled = state.params.selectionKernelMode !== 'access';
    const adjacencyOptions = triangularFamily
      ? [
        { value: 'none', label: 'None' },
        { value: 'rook', label: 'Nearest edge-neighbor (6)' },
        { value: 'queen', label: 'Expanded local ring (12)' },
      ]
      : [
        { value: 'none', label: 'None' },
        { value: 'rook', label: 'Nearest edge-neighbor (4)' },
        { value: 'queen', label: 'Edge-plus-corner (8)' },
      ];
    refs.sidebar.innerHTML = `
      ${panelHeader('Parameters', 'sidebar')}
      ${panelBody('sidebar', `
        <div class="sidebar-actions">
          <button id="run-once">Run once</button>
          <button id="step-once">Step arrival</button>
          <button id="play-toggle">${state.playTimer ? 'Pause' : 'Play'}</button>
          <button id="reset-run">Reset</button>
        </div>
        <label class="field field--compact">
          <span>Preset</span>
          <select id="preset-select">
            <option value="" ${state.ui.selectedPresetId === '' ? 'selected' : ''}>Choose preset</option>
            ${scenarioPresets.map((preset) => `<option value="${preset.id}" ${state.ui.selectedPresetId === preset.id ? 'selected' : ''}>${preset.label}</option>`).join('')}
          </select>
        </label>
        ${sidebarSection('simulationScope', 'Simulation Scope', true, `
          ${sidebarSubpanel('Run size', 'Controls that define the scale and execution settings for the simulation.', `
            <div class="field-grid field-grid--tight">
              ${numberField('finalNodeCount', 'N', state.params.finalNodeCount, 1, state.params.m0, PARAM_LIMITS.finalNodeCount.max, true)}
              ${numberField('kappa', 'kappa', state.params.kappa, 1, 1, Math.min(PARAM_LIMITS.kappa.max, Math.max(state.params.finalNodeCount - 1, 1)), true)}
              ${numberField('rngSeed', 'RNG seed', state.params.rngSeed, 1, PARAM_LIMITS.rngSeed.min, PARAM_LIMITS.rngSeed.max, true)}
              ${numberField('animationSpeedMs', 'Animation ms', state.params.animationSpeedMs, 10, PARAM_LIMITS.animationSpeedMs.min, PARAM_LIMITS.animationSpeedMs.max, true)}
              ${numberField('replicationCount', 'Replications', state.params.replicationCount, 1, PARAM_LIMITS.replicationCount.min, PARAM_LIMITS.replicationCount.max, true, batchOnlyDisabled)}
            </div>
          `)}
        `)}
        ${sidebarSection('networkInitialization', 'Network Initialization', true, `
          ${sidebarSubpanel('Lattice framing', 'Optional geometric frame inherited by later exploratory arrival rules.', `
            <div class="field-grid field-grid--tight">
              <label class="field field--compact">
                <span>Mesh mode</span>
                <select id="meshMode">
                  <option value="off" ${state.params.meshMode === 'off' ? 'selected' : ''}>Off</option>
                  <option value="grid_bias" ${state.params.meshMode === 'grid_bias' ? 'selected' : ''}>Grid bias</option>
                </select>
              </label>
              <label class="field field--compact ${meshDisabled ? 'field--disabled' : ''}">
                <span>Mesh angle set</span>
                <select id="meshAngleSet" ${meshDisabled ? 'disabled' : ''}>
                  <option value="30" ${state.params.meshAngleSet === '30' ? 'selected' : ''}>30°</option>
                  <option value="45" ${state.params.meshAngleSet === '45' ? 'selected' : ''}>45°</option>
                  <option value="60" ${state.params.meshAngleSet === '60' ? 'selected' : ''}>60°</option>
                  <option value="90" ${state.params.meshAngleSet === '90' ? 'selected' : ''}>90°</option>
                </select>
              </label>
            </div>
          `)}
          ${sidebarSubpanel('Seed and capacity at birth', 'Controls for the initial network and node capacities before the growth loop begins.', `
            <div class="field-grid field-grid--tight">
              ${numberField('m0', 'm0', state.params.m0, 1, Math.max(2, state.params.kappa + 1), Math.min(PARAM_LIMITS.m0.max, state.params.finalNodeCount), true)}
              ${numberField('capacityValue', 'K', typeof state.params.capacityValue === 'number' ? state.params.capacityValue : 1000, 1, Math.max(1, state.params.kappa, state.params.m0 - 1), PARAM_LIMITS.capacityValue.max, true)}
              <label class="field field--compact">
                <span>Seed graph</span>
                <select id="seedGraphType">
                  <option value="complete" ${state.params.seedGraphType === 'complete' ? 'selected' : ''}>Complete</option>
                  <option value="ring" ${state.params.seedGraphType === 'ring' ? 'selected' : ''}>Ring</option>
                  <option value="grid" ${state.params.seedGraphType === 'grid' ? 'selected' : ''}>Small grid</option>
                  <option value="cross" ${state.params.seedGraphType === 'cross' ? 'selected' : ''}>Point lattice</option>
                </select>
              </label>
              <label class="field field--compact">
                <span>Capacity mode</span>
                <select id="capacityMode">
                  <option value="homogeneous" ${state.params.capacityMode === 'homogeneous' ? 'selected' : ''}>Constant</option>
                  <option value="uniform" ${state.params.capacityMode === 'uniform' ? 'selected' : ''}>Uniform</option>
                  <option value="lognormal" ${state.params.capacityMode === 'lognormal' ? 'selected' : ''}>Lognormal</option>
                </select>
              </label>
            </div>
            ${state.params.capacityMode === 'uniform' ? `
              <div class="field-grid field-grid--tight">
                ${numberField('capacityLow', 'K low', state.params.capacityParams.low ?? 4, 1, PARAM_LIMITS.capacityLow.min, PARAM_LIMITS.capacityLow.max, true)}
                ${numberField('capacityHigh', 'K high', state.params.capacityParams.high ?? 12, 1, Math.max(PARAM_LIMITS.capacityHigh.min, state.params.capacityParams.low ?? 4), PARAM_LIMITS.capacityHigh.max, true)}
              </div>
            ` : ''}
            ${state.params.capacityMode === 'lognormal' ? `
              <div class="field-grid field-grid--tight">
                ${numberField('capacityMean', 'K log-mean', state.params.capacityParams.mean ?? 1.5, 0.1, PARAM_LIMITS.capacityMean.min, PARAM_LIMITS.capacityMean.max, true)}
                ${numberField('capacitySigma', 'K log-sigma', state.params.capacityParams.sigma ?? 0.35, 0.05, PARAM_LIMITS.capacitySigma.min, PARAM_LIMITS.capacitySigma.max, true)}
              </div>
            ` : ''}
          `)}
        `)}
        ${sidebarSection('arrivalModel', 'Arrival Model', true, `
          ${arrivalNotationMarkup()}
          ${sidebarSubpanel('Arrival process', 'How candidate sites for new nodes are generated after initialization.', `
            <div class="field-grid field-grid--tight">
              <label class="field field--compact">
                <span>Arrival mode</span>
                <select id="arrivalMode">
                  <option value="uniform" ${state.params.arrivalMode === 'uniform' ? 'selected' : ''}>Uniform in square</option>
                  <option value="uniform_lattice" ${state.params.arrivalMode === 'uniform_lattice' ? 'selected' : ''}>Uniform on lattice</option>
                  <option value="network" ${state.params.arrivalMode === 'network' ? 'selected' : ''}>Near existing network</option>
                  <option value="frontier" ${state.params.arrivalMode === 'frontier' ? 'selected' : ''}>Outside occupied region</option>
                </select>
              </label>
              ${numberField('arrivalDistanceFactor', 'arrival distance', state.params.arrivalDistanceFactor ?? 1, 0.1, PARAM_LIMITS.arrivalDistanceFactor.min, PARAM_LIMITS.arrivalDistanceFactor.max, true, meshDisabled)}
              ${numberField('arrivalDistanceSdFactor', 'arrival distance sd', state.params.arrivalDistanceSdFactor ?? 0.35, 0.05, PARAM_LIMITS.arrivalDistanceSdFactor.min, PARAM_LIMITS.arrivalDistanceSdFactor.max, true, meshDisabled)}
              ${numberField('meshSpacingFactor', 'mesh spacing', state.params.meshSpacingFactor ?? 0, 0.05, PARAM_LIMITS.meshSpacingFactor.min, PARAM_LIMITS.meshSpacingFactor.max, true, meshDisabled)}
            </div>
          `)}
          ${sidebarSubpanel('Arrival preferences', 'Optional ranking terms that bias which admissible arrival site is used.', `
            <div class="field-grid field-grid--tight">
              <label class="field field--compact">
                <span>Arrival preference</span>
                <select id="arrivalPreferenceMode">
                  <option value="baseline" ${state.params.arrivalPreferenceMode === 'baseline' ? 'selected' : ''}>Baseline arrival ranking</option>
                  <option value="access" ${state.params.arrivalPreferenceMode === 'access' ? 'selected' : ''}>Access-weighted arrivals</option>
                </select>
              </label>
              <label class="field field--compact ${arrivalAccessDisabled ? 'field--disabled' : ''}">
                <span>Arrival access metric</span>
                <select id="arrivalAccessMetric" ${arrivalAccessDisabled ? 'disabled' : ''}>
                  <option value="gravity" ${state.params.arrivalAccessMetric === 'gravity' ? 'selected' : ''}>Gravity access</option>
                  <option value="cumulative" ${state.params.arrivalAccessMetric === 'cumulative' ? 'selected' : ''}>Cumulative access</option>
                </select>
              </label>
              ${numberField('arrivalAccessStrength', 'arrival access strength', state.params.arrivalAccessStrength ?? 0, 0.1, PARAM_LIMITS.arrivalAccessStrength.min, PARAM_LIMITS.arrivalAccessStrength.max, true, arrivalAccessDisabled)}
            </div>
          `)}
        `)}
        ${sidebarSection('connectivityModel', 'Connectivity Panel', true, `
          ${connectivityNotationMarkup()}
          ${sidebarSubpanel('Attachment kernel', 'Controls that shape how feasible targets are weighted once an arrival site is fixed.', `
            <div class="field-grid field-grid--tight">
              ${numberField('alpha', 'alpha', state.params.alpha, 0.1, PARAM_LIMITS.alpha.min, PARAM_LIMITS.alpha.max, true)}
              ${numberField('beta', 'beta', state.params.beta, 0.1, PARAM_LIMITS.beta.min, PARAM_LIMITS.beta.max, true)}
              ${numberField('phi', 'phi', state.params.phi, 0.1, PARAM_LIMITS.phi.min, PARAM_LIMITS.phi.max, true, powerImpedanceDisabled)}
              ${numberField('lambda', 'lambda', state.params.lambda ?? 1, 0.1, PARAM_LIMITS.lambda.min, PARAM_LIMITS.lambda.max, true, exponentialImpedanceDisabled)}
              <label class="field field--compact">
                <span>Impedance type</span>
                <select id="impedanceMode">
                  <option value="power" ${state.params.impedanceMode === 'power' ? 'selected' : ''}>Power cost</option>
                  <option value="exponential" ${state.params.impedanceMode === 'exponential' ? 'selected' : ''}>Exponential cost</option>
                </select>
              </label>
              <label class="field field--compact">
                <span>Selection rule</span>
                <select id="selectionKernelMode">
                  <option value="baseline" ${state.params.selectionKernelMode === 'baseline' ? 'selected' : ''}>Baseline kernel</option>
                  <option value="access" ${state.params.selectionKernelMode === 'access' ? 'selected' : ''}>Access-weighted kernel</option>
                </select>
              </label>
              <label class="field field--compact">
                <span>Access semantics</span>
                <select id="accessSemantics">
                  <option value="network" ${state.params.accessSemantics === 'network' ? 'selected' : ''}>Network access</option>
                  <option value="seed" ${state.params.accessSemantics === 'seed' ? 'selected' : ''}>Seed-only access</option>
                  <option value="opportunity" ${state.params.accessSemantics === 'opportunity' ? 'selected' : ''}>Weighted opportunity access</option>
                </select>
              </label>
              <label class="field field--compact ${selectionAccessDisabled ? 'field--disabled' : ''}">
                <span>Access metric</span>
                <select id="accessSelectionMetric" ${selectionAccessDisabled ? 'disabled' : ''}>
                  <option value="gravity" ${state.params.accessSelectionMetric === 'gravity' ? 'selected' : ''}>Gravity access</option>
                  <option value="cumulative" ${state.params.accessSelectionMetric === 'cumulative' ? 'selected' : ''}>Cumulative access</option>
                </select>
              </label>
              ${numberField('accessSelectionStrength', 'access strength', state.params.accessSelectionStrength ?? 0, 0.1, PARAM_LIMITS.accessSelectionStrength.min, PARAM_LIMITS.accessSelectionStrength.max, true, selectionAccessDisabled)}
            </div>
          `)}
          ${sidebarSubpanel('Topology constraints', 'Rules that restrict which nearby targets remain admissible once the kernel is evaluated.', `
            <div class="field-grid field-grid--tight">
              <label class="field field--compact">
                <span>Planarity mode</span>
                <select id="planarityMode">
                  <option value="none" ${state.params.planarityMode === 'none' ? 'selected' : ''}>None</option>
                  <option value="reject_crossings" ${state.params.planarityMode === 'reject_crossings' ? 'selected' : ''}>Reject crossings</option>
                  <option value="split_crossings" ${state.params.planarityMode === 'split_crossings' ? 'selected' : ''}>Split crossings</option>
                </select>
              </label>
              <label class="field field--compact ${meshDisabled ? 'field--disabled' : ''}">
                <span>Mesh adjacency</span>
                <select id="meshAdjacencyMode" ${meshDisabled ? 'disabled' : ''}>
                  ${adjacencyOptions.map((option) => `<option value="${option.value}" ${state.params.meshAdjacencyMode === option.value ? 'selected' : ''}>${option.label}</option>`).join('')}
                </select>
              </label>
              ${numberField('meshNearestCount', 'mesh nearest q', state.params.meshNearestCount ?? 6, 1, PARAM_LIMITS.meshNearestCount.min, PARAM_LIMITS.meshNearestCount.max, true, meshDisabled)}
              ${numberField('meshOrthogonalBias', 'mesh angle bias', state.params.meshOrthogonalBias ?? 0, 0.1, PARAM_LIMITS.meshOrthogonalBias.min, PARAM_LIMITS.meshOrthogonalBias.max, true, meshDisabled)}
              ${numberField('accessibilityRadius', 'access radius', state.params.accessibilityRadius ?? 0.75, 0.05, PARAM_LIMITS.accessibilityRadius.min, PARAM_LIMITS.accessibilityRadius.max, true)}
              ${numberField('accessibilityDecay', 'access decay', state.params.accessibilityDecay ?? 3, 0.1, PARAM_LIMITS.accessibilityDecay.min, PARAM_LIMITS.accessibilityDecay.max, true)}
            </div>
          `)}
        `)}
        ${sidebarSection('batchNotes', 'Batch, accessibility, and notes', false, `
          <label class="field field--compact">
            <span>Scenario notes</span>
            <textarea id="notes" rows="3">${escapeHtml(state.params.notes)}</textarea>
          </label>
          <div class="control-row">
            <button id="run-batch">Run batch</button>
            <button id="save-baseline">Save baseline</button>
            <button id="save-comparison">Copy scenario</button>
          </div>
          <div class="control-row">
            <button id="export-scenario">Export scenario</button>
            <button id="import-scenario-trigger">Import scenario</button>
            <input id="import-scenario-file" class="hidden" type="file" accept="application/json" />
          </div>
          <div class="control-row">
            <button id="export-graph-json">Export graph JSON</button>
            <button id="export-network-svg">Export network SVG</button>
            <button id="export-network-png">Export network PNG</button>
          </div>
          <div class="control-row">
            <button id="export-gmns-node">Export GMNS nodes</button>
            <button id="export-gmns-link">Export GMNS links</button>
          </div>
        `)}
        ${warnings.length > 0 ? `<div class="warning-list">${warnings.map((warning) => `<p>${escapeHtml(warning)}</p>`).join('')}</div>` : ''}
      `)}
    `;
    const arrivalNotationCard = refs.sidebar.querySelector('#arrival-notation-card');
    if (arrivalNotationCard) {
      arrivalNotationCard.addEventListener('toggle', (event) => {
        state.ui.arrivalNotationExpanded = event.currentTarget.open;
      });
    }
    const connectivityNotationCard = refs.sidebar.querySelector('#connectivity-notation-card');
    if (connectivityNotationCard) {
      connectivityNotationCard.addEventListener('toggle', (event) => {
        state.ui.connectivityNotationExpanded = event.currentTarget.open;
      });
    }
    refs.sidebar.querySelectorAll('[data-sidebar-section]').forEach((section) => {
      section.addEventListener('toggle', (event) => {
        state.ui.sidebarSections[event.currentTarget.dataset.sidebarSection] = event.currentTarget.open;
      });
    });
    wirePanelToggle(refs.sidebar);

    if (state.ui.collapsedPanels.sidebar) {
      return;
    }

    refs.sidebar.querySelector('#preset-select').addEventListener('change', (event) => {
      if (event.target.value) {
        applyPreset(event.target.value);
      }
    });
    const numericFields = [
      'finalNodeCount', 'alpha', 'beta', 'phi', 'lambda', 'arrivalDistanceFactor', 'arrivalDistanceSdFactor', 'meshNearestCount', 'meshOrthogonalBias', 'meshSpacingFactor', 'accessibilityRadius', 'accessibilityDecay', 'arrivalAccessStrength', 'accessSelectionStrength', 'kappa', 'm0', 'capacityValue', 'rngSeed', 'animationSpeedMs', 'replicationCount',
    ];
    numericFields.forEach((field) => {
      const input = refs.sidebar.querySelector(`#${field}`);
      if (input) {
        const commit = () => setParam(field, Number(input.value));
        input.addEventListener('input', commit);
        input.addEventListener('change', commit);
      }
    });
    refs.sidebar.querySelector('#capacityMode').addEventListener('change', (event) => setParam('capacityMode', event.target.value));
    refs.sidebar.querySelector('#impedanceMode').addEventListener('change', (event) => setParam('impedanceMode', event.target.value));
    refs.sidebar.querySelector('#planarityMode').addEventListener('change', (event) => setParam('planarityMode', event.target.value));
    refs.sidebar.querySelector('#meshMode').addEventListener('change', (event) => setParam('meshMode', event.target.value));
    refs.sidebar.querySelector('#meshAngleSet').addEventListener('change', (event) => setParam('meshAngleSet', event.target.value));
    refs.sidebar.querySelector('#meshAdjacencyMode').addEventListener('change', (event) => setParam('meshAdjacencyMode', event.target.value));
    refs.sidebar.querySelector('#seedGraphType').addEventListener('change', (event) => setParam('seedGraphType', event.target.value));
    refs.sidebar.querySelector('#arrivalMode').addEventListener('change', (event) => setParam('arrivalMode', event.target.value));
    refs.sidebar.querySelector('#arrivalPreferenceMode').addEventListener('change', (event) => setParam('arrivalPreferenceMode', event.target.value));
    refs.sidebar.querySelector('#arrivalAccessMetric').addEventListener('change', (event) => setParam('arrivalAccessMetric', event.target.value));
    refs.sidebar.querySelector('#selectionKernelMode').addEventListener('change', (event) => setParam('selectionKernelMode', event.target.value));
    refs.sidebar.querySelector('#accessSemantics').addEventListener('change', (event) => setParam('accessSemantics', event.target.value));
    refs.sidebar.querySelector('#accessSelectionMetric').addEventListener('change', (event) => setParam('accessSelectionMetric', event.target.value));
    const capacityLow = refs.sidebar.querySelector('#capacityLow');
    if (capacityLow) {
      capacityLow.addEventListener('change', () => setParam('capacityParams', { ...state.params.capacityParams, low: Number(capacityLow.value) }));
    }
    const capacityHigh = refs.sidebar.querySelector('#capacityHigh');
    if (capacityHigh) {
      capacityHigh.addEventListener('change', () => setParam('capacityParams', { ...state.params.capacityParams, high: Number(capacityHigh.value) }));
    }
    const capacityMean = refs.sidebar.querySelector('#capacityMean');
    if (capacityMean) {
      capacityMean.addEventListener('change', () => setParam('capacityParams', { ...state.params.capacityParams, mean: Number(capacityMean.value) }));
    }
    const capacitySigma = refs.sidebar.querySelector('#capacitySigma');
    if (capacitySigma) {
      capacitySigma.addEventListener('change', () => setParam('capacityParams', { ...state.params.capacityParams, sigma: Number(capacitySigma.value) }));
    }
    refs.sidebar.querySelector('#notes').addEventListener('change', (event) => setParam('notes', event.target.value));

    refs.sidebar.querySelector('#run-once').addEventListener('click', () => {
      startRunOnce();
    });
    refs.sidebar.querySelector('#step-once').addEventListener('click', () => {
      stopRunning();
      state.simulation = stepSimulation(state.simulation);
      refreshDerived();
    });
    refs.sidebar.querySelector('#play-toggle').addEventListener('click', () => {
      if (state.playTimer) {
        stopPlaying();
        renderSidebar();
      } else {
        startPlaying();
        renderSidebar();
      }
    });
    refs.sidebar.querySelector('#reset-run').addEventListener('click', () => {
      resetSimulation();
      render();
    });
    refs.sidebar.querySelector('#run-batch').addEventListener('click', runBatch);
    refs.sidebar.querySelector('#save-baseline').addEventListener('click', saveBaseline);
    refs.sidebar.querySelector('#save-comparison').addEventListener('click', saveComparison);
    refs.sidebar.querySelector('#export-scenario').addEventListener('click', () => exportText('scenario.json', JSON.stringify(scenarioDocument(state.params), null, 2), 'application/json'));
    refs.sidebar.querySelector('#import-scenario-trigger').addEventListener('click', () => refs.sidebar.querySelector('#import-scenario-file').click());
    refs.sidebar.querySelector('#import-scenario-file').addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) {
        return;
      }
      try {
        const text = await file.text();
        state.params = sanitizeParams(mergeScenarioParams(parseScenarioDocument(text).params));
        state.ui.selectedPresetId = detectMatchingPresetId(state.params);
        setHashFromParams();
        resetSimulation();
        render();
      } catch (error) {
        window.alert(error.message);
      }
    });
    refs.sidebar.querySelector('#export-graph-json').addEventListener('click', async () => copyGraphJson());
    refs.sidebar.querySelector('#export-network-svg').addEventListener('click', () => exportText('network.svg', graphSvg(state.simulation), 'image/svg+xml;charset=utf-8'));
    refs.sidebar.querySelector('#export-network-png').addEventListener('click', async () => {
      if (state.cy) {
        const uri = state.cy.png({ full: true, scale: 2, bg: '#ffffff' });
        const anchor = document.createElement('a');
        anchor.href = uri;
        anchor.download = 'network.png';
        anchor.click();
      }
    });
    refs.sidebar.querySelector('#export-gmns-node').addEventListener('click', () => exportText('gmns_node.csv', gmnsNodeCsv(state.simulation), 'text/csv;charset=utf-8'));
    refs.sidebar.querySelector('#export-gmns-link').addEventListener('click', () => exportText('gmns_link.csv', gmnsLinkCsv(state.simulation), 'text/csv;charset=utf-8'));
  }

  function renderRunControls() {
    const last = state.simulation.lastStepDetails;
    function renderCandidateTable(diagnostics) {
      if (!diagnostics || !diagnostics.entries || diagnostics.entries.length === 0) {
        return '';
      }
      return `
        <div class="candidate-table-wrap">
          <table class="candidate-table">
            <thead>
              <tr>
                <th>node</th>
                <th>d</th>
                <th>cap</th>
                <th>adj</th>
                <th>local</th>
                <th>cross</th>
                <th>nearest-q</th>
                <th>access</th>
                <th>weight</th>
                <th>p</th>
                <th>chosen</th>
              </tr>
            </thead>
            <tbody>
              ${diagnostics.entries.map((entry) => `
                <tr>
                  <td>${escapeHtml(entry.nodeId)}</td>
                  <td>${entry.distance.toFixed(3)}</td>
                  <td>${entry.hasCapacity ? 'y' : 'n'}</td>
                  <td>${entry.adjacent ? 'y' : 'n'}</td>
                  <td>${entry.local ? 'y' : 'n'}</td>
                  <td>${entry.crossing ? 'y' : 'n'}</td>
                  <td>${entry.withinNearestNonCrossingQ || entry.withinNearestAdjacentQ ? 'y' : 'n'}</td>
                  <td>${Number(entry.accessValue ?? 0).toFixed(3)}</td>
                  <td>${entry.round1Weight !== null ? Number(entry.round1Weight).toFixed(4) : '—'}</td>
                  <td>${entry.round1Probability !== null ? Number(entry.round1Probability).toFixed(4) : '—'}</td>
                  <td>${entry.round1Selected ? 'y' : 'n'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
    function renderSiteAudit(audit, label = 'Arrival-site audit') {
      if (!audit) {
        return '';
      }
      if (audit.preferred || audit.fallback) {
        return `
          ${audit.preferred ? renderSiteAudit(audit.preferred, 'Projected-site audit') : ''}
          ${audit.fallback ? renderSiteAudit(audit.fallback, 'Fallback network-site audit') : ''}
        `;
      }
      return `
        <p><strong>${escapeHtml(label)}</strong>: ${audit.considered} lattice neighbor sites checked, ${audit.candidates} surviving, ${audit.outOfBounds} out of bounds, ${audit.spacingBlocked} blocked by spacing, ${audit.zeroAttachable} with no attachable targets.</p>
        ${audit.samples && audit.samples.length > 0 ? `
          <div class="note" style="max-height:9rem; overflow:auto; border-top:1px solid #d0d5dd; padding-top:0.5rem;">
            ${audit.samples.map((entry) => `
              <p>
                site (${Number(entry.u).toFixed(0)}, ${Number(entry.v).toFixed(0)}):
                ${escapeHtml(String(entry.reason).replaceAll('_', ' '))}
                ${Number.isFinite(entry.nearestDistance) ? `, nearest=${entry.nearestDistance.toFixed(3)}` : ''}
                ${entry.blockerId ? `, blocker=${escapeHtml(entry.blockerId)}${Number.isFinite(entry.blockerLatticeU) && Number.isFinite(entry.blockerLatticeV) ? `@(${Number(entry.blockerLatticeU).toFixed(0)}, ${Number(entry.blockerLatticeV).toFixed(0)})` : ''}` : ''}
                ${entry.blockerGeneratedBy ? `, blocker-type=${escapeHtml(String(entry.blockerGeneratedBy).replaceAll('_', ' '))}` : ''}
                ${Number.isFinite(entry.attachableNeighborCount) ? `, attachable=${entry.attachableNeighborCount}` : ''}
                ${Number.isFinite(entry.futureGrowthCount) ? `, future=${entry.futureGrowthCount}` : ''}
              </p>
            `).join('')}
          </div>
        ` : ''}
      `;
    }
    refs.runControls.innerHTML = `
      ${panelHeader('Run status', 'runControls', `<span class="status-pill ${state.simulation.status}">${state.simulation.status}</span>`)}
      ${panelBody('runControls', `
        <p class="note">Termination: ${escapeHtml(state.simulation.terminationReason || 'not terminated')} | truncation events: ${state.simulation.truncationEvents}</p>
        <p class="note">Current step: ${state.simulation.currentStep} / ${state.params.finalNodeCount} | current node count: ${state.metrics.nodeCount}</p>
        <p class="note">The step control advances one full node arrival, including all sequential without-replacement link choices for that new node.</p>
        ${last ? `
          <div class="warning-list" style="background:#f8fafc;border-color:#d0d5dd;color:#344054;margin-top:0.75rem;">
            <p><strong>${last.arrivalCommitted === false ? 'Last attempted arrival' : 'Last arrival'}</strong>: ${escapeHtml(last.newNodeId)} connected to ${last.selectedTargetIds.length > 0 ? escapeHtml(last.selectedTargetIds.join(', ')) : 'no feasible targets'}.</p>
            ${typeof last.retryCount === 'number' ? `<p>Arrival retries before placement settled: ${last.retryCount}</p>` : ''}
            ${last.arrivalSource ? `<p>Arrival source path: ${escapeHtml(String(last.arrivalSource).replaceAll('_', ' '))}</p>` : ''}
            <p>Truncation: ${last.truncationOccurred ? 'yes' : 'no'}${last.truncationOccurred ? ` | missing links: ${last.missingLinks}` : ''}</p>
            ${last.arrivalCommitted === false ? `<p>This arrival was rejected because ${escapeHtml(String(last.failureReason || 'no_feasible_targets')).replaceAll('_', ' ')}.</p>` : ''}
            ${last.arrivalSiteAudit ? renderSiteAudit(last.arrivalSiteAudit) : ''}
            ${last.createdIntersectionIds && last.createdIntersectionIds.length > 0 ? `<p>Split crossings created ${last.createdIntersectionIds.length} intersection node${last.createdIntersectionIds.length === 1 ? '' : 's'}: ${escapeHtml(last.createdIntersectionIds.join(', '))}.</p>` : ''}
            ${last.selectionRounds.length > 0 ? `
              <p><strong>Sequential choices</strong></p>
              ${last.selectionRounds.map((round, index) => {
                const selectedIndex = round.feasibleNodeIds.indexOf(round.selectedId);
                const selectedProbability = selectedIndex >= 0 ? round.probabilities[selectedIndex] : null;
                return `<p>Round ${index + 1}: chose ${escapeHtml(round.selectedId)} from ${round.feasibleNodeIds.length} feasible nodes${selectedProbability !== null ? ` at p = ${selectedProbability.toFixed(3)}` : ''}.</p>`;
              }).join('')}
            ` : '<p>No feasible candidates were available at this arrival.</p>'}
            ${last.candidateDiagnostics ? `
              <p><strong>Round-1 candidate audit</strong>: ${last.candidateDiagnostics.counts.capacityAvailable} with capacity, ${last.candidateDiagnostics.counts.adjacentAvailable} adjacent, ${last.candidateDiagnostics.counts.localAdjacentAvailable} adjacent and local, ${last.candidateDiagnostics.counts.crossingLocalAvailable} adjacent/local/crossing, ${last.candidateDiagnostics.counts.nonCrossingAdjacentAvailable} adjacent/local/non-crossing, ${last.candidateDiagnostics.counts.round1Feasible} surviving the current round-1 filter.</p>
              <div class="note" style="max-height:11rem; overflow:auto; border-top:1px solid #d0d5dd; padding-top:0.5rem;">
                ${last.candidateDiagnostics.entries.slice(0, 10).map((entry) => `
                  <p>
                    ${escapeHtml(entry.nodeId)}:
                    d=${entry.distance.toFixed(3)},
                    cap=${entry.hasCapacity ? 'y' : 'n'},
                    adj=${entry.adjacent ? 'y' : 'n'},
                    local=${entry.local ? 'y' : 'n'},
                    cross=${entry.crossing ? 'y' : 'n'},
                    nearest-q=${entry.withinNearestNonCrossingQ ? 'y' : 'n'},
                    round1=${entry.round1Feasible ? 'y' : 'n'}
                  </p>
                `).join('')}
              </div>
              ${renderCandidateTable(last.candidateDiagnostics)}
            ` : ''}
          </div>
        ` : ''}
      `)}
    `;
    wirePanelToggle(refs.runControls);
  }

  function renderMainPanel() {
    if (state.ui.activePrimaryTab === 'comparison') {
      if (state.cy) {
        state.cy.destroy();
        state.cy = null;
      }
      renderComparisonView();
      return;
    }
    if (state.ui.activePrimaryTab === 'batch') {
      if (state.cy) {
        state.cy.destroy();
        state.cy = null;
      }
      renderBatchView();
      return;
    }
    renderNetworkView();
  }

  function renderComparisonView() {
    const currentMetrics = computeNetworkMetrics(state.simulation.nodes, state.simulation.edges, state.simulation.params.degreeThreshold);
    const baselineMetrics = state.baseline ? computeNetworkMetrics(state.baseline.state.nodes, state.baseline.state.edges, state.baseline.state.params.degreeThreshold) : null;
    refs.mainPanel.innerHTML = `
      ${panelHeader('Scenario comparison', 'mainPanel')}
      ${panelBody('mainPanel', `
        ${baselineMetrics ? `
          <article class="comparison-card">
            <h3>Current run vs baseline</h3>
            <dl class="comparison-grid">
              ${comparisonMetric('Mean degree', baselineMetrics.meanDegree, currentMetrics.meanDegree)}
              ${comparisonMetric('Degree Gini', baselineMetrics.degreeGini, currentMetrics.degreeGini)}
              ${comparisonMetric('Share at capacity', baselineMetrics.shareAtCapacity, currentMetrics.shareAtCapacity)}
              ${comparisonMetric('Mean edge length', baselineMetrics.meanEdgeLength, currentMetrics.meanEdgeLength)}
              ${comparisonMetric('Clustering', baselineMetrics.averageClustering, currentMetrics.averageClustering)}
            </dl>
          </article>
        ` : '<p class="panel__hint">Save a baseline run to unlock one-parameter exploration comparisons.</p>'}
        ${state.comparisons.map((comparison) => {
          const metrics = computeNetworkMetrics(comparison.state.nodes, comparison.state.edges, comparison.state.params.degreeThreshold);
          return `
            <article class="comparison-card">
              <div class="panel__header">
                <h3>${escapeHtml(comparison.label)}</h3>
                <button data-remove-comparison="${comparison.id}">Remove</button>
              </div>
              <dl class="comparison-grid">
                <div><dt>Nodes</dt><dd>${metrics.nodeCount}</dd></div>
                <div><dt>Edges</dt><dd>${metrics.edgeCount}</dd></div>
                <div><dt>Mean degree</dt><dd>${metrics.meanDegree.toFixed(3)}</dd></div>
                <div><dt>Clustering</dt><dd>${metrics.averageClustering.toFixed(3)}</dd></div>
              </dl>
            </article>
          `;
        }).join('')}
      `)}
    `;
    wirePanelToggle(refs.mainPanel);
    if (state.ui.collapsedPanels.mainPanel) {
      return;
    }
    refs.mainPanel.querySelectorAll('[data-remove-comparison]').forEach((button) => {
      button.addEventListener('click', () => removeComparison(button.dataset.removeComparison));
    });
  }

  function renderBatchView() {
    refs.mainPanel.innerHTML = `
      ${panelHeader('Batch experiments', 'mainPanel', `<button id="run-batch-main">${state.batch.running ? 'Running...' : 'Run batch'}</button>`)}
      ${panelBody('mainPanel', `
        <p class="panel__hint">Batch runs execute in a browser worker using the same simulation logic as the single-run view.</p>
        <div class="progress-bar"><div class="progress-bar__fill" style="width:${(state.batch.progress || 0) * 100}%"></div></div>
        ${state.batch.result ? `
          <div class="control-row">
            <button id="export-batch-csv">Export batch CSV</button>
            <button id="export-batch-json">Export batch JSON</button>
          </div>
          ${renderBatchTable(state.batch.result)}
        ` : '<p class="note">Run a batch to populate aggregated scenario summaries.</p>'}
        <div class="saved-list">
          <h3>Saved batch summaries</h3>
          ${state.batch.saved.map((entry) => `<article class="saved-list__item"><strong>${escapeHtml(entry.label)}</strong><span>${new Date(entry.createdAt).toLocaleString()}</span></article>`).join('')}
        </div>
      `)}
    `;
    wirePanelToggle(refs.mainPanel);
    if (state.ui.collapsedPanels.mainPanel) {
      return;
    }
    refs.mainPanel.querySelector('#run-batch-main').addEventListener('click', runBatch);
    const csvButton = refs.mainPanel.querySelector('#export-batch-csv');
    if (csvButton) {
      csvButton.addEventListener('click', () => exportText('batch-summary.csv', batchResultCsv(state.batch.result), 'text/csv;charset=utf-8'));
    }
    const jsonButton = refs.mainPanel.querySelector('#export-batch-json');
    if (jsonButton) {
      jsonButton.addEventListener('click', () => exportText('batch-summary.json', JSON.stringify(state.batch.result, null, 2), 'application/json'));
    }
  }

  function renderNetworkView() {
    if (state.cy) {
      state.cy.destroy();
      state.cy = null;
    }
    const paper = state.ui.activePrimaryTab === 'paper' || state.ui.paperMode;
    refs.mainPanel.innerHTML = `
      ${panelHeader('Network view', 'mainPanel', `
        <div class="control-row">
          <button id="network-png">Export PNG</button>
          <button id="network-svg">Export SVG</button>
        </div>
      `)}
      ${panelBody('mainPanel', `
        <div class="network-toolbar">
          <label>Node colour
            <select id="node-color-mode">
              ${['degree', 'residual_capacity', 'age', 'component', 'saturated', 'access_cumulative', 'access_gravity'].map((mode) => `<option value="${mode}" ${state.ui.nodeColorMode === mode ? 'selected' : ''}>${mode.replace(/_/g, ' ')}</option>`).join('')}
            </select>
          </label>
          ${checkbox('edgeColorByLength', 'edge length colours', state.ui.edgeColorByLength)}
          ${checkbox('showBoundary', 'unit square boundary', state.ui.showBoundary)}
          ${state.params.meshMode === 'grid_bias' ? checkbox('showLatticeOverlay', 'show lattice', state.ui.showLatticeOverlay) : ''}
          ${checkbox('showCoordinates', 'coordinates', state.ui.showCoordinates)}
          ${checkbox('showScaleBar', 'scale bar', state.ui.showScaleBar)}
          ${checkbox('highlightSaturated', 'highlight saturated', state.ui.highlightSaturated)}
          ${checkbox('highlightNewest', 'highlight newest', state.ui.highlightNewest)}
          ${checkbox('showAttachmentWeights', 'attachment weights', state.ui.showAttachmentWeights)}
        </div>
        <div class="network-stage ${paper ? 'paper' : ''}">
          <svg id="network-choropleth" class="network-choropleth hidden" aria-hidden="true"></svg>
          <svg id="network-lattice-overlay" class="network-lattice-overlay hidden" aria-hidden="true"></svg>
          <svg id="network-reference-overlay" class="network-reference-overlay hidden" aria-hidden="true"></svg>
          <div id="network-canvas"></div>
          ${state.ui.showBoundary ? '<div class="network-boundary"></div>' : ''}
          <div id="network-tooltip" class="network-tooltip hidden"></div>
        </div>
        ${networkLegendMarkup()}
        <div class="network-footer">
          <span>Node count ${state.metrics.nodeCount}</span>
          <span>Edge count ${state.metrics.edgeCount}</span>
          <span>Crossings ${state.metrics.crossingCount ?? 'NA'}</span>
          <span>Split nodes ${state.metrics.generatedIntersectionNodes}</span>
          <span>Lonely nodes ${state.metrics.lonelyNodeCount}</span>
        </div>
        <p class="note">The attachment-weight labels show the current probabilities for the first sequential choice of the most recent arrival. Use Step arrival and the run-status panel to inspect later rounds in that same arrival.</p>
        ${paper ? `
          <div style="margin-top:1rem">
            <label class="field">
              <span>Figure caption draft</span>
              <textarea id="figure-caption" class="paper-caption" placeholder="Draft a paper-ready caption for the current figure.">${escapeHtml(state.ui.figureCaptionDraft)}</textarea>
            </label>
          </div>
        ` : ''}
      `)}
    `;
    wirePanelToggle(refs.mainPanel);
    if (state.ui.collapsedPanels.mainPanel) {
      return;
    }

    refs.mainPanel.querySelector('#network-png').addEventListener('click', () => {
      if (state.cy) {
        const anchor = document.createElement('a');
        anchor.href = state.cy.png({ full: true, scale: 2, bg: '#ffffff' });
        anchor.download = 'network.png';
        anchor.click();
      }
    });
    refs.mainPanel.querySelector('#network-svg').addEventListener('click', () => exportText('network.svg', graphSvg(state.simulation), 'image/svg+xml;charset=utf-8'));
    refs.mainPanel.querySelector('#node-color-mode').addEventListener('change', (event) => {
      state.ui.nodeColorMode = event.target.value;
      renderNetworkGraph();
    });
    ['edgeColorByLength', 'showBoundary', 'showLatticeOverlay', 'showCoordinates', 'showScaleBar', 'highlightSaturated', 'highlightNewest', 'showAttachmentWeights'].forEach((key) => {
      const element = refs.mainPanel.querySelector(`#${key}`);
      if (element) {
        element.addEventListener('change', (event) => {
          state.ui[key] = event.target.checked;
          renderMainPanel();
          renderCharts();
        });
      }
    });
    const caption = refs.mainPanel.querySelector('#figure-caption');
    if (caption) {
      caption.addEventListener('input', (event) => {
        state.ui.figureCaptionDraft = event.target.value;
      });
    }
    renderNetworkGraph();
  }

  function componentColor(componentId) {
    return COMPONENT_COLORS[componentId % COMPONENT_COLORS.length];
  }

  function gradientColor(value, min, max) {
    const t = max > min ? (value - min) / (max - min) : 0.5;
    const start = [232, 241, 245];
    const end = [11, 79, 108];
    const channel = (index) => Math.round(start[index] + (end[index] - start[index]) * Math.max(0, Math.min(1, t)));
    return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
  }

  function withAlpha(rgbColor, alpha) {
    const match = rgbColor.match(/\d+/g);
    if (!match || match.length < 3) {
      return rgbColor;
    }
    return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${alpha})`;
  }

  function nodeLegendMarkup() {
    if (state.ui.nodeColorMode === 'component') {
      const items = Array.from(new Set(Object.values(state.metrics.componentAssignments || {}))).slice(0, 5);
      return `
        <div class="legend-row">
          <span class="legend-label">Components</span>
          ${items.map((componentId) => `<span class="legend-item"><span class="legend-swatch" style="background:${componentColor(componentId)}"></span>C${componentId}</span>`).join('')}
        </div>
      `;
    }
    if (state.ui.nodeColorMode === 'saturated') {
      return `
        <div class="legend-row">
          <span class="legend-label">Node colour</span>
          <span class="legend-item"><span class="legend-swatch" style="background:#0b4f6c"></span>not saturated</span>
          <span class="legend-item"><span class="legend-swatch" style="background:#b42318"></span>saturated</span>
        </div>
      `;
    }

    let values = state.simulation.nodes.map((node) => node.degree);
    let label = 'Degree';
    if (state.ui.nodeColorMode === 'residual_capacity') {
      values = state.simulation.nodes.map((node) => node.residualCapacity);
      label = 'Residual capacity';
    } else if (state.ui.nodeColorMode === 'age') {
      values = state.simulation.nodes.map((node) => node.birthStep);
      label = 'Age';
    } else if (state.ui.nodeColorMode === 'access_cumulative') {
      values = state.simulation.nodes.map((node) => state.transportAccessibility?.cumulativeById?.[node.id] ?? 0);
      label = 'Cumulative access';
    } else if (state.ui.nodeColorMode === 'access_gravity') {
      values = state.simulation.nodes.map((node) => state.transportAccessibility?.gravityById?.[node.id] ?? 0);
      label = 'Gravity access';
    }
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 1);
    return `
      <div class="legend-row">
        <span class="legend-label">${escapeHtml(label)}</span>
        <span class="legend-gradient" style="background:linear-gradient(90deg, ${gradientColor(min, min, max)}, ${gradientColor((min + max) / 2, min, max)}, ${gradientColor(max, min, max)})"></span>
        <span class="legend-bound">${min.toFixed(2)}</span>
        <span class="legend-bound">${max.toFixed(2)}</span>
      </div>
    `;
  }

  function specialLegendMarkup() {
    return `
      <div class="legend-row">
        <span class="legend-label">Special markers</span>
        <span class="legend-item"><span class="legend-node newest"></span>newest</span>
        <span class="legend-item"><span class="legend-node selected"></span>selected target</span>
        <span class="legend-item"><span class="legend-node lonely"></span>lonely node</span>
        <span class="legend-item"><span class="legend-node split"></span>split node</span>
        <span class="legend-item"><span class="legend-edge split"></span>split link</span>
      </div>
    `;
  }

  function latticeLegendMarkup() {
    if (state.params.meshMode !== 'grid_bias' || !state.ui.showLatticeOverlay) {
      return '';
    }
    return `
      <div class="legend-row">
        <span class="legend-label">Lattice overlay</span>
        <span class="legend-item"><span class="legend-swatch" style="background:rgba(11, 79, 108, 0.22)"></span>all lattice sites</span>
        <span class="legend-item"><span class="legend-swatch" style="background:rgba(247, 144, 9, 0.35); border-color:rgba(247, 144, 9, 0.7)"></span>current arrival candidates</span>
        <span class="legend-item">arrival nodes should snap to these sites; split nodes need not</span>
      </div>
    `;
  }

  function edgeLegendMarkup() {
    if (!state.ui.edgeColorByLength) {
      return '<div class="legend-row"><span class="legend-label">Edges</span><span class="legend-item"><span class="legend-edge base"></span>arrival links</span><span class="legend-item"><span class="legend-edge split"></span>split links</span></div>';
    }
    const lengths = state.simulation.edges.filter((edge) => edge.generatedBy !== 'split_crossing').map((edge) => edge.length);
    const min = Math.min(...lengths, 0);
    const max = Math.max(...lengths, 1);
    return `
      <div class="legend-row">
        <span class="legend-label">Edge length</span>
        <span class="legend-gradient" style="background:linear-gradient(90deg, ${gradientColor(min, min, max)}, ${gradientColor((min + max) / 2, min, max)}, ${gradientColor(max, min, max)})"></span>
        <span class="legend-bound">${min.toFixed(2)}</span>
        <span class="legend-bound">${max.toFixed(2)}</span>
        <span class="legend-item"><span class="legend-edge split"></span>split links</span>
      </div>
    `;
  }

  function networkLegendMarkup() {
    return `
      <div class="network-legend">
        ${nodeLegendMarkup()}
        ${edgeLegendMarkup()}
        ${latticeLegendMarkup()}
        ${specialLegendMarkup()}
      </div>
    `;
  }

  function renderNetworkChoropleth() {
    const svgElement = refs.mainPanel.querySelector('#network-choropleth');
    const container = refs.mainPanel.querySelector('.network-stage');
    if (!svgElement || !container || !state.cy) {
      return;
    }
    if (!state.ui.nodeColorMode.startsWith('access_') || !state.transportAccessibility?.available) {
      svgElement.innerHTML = '';
      svgElement.classList.add('hidden');
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width <= 0 || height <= 0) {
      return;
    }
    svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svgElement.classList.remove('hidden');

    const nodes = state.cy.nodes().map((cyNode) => {
      const id = cyNode.id();
      const rendered = cyNode.renderedPosition();
      const value = state.ui.nodeColorMode === 'access_cumulative'
        ? state.transportAccessibility.cumulativeById[id] ?? 0
        : state.transportAccessibility.gravityById[id] ?? 0;
      return { id, x: rendered.x, y: rendered.y, value };
    }).filter((node) => Number.isFinite(node.x) && Number.isFinite(node.y));

    if (nodes.length < 2) {
      svgElement.innerHTML = '';
      return;
    }

    const min = Math.min(...nodes.map((node) => node.value), 0);
    const max = Math.max(...nodes.map((node) => node.value), 1);
    const delaunay = d3.Delaunay.from(nodes, (node) => node.x, (node) => node.y);
    const voronoi = delaunay.voronoi([0, 0, width, height]);
    svgElement.innerHTML = nodes.map((node, index) => {
      const path = voronoi.renderCell(index);
      return `<path d="${path}" fill="${withAlpha(gradientColor(node.value, min, max), 0.3)}" stroke="${withAlpha('#d0d5dd', 0.35)}" stroke-width="0.6"></path>`;
    }).join('');
  }

  function renderNetworkLatticeOverlay() {
    const svgElement = refs.mainPanel.querySelector('#network-lattice-overlay');
    const container = refs.mainPanel.querySelector('.network-stage');
    if (!svgElement || !container || !state.cy) {
      return;
    }
    if (state.params.meshMode !== 'grid_bias' || !state.ui.showLatticeOverlay) {
      svgElement.innerHTML = '';
      svgElement.classList.add('hidden');
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width <= 0 || height <= 0) {
      return;
    }
    svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svgElement.classList.remove('hidden');

    const allPoints = projectedLatticePoints(state.simulation);
    // The overlay visualizes the primary candidate list for the active arrival
    // mode. It does not show every later fallback path, rescue-site path, or
    // random fallback that chooseArrivalPoint() may still use.
    let frontierPoints = [];
    if (state.params.arrivalMode === 'network') {
      frontierPoints = networkBiasedLatticeCandidates(state.simulation);
    } else if (state.params.arrivalMode === 'frontier') {
      frontierPoints = projectedLatticeCandidates(state.simulation);
    } else if (state.params.arrivalMode === 'uniform_lattice') {
      const spacingNodes = arrivalSpacingNodes(state.simulation);
      frontierPoints = projectedLatticePoints(state.simulation).filter((point) =>
        nearestExistingDistance(point, spacingNodes) >= Math.max(0.01, averageEdgeLength(state.simulation.edges) * (state.params.meshSpacingFactor ?? 0)),
      );
    }
    const pan = state.cy.pan();
    const zoom = state.cy.zoom();
    const rendered = (point) => ({
      x: point.x * 1000 * zoom + pan.x,
      y: (1 - point.y) * 1000 * zoom + pan.y,
    });

    const baseDots = allPoints.map((point) => {
      const position = rendered(point);
      return `<circle cx="${position.x.toFixed(2)}" cy="${position.y.toFixed(2)}" r="2.4" fill="rgba(11, 79, 108, 0.22)"></circle>`;
    }).join('');
    const frontierDots = frontierPoints.map((point) => {
      const position = rendered(point);
      return `<circle cx="${position.x.toFixed(2)}" cy="${position.y.toFixed(2)}" r="3.8" fill="rgba(247, 144, 9, 0.35)" stroke="rgba(247, 144, 9, 0.7)" stroke-width="0.9"></circle>`;
    }).join('');
    svgElement.innerHTML = `${baseDots}${frontierDots}`;
  }

  function renderNetworkReferenceOverlay() {
    const svgElement = refs.mainPanel.querySelector('#network-reference-overlay');
    const container = refs.mainPanel.querySelector('.network-stage');
    if (!svgElement || !container || !state.cy) {
      return;
    }
    if (!state.ui.showCoordinates && !state.ui.showScaleBar) {
      svgElement.innerHTML = '';
      svgElement.classList.add('hidden');
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width <= 0 || height <= 0) {
      return;
    }
    svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svgElement.classList.remove('hidden');

    const topLeft = renderedPointFromUnit({ x: 0, y: 0 });
    const topRight = renderedPointFromUnit({ x: 1, y: 0 });
    const bottomLeft = renderedPointFromUnit({ x: 0, y: 1 });
    const pixelsPerUnitX = Math.abs(topRight.x - topLeft.x);
    const pixelsPerUnitY = Math.abs(bottomLeft.y - topLeft.y);
    const pixelsPerUnit = Math.max(1, (pixelsPerUnitX + pixelsPerUnitY) / 2);
    const pieces = [];

    if (state.ui.showCoordinates) {
      [0, 0.25, 0.5, 0.75, 1].forEach((tick) => {
        const xPoint = renderedPointFromUnit({ x: tick, y: 1 });
        pieces.push(
          `<line x1="${xPoint.x.toFixed(2)}" y1="${(bottomLeft.y - 7).toFixed(2)}" x2="${xPoint.x.toFixed(2)}" y2="${bottomLeft.y.toFixed(2)}" stroke="rgba(11,79,108,0.45)" stroke-width="1"/>`,
          `<text x="${xPoint.x.toFixed(2)}" y="${(bottomLeft.y - 11).toFixed(2)}" text-anchor="middle" fill="#344054" font-size="10">${tick.toFixed(2)}</text>`
        );
        const yPoint = renderedPointFromUnit({ x: 0, y: 1 - tick });
        pieces.push(
          `<line x1="${topLeft.x.toFixed(2)}" y1="${yPoint.y.toFixed(2)}" x2="${(topLeft.x + 7).toFixed(2)}" y2="${yPoint.y.toFixed(2)}" stroke="rgba(11,79,108,0.45)" stroke-width="1"/>`,
          `<text x="${(topLeft.x + 11).toFixed(2)}" y="${(yPoint.y + 3).toFixed(2)}" text-anchor="start" fill="#344054" font-size="10">${tick.toFixed(2)}</text>`
        );
      });
      pieces.push(
        `<text x="${(bottomLeft.x + pixelsPerUnitX / 2).toFixed(2)}" y="${(bottomLeft.y - 24).toFixed(2)}" text-anchor="middle" fill="#475467" font-size="10">x in unit-square coordinates</text>`,
        `<text x="${(topLeft.x + 24).toFixed(2)}" y="${(topLeft.y + pixelsPerUnitY / 2).toFixed(2)}" transform="rotate(-90 ${(topLeft.x + 24).toFixed(2)} ${(topLeft.y + pixelsPerUnitY / 2).toFixed(2)})" text-anchor="middle" fill="#475467" font-size="10">y in unit-square coordinates</text>`
      );
    }

    if (state.ui.showScaleBar) {
      const unitLength = chooseScaleBarUnits(pixelsPerUnit);
      const pixelLength = unitLength * pixelsPerUnit;
      const y = Math.max(24, bottomLeft.y - 18);
      const x2 = Math.min(width - 18, topRight.x - 18);
      const x1 = x2 - pixelLength;
      pieces.push(
        `<line x1="${x1.toFixed(2)}" y1="${y.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y.toFixed(2)}" stroke="#344054" stroke-width="2"/>`,
        `<line x1="${x1.toFixed(2)}" y1="${(y - 5).toFixed(2)}" x2="${x1.toFixed(2)}" y2="${(y + 5).toFixed(2)}" stroke="#344054" stroke-width="2"/>`,
        `<line x1="${x2.toFixed(2)}" y1="${(y - 5).toFixed(2)}" x2="${x2.toFixed(2)}" y2="${(y + 5).toFixed(2)}" stroke="#344054" stroke-width="2"/>`,
        `<text x="${((x1 + x2) / 2).toFixed(2)}" y="${(y - 8).toFixed(2)}" text-anchor="middle" fill="#344054" font-size="10">${unitLength.toFixed(2)} unit length</text>`
      );
    }

    svgElement.innerHTML = pieces.join('');
  }

  function renderNetworkGraph() {
    if (!cytoscape || !refs.mainPanel.querySelector('#network-canvas')) {
      return;
    }
    const historyMetrics = state.simulation.history.length > 0
      ? state.simulation.history[state.simulation.history.length - 1].metrics
      : computeNetworkMetrics(state.simulation.nodes, state.simulation.edges, state.params.degreeThreshold);
    const latestRound = state.simulation.lastStepDetails && state.simulation.lastStepDetails.selectionRounds[0];
    const maxEdgeLength = Math.max(...state.simulation.edges.map((edge) => edge.length), 1);
    const cumulativeValues = Object.values(state.transportAccessibility?.cumulativeById || {});
    const gravityValues = Object.values(state.transportAccessibility?.gravityById || {});
    const elements = [
      ...state.simulation.nodes.map((node) => {
        let color = '#0b4f6c';
        if (state.ui.nodeColorMode === 'saturated') {
          color = node.saturated ? '#b42318' : '#0b4f6c';
        } else if (state.ui.nodeColorMode === 'age') {
          color = gradientColor(node.birthStep, 0, Math.max(...state.simulation.nodes.map((entry) => entry.birthStep), 1));
        } else if (state.ui.nodeColorMode === 'residual_capacity') {
          color = gradientColor(node.residualCapacity, 0, Math.max(...state.simulation.nodes.map((entry) => entry.capacity), 1));
        } else if (state.ui.nodeColorMode === 'component') {
          color = componentColor(historyMetrics.componentAssignments[node.id] ?? 0);
        } else if (state.ui.nodeColorMode === 'access_cumulative') {
          color = gradientColor(state.transportAccessibility?.cumulativeById?.[node.id] ?? 0, 0, Math.max(...cumulativeValues, 1));
        } else if (state.ui.nodeColorMode === 'access_gravity') {
          color = gradientColor(state.transportAccessibility?.gravityById?.[node.id] ?? 0, 0, Math.max(...gravityValues, 1));
        } else {
          color = gradientColor(node.degree, 0, Math.max(...state.simulation.nodes.map((entry) => entry.degree), 1));
        }

        const isNewest = state.ui.highlightNewest && node.id === state.simulation.lastStepDetails?.newNodeId;
        const isSelected = state.ui.highlightNewest && state.simulation.lastStepDetails?.selectedTargetIds.includes(node.id);
        const attachmentIndex = latestRound ? latestRound.feasibleNodeIds.indexOf(node.id) : -1;
        const probability = attachmentIndex >= 0 ? latestRound.probabilities[attachmentIndex] : null;

        return {
          data: {
            id: node.id,
            color,
            size: 12 + Math.sqrt(node.degree) * 3.8,
            outlineColor: node.generatedBy === 'split_crossing'
              ? '#f79009'
              : node.lonely
                ? '#667085'
                : isNewest
                  ? '#f79009'
                  : isSelected
                    ? '#12b76a'
                    : state.ui.highlightSaturated && node.saturated
                      ? '#b42318'
                      : '#ffffff',
            outlineWidth: node.generatedBy === 'split_crossing' || node.lonely || isNewest || isSelected || (state.ui.highlightSaturated && node.saturated) ? 3 : 1,
            probabilityLabel: state.ui.showAttachmentWeights && probability !== null ? probability.toFixed(3) : '',
          },
          position: { x: node.x * 1000, y: (1 - node.y) * 1000 },
          classes: [
            isNewest ? 'newest-node' : '',
            isSelected ? 'selected-target' : '',
            node.saturated ? 'saturated-node' : '',
            node.generatedBy === 'split_crossing' ? 'split-node' : '',
            node.lonely ? 'lonely-node' : '',
          ].filter(Boolean).join(' '),
        };
      }),
      ...state.simulation.edges.map((edge) => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          color: edge.generatedBy === 'split_crossing' ? '#f79009' : state.ui.edgeColorByLength ? gradientColor(edge.length, 0, maxEdgeLength) : '#98a2b3',
          generatedBy: edge.generatedBy || 'arrival',
        },
        classes: edge.generatedBy === 'split_crossing' ? 'split-edge' : '',
      })),
    ];

    if (!state.cy) {
      state.cy = cytoscape({
        container: refs.mainPanel.querySelector('#network-canvas'),
        elements,
        layout: { name: 'preset' },
        style: [
          {
            selector: 'node',
            style: {
              'background-color': 'data(color)',
              width: 'data(size)',
              height: 'data(size)',
              shape: 'ellipse',
              label: 'data(probabilityLabel)',
              'font-size': 10,
              color: '#344054',
              'text-background-color': '#ffffff',
              'text-background-opacity': 0.95,
              'text-background-padding': 2,
              'border-width': 'data(outlineWidth)',
              'border-color': 'data(outlineColor)',
            },
          },
          {
            selector: 'edge',
            style: {
              width: 1.25,
              'line-color': 'data(color)',
              'curve-style': 'straight',
              opacity: 0.85,
            },
          },
          {
            selector: '.split-node',
            style: {
              shape: 'diamond',
            },
          },
          {
            selector: '.lonely-node',
            style: {
              shape: 'round-rectangle',
            },
          },
          {
            selector: '.split-edge',
            style: {
              'line-style': 'dashed',
              width: 2,
              opacity: 0.95,
            },
          },
        ],
        minZoom: 0.4,
        maxZoom: 3,
        wheelSensitivity: 0.15,
      });
      const tooltip = refs.mainPanel.querySelector('#network-tooltip');
      state.cy.on('mouseover', 'node', (event) => {
        const node = state.simulation.nodes.find((entry) => entry.id === event.target.id());
        if (!node) {
          return;
        }
        tooltip.innerHTML = `
          <strong>${node.id}</strong><br/>
          degree: ${node.degree}<br/>
          capacity: ${node.capacity.toFixed(2)}<br/>
          residual: ${node.residualCapacity.toFixed(2)}<br/>
          weight: ${(node.weight ?? 1).toFixed(2)}<br/>
          production share: ${(node.typeShare ?? 0.5).toFixed(2)}<br/>
          attraction share: ${(1 - (node.typeShare ?? 0.5)).toFixed(2)}<br/>
          lonely: ${node.lonely ? 'yes' : 'no'}<br/>
          ${node.lonely ? `lonely reason: ${escapeHtml(String(node.lonelyReason || 'unknown')).replaceAll('_', ' ')}<br/>` : ''}
          generated by: ${node.generatedBy || 'arrival'}<br/>
          cumulative access: ${(state.transportAccessibility?.cumulativeById?.[node.id] ?? 0).toFixed(2)}<br/>
          gravity access: ${(state.transportAccessibility?.gravityById?.[node.id] ?? 0).toFixed(3)}<br/>
          access value: ${(node.accessValue ?? 0).toFixed(3)}<br/>
          position: (${node.x.toFixed(3)}, ${node.y.toFixed(3)})<br/>
          birth step: ${node.birthStep}
        `;
        tooltip.style.left = `${event.renderedPosition.x + 18}px`;
        tooltip.style.top = `${event.renderedPosition.y + 18}px`;
        tooltip.classList.remove('hidden');
      });
      state.cy.on('mouseover', 'edge', (event) => {
        const edge = state.simulation.edges.find((entry) => entry.id === event.target.id());
        if (!edge) {
          return;
        }
        tooltip.innerHTML = `
          <strong>${edge.id}</strong><br/>
          endpoints: ${edge.source}, ${edge.target}<br/>
          length: ${edge.length.toFixed(3)}<br/>
          type: ${edge.generatedBy || 'arrival'}<br/>
          created: ${edge.birthStep}
        `;
        tooltip.style.left = `${event.renderedPosition.x + 18}px`;
        tooltip.style.top = `${event.renderedPosition.y + 18}px`;
        tooltip.classList.remove('hidden');
      });
      state.cy.on('mouseout', () => tooltip.classList.add('hidden'));
    }

    state.cy.json({ elements });
    state.cy.layout({ name: 'preset' }).run();
    renderNetworkChoropleth();
    renderNetworkLatticeOverlay();
    renderNetworkReferenceOverlay();
    state.cy.off('pan zoom resize');
    state.cy.on('pan zoom resize', () => {
      renderNetworkChoropleth();
      renderNetworkLatticeOverlay();
      renderNetworkReferenceOverlay();
    });
  }

function renderMetricsPanel() {
    const metrics = state.metrics;
    const rows = [
      ['Nodes', metrics.nodeCount],
      ['Edges', metrics.edgeCount],
      ['Split nodes', metrics.generatedIntersectionNodes],
      ['Split links', metrics.splitLinkCount],
      ['Split events', metrics.splitEvents],
      ['Crossing candidates seen', metrics.crossingCandidatesEncountered],
      ['Crossing candidates admitted', metrics.crossingCandidatesAdmitted],
      ['Lonely nodes', metrics.lonelyNodeCount],
      ['Mean degree', metrics.meanDegree],
      ['Max degree', metrics.maxDegree],
      ['Degree Gini', metrics.degreeGini],
      ['Share at capacity', metrics.shareAtCapacity],
      ['Components', metrics.connectedComponents],
      ['Largest component share', metrics.largestComponentShare],
      ['Average clustering', metrics.averageClustering],
      ['Average path length (LCC)', metrics.averagePathLengthLargestComponent],
      ['Diameter (LCC)', metrics.diameterLargestComponent],
      ['Assortativity', metrics.degreeAssortativity],
      ['Mean edge length', metrics.meanEdgeLength],
      ['Median edge length', metrics.medianEdgeLength],
      ['Total network length', metrics.totalNetworkLength],
      ['Leaf share', metrics.fractionLeaves],
      ['High-degree share', metrics.fractionDegreeAboveThreshold],
      ['Cyclomatic number', metrics.cyclomaticNumber],
      ['Dominant growth sector', metrics.dominantDirectionSector],
      ['Dominant sector share', metrics.dominantDirectionShare],
      ['East-West bias', metrics.eastWestBias],
      ['North-South bias', metrics.northSouthBias],
    ];
    refs.metricsPanel.innerHTML = `
      ${panelHeader('Metrics', 'metricsPanel')}
      ${panelBody('metricsPanel', `
        <dl class="metrics-grid">
          ${rows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${typeof value === 'number' ? value.toFixed(3) : value ?? 'NA'}</dd></div>`).join('')}
        </dl>
        <div class="metrics-footer">
          <p>Termination reason: ${escapeHtml(state.simulation.terminationReason || 'still active')}</p>
          <p>Truncation events: ${state.simulation.truncationEvents}</p>
          <p>Tail model: ${escapeHtml(String(state.tail.preferredModel).replace(/_/g, ' '))}</p>
        </div>
      `)}
    `;
    wirePanelToggle(refs.metricsPanel);
  }

function renderInsightsPanel() {
    const insights = [];
    if (state.baseline) {
      const baselineMetrics = computeNetworkMetrics(state.baseline.state.nodes, state.baseline.state.edges, state.baseline.state.params.degreeThreshold);
      if (state.metrics.meanEdgeLength < baselineMetrics.meanEdgeLength - 0.02) {
        insights.push('Higher spatial deterrence shortened average edge length relative to the saved baseline.');
      }
      if (state.metrics.degreeGini < baselineMetrics.degreeGini - 0.02) {
        insights.push('Finite capacity appears to have truncated the upper degree tail relative to the baseline.');
      }
      if (state.metrics.averageClustering > baselineMetrics.averageClustering + 0.02) {
        insights.push('The current parameter setting increased clustering relative to the baseline comparison.');
      }
    }
    if (state.params.kappa >= 3 && state.metrics.cyclomaticNumber > 0) {
      insights.push('Higher kappa is supporting denser local closure and reducing tree-like growth.');
    }
    if (state.metrics.shareAtCapacity > 0.25) {
      insights.push('A substantial share of nodes is saturated, so capacity constraints are materially shaping attachment opportunities.');
    }
    if (Math.abs(state.metrics.eastWestBias) > 0.18) {
      insights.push(`Growth is showing a directional east-west bias (${state.metrics.eastWestBias > 0 ? 'east-heavy' : 'west-heavy'}) relative to the lattice anchor.`);
    }
    if (Math.abs(state.metrics.northSouthBias) > 0.18) {
      insights.push(`Growth is showing a directional north-south bias (${state.metrics.northSouthBias > 0 ? 'north-heavy' : 'south-heavy'}) relative to the lattice anchor.`);
    }
    if (state.simulation.status === 'early_stopped') {
      insights.push('Growth terminated early because no feasible nodes remained under the active capacity constraints.');
    }
    if (insights.length === 0) {
      insights.push('This run is close to its current baseline on the tracked summary metrics. Try varying one mechanism at a time to surface clearer regime changes.');
    }
    refs.insightsPanel.innerHTML = `
      ${panelHeader('Insights', 'insightsPanel')}
      ${panelBody('insightsPanel', `<ul class="insight-list">${insights.map((insight) => `<li>${escapeHtml(insight)}</li>`).join('')}</ul>`)}
    `;
    wirePanelToggle(refs.insightsPanel);
  }

  function renderAccessibilityPanel() {
    const access = state.transportAccessibility;
    const candidateAccess = state.candidateAccessibility;
    const potentialAccess = state.potentialAccessibility;
    const liveSummary = access?.available
      ? `Transport accessibility updated. Mean cumulative access ${access.meanCumulative.toFixed(2)} within radius ${state.params.accessibilityRadius.toFixed(2)}, mean gravity access ${access.meanGravity.toFixed(3)} with decay ${state.params.accessibilityDecay.toFixed(2)}.`
      : access?.message || 'Transport accessibility unavailable.';
    refs.accessibilityPanel.innerHTML = `
      ${panelHeader('Transport accessibility', 'accessibilityPanel', `${access?.available ? '<button id="export-accessibility-csv">Export node CSV</button>' : ''}${candidateAccess?.available ? '<button id="export-candidate-accessibility-csv">Export candidate CSV</button>' : ''}${potentialAccess?.available ? '<button id="export-potential-accessibility-csv">Export potential CSV</button>' : ''}`)}
      ${panelBody('accessibilityPanel', access?.available ? `
        <p class="panel__hint">Shortest-path accessibility over network edge length, using <strong>${escapeHtml(String(access?.semantics || state.params.accessSemantics || 'network').replace('_', ' '))}</strong> destination semantics.</p>
        <dl class="metrics-grid">
          <div><dt>Radius</dt><dd>${state.params.accessibilityRadius.toFixed(3)}</dd></div>
          <div><dt>Decay</dt><dd>${state.params.accessibilityDecay.toFixed(3)}</dd></div>
          <div><dt>Mean cumulative</dt><dd>${access.meanCumulative.toFixed(3)}</dd></div>
          <div><dt>Mean gravity</dt><dd>${access.meanGravity.toFixed(3)}</dd></div>
          <div><dt>Best cumulative node</dt><dd>${escapeHtml(access.maxCumulativeNodeId || 'NA')} (${(access.maxCumulative ?? 0).toFixed(3)})</dd></div>
          <div><dt>Best gravity node</dt><dd>${escapeHtml(access.maxGravityNodeId || 'NA')} (${(access.maxGravity ?? 0).toFixed(3)})</dd></div>
        </dl>
        <p class="note">Use the network node-colour menu to switch to <em>access cumulative</em> or <em>access gravity</em>; those modes now add a choropleth-style accessibility surface in the network view.</p>
        <p class="note">${state.params.selectionKernelMode === 'access'
          ? `Target selection is currently access-weighted using ${escapeHtml(state.params.accessSelectionMetric)} accessibility with strength ${Number(state.params.accessSelectionStrength ?? 0).toFixed(2)}.`
          : 'Target selection is currently using the baseline kernel only.'}</p>
        ${candidateAccess?.available ? `
          <div style="margin-top:0.9rem">
            <p><strong>Current arrival-candidate accessibility</strong> (${escapeHtml(String(candidateAccess.source || 'unknown').replaceAll('_', ' '))})</p>
            <dl class="metrics-grid">
              <div><dt>Candidate sites</dt><dd>${candidateAccess.rows.length}</dd></div>
              <div><dt>Realizable now</dt><dd>${candidateAccess.realizableCount ?? candidateAccess.rows.length}</dd></div>
              <div><dt>Mean candidate cumulative</dt><dd>${Number(candidateAccess.meanCumulative ?? 0).toFixed(3)}</dd></div>
              <div><dt>Mean candidate gravity</dt><dd>${Number(candidateAccess.meanGravity ?? 0).toFixed(3)}</dd></div>
              <div><dt>Best cumulative site</dt><dd>${candidateAccess.bestCumulative ? `(${candidateAccess.bestCumulative.u}, ${candidateAccess.bestCumulative.v}) = ${candidateAccess.bestCumulative.cumulative.toFixed(3)}` : 'NA'}</dd></div>
              <div><dt>Best gravity site</dt><dd>${candidateAccess.bestGravity ? `(${candidateAccess.bestGravity.u}, ${candidateAccess.bestGravity.v}) = ${candidateAccess.bestGravity.gravity.toFixed(3)}` : 'NA'}</dd></div>
            </dl>
          </div>
        ` : `<p class="note">${escapeHtml(candidateAccess?.message || 'Candidate-site accessibility is unavailable for the current arrival mode.')}</p>`}
        ${potentialAccess?.available ? `
          <div style="margin-top:0.9rem">
            <p><strong>All potential lattice-site accessibility</strong> (${escapeHtml(String(potentialAccess.source || 'unknown').replaceAll('_', ' '))})</p>
            <dl class="metrics-grid">
              <div><dt>Potential sites</dt><dd>${potentialAccess.rows.length}</dd></div>
              <div><dt>Realizable now</dt><dd>${potentialAccess.realizableCount ?? 0}</dd></div>
              <div><dt>Mean potential cumulative</dt><dd>${Number(potentialAccess.meanCumulative ?? 0).toFixed(3)}</dd></div>
              <div><dt>Mean potential gravity</dt><dd>${Number(potentialAccess.meanGravity ?? 0).toFixed(3)}</dd></div>
              <div><dt>Best potential cumulative</dt><dd>${potentialAccess.bestCumulative ? `(${potentialAccess.bestCumulative.u}, ${potentialAccess.bestCumulative.v}) = ${potentialAccess.bestCumulative.cumulative.toFixed(3)}` : 'NA'}</dd></div>
              <div><dt>Best potential gravity</dt><dd>${potentialAccess.bestGravity ? `(${potentialAccess.bestGravity.u}, ${potentialAccess.bestGravity.v}) = ${potentialAccess.bestGravity.gravity.toFixed(3)}` : 'NA'}</dd></div>
            </dl>
            <p class="note">Potential-site accessibility covers all currently empty in-bounds lattice sites. Sites with no attachable local targets are listed as not realizable under the current rules.</p>
          </div>
        ` : `<p class="note">${escapeHtml(potentialAccess?.message || 'Potential-site accessibility is unavailable for the current run.')}</p>`}
      ` : `<p class="panel__hint">${escapeHtml(access?.message || 'Transport accessibility is unavailable for this run.')}</p>`)}
    `;
    wirePanelToggle(refs.accessibilityPanel);
    if (!state.ui.collapsedPanels.accessibilityPanel) {
      const button = refs.accessibilityPanel.querySelector('#export-accessibility-csv');
      if (button) {
        button.addEventListener('click', () => {
          const rows = ['id,cumulative_access,gravity_access'];
          state.simulation.nodes.forEach((node) => {
            rows.push([node.id, access.cumulativeById[node.id] ?? 0, access.gravityById[node.id] ?? 0].join(','));
          });
          exportText('transport-accessibility.csv', rows.join('\n'), 'text/csv;charset=utf-8');
        });
      }
      const candidateButton = refs.accessibilityPanel.querySelector('#export-candidate-accessibility-csv');
      if (candidateButton && candidateAccess?.available) {
        candidateButton.addEventListener('click', () => {
          const rows = ['lattice_u,lattice_v,x,y,attachable_neighbor_count,provisional_targets,realizable_now,candidate_cumulative_access,candidate_gravity_access'];
          candidateAccess.rows.forEach((row) => {
            rows.push([
              row.u,
              row.v,
              row.x.toFixed(6),
              row.y.toFixed(6),
              row.attachableNeighborCount,
              `"${row.provisionalTargetIds.join('|')}"`,
              row.realizableNow ? 1 : 0,
              row.realizableNow ? row.cumulative.toFixed(6) : '',
              row.realizableNow ? row.gravity.toFixed(6) : '',
            ].join(','));
          });
          exportText('candidate-site-accessibility.csv', rows.join('\n'), 'text/csv;charset=utf-8');
        });
      }
      const potentialButton = refs.accessibilityPanel.querySelector('#export-potential-accessibility-csv');
      if (potentialButton && potentialAccess?.available) {
        potentialButton.addEventListener('click', () => {
          const rows = ['lattice_u,lattice_v,x,y,is_current_candidate,attachable_neighbor_count,provisional_targets,realizable_now,potential_cumulative_access,potential_gravity_access'];
          potentialAccess.rows.forEach((row) => {
            rows.push([
              row.u,
              row.v,
              row.x.toFixed(6),
              row.y.toFixed(6),
              row.isCurrentCandidate ? 1 : 0,
              row.attachableNeighborCount,
              `"${row.provisionalTargetIds.join('|')}"`,
              row.realizableNow ? 1 : 0,
              row.realizableNow ? row.cumulative.toFixed(6) : '',
              row.realizableNow ? row.gravity.toFixed(6) : '',
            ].join(','));
          });
          exportText('potential-site-accessibility.csv', rows.join('\n'), 'text/csv;charset=utf-8');
        });
      }
    }
    refs.accessibilityLive.textContent = liveSummary;
  }

  function renderCharts() {
    refs.chartPanel.innerHTML = `
      ${panelHeader('Charts', 'chartPanel')}
      ${panelBody('chartPanel', `
        <div class="tab-bar">
          ${[
            ['degree', 'Degree histogram'],
            ['ccdf', 'Degree CCDF'],
            ['edgeLength', 'Edge lengths'],
            ['timeSeries', 'Time series'],
            ['scatter', 'Scatter'],
            ['batch', 'Batch'],
          ].map(([id, label]) => `<button data-chart-tab="${id}" class="${state.ui.activeChartTab === id ? 'active' : ''}">${label}</button>`).join('')}
        </div>
        <div id="chart-content"></div>
      `)}
    `;
    wirePanelToggle(refs.chartPanel);
    if (state.ui.collapsedPanels.chartPanel) {
      return;
    }
    refs.chartPanel.querySelectorAll('[data-chart-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        state.ui.activeChartTab = button.dataset.chartTab;
        renderCharts();
      });
    });
    const container = refs.chartPanel.querySelector('#chart-content');
    if (state.ui.activeChartTab === 'degree') {
      renderDegreeHistogram(container);
    } else if (state.ui.activeChartTab === 'ccdf') {
      renderCcdf(container);
    } else if (state.ui.activeChartTab === 'edgeLength') {
      renderEdgeLengthHistogram(container);
    } else if (state.ui.activeChartTab === 'timeSeries') {
      renderTimeSeries(container);
    } else if (state.ui.activeChartTab === 'scatter') {
      renderScatter(container);
    } else {
      renderBatchChart(container);
    }
  }

  function chartFrame(title, subtitle) {
    return `
      <div class="chart-frame__header">
        <div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(subtitle)}</p>
        </div>
        <div class="control-row">
          <button data-chart-export="svg">Export SVG</button>
          <button data-chart-export="png">Export PNG</button>
        </div>
      </div>
      <div class="chart-stage"></div>
    `;
  }

  function wireChartExport(container, svgFilename, pngFilename) {
    const svgButton = container.querySelector('[data-chart-export="svg"]');
    const pngButton = container.querySelector('[data-chart-export="png"]');
    svgButton.addEventListener('click', () => {
      const svg = container.querySelector('svg');
      if (svg) {
        exportText(svgFilename, svg.outerHTML, 'image/svg+xml;charset=utf-8');
      }
    });
    pngButton.addEventListener('click', async () => {
      const svg = container.querySelector('svg');
      if (svg) {
        await exportSvgAsPng(pngFilename, svg.outerHTML, 1200, 700);
      }
    });
  }

  function renderDegreeHistogram(container) {
    container.innerHTML = chartFrame('Degree histogram', 'Observed degree frequencies in the current run.');
    const stage = container.querySelector('.chart-stage');
    const width = 760;
    const height = 360;
    const margin = { top: 28, right: 28, bottom: 46, left: 64 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const degrees = state.simulation.nodes.map((node) => node.degree);
    const maxDegree = Math.max(...degrees, 0);
    const counts = new Map();
    degrees.forEach((degree) => counts.set(degree, (counts.get(degree) || 0) + 1));
    const data = d3.range(0, maxDegree + 1).map((degree) => ({ degree, count: counts.get(degree) || 0 }));
    const maxCount = Math.max(...data.map((entry) => entry.count), 1);
    const svg = d3.create('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('class', 'chart-svg');
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleBand().domain(data.map((entry) => String(entry.degree))).range([0, innerWidth]).padding(0.12);
    const y = d3.scaleLinear().domain([0, maxCount]).range([innerHeight, 0]);
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y).ticks(Math.min(8, maxCount + 1)).tickFormat(d3.format('d'));
    g.selectAll('rect').data(data).enter().append('rect')
      .attr('x', (entry) => x(String(entry.degree)))
      .attr('y', (entry) => y(entry.count))
      .attr('width', x.bandwidth())
      .attr('height', (entry) => innerHeight - y(entry.count))
      .attr('fill', '#0b4f6c')
      .attr('opacity', 0.82);
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((axis) => axis.selectAll('text').attr('fill', '#667085').attr('font-size', 10))
      .call((axis) => axis.selectAll('path,line').attr('stroke', '#98a2b3'));
    g.append('g')
      .call(yAxis)
      .call((axis) => axis.selectAll('text').attr('fill', '#667085').attr('font-size', 10))
      .call((axis) => axis.selectAll('path,line').attr('stroke', '#98a2b3'));
    g.append('text').attr('x', innerWidth / 2).attr('y', innerHeight + 34).attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', '#344054').text('Degree');
    g.append('text').attr('x', -innerHeight / 2).attr('y', -46).attr('transform', 'rotate(-90)').attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', '#344054').text('Count');
    stage.appendChild(svg.node());
    wireChartExport(container, 'degree-histogram.svg', 'degree-histogram.png');
  }

  function renderEdgeLengthHistogram(container) {
    container.innerHTML = chartFrame('Edge-length histogram', state.params.planarityMode === 'split_crossings'
      ? 'Original intended link lengths before any split-crossing subdivision.'
      : 'Distance distribution under the preserved unit-square geometry.');
    const stage = container.querySelector('.chart-stage');
    const width = 760;
    const height = 360;
    const margin = { top: 28, right: 28, bottom: 46, left: 64 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const lengths = (state.simulation.referenceLinks && state.simulation.referenceLinks.length > 0
      ? state.simulation.referenceLinks
      : state.simulation.edges).map((edge) => edge.length);
    const svg = d3.create('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('class', 'chart-svg');
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const bins = d3.bin().domain([0, Math.max(...lengths, 1)]).thresholds(18)(lengths);
    const x = d3.scaleLinear().domain([0, Math.max(...lengths, 1)]).range([0, innerWidth]);
    const y = d3.scaleLinear().domain([0, Math.max(...bins.map((bin) => bin.length), 1)]).nice().range([innerHeight, 0]);
    const xAxis = d3.axisBottom(x).ticks(6);
    const yAxis = d3.axisLeft(y).ticks(6).tickFormat(d3.format('d'));
    g.selectAll('rect').data(bins).enter().append('rect')
      .attr('x', (bin) => x(bin.x0 || 0) + 1)
      .attr('y', (bin) => y(bin.length))
      .attr('width', (bin) => Math.max(x(bin.x1 || 0) - x(bin.x0 || 0) - 2, 0))
      .attr('height', (bin) => innerHeight - y(bin.length))
      .attr('fill', '#2f855a')
      .attr('opacity', 0.82);
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((axis) => axis.selectAll('text').attr('fill', '#667085').attr('font-size', 10))
      .call((axis) => axis.selectAll('path,line').attr('stroke', '#98a2b3'));
    g.append('g')
      .call(yAxis)
      .call((axis) => axis.selectAll('text').attr('fill', '#667085').attr('font-size', 10))
      .call((axis) => axis.selectAll('path,line').attr('stroke', '#98a2b3'));
    g.append('text').attr('x', innerWidth / 2).attr('y', innerHeight + 34).attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', '#344054').text('Edge length');
    g.append('text').attr('x', -innerHeight / 2).attr('y', -46).attr('transform', 'rotate(-90)').attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', '#344054').text('Count');
    stage.appendChild(svg.node());
    wireChartExport(container, 'edge-length-histogram.svg', 'edge-length-histogram.png');
  }

  function renderCcdf(container) {
    container.innerHTML = chartFrame('Degree CCDF', `Tail diagnostics: preferred model ${String(state.tail.preferredModel).replace(/_/g, ' ')}.`);
    const stage = container.querySelector('.chart-stage');
    const width = 760;
    const height = 360;
    const margin = { top: 28, right: 28, bottom: 46, left: 64 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const support = state.tail.support.length > 0 ? state.tail.support : [1];
    const ccdf = state.tail.ccdf.length > 0 ? state.tail.ccdf : [1];
    const svg = d3.create('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('class', 'chart-svg');
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLog().domain([Math.max(1, support[0]), Math.max(...support, 1)]).range([0, innerWidth]);
    const y = d3.scaleLog().domain([Math.max(1e-3, Math.min(...ccdf)), 1]).range([innerHeight, 0]);
    const xAxis = d3.axisBottom(x).ticks(6, '~g');
    const yAxis = d3.axisLeft(y).ticks(6, '~g');
    const line = d3.line().x((_, index) => x(support[index])).y((value) => y(Math.max(value, 1e-3)));
    g.append('path').attr('d', line(ccdf)).attr('fill', 'none').attr('stroke', '#0b4f6c').attr('stroke-width', 2.2);
    g.selectAll('circle').data(support).enter().append('circle')
      .attr('cx', (value) => x(value))
      .attr('cy', (_, index) => y(Math.max(ccdf[index], 1e-3)))
      .attr('r', 2.4)
      .attr('fill', '#0b4f6c');
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((axis) => axis.selectAll('text').attr('fill', '#667085').attr('font-size', 10))
      .call((axis) => axis.selectAll('path,line').attr('stroke', '#98a2b3'));
    g.append('g')
      .call(yAxis)
      .call((axis) => axis.selectAll('text').attr('fill', '#667085').attr('font-size', 10))
      .call((axis) => axis.selectAll('path,line').attr('stroke', '#98a2b3'));
    g.append('text').attr('x', innerWidth / 2).attr('y', innerHeight + 34).attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', '#344054').text('Degree (log scale)');
    g.append('text').attr('x', -innerHeight / 2).attr('y', -46).attr('transform', 'rotate(-90)').attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', '#344054').text('CCDF (log scale)');
    stage.appendChild(svg.node());
    wireChartExport(container, 'degree-ccdf.svg', 'degree-ccdf.png');
  }

  function renderTimeSeries(container) {
    container.innerHTML = chartFrame('Growth time series', 'Trajectory diagnostics recorded across simulation steps.');
    const stage = container.querySelector('.chart-stage');
    const width = 760;
    const height = 360;
    const margin = { top: 28, right: 28, bottom: 46, left: 64 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const series = [
      { key: 'maxDegree', label: 'Max degree', color: '#0b4f6c' },
      { key: 'shareAtCapacity', label: 'Share saturated', color: '#b42318' },
      { key: 'averageClustering', label: 'Clustering', color: '#2f855a' },
      { key: 'connectedComponents', label: 'Component count', color: '#805ad5' },
      { key: 'totalNetworkLength', label: 'Total length', color: '#c05621' },
    ];
    const points = state.simulation.history.map((snapshot) => ({
      step: snapshot.step,
      maxDegree: snapshot.metrics.maxDegree,
      shareAtCapacity: snapshot.metrics.shareAtCapacity,
      averageClustering: snapshot.metrics.averageClustering,
      connectedComponents: snapshot.metrics.connectedComponents,
      totalNetworkLength: snapshot.metrics.totalNetworkLength,
    }));
    const svg = d3.create('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('class', 'chart-svg');
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLinear().domain([0, Math.max(...points.map((point) => point.step), 1)]).range([0, innerWidth]);
    const y = d3.scaleLinear().domain([0, Math.max(...series.flatMap((item) => points.map((point) => point[item.key])), 1)]).nice().range([innerHeight, 0]);
    const xAxis = d3.axisBottom(x).ticks(6).tickFormat(d3.format('d'));
    const yAxis = d3.axisLeft(y).ticks(6);
    series.forEach((item) => {
      const line = d3.line().x((point) => x(point.step)).y((point) => y(point[item.key]));
      g.append('path').attr('d', line(points)).attr('fill', 'none').attr('stroke', item.color).attr('stroke-width', 2);
    });
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((axis) => axis.selectAll('text').attr('fill', '#667085').attr('font-size', 10))
      .call((axis) => axis.selectAll('path,line').attr('stroke', '#98a2b3'));
    g.append('g')
      .call(yAxis)
      .call((axis) => axis.selectAll('text').attr('fill', '#667085').attr('font-size', 10))
      .call((axis) => axis.selectAll('path,line').attr('stroke', '#98a2b3'));
    g.append('text').attr('x', innerWidth / 2).attr('y', innerHeight + 34).attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', '#344054').text('Step');
    g.append('text').attr('x', -innerHeight / 2).attr('y', -46).attr('transform', 'rotate(-90)').attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', '#344054').text('Metric value');
    const legend = g.append('g').attr('transform', `translate(${Math.max(innerWidth - 160, 0)}, 6)`);
    series.forEach((item, index) => {
      const row = legend.append('g').attr('transform', `translate(0, ${index * 16})`);
      row.append('line').attr('x1', 0).attr('x2', 16).attr('y1', 0).attr('y2', 0).attr('stroke', item.color).attr('stroke-width', 2);
      row.append('text').attr('x', 22).attr('y', 4).attr('font-size', 10).attr('fill', '#475467').text(item.label);
    });
    stage.appendChild(svg.node());
    wireChartExport(container, 'growth-time-series.svg', 'growth-time-series.png');
  }

  function renderScatter(container) {
    container.innerHTML = chartFrame('Scatter diagnostics', 'Degree-age and degree-capacity relationships for the current run.');
    const stage = container.querySelector('.chart-stage');
    const width = 760;
    const height = 360;
    const svg = d3.create('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('class', 'chart-svg');
    const panels = [
      { title: 'Degree vs age', points: state.simulation.nodes.map((node) => ({ x: node.birthStep, y: node.degree })), color: '#0b4f6c' },
      { title: 'Degree vs residual capacity', points: state.simulation.nodes.map((node) => ({ x: node.residualCapacity, y: node.degree })), color: '#2f855a' },
    ];
    panels.forEach((panel, panelIndex) => {
      const margin = { top: 40, right: 24, bottom: 42, left: 58 };
      const innerWidth = width / 2 - margin.left - margin.right - 24;
      const innerHeight = height - margin.top - margin.bottom;
      const offsetX = panelIndex * (width / 2) + margin.left + panelIndex * 12;
      const g = svg.append('g').attr('transform', `translate(${offsetX},${margin.top})`);
      const x = d3.scaleLinear().domain([0, Math.max(...panel.points.map((point) => point.x), 1)]).range([0, innerWidth]);
      const y = d3.scaleLinear().domain([0, Math.max(...panel.points.map((point) => point.y), 1)]).range([innerHeight, 0]);
      const xAxis = d3.axisBottom(x).ticks(5);
      const yAxis = d3.axisLeft(y).ticks(5);
      g.append('text').attr('x', innerWidth / 2).attr('y', -10).attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', '#344054').text(panel.title);
      g.selectAll('circle').data(panel.points).enter().append('circle')
        .attr('cx', (point) => x(point.x))
        .attr('cy', (point) => y(point.y))
        .attr('r', 3)
        .attr('fill', panel.color)
        .attr('opacity', 0.75);
      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .call((axis) => axis.selectAll('text').attr('fill', '#667085').attr('font-size', 10))
        .call((axis) => axis.selectAll('path,line').attr('stroke', '#98a2b3'));
      g.append('g')
        .call(yAxis)
        .call((axis) => axis.selectAll('text').attr('fill', '#667085').attr('font-size', 10))
        .call((axis) => axis.selectAll('path,line').attr('stroke', '#98a2b3'));
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 34)
        .attr('text-anchor', 'middle')
        .attr('font-size', 10)
        .attr('fill', '#344054')
        .text(panelIndex === 0 ? 'Birth step' : 'Residual capacity');
      g.append('text')
        .attr('x', -innerHeight / 2)
        .attr('y', -40)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .attr('font-size', 10)
        .attr('fill', '#344054')
        .text('Degree');
    });
    stage.appendChild(svg.node());
    wireChartExport(container, 'scatter-diagnostics.svg', 'scatter-diagnostics.png');
  }

  function renderBatchChart(container) {
    container.innerHTML = chartFrame('Batch summaries', 'Aggregated means, variation, and early-stop behavior across replications.');
    const stage = container.querySelector('.chart-stage');
    if (!state.batch.result) {
      stage.innerHTML = '<p class="note">Run a batch to populate this table.</p>';
      return;
    }
    stage.innerHTML = renderBatchTable(state.batch.result);
    const svgButton = container.querySelector('[data-chart-export="svg"]');
    const pngButton = container.querySelector('[data-chart-export="png"]');
    svgButton.disabled = true;
    pngButton.disabled = true;
  }

  function renderBatchTable(result) {
    return `
      <div class="batch-table-wrap">
        <table class="batch-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Replications</th>
              <th>Early-stop rate</th>
              <th>Truncation rate</th>
              <th>Mean degree</th>
              <th>Degree Gini</th>
              <th>Mean edge length</th>
            </tr>
          </thead>
          <tbody>
            ${result.summaries.map((summary) => `
              <tr>
                <td>${escapeHtml(summary.scenarioLabel)}</td>
                <td>${summary.replications}</td>
                <td>${summary.earlyStopRate.toFixed(3)}</td>
                <td>${summary.truncationRate.toFixed(3)}</td>
                <td>${summary.metrics.meanDegree.mean.toFixed(3)}</td>
                <td>${summary.metrics.degreeGini.mean.toFixed(3)}</td>
                <td>${summary.metrics.meanEdgeLength.mean.toFixed(3)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function batchResultCsv(result) {
    const rows = ['scenario,replications,earlyStopRate,truncationRate,meanDegree,degreeGini,meanEdgeLength'];
    result.summaries.forEach((summary) => {
      rows.push([
        summary.scenarioLabel,
        summary.replications,
        summary.earlyStopRate,
        summary.truncationRate,
        summary.metrics.meanDegree.mean,
        summary.metrics.degreeGini.mean,
        summary.metrics.meanEdgeLength.mean,
      ].join(','));
    });
    return rows.join('\n');
  }

  function createBatchWorker() {
    const workerFunctions = [
      clone,
      createRng,
      nextRandom,
      randomUniform,
      randomPoint,
      averageEdgeLength,
      meshAngleStepDegrees,
      allowedMeshAngles,
      smallestAngleDifference,
      snapAngleToAllowed,
      generateCrossSeedCells,
      latticeCoordinatesForPoint,
      assignLatticeCoordinates,
      isMeshAdjacentCandidate,
      latticeNeighborOffsets,
      countAttachableMeshNeighbors,
      meshBasisForAngle,
      solveBasisCoefficients,
      pointFromBasis,
      dominantAllowedAngle,
      projectedLatticeGeometry,
      projectedLatticePoints,
      projectedLatticeCandidates,
      networkBiasedLatticeCandidates,
      nearestExistingDistance,
      randomLogNormal,
      randomNormal,
      weightedChoiceIndex,
      deriveSeed,
      resolveCapacityValue,
      minimumCapacityForBirth,
      sampleCapacity,
      updateCapacityState,
      euclideanDistance,
      nodeIdFromIndex,
      edgeIdFor,
      nodeMap,
      cross2d,
      segmentIntersectionPoint,
      edgeWouldCrossExisting,
      findCrossingsForConnection,
      incrementNodeDegree,
      recordReferenceLink,
      removeEdgeFromState,
      addEdgeToState,
      createGeneratedIntersectionNode,
      applyConnectionWithPlanarity,
      validateSimulationParams,
      createSeedGraph,
      computeMeshLogAdjustment,
      computeAttachmentWeight,
      computeFeasibleProbabilities,
      selectSequentialNeighbors,
      gini,
      buildAdjacency,
      connectedComponents,
      averageClustering,
      bfsDistances,
      largestComponentStats,
      degreeAssortativity,
      median,
      countSquares,
      ccw,
      segmentsCross,
      crossingDiagnostics,
      computeNetworkMetrics,
      empiricalCcdf,
      hurwitzZeta,
      powerLawAlphaMle,
      powerLawKs,
      powerLawAic,
      exponentialFit,
      lognormalFit,
      fitTailModels,
      historySnapshot,
      initializeSimulation,
      stepSimulation,
      runSimulation,
      summarizeMetric,
      summarizeBatchScenario,
      runBatchConfig,
    ];
    const source = `
const VERY_LARGE = 'very_large';
const NON_CROSSING_RETRY_LIMIT = ${NON_CROSSING_RETRY_LIMIT};
${workerFunctions.map((fn) => fn.toString()).join('\n\n')}
self.onmessage = (event) => {
  const { type, config } = event.data || {};
  if (type !== 'run-batch') return;
  const result = runBatchConfig(config, (progress) => self.postMessage({ type: 'progress', progress }));
  self.postMessage({ type: 'result', result });
};
`;
    const blob = new Blob([source], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    return { worker: new Worker(url), url };
  }

  function currentBatchConfig() {
    return {
      scenarios: scenarioPresets.slice(0, 4).map((preset) => ({
        id: preset.id,
        label: preset.label,
        params: sanitizeParams(mergeScenarioParams(preset.params)),
      })),
      replications: state.params.replicationCount,
    };
  }

  function completeBatch(result) {
    state.batch.result = result;
    state.batch.progress = 1;
    state.batch.running = false;
    state.batch.saved = [
      {
        id: `batch-${Date.now()}`,
        createdAt: new Date().toISOString(),
        label: 'latest batch',
        result,
      },
      ...state.batch.saved.slice(0, 9),
    ];
    storeBatchResults();
    render();
  }

  function runBatchFallback(config) {
    const runs = [];
    const jobs = [];
    config.scenarios.forEach((scenario) => {
      for (let replication = 0; replication < config.replications; replication += 1) {
        jobs.push({ scenario, replication });
      }
    });
    const total = jobs.length;
    let index = 0;

    function processChunk() {
      const chunkSize = 1;
      const limit = Math.min(index + chunkSize, total);
      for (; index < limit; index += 1) {
        const job = jobs[index];
        const seed = deriveSeed(job.scenario.params.rngSeed, job.scenario.id, job.replication);
        const runState = runSimulation({ ...job.scenario.params, rngSeed: seed });
        const metrics = computeNetworkMetrics(runState.nodes, runState.edges, runState.params.degreeThreshold);
        const tail = fitTailModels(runState.nodes.map((node) => node.degree));
        runs.push({
          scenarioId: job.scenario.id,
          scenarioLabel: job.scenario.label,
          replication: job.replication,
          seed,
          metrics,
          earlyStopped: runState.status === 'early_stopped',
          terminationReason: runState.terminationReason,
          truncationEvents: runState.truncationEvents,
          totalMissingLinks: runState.totalMissingLinks,
          tail,
        });
      }
      state.batch.progress = total > 0 ? index / total : 1;
      if (state.ui.activePrimaryTab === 'batch') {
        renderBatchView();
      }
      if (index < total) {
        window.setTimeout(processChunk, 0);
        return;
      }
      const result = {
        config,
        runs,
        summaries: config.scenarios.map((scenario) => summarizeBatchScenario(runs.filter((run) => run.scenarioId === scenario.id))),
      };
      completeBatch(result);
    }

    processChunk();
  }

  function runBatch() {
    if (state.batch.running) {
      return;
    }
    state.ui.activePrimaryTab = 'batch';
    state.batch.running = true;
    state.batch.progress = 0.01;
    render();
    const config = currentBatchConfig();

    if (window.location.protocol === 'file:') {
      runBatchFallback(config);
      return;
    }

    const { worker, url } = createBatchWorker();
    worker.onmessage = (event) => {
      if (event.data.type === 'progress') {
        state.batch.progress = event.data.progress;
        if (state.ui.activePrimaryTab === 'batch') {
          renderBatchView();
        }
        return;
      }
      if (event.data.type === 'result') {
        completeBatch(event.data.result);
        worker.terminate();
        URL.revokeObjectURL(url);
      }
    };
    worker.onerror = () => {
      worker.terminate();
      URL.revokeObjectURL(url);
      runBatchFallback(config);
    };
    worker.postMessage({
      type: 'run-batch',
      config,
    });
  }

  function render() {
    refs.shell.className = state.ui.activePrimaryTab === 'paper' || state.ui.paperMode ? 'app-shell app-shell--paper' : 'app-shell';
    renderPrimaryTabs();
    renderSidebar();
    renderRunControls();
    renderMainPanel();
    renderMetricsPanel();
    renderInsightsPanel();
    renderAccessibilityPanel();
    renderCharts();
  }

  function numberField(id, label, value, step, min, max, compact = false, disabled = false) {
    return `<label class="field ${compact ? 'field--compact' : ''} ${disabled ? 'field--disabled' : ''}"><span>${escapeHtml(label)}</span><input id="${id}" type="number" value="${value}" step="${step}" min="${min}" ${Number.isFinite(max) ? `max="${max}"` : ''} ${disabled ? 'disabled' : ''} /></label>`;
  }

  function sidebarSection(id, title, open, body) {
    const expanded = state.ui.sidebarSections[id] ?? open;
    return `
      <details class="sidebar-section" data-sidebar-section="${id}" ${expanded ? 'open' : ''}>
        <summary>${escapeHtml(title)}</summary>
        <div class="sidebar-section__body">${body}</div>
      </details>
    `;
  }

  function checkbox(id, label, checked) {
    return `<label><input id="${id}" type="checkbox" ${checked ? 'checked' : ''}/> ${escapeHtml(label)}</label>`;
  }

  function comparisonMetric(label, baseline, current) {
    const delta = current - baseline;
    return `
      <div>
        <dt>${escapeHtml(label)}</dt>
        <dd>${current.toFixed(3)} <span class="delta ${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '+' : ''}${delta.toFixed(3)}</span></dd>
      </div>
    `;
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  document.getElementById('toggle-paper').addEventListener('click', () => {
    state.ui.paperMode = !state.ui.paperMode;
    render();
  });
  document.getElementById('export-bundle').addEventListener('click', exportCurrentBundle);
  document.getElementById('copy-graph-json').addEventListener('click', async () => copyGraphJson());

  initializeAppState();
  render();
