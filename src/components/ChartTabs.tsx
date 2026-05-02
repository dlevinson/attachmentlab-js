import { useSimulationStore } from '../store/useSimulationStore';
import BatchResultsChart from '../charts/BatchResultsChart';
import CCDFChart from '../charts/CCDFChart';
import DegreeHistogram from '../charts/DegreeHistogram';
import EdgeLengthHistogram from '../charts/EdgeLengthHistogram';
import ScatterPanels from '../charts/ScatterPanels';
import TimeSeriesChart from '../charts/TimeSeriesChart';

const TABS = [
  ['degree', 'Degree histogram'],
  ['ccdf', 'Degree CCDF'],
  ['edgeLength', 'Edge lengths'],
  ['timeSeries', 'Time series'],
  ['scatter', 'Scatter'],
  ['batch', 'Batch'],
] as const;

export default function ChartTabs() {
  const simulation = useSimulationStore((state) => state.simulation);
  const tail = useSimulationStore((state) => state.tail);
  const activeChartTab = useSimulationStore((state) => state.ui.activeChartTab);
  const batch = useSimulationStore((state) => state.batch);
  const setUiFlag = useSimulationStore((state) => state.setUiFlag);

  return (
    <section className="panel panel--charts">
      <div className="tab-bar">
        {TABS.map(([key, label]) => (
          <button
            type="button"
            key={key}
            className={activeChartTab === key ? 'tab-bar__tab tab-bar__tab--active' : 'tab-bar__tab'}
            onClick={() => setUiFlag('activeChartTab', key)}
          >
            {label}
          </button>
        ))}
      </div>
      {activeChartTab === 'degree' ? <DegreeHistogram nodes={simulation.nodes} /> : null}
      {activeChartTab === 'ccdf' ? <CCDFChart tail={tail} /> : null}
      {activeChartTab === 'edgeLength' ? <EdgeLengthHistogram edges={simulation.edges} /> : null}
      {activeChartTab === 'timeSeries' ? <TimeSeriesChart history={simulation.history} /> : null}
      {activeChartTab === 'scatter' ? <ScatterPanels nodes={simulation.nodes} /> : null}
      {activeChartTab === 'batch' ? <BatchResultsChart result={batch.result} /> : null}
    </section>
  );
}
