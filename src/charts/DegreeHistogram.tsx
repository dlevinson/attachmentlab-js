import * as d3 from 'd3';
import type { NodeRecord } from '../types/model';
import ChartFrame from './ChartFrame';
import { defaultBounds } from './chartUtils';

interface DegreeHistogramProps {
  nodes: NodeRecord[];
}

export default function DegreeHistogram({ nodes }: DegreeHistogramProps) {
  const degrees = nodes.map((node) => node.degree);
  const bins = d3
    .bin<number, number>()
    .domain([0, Math.max(...degrees, 1)])
    .thresholds(Math.min(20, Math.max(...degrees, 1) + 1))(degrees);

  const x = d3.scaleLinear().domain([0, Math.max(...degrees, 1)]).range([0, defaultBounds.innerWidth]);
  const y = d3
    .scaleLinear()
    .domain([0, Math.max(...bins.map((bin) => bin.length), 1)])
    .nice()
    .range([defaultBounds.innerHeight, 0]);

  return (
    <ChartFrame
      title="Degree histogram"
      subtitle="Observed degree frequencies in the current run."
      svgFilename="degree-histogram.svg"
      pngFilename="degree-histogram.png"
    >
      <svg viewBox={`0 0 ${defaultBounds.width} ${defaultBounds.height}`} className="chart-svg">
        <g transform={`translate(${defaultBounds.margin.left},${defaultBounds.margin.top})`}>
          {bins.map((bin) => (
            <rect
              key={`${bin.x0}-${bin.x1}`}
              x={x(bin.x0 ?? 0) + 1}
              y={y(bin.length)}
              width={Math.max(x(bin.x1 ?? 0) - x(bin.x0 ?? 0) - 2, 0)}
              height={defaultBounds.innerHeight - y(bin.length)}
              fill="#0b4f6c"
              opacity="0.82"
            />
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const value = y.domain()[1] * ratio;
            return (
              <g key={ratio} transform={`translate(0,${y(value)})`}>
                <line x1={0} x2={defaultBounds.innerWidth} stroke="#eaecf0" />
                <text x={-10} y={4} textAnchor="end" fontSize="10" fill="#667085">
                  {Math.round(value)}
                </text>
              </g>
            );
          })}
          <text x={defaultBounds.innerWidth / 2} y={defaultBounds.innerHeight + 34} textAnchor="middle" fontSize="11" fill="#344054">
            Degree
          </text>
          <text
            x={-defaultBounds.innerHeight / 2}
            y={-46}
            transform="rotate(-90)"
            textAnchor="middle"
            fontSize="11"
            fill="#344054"
          >
            Count
          </text>
        </g>
      </svg>
    </ChartFrame>
  );
}
