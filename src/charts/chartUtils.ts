import * as d3 from 'd3';

export interface ChartBounds {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

export const defaultBounds: ChartBounds = {
  width: 760,
  height: 360,
  innerWidth: 760 - 64 - 28,
  innerHeight: 360 - 28 - 46,
  margin: { top: 28, right: 28, bottom: 46, left: 64 },
};

export function axisTicks(scale: d3.AxisScale<d3.AxisDomain>, count = 5): string[] {
  if ('ticks' in scale) {
    return (scale as d3.AxisScale<d3.AxisDomain> & { ticks: (count: number) => Array<d3.AxisDomain> }).ticks(count).map(String);
  }
  return [];
}

export function withMargin(x: number, y: number, margin = defaultBounds.margin): string {
  return `translate(${x + margin.left}, ${y + margin.top})`;
}
