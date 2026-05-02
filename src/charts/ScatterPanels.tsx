import * as d3 from 'd3';
import type { NodeRecord } from '../types/model';
import ChartFrame from './ChartFrame';
import { defaultBounds } from './chartUtils';

interface ScatterPanelsProps {
  nodes: NodeRecord[];
}

function panel(
  points: Array<{ x: number; y: number }>,
  title: string,
  xLabel: string,
  yLabel: string,
  color: string,
) {
  const x = d3.scaleLinear().domain([0, Math.max(...points.map((point) => point.x), 1)]).range([0, defaultBounds.innerWidth / 2 - 32]);
  const y = d3.scaleLinear().domain([0, Math.max(...points.map((point) => point.y), 1)]).range([defaultBounds.innerHeight - 24, 0]);

  return (
    <g>
      <text x={(defaultBounds.innerWidth / 2 - 32) / 2} y={-8} textAnchor="middle" fontSize="11" fill="#344054">
        {title}
      </text>
      {points.map((point, index) => (
        <circle key={index} cx={x(point.x)} cy={y(point.y)} r="3" fill={color} opacity="0.75" />
      ))}
      <text x={(defaultBounds.innerWidth / 2 - 32) / 2} y={defaultBounds.innerHeight} textAnchor="middle" fontSize="10" fill="#667085">
        {xLabel}
      </text>
      <text x={-defaultBounds.innerHeight / 2} y={-36} transform="rotate(-90)" textAnchor="middle" fontSize="10" fill="#667085">
        {yLabel}
      </text>
    </g>
  );
}

export default function ScatterPanels({ nodes }: ScatterPanelsProps) {
  const byAge = nodes.map((node) => ({ x: node.birthStep, y: node.degree }));
  const byCapacity = nodes.map((node) => ({ x: node.residualCapacity, y: node.degree }));

  return (
    <ChartFrame
      title="Scatter diagnostics"
      subtitle="Degree-age and degree-capacity relationships for the current run."
      svgFilename="scatter-diagnostics.svg"
      pngFilename="scatter-diagnostics.png"
    >
      <svg viewBox={`0 0 ${defaultBounds.width} ${defaultBounds.height}`} className="chart-svg">
        <g transform={`translate(${defaultBounds.margin.left},${defaultBounds.margin.top + 10})`}>
          <g transform="translate(0,0)">{panel(byAge, 'Degree vs age', 'Birth step', 'Degree', '#0b4f6c')}</g>
          <g transform={`translate(${defaultBounds.innerWidth / 2 + 24},0)`}>
            {panel(byCapacity, 'Degree vs residual capacity', 'Residual capacity', 'Degree', '#2f855a')}
          </g>
        </g>
      </svg>
    </ChartFrame>
  );
}
