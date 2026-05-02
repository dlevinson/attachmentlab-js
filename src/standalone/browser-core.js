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
  rngSeed: { min: 1, max: 2147483647 },
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

