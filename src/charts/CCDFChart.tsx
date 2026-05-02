import * as d3 from 'd3';
import type { TailFitSummary } from '../types/model';
import ChartFrame from './ChartFrame';
import { defaultBounds } from './chartUtils';

interface CCDFChartProps {
  tail: TailFitSummary;
}

export default function CCDFChart({ tail }: CCDFChartProps) {
  const support = tail.support.length > 0 ? tail.support : [1];
  const ccdf = tail.ccdf.length > 0 ? tail.ccdf : [1];

  const x = d3.scaleLog().domain([Math.max(1, support[0]), Math.max(...support, 1)]).range([0, defaultBounds.innerWidth]);
  const y = d3.scaleLog().domain([Math.max(1e-3, Math.min(...ccdf)), 1]).range([defaultBounds.innerHeight, 0]);

  const line = d3
    .line<number>()
    .x((_, index) => x(support[index]))
    .y((value) => y(Math.max(value, 1e-3)));

  return (
    <ChartFrame
      title="Degree CCDF"
      subtitle={`Tail diagnostics: preferred model ${tail.preferredModel.replace('_', ' ')}.`}
      svgFilename="degree-ccdf.svg"
      pngFilename="degree-ccdf.png"
    >
      <svg viewBox={`0 0 ${defaultBounds.width} ${defaultBounds.height}`} className="chart-svg">
        <g transform={`translate(${defaultBounds.margin.left},${defaultBounds.margin.top})`}>
          <path d={line(ccdf) ?? undefined} fill="none" stroke="#0b4f6c" strokeWidth="2.2" />
          {support.map((value, index) => (
            <circle key={value} cx={x(value)} cy={y(Math.max(ccdf[index], 1e-3))} r="2.4" fill="#0b4f6c" />
          ))}
        </g>
      </svg>
    </ChartFrame>
  );
}
