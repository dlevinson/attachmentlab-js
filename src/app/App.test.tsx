import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import App from './App';
import { computeNetworkMetrics } from '../metrics/networkMetrics';
import { fitTailModels } from '../metrics/tailFits';
import { useSimulationStore } from '../store/useSimulationStore';
import { createDefaultParams, initializeSimulation } from '../model/simulator';

vi.mock('../components/NetworkView', () => ({
  default: () => <div data-testid="network-view">network</div>,
}));

describe('app smoke tests', () => {
  beforeEach(() => {
    const params = createDefaultParams();
    const simulation = initializeSimulation(params);
    const metrics = computeNetworkMetrics(simulation.nodes, simulation.edges, simulation.params.degreeThreshold);
    const tail = fitTailModels(simulation.nodes.map((node) => node.degree));
    useSimulationStore.setState({
      params,
      simulation,
      metrics,
      tail,
      baseline: null,
      comparisons: [],
      batch: { isRunning: false, progress: 0, result: null, saved: [] },
      ui: {
        ...useSimulationStore.getState().ui,
        activePrimaryTab: 'simulation',
        activeChartTab: 'degree',
      },
      isPlaying: false,
    });
  });

  test('can run a single simulation and step through growth', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Run once' }));
    expect(screen.getByText(/Termination/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    await user.click(screen.getByRole('button', { name: 'Step' }));
    expect(screen.getByText(/truncation events/i)).toBeInTheDocument();
  });

  test('batch tab and charts render', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Batch' }));
    expect(screen.getByRole('button', { name: 'Run batch' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Degree CCDF' }));
    expect(screen.getByText(/Tail diagnostics/i)).toBeInTheDocument();
  });
});
