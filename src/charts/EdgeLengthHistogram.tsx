import * as d3 from 'd3';
import type { EdgeRecord } from '../types/model';
import ChartFrame from './ChartFrame';
import { defaultBounds } from './chartUtils';

interface EdgeLengthHistogramProps {
  edges: EdgeRecord[];
}

export default function EdgeLengthHistogram({ edges }: EdgeLengthHistogramProps) {
  const lengths = edges.map((edge) => edge.length);
  const bins = d3
    .bin<number, number>()
    .domain([0, Math.max(...lengths, 1)])
    .thresholds(18)(lengths);

  const x = d3.scaleLinear().domain([0, Math.max(...lengths, 1)]).range([0, defaultBounds.innerWidth]);
  const y = d3
    .scaleLinear()
    .domain([0, Math.max(...bins.map((bin) => bin.length), 1)])
    .nice()
    .range([defaultBounds.innerHeight, 0]);

  return (
    <ChartFrame
      title="Edge-length histogram"
      subtitle="Distance distribution under the preserved unit-square geometry."
      svgFilename="edge-length-histogram.svg"
      pngFilename="edge-length-histogram.png"
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
              fill="#2f855a"
              opacity="0.82"
            />
          ))}
          <text x={defaultBounds.innerWidth / 2} y={defaultBounds.innerHeight + 34} textAnchor="middle" fontSize="11" fill="#344054">
            Edge length
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
