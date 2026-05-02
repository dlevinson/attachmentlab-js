import { useEffect, useRef } from 'react';
import type { BatchResult } from '../types/model';
import { useSimulationStore } from '../store/useSimulationStore';
import { downloadText } from '../utils/export';
import { loadBatchResults, saveBatchResult } from '../utils/batchPersistence';
import { mergeScenarioParams } from '../utils/import';

function batchResultCsv(result: BatchResult): string {
  const rows = ['scenario,replications,earlyStopRate,truncationRate,meanDegree,degreeGini,meanEdgeLength'];
  result.summaries.forEach((summary) => {
    rows.push(
      [
        summary.scenarioLabel,
        summary.replications,
        summary.earlyStopRate,
        summary.truncationRate,
        summary.metrics.meanDegree.mean,
        summary.metrics.degreeGini.mean,
        summary.metrics.meanEdgeLength.mean,
      ].join(','),
    );
  });
  return rows.join('\n');
}

export default function BatchExperimentPanel() {
  const params = useSimulationStore((state) => state.params);
  const presets = useSimulationStore((state) => state.presets);
  const batch = useSimulationStore((state) => state.batch);
  const setBatchProgress = useSimulationStore((state) => state.setBatchProgress);
  const setBatchResult = useSimulationStore((state) => state.setBatchResult);
  const setSavedBatchResults = useSimulationStore((state) => state.setSavedBatchResults);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    void loadBatchResults().then(setSavedBatchResults).catch(() => undefined);
    return () => {
      workerRef.current?.terminate();
    };
  }, [setSavedBatchResults]);

  const runBatch = () => {
    workerRef.current?.terminate();
    const worker = new Worker(new URL('../workers/batchWorker.ts', import.meta.url), { type: 'module' });
    workerRef.current = worker;
    setBatchProgress(0.01);

    worker.onmessage = async (event: MessageEvent<{ type: 'progress' | 'result'; progress?: number; result?: BatchResult }>) => {
      if (event.data.type === 'progress') {
        setBatchProgress(event.data.progress ?? 0);
        return;
      }

      if (event.data.result) {
        setBatchResult(event.data.result);
        const saved = await saveBatchResult('latest batch', event.data.result);
        const existing = await loadBatchResults();
        setSavedBatchResults([saved, ...existing.filter((entry) => entry.id !== saved.id)]);
      }
      worker.terminate();
    };

    worker.postMessage({
      config: {
        scenarios: presets.slice(0, 4).map((preset) => ({
          id: preset.id,
          label: preset.label,
          params: mergeScenarioParams({ ...params, ...preset.params }),
        })),
        replications: params.replicationCount,
      },
    });
  };

  return (
    <section className="panel panel--batch">
      <div className="panel__header">
        <h2>Batch experiments</h2>
        <button type="button" onClick={runBatch}>
          Run batch
        </button>
      </div>
      <p className="panel__hint">Runs execute in a web worker so the UI remains responsive during replications.</p>
      <div className="progress-bar">
        <div className="progress-bar__fill" style={{ width: `${batch.progress * 100}%` }} />
      </div>
      {batch.result ? (
        <div className="control-row">
          <button
            type="button"
            onClick={() => {
              const result = batch.result;
              if (!result) return;
              downloadText('batch-summary.csv', batchResultCsv(result), 'text/csv;charset=utf-8');
            }}
          >
            Export batch CSV
          </button>
          <button
            type="button"
            onClick={() => {
              const result = batch.result;
              if (!result) return;
              downloadText('batch-summary.json', JSON.stringify(result, null, 2), 'application/json');
            }}
          >
            Export batch JSON
          </button>
        </div>
      ) : null}
      <div className="saved-list">
        <h3>IndexedDB results</h3>
        {batch.saved.map((entry) => (
          <article key={entry.id} className="saved-list__item">
            <strong>{entry.label}</strong>
            <span>{new Date(entry.createdAt).toLocaleString()}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
