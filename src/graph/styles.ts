type CytoscapeStyleRule = {
  selector: string;
  style: Record<string, string | number>;
};

export function cytoscapeStyles(): CytoscapeStyleRule[] {
  return [
    {
      selector: 'node',
      style: {
        'background-color': 'data(color)',
        width: 'data(size)',
        height: 'data(size)',
        label: 'data(probabilityLabel)',
        'font-size': 10,
        color: '#344054',
        'text-background-color': '#ffffff',
        'text-background-opacity': 0.95,
        'text-background-padding': 2,
        'text-border-color': '#d0d5dd',
        'text-border-width': 0.6,
        'text-halign': 'center',
        'text-valign': 'top',
        'border-width': 'data(outlineWidth)',
        'border-color': 'data(outlineColor)',
      },
    },
    {
      selector: 'edge',
      style: {
        width: 1.25,
        'line-color': 'data(color)',
        'curve-style': 'straight',
        opacity: 0.85,
      },
    },
    {
      selector: '.newest-node',
      style: {
        'z-index-compare': 'manual',
        'z-index': 99,
      },
    },
    {
      selector: '.selected-target',
      style: {
        'z-index-compare': 'manual',
        'z-index': 95,
      },
    },
  ];
}
