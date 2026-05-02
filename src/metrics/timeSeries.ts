import type { HistorySnapshot } from '../types/model';

export interface TimeSeriesPoint {
  step: number;
  value: number | null;
}

export function metricSeries(
  history: HistorySnapshot[],
  key:
    | 'maxDegree'
    | 'shareAtCapacity'
    | 'averageClustering'
    | 'connectedComponents'
    | 'totalNetworkLength',
): TimeSeriesPoint[] {
  return history.map((snapshot) => ({
    step: snapshot.step,
    value: snapshot.metrics[key],
  }));
}
