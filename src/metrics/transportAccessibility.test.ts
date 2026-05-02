import { describe, expect, test } from 'vitest';
import { computeTransportAccessibility } from './transportAccessibility';

describe('transport accessibility semantics', () => {
  const nodes = [
    { id: 'seed-a', x: 0, y: 0, birthStep: 0, degree: 1, capacity: 4, residualCapacity: 3, saturated: false, weight: 1, typeShare: 0.5 },
    { id: 'seed-b', x: 1, y: 0, birthStep: 0, degree: 2, capacity: 4, residualCapacity: 2, saturated: false, weight: 1, typeShare: 0.5 },
    { id: 'arrival-c', x: 2, y: 0, birthStep: 2, degree: 1, capacity: 4, residualCapacity: 3, saturated: false, weight: 2, typeShare: 0.25 },
  ];

  const edges = [
    { id: 'ab', source: 'seed-a', target: 'seed-b', length: 1, birthStep: 0 },
    { id: 'bc', source: 'seed-b', target: 'arrival-c', length: 1, birthStep: 2 },
  ];

  test('network, seed-only, and opportunity semantics diverge on the same toy graph', () => {
    const network = computeTransportAccessibility(nodes, edges, { radius: 2.5, decay: 1, semantics: 'network' });
    const seed = computeTransportAccessibility(nodes, edges, { radius: 2.5, decay: 1, semantics: 'seed' });
    const opportunity = computeTransportAccessibility(nodes, edges, { radius: 2.5, decay: 1, semantics: 'opportunity' });

    expect(network.meanGravity).toBeGreaterThan(seed.meanGravity);
    expect(opportunity.meanGravity).toBeGreaterThan(seed.meanGravity);
    expect(network.meanGravity).not.toBeCloseTo(opportunity.meanGravity, 8);
    expect(network.meanCumulative).toBeGreaterThan(seed.meanCumulative);
  });
});
