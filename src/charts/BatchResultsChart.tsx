import ChartFrame from './ChartFrame';
import type { BatchResult } from '../types/model';

interface BatchResultsChartProps {
  result: BatchResult | null;
}

export default function BatchResultsChart({ result }: BatchResultsChartProps) {
  return (
    <ChartFrame
      title="Batch summaries"
      subtitle="Aggregated means, variation, and early-stop behavior across replications."
      svgFilename="batch-summary.svg"
      pngFilename="batch-summary.png"
    >
      <div className="batch-table-wrap">
        <table className="batch-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Replications</th>
              <th>Early-stop rate</th>
              <th>Truncation rate</th>
              <th>Mean degree</th>
              <th>Degree Gini</th>
              <th>Mean edge length</th>
            </tr>
          </thead>
          <tbody>
            {result?.summaries.map((summary) => (
              <tr key={summary.scenarioId}>
                <td>{summary.scenarioLabel}</td>
                <td>{summary.replications}</td>
                <td>{summary.earlyStopRate.toFixed(3)}</td>
                <td>{summary.truncationRate.toFixed(3)}</td>
                <td>{summary.metrics.meanDegree.mean.toFixed(3)}</td>
                <td>{summary.metrics.degreeGini.mean.toFixed(3)}</td>
                <td>{summary.metrics.meanEdgeLength.mean.toFixed(3)}</td>
              </tr>
            )) ?? (
              <tr>
                <td colSpan={7}>Run a batch to populate this table.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ChartFrame>
  );
}
