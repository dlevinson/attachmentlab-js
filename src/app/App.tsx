import { useEffect } from 'react';
import BatchExperimentPanel from '../components/BatchExperimentPanel';
import ChartTabs from '../components/ChartTabs';
import ComparisonView from '../components/ComparisonView';
import InsightsPanel from '../components/InsightsPanel';
import MetricsPanel from '../components/MetricsPanel';
import NetworkView from '../components/NetworkView';
import ParameterPanel from '../components/ParameterPanel';
import RunControls from '../components/RunControls';
import { useSimulationStore } from '../store/useSimulationStore';
import { exportStateBundle, graphJson, scenarioToDocument } from '../utils/export';
import { parseScenarioDocument } from '../utils/import';

export default function App() {
  const ui = useSimulationStore((state) => state.ui);
  const setUiFlag = useSimulationStore((state) => state.setUiFlag);
  const isPlaying = useSimulationStore((state) => state.isPlaying);
  const step = useSimulationStore((state) => state.step);
  const simulation = useSimulationStore((state) => state.simulation);
  const metrics = useSimulationStore((state) => state.metrics);
  const params = useSimulationStore((state) => state.params);
  const importScenario = useSimulationStore((state) => state.importScenario);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    if (simulation.status === 'done' || simulation.status === 'early_stopped') {
      useSimulationStore.getState().setPlaying(false);
      return;
    }
    const timeout = window.setTimeout(() => step(), params.animationSpeedMs);
    return () => window.clearTimeout(timeout);
  }, [isPlaying, params.animationSpeedMs, simulation.status, step]);

  useEffect(() => {
    if (!window.location.hash.startsWith('#scenario=')) {
      return;
    }
    try {
      const encoded = window.location.hash.slice('#scenario='.length);
      const bytes = Uint8Array.from(window.atob(encoded), (char) => char.charCodeAt(0));
      const json = new TextDecoder().decode(bytes);
      importScenario(parseScenarioDocument(json).params);
    } catch {
      // Ignore malformed hashes and fall back to the current store state.
    }
  }, [importScenario]);

  useEffect(() => {
    const json = JSON.stringify(scenarioToDocument('shared-scenario', params));
    const bytes = new TextEncoder().encode(json);
    const encoded = window.btoa(String.fromCharCode(...bytes));
    window.history.replaceState({}, '', `#scenario=${encoded}`);
  }, [params]);

  const copyGraphJson = async () => {
    if (!navigator.clipboard) {
      return;
    }
    await navigator.clipboard.writeText(graphJson(simulation));
  };

  return (
    <main className={ui.paperMode ? 'app-shell app-shell--paper' : 'app-shell'}>
      <header className="app-header">
        <div>
          <h1>General Attachment Lab</h1>
          <p>Interactive simulation and visualisation for generalized preferential attachment with capacity, cost, and connectivity.</p>
        </div>
        <div className="control-row">
          <button type="button" onClick={() => setUiFlag('paperMode', !ui.paperMode)}>
            {ui.paperMode ? 'Exit paper mode' : 'Paper mode'}
          </button>
          <button type="button" onClick={() => exportStateBundle(simulation, metrics)}>
            Export data bundle
          </button>
          <button type="button" onClick={() => void copyGraphJson()}>
            Copy graph JSON
          </button>
        </div>
      </header>

      <nav className="primary-tabs">
        {[
          ['simulation', 'Simulation'],
          ['comparison', 'Comparison'],
          ['batch', 'Batch'],
          ['paper', 'Paper mode'],
        ].map(([key, label]) => (
          <button
            type="button"
            key={key}
            className={ui.activePrimaryTab === key ? 'primary-tabs__tab primary-tabs__tab--active' : 'primary-tabs__tab'}
            onClick={() => setUiFlag('activePrimaryTab', key as typeof ui.activePrimaryTab)}
          >
            {label}
          </button>
        ))}
      </nav>

      <section className="app-grid">
        <ParameterPanel />
        <div className="workspace">
          <RunControls />
          {(ui.activePrimaryTab === 'simulation' || ui.activePrimaryTab === 'paper') && <NetworkView />}
          {ui.activePrimaryTab === 'comparison' && <ComparisonView />}
          {ui.activePrimaryTab === 'batch' && <BatchExperimentPanel />}
          {ui.activePrimaryTab === 'paper' ? (
            <section className="panel panel--paper">
              <div className="panel__header">
                <h2>Figure caption draft</h2>
              </div>
              <textarea
                className="paper-caption"
                value={ui.figureCaptionDraft}
                onChange={(event) => setUiFlag('figureCaptionDraft', event.target.value)}
                placeholder="Draft a paper-style caption for the current figure bundle."
              />
            </section>
          ) : null}
          <ChartTabs />
        </div>
        <div className="right-rail">
          <MetricsPanel />
          <InsightsPanel />
        </div>
      </section>
    </main>
  );
}
