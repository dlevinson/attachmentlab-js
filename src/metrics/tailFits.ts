import type { TailFitSummary } from '../types/model';

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function variance(values: number[]): number {
  const mu = mean(values);
  return values.reduce((sum, value) => sum + (value - mu) ** 2, 0) / values.length;
}

function hurwitzZeta(alpha: number, kMin: number): number {
  let sum = 0;
  let k = kMin;
  let last = 0;
  while (k < kMin + 10000) {
    const term = k ** (-alpha);
    sum += term;
    if (Math.abs(sum - last) < 1e-10 && k > kMin + 200) {
      break;
    }
    last = sum;
    k += 1;
  }
  return sum;
}

export function empiricalCcdf(degrees: number[]): { support: number[]; ccdf: number[] } {
  const values = degrees.filter((degree) => degree > 0).sort((a, b) => a - b);
  const support = [...new Set(values)];
  const ccdf = support.map((value) => values.filter((degree) => degree >= value).length / values.length);
  return { support, ccdf };
}

function powerLawAlphaMle(sample: number[], kMin: number): number {
  return 1 + sample.length / sample.reduce((sum, value) => sum + Math.log(value / (kMin - 0.5)), 0);
}

function powerLawKs(sample: number[], alpha: number, kMin: number): number {
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

function powerLawAic(sample: number[], alpha: number, kMin: number): number | null {
  const zeta = hurwitzZeta(alpha, kMin);
  if (!Number.isFinite(zeta) || zeta <= 0) {
    return null;
  }
  const logLik = -alpha * sample.reduce((sum, value) => sum + Math.log(value), 0) - sample.length * Math.log(zeta);
  return 2 - 2 * logLik;
}

function exponentialFit(sample: number[], kMin: number): { lambda: number | null; aic: number | null } {
  const shifted = sample.map((value) => value - kMin);
  const scale = mean(shifted);
  if (scale <= 0) {
    return { lambda: null, aic: null };
  }
  const lambda = 1 / scale;
  const logLik = shifted.reduce((sum, value) => sum + Math.log(lambda) - lambda * value, 0);
  return { lambda, aic: 2 - 2 * logLik };
}

function lognormalFit(sample: number[]): { mu: number | null; sigma: number | null; aic: number | null } {
  const positive = sample.filter((value) => value > 0);
  if (positive.length === 0) {
    return { mu: null, sigma: null, aic: null };
  }
  const logs = positive.map((value) => Math.log(value));
  const mu = mean(logs);
  const sigma = Math.sqrt(Math.max(variance(logs), 1e-12));
  const logLik = logs.reduce(
    (sum, logValue, index) =>
      sum -
      Math.log(positive[index] * sigma * Math.sqrt(2 * Math.PI)) -
      ((logValue - mu) ** 2) / (2 * sigma * sigma),
    0,
  );
  return { mu, sigma, aic: 4 - 2 * logLik };
}

export function fitTailModels(degrees: number[], minTailSize = 20): TailFitSummary {
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

  let best:
    | {
        kMin: number;
        alpha: number;
        ks: number;
        aic: number | null;
        tail: number[];
      }
    | undefined;

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
  ].filter((entry): entry is ['power_law' | 'exponential' | 'lognormal', number] => entry[1] !== null);

  comparison.sort((a, b) => a[1] - b[1]);

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
    preferredModel: comparison[0]?.[0] ?? 'fit_failed',
  };
}
