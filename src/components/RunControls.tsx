import { useSimulationStore } from '../store/useSimulationStore';

export default function RunControls() {
  const simulation = useSimulationStore((state) => state.simulation);
  const resetSimulation = useSimulationStore((state) => state.resetSimulation);
  const step = useSimulationStore((state) => state.step);
  const runOnce = useSimulationStore((state) => state.runOnce);
  const isPlaying = useSimulationStore((state) => state.isPlaying);
  const setPlaying = useSimulationStore((state) => state.setPlaying);
  const saveBaseline = useSimulationStore((state) => state.saveBaseline);
  const saveComparison = useSimulationStore((state) => state.saveComparison);

  return (
    <section className="panel panel--controls">
      <div className="panel__header">
        <h2>Run controls</h2>
        <span className={`status-pill status-pill--${simulation.status}`}>{simulation.status}</span>
      </div>
      <div className="control-row">
        <button type="button" onClick={runOnce}>
          Run once
        </button>
        <button type="button" onClick={step}>
          Step
        </button>
        <button type="button" onClick={() => setPlaying(!isPlaying)}>
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button type="button" onClick={resetSimulation}>
          Reset
        </button>
      </div>
      <div className="control-row">
        <button type="button" onClick={saveBaseline}>
          Save baseline
        </button>
        <button type="button" onClick={saveComparison}>
          Copy scenario
        </button>
      </div>
      <p className="panel__hint">
        Termination: {simulation.terminationReason ?? 'not terminated'} | truncation events: {simulation.truncationEvents}
      </p>
    </section>
  );
}
