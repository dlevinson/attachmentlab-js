// @vitest-environment node
import { describe, expect, test } from 'vitest';
import { getBrowserParityEngine } from '../model/browserParity';
import { fitTailModels } from './tailFits';

describe('degree-tail fits', () => {
  test('integer-degree exponential fits use the geometric likelihood', () => {
    const degrees = [2, 2, 3, 4, 4, 4, 7];
    const meanExcess = degrees.reduce((sum, value) => sum + value - 2, 0) / degrees.length;
    const continuationProbability = meanExcess / (1 + meanExcess);
    const expectedLambda = -Math.log(continuationProbability);

    expect(fitTailModels(degrees, degrees.length).expLambda).toBeCloseTo(expectedLambda, 12);
    const browserFit = getBrowserParityEngine().fitTailModels(degrees, degrees.length) as { expLambda: number };
    expect(browserFit.expLambda).toBeCloseTo(expectedLambda, 12);
  });
});
