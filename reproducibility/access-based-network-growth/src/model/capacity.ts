import type { CapacityMode, SimulationParams } from '../types/model';
import { randomLogNormal, randomUniform, type RngState } from './random';

export const VERY_LARGE = 'very_large';

export function minimumCapacityForBirth(m0: number, kappa: number, isSeed: boolean): number {
  return isSeed ? m0 - 1 : kappa;
}

export function resolveCapacityValue(
  value: number | 'very_large' | undefined,
  finalNodeCount: number,
  m0: number,
  kappa: number,
): number {
  if (value === VERY_LARGE || value === undefined) {
    return finalNodeCount + m0 + kappa + 10;
  }
  return value;
}

export function sampleCapacity(
  rng: RngState,
  params: SimulationParams,
  isSeed: boolean,
): number {
  const minimum = minimumCapacityForBirth(params.m0, params.kappa, isSeed);
  const { capacityMode, capacityParams = {}, capacityValue } = params;

  let sampled: number;
  switch (capacityMode as CapacityMode) {
    case 'homogeneous':
      sampled = resolveCapacityValue(
        capacityValue ?? capacityParams.value,
        params.finalNodeCount,
        params.m0,
        params.kappa,
      );
      break;
    case 'uniform':
      {
        const low = Math.ceil(capacityParams.low ?? minimum);
        const high = Math.floor(capacityParams.high ?? minimum + 4);
        if (low > high) {
          throw new Error('Uniform capacity range contains no integer values.');
        }
        sampled = Math.floor(randomUniform(rng, low, high + 1));
      }
      break;
    case 'lognormal':
      sampled = Math.round(randomLogNormal(rng, capacityParams.mean ?? 1.5, capacityParams.sigma ?? 0.35));
      break;
    default:
      sampled = resolveCapacityValue(
        capacityValue ?? capacityParams.value,
        params.finalNodeCount,
        params.m0,
        params.kappa,
      );
      break;
  }

  return Math.max(Math.round(sampled), minimum);
}

export function updateCapacityState<T extends { degree: number; capacity: number; residualCapacity: number; saturated: boolean }>(
  node: T,
): T {
  const residualCapacity = Math.max(node.capacity - node.degree, 0);
  node.residualCapacity = residualCapacity;
  node.saturated = residualCapacity <= 1e-9;
  return node;
}
