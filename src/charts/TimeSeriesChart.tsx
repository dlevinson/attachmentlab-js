import * as d3 from 'd3';
import type { HistorySnapshot } from '../types/model';
import ChartFrame from './ChartFrame';
import { defaultBounds } from './chartUtils';

interface TimeSeriesChartProps {
  history: HistorySnapshot[];
}

const SERIES = [
  { key: 'maxDegree', label: 'Max degree', color: '#0b4f6c' },
  { key: 'shareAtCapacity', label: 'Share saturated', color: '#b42318' },
  { key: 'averageClustering', label: 'Clustering', color: '#2f855a' },
  { key: 'connectedComponents', label: 'Component count', color: '#805ad5' },
  { key: 'totalNetworkLength', label: 'Total length', color: '#c05621' },
] as const;

export default function TimeSeriesChart({ history }: TimeSeriesChartProps) {
  const points = history.map((snapshot) => ({
    step: snapshot.step,
    maxDegree: snapshot.metrics.maxDegree,
    shareAtCapacity: snapshot.metrics.shareAtCapacity,
    averageClustering: snapshot.metrics.averageClustering,
    connectedComponents: snapshot.metrics.connectedComponents,
    totalNetworkLength: snapshot.metrics.totalNetworkLength,
  }));

  const x = d3
    .scaleLinear()
    .domain([0, Math.max(...points.map((point) => point.step), 1)])
    .range([0, defaultBounds.innerWidth]);
  const y = d3
    .scaleLinear()
    .domain([0, Math.max(...SERIES.flatMap((series) => points.map((point) => point[series.key])), 1)])
    .nice()
    .range([defaultBounds.innerHeight, 0]);

  return (
    <ChartFrame
      title="Growth time series"
      subtitle="Trajectory diagnostics recorded across simulation steps."
      svgFilename="growth-time-series.svg"
      pngFilename="growth-time-series.png"
    >
      <svg viewBox={`0 0 ${defaultBounds.width} ${defaultBounds.height}`} className="chart-svg">
        <g transform={`translate(${defaultBounds.margin.left},${defaultBounds.margin.top})`}>
          {SERIES.map((series) => {
            const line = d3
              .line<(typeof points)[number]>()
              .x((point) => x(point.step))
              .y((point) => y(point[series.key]));
            return <path key={series.key} d={line(points) ?? undefined} fill="none" stroke={series.color} strokeWidth="2" />;
          })}
          <g transform={`translate(0,${defaultBounds.innerHeight + 12})`}>
            {SERIES.map((series, index) => (
              <g key={series.key} transform={`translate(${index * 126},0)`}>
                <rect width="10" height="10" fill={series.color} />
                <text x="16" y="10" fontSize="10" fill="#344054">
                  {series.label}
                </text>
              </g>
            ))}
          </g>
        </g>
      </svg>
    </ChartFrame>
  );
}
