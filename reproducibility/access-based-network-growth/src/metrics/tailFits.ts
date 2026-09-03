import type { TailFitSummary } from '../types/model';

function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function variance(values: number[]): number {
  const mu = mean(values);
  return values.reduce((sum, value) => sum + (value - mu) ** 2, 0) / values.length;
}

function goldenSectionMinimize(objective: (value: number) => number, lower: number, upper: number): number {
  const ratio = (Math.sqrt(5) - 1) / 2;
  let left = lower;
  let right = upper;
  let x1 = right - ratio * (right - left);
  let x2 = left + ratio * (right - left);
  let f1 = objective(x1);
  let f2 = objective(x2);
  for (let iteration = 0; iteration < 120; iteration += 1) {
    if (f1 < f2) {
      right = x2;
      x2 = x1;
      f2 = f1;
      x1 = right - ratio * (right - left);
      f1 = objective(x1);
    } else {
      left = x1;
      x1 = x2;
      f1 = f2;
      x2 = left + ratio * (right - left);
      f2 = objective(x2);
    }
  }
  return (left + right) / 2;
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
  const logSum = sample.reduce((sum, value) => sum + Math.log(value), 0);
  return goldenSectionMinimize(
    (alpha) => alpha * logSum + sample.length * Math.log(hurwitzZeta(alpha, kMin)),
    1.000001,
    100,
  );
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
  const meanExcess = mean(shifted);
  if (meanExcess < 0) {
    return { lambda: null, aic: null };
  }
  if (meanExcess === 0) {
    return { lambda: Infinity, aic: 2 };
  }
  const continuationProbability = meanExcess / (1 + meanExcess);
  const lambda = -Math.log(continuationProbability);
  const logLik = shifted.reduce(
    (sum, value) => sum + Math.log1p(-continuationProbability) + value * Math.log(continuationProbability),
    0,
  );
  return { lambda, aic: 2 - 2 * logLik };
}

function complementaryErrorFunction(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const x = Math.abs(value);
  const t = 1 / (1 + 0.3275911 * x);
  const polynomial = (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  const erfcPositive = polynomial * Math.exp(-x * x);
  return sign > 0 ? erfcPositive : 2 - erfcPositive;
}

function normalCdf(value: number): number {
  return 0.5 * complementaryErrorFunction(-value / Math.sqrt(2));
}

function normalSurvival(value: number): number {
  return 0.5 * complementaryErrorFunction(value / Math.sqrt(2));
}

function discreteLognormalProbability(value: number, mu: number, sigma: number, kMin: number): number {
  const lower = Math.max(value - 0.5, Number.MIN_VALUE);
  const upper = value + 0.5;
  const lowerZ = (Math.log(lower) - mu) / sigma;
  const upperZ = (Math.log(upper) - mu) / sigma;
  const mass = lowerZ > 0
    ? normalSurvival(lowerZ) - normalSurvival(upperZ)
    : normalCdf(upperZ) - normalCdf(lowerZ);
  const thresholdZ = (Math.log(Math.max(kMin - 0.5, Number.MIN_VALUE)) - mu) / sigma;
  return mass / normalSurvival(thresholdZ);
}

function lognormalFit(sample: number[], kMin: number): { mu: number | null; sigma: number | null; aic: number | null } {
  const positive = sample.filter((value) => value > 0);
  if (positive.length === 0) {
    return { mu: null, sigma: null, aic: null };
  }
  const logs = positive.map((value) => Math.log(value));
  let mu = mean(logs);
  let logSigma = Math.log(Math.max(Math.sqrt(variance(logs)), 0.1));
  let muStep = 1;
  let sigmaStep = 0.5;
  const negativeLogLikelihood = (candidateMu: number, candidateLogSigma: number): number => {
    const sigma = Math.exp(candidateLogSigma);
    const probabilities = positive.map((value) => discreteLognormalProbability(value, candidateMu, sigma, kMin));
    if (probabilities.some((probability) => !Number.isFinite(probability) || probability <= 0)) {
      return Infinity;
    }
    return -probabilities.reduce((sum, probability) => sum + Math.log(probability), 0);
  };
  let best = negativeLogLikelihood(mu, logSigma);
  for (let iteration = 0; iteration < 100; iteration += 1) {
    let improved = false;
    const candidates: Array<[number, number]> = [
      [mu + muStep, logSigma], [mu - muStep, logSigma],
      [mu, logSigma + sigmaStep], [mu, logSigma - sigmaStep],
      [mu + muStep, logSigma + sigmaStep], [mu + muStep, logSigma - sigmaStep],
      [mu - muStep, logSigma + sigmaStep], [mu - muStep, logSigma - sigmaStep],
    ];
    candidates.forEach(([candidateMu, candidateLogSigma]) => {
      const objective = negativeLogLikelihood(candidateMu, candidateLogSigma);
      if (objective < best) {
        mu = candidateMu;
        logSigma = candidateLogSigma;
        best = objective;
        improved = true;
      }
    });
    if (!improved) {
      muStep /= 2;
      sigmaStep /= 2;
      if (muStep < 1e-5 && sigmaStep < 1e-5) {
        break;
      }
    }
  }
  const sigma = Math.exp(logSigma);
  return Number.isFinite(best) ? { mu, sigma, aic: 4 + 2 * best } : { mu: null, sigma: null, aic: null };
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
  const lognormal = lognormalFit(best.tail, best.kMin);
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
