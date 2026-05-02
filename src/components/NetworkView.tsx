import cytoscape from 'cytoscape';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cytoscapeStyles } from '../graph/styles';
import { toCytoscapeElements } from '../graph/cytoscapeAdapter';
import { useSimulationStore } from '../store/useSimulationStore';
import { downloadDataUrl, downloadText, graphSvg } from '../utils/export';

export default function NetworkView() {
  const simulation = useSimulationStore((state) => state.simulation);
  const ui = useSimulationStore((state) => state.ui);
  const metrics = useSimulationStore((state) => state.metrics);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; html: string } | null>(null);

  const elements = useMemo(
    () =>
      toCytoscapeElements(simulation, ui.nodeColorMode, {
        edgeColorByLength: ui.edgeColorByLength,
        highlightNewest: ui.highlightNewest,
        highlightSaturated: ui.highlightSaturated,
        showAttachmentWeights: ui.showAttachmentWeights,
      }),
    [simulation, ui.edgeColorByLength, ui.highlightNewest, ui.highlightSaturated, ui.nodeColorMode, ui.showAttachmentWeights],
  );

  useEffect(() => {
    if (!containerRef.current || cyRef.current) {
      return;
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: cytoscapeStyles(),
      layout: { name: 'preset' },
      minZoom: 0.4,
      maxZoom: 3,
      wheelSensitivity: 0.15,
      userPanningEnabled: true,
    });

    const showNodeTooltip = (event: cytoscape.EventObject) => {
      const node = useSimulationStore.getState().simulation.nodes.find((entry) => entry.id === event.target.id());
      if (!node) {
        return;
      }
      setTooltip({
        x: event.renderedPosition.x + 18,
        y: event.renderedPosition.y + 18,
        html: `
          <strong>${node.id}</strong><br/>
          degree: ${node.degree}<br/>
          capacity: ${node.capacity.toFixed(2)}<br/>
          residual: ${node.residualCapacity.toFixed(2)}<br/>
          position: (${node.x.toFixed(3)}, ${node.y.toFixed(3)})<br/>
          birth step: ${node.birthStep}
        `,
      });
    };

    const showEdgeTooltip = (event: cytoscape.EventObject) => {
      const edge = useSimulationStore.getState().simulation.edges.find((entry) => entry.id === event.target.id());
      if (!edge) {
        return;
      }
      setTooltip({
        x: event.renderedPosition.x + 18,
        y: event.renderedPosition.y + 18,
        html: `
          <strong>${edge.id}</strong><br/>
          endpoints: ${edge.source}, ${edge.target}<br/>
          length: ${edge.length.toFixed(3)}<br/>
          created: ${edge.birthStep}
        `,
      });
    };

    cy.on('mouseover', 'node', showNodeTooltip);
    cy.on('mouseover', 'edge', showEdgeTooltip);
    cy.on('mouseout', () => setTooltip(null));
    cyRef.current = cy;

    return () => {
      cy.destroy();
      cyRef.current = null;
    };
  }, [elements]);

  useEffect(() => {
    if (!cyRef.current) {
      return;
    }
    cyRef.current.json({ elements });
    cyRef.current.layout({ name: 'preset' }).run();
  }, [elements]);

  const exportPng = () => {
    const uri = cyRef.current?.png({ full: true, scale: 2, bg: '#ffffff' });
    if (uri) {
      downloadDataUrl('network.png', uri);
    }
  };

  const exportSvg = () => {
    downloadText('network.svg', graphSvg(simulation), 'image/svg+xml;charset=utf-8');
  };

  return (
    <section className="panel panel--network">
      <div className="panel__header">
        <h2>Network view</h2>
        <div className="control-row control-row--tight">
          <button type="button" onClick={exportPng}>
            Export PNG
          </button>
          <button type="button" onClick={exportSvg}>
            Export SVG
          </button>
        </div>
      </div>
      <div className="network-toolbar">
        <label>
          Node colour
          <select value={ui.nodeColorMode} onChange={(event) => useSimulationStore.getState().setNodeColorMode(event.target.value as typeof ui.nodeColorMode)}>
            <option value="degree">Degree</option>
            <option value="residual_capacity">Residual capacity</option>
            <option value="age">Age</option>
            <option value="component">Component</option>
            <option value="saturated">Saturation</option>
          </select>
        </label>
        <label>
          <input type="checkbox" checked={ui.edgeColorByLength} onChange={(event) => useSimulationStore.getState().setUiFlag('edgeColorByLength', event.target.checked)} />
          edge length colours
        </label>
        <label>
          <input type="checkbox" checked={ui.showBoundary} onChange={(event) => useSimulationStore.getState().setUiFlag('showBoundary', event.target.checked)} />
          unit square boundary
        </label>
        <label>
          <input type="checkbox" checked={ui.highlightSaturated} onChange={(event) => useSimulationStore.getState().setUiFlag('highlightSaturated', event.target.checked)} />
          highlight saturated
        </label>
        <label>
          <input type="checkbox" checked={ui.highlightNewest} onChange={(event) => useSimulationStore.getState().setUiFlag('highlightNewest', event.target.checked)} />
          highlight newest
        </label>
        <label>
          <input type="checkbox" checked={ui.showAttachmentWeights} onChange={(event) => useSimulationStore.getState().setUiFlag('showAttachmentWeights', event.target.checked)} />
          attachment weights
        </label>
      </div>
      <div className="network-stage">
        <div ref={containerRef} className={`network-canvas ${ui.paperMode ? 'network-canvas--paper' : ''}`} />
        {ui.showBoundary ? <div className="network-boundary" /> : null}
        {tooltip ? <div className="network-tooltip" style={{ left: tooltip.x, top: tooltip.y }} dangerouslySetInnerHTML={{ __html: tooltip.html }} /> : null}
      </div>
      <div className="network-footer">
        <span>Node count {metrics.nodeCount}</span>
        <span>Edge count {metrics.edgeCount}</span>
        <span>Crossings {metrics.crossingCount ?? 'NA'}</span>
      </div>
    </section>
  );
}
