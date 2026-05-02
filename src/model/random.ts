export interface RngState {
  seed: number;
  state: number;
}

function normalizeSeed(seed: number): number {
  const normalized = seed >>> 0;
  return normalized === 0 ? 1 : normalized;
}

export function createRng(seed: number): RngState {
  const normalized = normalizeSeed(seed);
  return {
    seed: normalized,
    state: normalized,
  };
}

export function cloneRng(rng: RngState): RngState {
  return { ...rng };
}

export function nextRandom(rng: RngState): number {
  rng.state = (rng.state + 0x6d2b79f5) >>> 0;
  let t = rng.state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function randomUniform(rng: RngState, min = 0, max = 1): number {
  return min + (max - min) * nextRandom(rng);
}

export function randomPoint(rng: RngState): [number, number] {
  return [nextRandom(rng), nextRandom(rng)];
}

export function randomLogNormal(rng: RngState, mean: number, sigma: number): number {
  const u1 = Math.max(nextRandom(rng), 1e-12);
  const u2 = Math.max(nextRandom(rng), 1e-12);
  const normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.exp(mean + sigma * normal);
}

export function weightedChoiceIndex(weights: number[], rng: RngState): number {
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

export function deriveSeed(baseSeed: number, ...parts: Array<string | number>): number {
  const payload = `${baseSeed}|${parts.join('|')}`;
  let hash = 2166136261;
  for (let index = 0; index < payload.length; index += 1) {
    hash ^= payload.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return normalizeSeed(hash);
}
