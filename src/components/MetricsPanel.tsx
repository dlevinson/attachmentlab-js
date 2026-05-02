import type { MetricBundle } from '../types/model';
import { useSimulationStore } from '../store/useSimulationStore';

const METRIC_ROWS: Array<[label: string, key: keyof MetricBundle]> = [
  ['Nodes', 'nodeCount'],
  ['Edges', 'edgeCount'],
  ['Mean degree', 'meanDegree'],
  ['Max degree', 'maxDegree'],
  ['Degree Gini', 'degreeGini'],
  ['Share at capacity', 'shareAtCapacity'],
  ['Components', 'connectedComponents'],
  ['Largest component share', 'largestComponentShare'],
  ['Average clustering', 'averageClustering'],
  ['Average path length (LCC)', 'averagePathLengthLargestComponent'],
  ['Diameter (LCC)', 'diameterLargestComponent'],
  ['Assortativity', 'degreeAssortativity'],
  ['Mean edge length', 'meanEdgeLength'],
  ['Median edge length', 'medianEdgeLength'],
  ['Total network length', 'totalNetworkLength'],
  ['Leaf share', 'fractionLeaves'],
  ['High-degree share', 'fractionDegreeAboveThreshold'],
  ['Cyclomatic number', 'cyclomaticNumber'],
];

export default function MetricsPanel() {
  const metrics = useSimulationStore((state) => state.metrics);
  const simulation = useSimulationStore((state) => state.simulation);
  const tail = useSimulationStore((state) => state.tail);
  const renderMetricValue = (value: MetricBundle[keyof MetricBundle]) => {
    if (typeof value === 'number') {
      return value.toFixed(3);
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'string') {
      return value;
    }
    return 'NA';
  };

  return (
    <section className="panel panel--metrics">
      <div className="panel__header">
        <h2>Metrics</h2>
      </div>
      <dl className="metrics-grid">
        {METRIC_ROWS.map(([label, key]) => {
          const value = metrics[key];
          return (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{renderMetricValue(value)}</dd>
            </div>
          );
        })}
      </dl>
      <div className="metrics-footer">
        <p>Termination reason: {simulation.terminationReason ?? 'still active'}</p>
        <p>Truncation events: {simulation.truncationEvents}</p>
        <p>Tail model: {tail.preferredModel.replace(/_/g, ' ')}</p>
      </div>
    </section>
  );
}
