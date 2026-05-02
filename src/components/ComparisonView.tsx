import { computeNetworkMetrics } from '../metrics/networkMetrics';
import { useSimulationStore } from '../store/useSimulationStore';

function MetricDelta({ label, a, b }: { label: string; a: number; b: number }) {
  const delta = b - a;
  return (
    <div className="comparison-card__metric">
      <dt>{label}</dt>
      <dd>
        {b.toFixed(3)} <span className={delta >= 0 ? 'delta delta--up' : 'delta delta--down'}>{delta >= 0 ? '+' : ''}{delta.toFixed(3)}</span>
      </dd>
    </div>
  );
}

export default function ComparisonView() {
  const baseline = useSimulationStore((state) => state.baseline);
  const comparisons = useSimulationStore((state) => state.comparisons);
  const current = useSimulationStore((state) => state.simulation);
  const removeComparison = useSimulationStore((state) => state.removeComparison);

  const baselineMetrics = baseline ? computeNetworkMetrics(baseline.state.nodes, baseline.state.edges, baseline.state.params.degreeThreshold) : null;
  const currentMetrics = computeNetworkMetrics(current.nodes, current.edges, current.params.degreeThreshold);

  return (
    <section className="panel panel--comparison">
      <div className="panel__header">
        <h2>Scenario comparison</h2>
      </div>
      {baselineMetrics ? (
        <article className="comparison-card">
          <h3>Current run vs baseline</h3>
          <dl className="comparison-card__grid">
            <MetricDelta label="Mean degree" a={baselineMetrics.meanDegree} b={currentMetrics.meanDegree} />
            <MetricDelta label="Degree Gini" a={baselineMetrics.degreeGini} b={currentMetrics.degreeGini} />
            <MetricDelta label="Share at capacity" a={baselineMetrics.shareAtCapacity} b={currentMetrics.shareAtCapacity} />
            <MetricDelta label="Mean edge length" a={baselineMetrics.meanEdgeLength} b={currentMetrics.meanEdgeLength} />
            <MetricDelta label="Clustering" a={baselineMetrics.averageClustering} b={currentMetrics.averageClustering} />
          </dl>
        </article>
      ) : (
        <p className="panel__hint">Save a baseline run to unlock one-parameter exploration comparisons.</p>
      )}

      <div className="comparison-grid">
        {comparisons.map((comparison) => {
          const metrics = computeNetworkMetrics(comparison.state.nodes, comparison.state.edges, comparison.state.params.degreeThreshold);
          return (
            <article key={comparison.id} className="comparison-card">
              <div className="panel__header">
                <h3>{comparison.label}</h3>
                <button type="button" onClick={() => removeComparison(comparison.id)}>
                  Remove
                </button>
              </div>
              <dl className="comparison-card__grid">
                <div className="comparison-card__metric">
                  <dt>Nodes</dt>
                  <dd>{metrics.nodeCount}</dd>
                </div>
                <div className="comparison-card__metric">
                  <dt>Edges</dt>
                  <dd>{metrics.edgeCount}</dd>
                </div>
                <div className="comparison-card__metric">
                  <dt>Mean degree</dt>
                  <dd>{metrics.meanDegree.toFixed(3)}</dd>
                </div>
                <div className="comparison-card__metric">
                  <dt>Clustering</dt>
                  <dd>{metrics.averageClustering.toFixed(3)}</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>
    </section>
  );
}
