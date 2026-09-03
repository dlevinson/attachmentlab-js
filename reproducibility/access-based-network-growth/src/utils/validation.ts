import type { SimulationParams, ValidationMessage } from '../types/model';

function expectedSeedMaxDegree(params: SimulationParams): number {
  if (params.seedGraphType === 'complete') {
    return Math.max(params.m0 - 1, 0);
  }
  if (params.seedGraphType === 'ring') {
    return params.m0 <= 2 ? Math.max(params.m0 - 1, 0) : 2;
  }
  if (params.seedGraphType === 'grid') {
    const size = Math.ceil(Math.sqrt(params.m0));
    if (size <= 1) {
      return 0;
    }
    if (size === 2 && params.m0 <= 4) {
      return 2;
    }
    return 4;
  }
  if (params.seedGraphType === 'cross') {
    if (params.m0 <= 1) {
      return 0;
    }
    return Math.min(6, params.m0 - 1);
  }
  return Math.max(params.m0 - 1, 0);
}

export function validateSimulationParams(params: SimulationParams): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
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
  if (params.alpha < 0 || params.beta < 0 || params.phi < 0 || (params.lambda ?? 1) < 0) {
    messages.push({ level: 'error', message: 'alpha, beta, phi, and lambda must be non-negative.' });
  }
  if (
    params.capacityMode === 'homogeneous'
    && typeof params.capacityValue === 'number'
    && params.capacityValue < Math.max(params.kappa, seedMaxDegree)
  ) {
    messages.push({
      level: 'error',
      message: `Homogeneous capacity must be at least max(kappa, seed max degree ${seedMaxDegree}) so the chosen seed graph is feasible.`,
    });
  }
  if (params.seedGraphType === 'complete' && params.m0 >= 5) {
    messages.push({
      level: 'warning',
      message: 'A complete seed with m0 >= 5 is non-planar by construction, so initial edge crossings are expected.',
    });
  }
  if (params.capacityMode === 'homogeneous' && typeof params.capacityValue === 'number' && params.capacityValue < params.kappa + 1) {
    messages.push({
      level: 'warning',
      message: 'Capacity is only slightly above kappa, so early stopping or frequent truncation is likely.',
    });
  }
  if (
    params.finalNodeCount > params.m0
    && params.capacityMode === 'homogeneous'
    && typeof params.capacityValue === 'number'
    && params.capacityValue <= seedMaxDegree
  ) {
    messages.push({
      level: 'warning',
      message: 'This seed graph starts at or above the chosen homogeneous capacity, so growth may stop immediately.',
    });
  }
  if (params.alpha === 0 && params.beta === 0 && params.phi === 0) {
    messages.push({
      level: 'warning',
      message: 'All exponents are zero, so attachment is nearly uniform among feasible nodes.',
    });
  }
  if (params.capacityMode === 'homogeneous' && typeof params.capacityValue === 'number' && params.capacityValue < params.kappa) {
    messages.push({
      level: 'warning',
      message: 'K is below kappa, so most arrivals cannot realize all requested links.',
    });
  }
  if (params.impedanceMode === 'exponential' && (params.lambda ?? 1) === 0) {
    messages.push({
      level: 'warning',
      message: 'Exponential impedance is active with lambda = 0, so distance has no effect.',
    });
  }

  return messages;
}
