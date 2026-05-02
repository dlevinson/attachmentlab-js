import { computeNetworkMetrics } from '../metrics/networkMetrics';
import { useSimulationStore } from '../store/useSimulationStore';

export default function InsightsPanel() {
  const current = useSimulationStore((state) => state.simulation);
  const baseline = useSimulationStore((state) => state.baseline);
  const metrics = useSimulationStore((state) => state.metrics);

  const insights: string[] = [];

  if (baseline) {
    const baselineMetrics = computeNetworkMetrics(baseline.state.nodes, baseline.state.edges, baseline.state.params.degreeThreshold);
    if (metrics.meanEdgeLength < baselineMetrics.meanEdgeLength - 0.02) {
      insights.push('Higher spatial deterrence shortened average edge length relative to the saved baseline.');
    }
    if (metrics.degreeGini < baselineMetrics.degreeGini - 0.02) {
      insights.push('Finite capacity appears to have truncated the upper degree tail relative to the baseline.');
    }
    if (metrics.averageClustering > baselineMetrics.averageClustering + 0.02) {
      insights.push('The current parameter setting increased clustering relative to the baseline comparison.');
    }
  }

  if (current.params.kappa >= 3 && metrics.cyclomaticNumber > 0) {
    insights.push('Higher kappa is supporting denser local closure and reducing tree-like growth.');
  }
  if (metrics.shareAtCapacity > 0.25) {
    insights.push('A substantial share of nodes is saturated, so capacity constraints are materially shaping attachment opportunities.');
  }
  if (current.status === 'early_stopped') {
    insights.push('Growth terminated early because no feasible nodes remained under the active capacity constraints.');
  }
  if (insights.length === 0) {
    insights.push('This run is close to its current baseline on the tracked summary metrics; try changing one mechanism at a time to surface stronger regime shifts.');
  }

  return (
    <section className="panel panel--insights">
      <div className="panel__header">
        <h2>Insights</h2>
      </div>
      <ul className="insight-list">
        {insights.map((insight) => (
          <li key={insight}>{insight}</li>
        ))}
      </ul>
    </section>
  );
}
