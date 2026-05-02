import type { EdgeRecord, MetricBundle, ScenarioDocument, SimulationParams, SimulationState } from '../types/model';

export function scenarioToDocument(name: string, params: SimulationParams): ScenarioDocument {
  return {
    version: 1,
    name,
    params,
  };
}

export function downloadText(filename: string, content: string, mimeType = 'text/plain;charset=utf-8'): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function exportScenario(name: string, params: SimulationParams): void {
  downloadText(`${name}.json`, JSON.stringify(scenarioToDocument(name, params), null, 2), 'application/json');
}

export function nodeCsv(state: SimulationState): string {
  const rows = ['id,x,y,birthStep,degree,capacity,residualCapacity,saturated'];
  state.nodes.forEach((node) => {
    rows.push(
      [
        node.id,
        node.x,
        node.y,
        node.birthStep,
        node.degree,
        node.capacity,
        node.residualCapacity,
        node.saturated,
      ].join(','),
    );
  });
  return rows.join('\n');
}

export function edgeCsv(edges: EdgeRecord[]): string {
  const rows = ['id,source,target,length,birthStep'];
  edges.forEach((edge) => {
    rows.push([edge.id, edge.source, edge.target, edge.length, edge.birthStep].join(','));
  });
  return rows.join('\n');
}

export function metricsJson(metrics: MetricBundle): string {
  return JSON.stringify(metrics, null, 2);
}

export function graphJson(state: SimulationState): string {
  return JSON.stringify(
    {
      params: state.params,
      nodes: state.nodes,
      edges: state.edges,
      status: state.status,
      terminationReason: state.terminationReason,
      truncationEvents: state.truncationEvents,
      totalMissingLinks: state.totalMissingLinks,
    },
    null,
    2,
  );
}

export function graphSvg(state: SimulationState): string {
  const width = 800;
  const height = 800;
  const padding = 40;
  const x = (value: number) => padding + value * (width - padding * 2);
  const y = (value: number) => height - padding - value * (height - padding * 2);

  const lines = state.edges
    .map((edge) => {
      const source = state.nodes.find((node) => node.id === edge.source)!;
      const target = state.nodes.find((node) => node.id === edge.target)!;
      return `<line x1="${x(source.x)}" y1="${y(source.y)}" x2="${x(target.x)}" y2="${y(target.y)}" stroke="#7a8aa1" stroke-width="1.1" />`;
    })
    .join('');

  const circles = state.nodes
    .map((node) => {
      const radius = 3 + Math.sqrt(node.degree);
      return `<circle cx="${x(node.x)}" cy="${y(node.y)}" r="${radius.toFixed(2)}" fill="${node.saturated ? '#b42318' : '#0b4f6c'}" />`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#ffffff" />
  <rect x="${padding}" y="${padding}" width="${width - padding * 2}" height="${height - padding * 2}" fill="none" stroke="#98a2b3" stroke-width="1" />
  ${lines}
  ${circles}
</svg>`;
}

export function exportStateBundle(state: SimulationState, metrics: MetricBundle): void {
  downloadText('nodes.csv', nodeCsv(state), 'text/csv;charset=utf-8');
  downloadText('edges.csv', edgeCsv(state.edges), 'text/csv;charset=utf-8');
  downloadText('metrics.json', metricsJson(metrics), 'application/json');
}

export function svgToPngDataUrl(svgMarkup: string, width = 1200, height = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas 2D context unavailable.'));
        return;
      }
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to rasterize SVG.'));
    };
    img.src = url;
  });
}

export function downloadDataUrl(filename: string, dataUrl: string): void {
  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}

export async function exportSvgAsPng(filename: string, svgMarkup: string, width?: number, height?: number): Promise<void> {
  const dataUrl = await svgToPngDataUrl(svgMarkup, width, height);
  downloadDataUrl(filename, dataUrl);
}
