// Standalone browser UI source. Built into web/main.js.

const d3 = window.d3;
const cytoscape = window.cytoscape;

  const COMPONENT_COLORS = ['#0b4f6c', '#c05621', '#2f855a', '#805ad5', '#d69e2e', '#e53e3e'];
  const state = {
    params: createDefaultParams(),
    simulation: null,
    metrics: null,
    tail: null,
    transportAccessibility: null,
    candidateAccessibility: null,
    potentialAccessibility: null,
    ui: {
      activePrimaryTab: 'simulation',
      activeChartTab: 'degree',
      nodeColorMode: 'degree',
      edgeColorByLength: false,
      showBoundary: true,
      showLatticeOverlay: true,
      showCoordinates: false,
      showScaleBar: true,
      highlightSaturated: true,
      highlightNewest: true,
      showAttachmentWeights: false,
      paperMode: false,
      arrivalNotationExpanded: false,
      connectivityNotationExpanded: false,
      figureCaptionDraft: '',
      selectedPresetId: '',
      sidebarSections: {
        simulationScope: true,
        networkInitialization: true,
        arrivalModel: true,
        connectivityModel: true,
        batchNotes: false,
      },
      collapsedPanels: {
        sidebar: false,
        runControls: true,
        mainPanel: false,
        chartPanel: false,
        metricsPanel: false,
        insightsPanel: false,
        accessibilityPanel: false,
      },
    },
    baseline: null,
    comparisons: [],
    batch: { progress: 0, running: false, result: null, saved: [] },
    playTimer: null,
    runTimer: null,
    cy: null,
  };

  const app = document.getElementById('app');
  app.innerHTML = `
    <main id="app-shell" class="app-shell">
      <header class="app-header card">
        <div>
          <h1>General Attachment Lab</h1>
          <p>Browser-deliverable research tool for generalized preferential attachment with true-coordinate Cytoscape rendering and D3 charts.</p>
        </div>
        <div class="control-row">
          <button id="toggle-paper">Paper mode</button>
          <button id="export-bundle">Export data bundle</button>
          <button id="copy-graph-json">Copy graph JSON</button>
        </div>
      </header>
      <nav id="primary-tabs" class="primary-tabs"></nav>
      <section class="layout">
        <aside id="sidebar" class="card panel"></aside>
        <div class="center-column">
          <section id="main-panel" class="card panel"></section>
          <section id="run-controls" class="card panel"></section>
          <section id="chart-panel" class="card panel"></section>
        </div>
        <div class="right-column">
          <section id="metrics-panel" class="card panel"></section>
          <section id="insights-panel" class="card panel"></section>
          <section id="accessibility-panel" class="card panel"></section>
        </div>
      </section>
      <div id="accessibility-live" class="sr-only" aria-live="polite" aria-atomic="true"></div>
    </main>
  `;

  const refs = {
    shell: document.getElementById('app-shell'),
    primaryTabs: document.getElementById('primary-tabs'),
    sidebar: document.getElementById('sidebar'),
    runControls: document.getElementById('run-controls'),
    mainPanel: document.getElementById('main-panel'),
    chartPanel: document.getElementById('chart-panel'),
    metricsPanel: document.getElementById('metrics-panel'),
    insightsPanel: document.getElementById('insights-panel'),
    accessibilityPanel: document.getElementById('accessibility-panel'),
    accessibilityLive: document.getElementById('accessibility-live'),
  };

  function initializeAppState() {
    const hash = window.location.hash.startsWith('#scenario=') ? window.location.hash.slice('#scenario='.length) : null;
    if (hash) {
      try {
        const json = new TextDecoder().decode(Uint8Array.from(window.atob(hash), (char) => char.charCodeAt(0)));
        state.params = sanitizeParams(mergeScenarioParams(parseScenarioDocument(json).params));
      } catch {
        state.params = createDefaultParams();
      }
    }
    state.ui.selectedPresetId = detectMatchingPresetId(state.params);
    resetSimulation();
    state.batch.saved = readStoredBatchResults();
  }

  function detectMatchingPresetId(params) {
    const preset = scenarioPresets.find((entry) =>
      Object.entries(entry.params).every(([key, value]) => JSON.stringify(params[key]) === JSON.stringify(value)),
    );
    return preset ? preset.id : '';
  }

  function setHashFromParams() {
    const bytes = new TextEncoder().encode(JSON.stringify(scenarioDocument(state.params)));
    const encoded = window.btoa(String.fromCharCode(...bytes));
    window.history.replaceState({}, '', `#scenario=${encoded}`);
  }

  function resetSimulation() {
    state.simulation = initializeSimulation(state.params);
    state.metrics = computeNetworkMetricsWithContext(
      state.simulation.nodes,
      state.simulation.edges,
      state.params.degreeThreshold,
      state.simulation.latticeMetadata,
      state.simulation.splitEvents,
      {
        crossingCandidatesEncountered: state.simulation.crossingCandidatesEncountered ?? 0,
        crossingCandidatesAdmitted: state.simulation.crossingCandidatesAdmitted ?? 0,
      },
    );
    state.tail = fitTailModels(state.simulation.nodes.map((node) => node.degree));
    state.transportAccessibility = computeTransportAccessibility(state.simulation.nodes, state.simulation.edges, state.params);
    applyAccessibilityToNodes(state.simulation.nodes, state.transportAccessibility);
    state.candidateAccessibility = computeCandidateSiteAccessibility(state.simulation, state.params);
    state.potentialAccessibility = computePotentialSiteAccessibility(state.simulation, state.params);
    stopPlaying();
    stopRunning();
  }

  function refreshDerived() {
    state.metrics = computeNetworkMetricsWithContext(
      state.simulation.nodes,
      state.simulation.edges,
      state.params.degreeThreshold,
      state.simulation.latticeMetadata,
      state.simulation.splitEvents,
      {
        crossingCandidatesEncountered: state.simulation.crossingCandidatesEncountered ?? 0,
        crossingCandidatesAdmitted: state.simulation.crossingCandidatesAdmitted ?? 0,
      },
    );
    state.tail = fitTailModels(state.simulation.nodes.map((node) => node.degree));
    state.transportAccessibility = computeTransportAccessibility(state.simulation.nodes, state.simulation.edges, state.params);
    applyAccessibilityToNodes(state.simulation.nodes, state.transportAccessibility);
    state.candidateAccessibility = computeCandidateSiteAccessibility(state.simulation, state.params);
    state.potentialAccessibility = computePotentialSiteAccessibility(state.simulation, state.params);
    render();
  }

  function stopPlaying() {
    if (state.playTimer) {
      window.clearTimeout(state.playTimer);
      state.playTimer = null;
    }
  }

  function stopRunning() {
    if (state.runTimer) {
      window.clearTimeout(state.runTimer);
      state.runTimer = null;
    }
  }

  function playTick() {
    if (state.simulation.status === 'done' || state.simulation.status === 'early_stopped') {
      stopPlaying();
      renderRunControls();
      return;
    }
    state.simulation = stepSimulation(state.simulation);
    refreshDerived();
    state.playTimer = window.setTimeout(playTick, state.params.animationSpeedMs);
  }

  function startPlaying() {
    stopRunning();
    stopPlaying();
    state.playTimer = window.setTimeout(playTick, state.params.animationSpeedMs);
  }

  function runOnceTick() {
    const chunkSize = state.params.finalNodeCount > 1000 ? 8 : 20;
    let steps = 0;
    while (steps < chunkSize && state.simulation.status !== 'done' && state.simulation.status !== 'early_stopped') {
      state.simulation = stepSimulation(state.simulation);
      steps += 1;
    }

    if (state.simulation.status !== 'done' && state.simulation.status !== 'early_stopped') {
      state.simulation.status = 'running';
      renderRunControls();
      state.runTimer = window.setTimeout(runOnceTick, 0);
      return;
    }

    stopRunning();
    refreshDerived();
  }

  function startRunOnce() {
    stopPlaying();
    stopRunning();
    state.simulation.status = 'running';
    renderRunControls();
    state.runTimer = window.setTimeout(runOnceTick, 0);
  }

  function setParam(key, value) {
    if (key === 'capacityParams') {
      state.params.capacityParams = value;
    } else {
      state.params[key] = value;
    }
    state.params = sanitizeParams(state.params);
    state.ui.selectedPresetId = '';
    setHashFromParams();
    resetSimulation();
    render();
  }

  function applyPreset(presetId) {
    const preset = scenarioPresets.find((entry) => entry.id === presetId);
    if (!preset) {
      return;
    }
    state.params = sanitizeParams(mergeScenarioParams(preset.params));
    state.ui.selectedPresetId = presetId;
    setHashFromParams();
    resetSimulation();
    render();
  }

  function saveBaseline() {
    state.baseline = { label: 'Baseline', state: clone(state.simulation) };
    render();
  }

  function saveComparison() {
    state.comparisons.push({ id: `comparison-${Date.now()}`, label: `Scenario ${state.comparisons.length + 1}`, state: clone(state.simulation) });
    render();
  }

  function removeComparison(id) {
    state.comparisons = state.comparisons.filter((entry) => entry.id !== id);
    render();
  }

  function exportText(filename, content, mimeType = 'text/plain;charset=utf-8') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function exportCurrentBundle() {
    exportText('nodes.csv', csvFromNodes(state.simulation.nodes), 'text/csv;charset=utf-8');
    exportText('edges.csv', csvFromEdges(state.simulation.edges), 'text/csv;charset=utf-8');
    exportText('gmns_node.csv', gmnsNodeCsv(state.simulation), 'text/csv;charset=utf-8');
    exportText('gmns_link.csv', gmnsLinkCsv(state.simulation), 'text/csv;charset=utf-8');
    if (state.transportAccessibility?.available) {
      const rows = ['id,cumulative_access,gravity_access'];
      state.simulation.nodes.forEach((node) => {
        rows.push([node.id, state.transportAccessibility.cumulativeById[node.id] ?? 0, state.transportAccessibility.gravityById[node.id] ?? 0].join(','));
      });
      exportText('transport-accessibility.csv', rows.join('\n'), 'text/csv;charset=utf-8');
    }
    if (state.candidateAccessibility?.available) {
      const rows = ['lattice_u,lattice_v,x,y,attachable_neighbor_count,provisional_targets,realizable_now,candidate_cumulative_access,candidate_gravity_access'];
      state.candidateAccessibility.rows.forEach((row) => {
        rows.push([
          row.u, row.v, row.x.toFixed(6), row.y.toFixed(6), row.attachableNeighborCount, `"${row.provisionalTargetIds.join('|')}"`,
          row.realizableNow ? 1 : 0,
          row.realizableNow ? row.cumulative.toFixed(6) : '',
          row.realizableNow ? row.gravity.toFixed(6) : '',
        ].join(','));
      });
      exportText('candidate-site-accessibility.csv', rows.join('\n'), 'text/csv;charset=utf-8');
    }
    if (state.potentialAccessibility?.available) {
      const rows = ['lattice_u,lattice_v,x,y,is_current_candidate,attachable_neighbor_count,provisional_targets,realizable_now,potential_cumulative_access,potential_gravity_access'];
      state.potentialAccessibility.rows.forEach((row) => {
        rows.push([
          row.u, row.v, row.x.toFixed(6), row.y.toFixed(6), row.isCurrentCandidate ? 1 : 0, row.attachableNeighborCount, `"${row.provisionalTargetIds.join('|')}"`,
          row.realizableNow ? 1 : 0,
          row.realizableNow ? row.cumulative.toFixed(6) : '',
          row.realizableNow ? row.gravity.toFixed(6) : '',
        ].join(','));
      });
      exportText('potential-site-accessibility.csv', rows.join('\n'), 'text/csv;charset=utf-8');
    }
    exportText('metrics.json', JSON.stringify(state.metrics, null, 2), 'application/json');
  }

  async function exportSvgAsPng(filename, svgMarkup, width = 1200, height = 700) {
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    const anchor = document.createElement('a');
    anchor.href = canvas.toDataURL('image/png');
    anchor.download = filename;
    anchor.click();
  }

  async function copyGraphJson() {
    if (!navigator.clipboard) {
      return;
    }
    await navigator.clipboard.writeText(JSON.stringify({
      params: state.params,
      nodes: state.simulation.nodes,
      edges: state.simulation.edges,
      status: state.simulation.status,
      terminationReason: state.simulation.terminationReason,
      truncationEvents: state.simulation.truncationEvents,
      totalMissingLinks: state.simulation.totalMissingLinks,
    }, null, 2));
  }

  function readStoredBatchResults() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.batchResults) || '[]');
    } catch {
      return [];
    }
  }

  function storeBatchResults() {
    localStorage.setItem(STORAGE_KEYS.batchResults, JSON.stringify(state.batch.saved));
  }

  function panelHeader(title, panelKey, extra = '') {
    const collapsed = state.ui.collapsedPanels[panelKey];
    return `
      <div class="panel__header">
        <h2>${escapeHtml(title)}</h2>
        <div class="panel__header-actions">
          ${extra}
          <button class="panel-toggle" type="button" data-panel-toggle="${panelKey}" aria-expanded="${collapsed ? 'false' : 'true'}" title="${collapsed ? 'Expand panel' : 'Collapse panel'}">${collapsed ? '&#9656;' : '&#9662;'}</button>
        </div>
      </div>
    `;
  }

  function panelBody(panelKey, body) {
    return state.ui.collapsedPanels[panelKey] ? '' : body;
  }

  function wirePanelToggle(container) {
    const button = container.querySelector('[data-panel-toggle]');
    if (!button) {
      return;
    }
    button.addEventListener('click', () => {
      const key = button.dataset.panelToggle;
      state.ui.collapsedPanels[key] = !state.ui.collapsedPanels[key];
      render();
    });
  }

  function sidebarSubpanel(title, hint, body) {
    return `
      <section class="sidebar-subpanel">
        <h4 class="sidebar-subpanel__title">${escapeHtml(title)}</h4>
        ${hint ? `<p class="sidebar-subpanel__hint">${escapeHtml(hint)}</p>` : ''}
        ${body}
      </section>
    `;
  }

  function renderPrimaryTabs() {
    const tabs = [
      ['simulation', 'Simulation'],
      ['comparison', 'Comparison'],
      ['batch', 'Batch'],
      ['paper', 'Paper mode'],
    ];
    refs.primaryTabs.innerHTML = tabs.map(([id, label]) => `<button data-tab="${id}" class="${state.ui.activePrimaryTab === id ? 'active' : ''}">${label}</button>`).join('');
    refs.primaryTabs.querySelectorAll('button').forEach((button) => {
      button.addEventListener('click', () => {
        state.ui.activePrimaryTab = button.dataset.tab;
        render();
      });
    });
  }

function arrivalNotationMarkup() {
    const arrivalRule = state.params.arrivalMode === 'uniform'
      ? '(x_n, y_n) ~ Uniform([0,1]^2)'
      : state.params.arrivalMode === 'uniform_lattice'
        ? '(u_n, v_n) chosen from lattice sites in the unit square, then mapped to (x_n, y_n)'
        : state.params.arrivalMode === 'network'
          ? '(u_n, v_n) chosen from admissible sites near the existing network frontier'
          : '(u_n, v_n) chosen from admissible projected outward-shell sites';
    return `
      <details class="equation-card" id="arrival-notation-card" ${state.ui.arrivalNotationExpanded ? 'open' : ''}>
        <summary>
          <div>
            <h3>Arrival Model notation</h3>
            <p class="equation-subtitle">How new nodes are placed before any links are chosen.</p>
          </div>
        </summary>
        <div class="equation-body">
          <div class="equation-code">${escapeHtml(arrivalRule)}</div>
          <ul class="equation-list">
            <li><strong>n</strong>: arriving node at the current step.</li>
            <li><strong>(x_n, y_n)</strong>: realized spatial coordinates of the arriving node in the unit square.</li>
            <li><strong>(u_n, v_n)</strong>: projected lattice coordinates used only in lattice-biased exploratory arrival modes.</li>
            <li><strong>Seed graph</strong> widget: chooses the initial node set and initial connectivity before growth begins.</li>
            <li><strong>Arrival mode</strong> widget: chooses whether arrivals are square-uniform, lattice-uniform, near the existing network, or on the outward shell.</li>
            <li><strong>mesh mode</strong>: optional exploratory lattice regularization layered on top of the baseline arrival process.</li>
            <li><strong>mesh angle set</strong>: allowed lattice-angle family for projected sites, such as 30, 45, 60, or 90 degrees.</li>
            <li><strong>arrival distance</strong> widget: mean outward step length used by the frontier heuristics.</li>
            <li><strong>arrival distance sd</strong> widget: spread of those outward step lengths.</li>
            <li><strong>mesh spacing</strong> widget: minimum separation factor used to keep arrivals from landing too close to occupied sites.</li>
            <li><strong>Arrival preference</strong> widget: baseline structural ranking of candidate sites or accessibility-weighted site ranking.</li>
            <li><strong>Access semantics</strong> widget: chooses whether accessibility is measured to all realized nodes, seed nodes only, or weighted opportunity mass.</li>
            <li><strong>Arrival access metric</strong> widget: cumulative or gravity accessibility used for accessibility-weighted site ranking.</li>
            <li><strong>arrival access strength</strong> widget: strength of the accessibility term in site ranking.</li>
          </ul>
        </div>
      </details>
    `;
}

function connectivityNotationMarkup() {
    const powerKernel = 'w_ni = (k_i + eps)^alpha * max(K_i - k_i, 0)^beta * (c_ni + eps)^(-phi)';
    const expKernel = 'w_ni = (k_i + eps)^alpha * max(K_i - k_i, 0)^beta * exp(-lambda * c_ni)';
    const probabilityRule = 'P_ni = w_ni / sum_j w_nj, over feasible existing candidates j';
    return `
      <details class="equation-card" id="connectivity-notation-card" ${state.ui.connectivityNotationExpanded ? 'open' : ''}>
        <summary>
          <div>
            <h3>Connectivity Model notation</h3>
            <p class="equation-subtitle">How an arrival chooses existing nodes to connect to.</p>
          </div>
        </summary>
        <div class="equation-body">
          <p class="note">Sequential without-replacement target selection over the current feasible existing nodes.</p>
          <div class="equation-code">${escapeHtml(state.params.impedanceMode === 'exponential' ? expKernel : powerKernel)}</div>
          <div class="equation-code">${escapeHtml(probabilityRule)}</div>
          <ul class="equation-list">
            <li><strong>w_ni</strong>: attachment weight from arriving node <em>n</em> to candidate <em>i</em>.</li>
            <li><strong>P_ni</strong>: normalized attachment probability over the feasible candidate set.</li>
            <li><strong>alpha</strong>: preferential-attachment strength on current degree.</li>
            <li><strong>beta</strong>: capacity-saturation strength on remaining capacity.</li>
            <li><strong>phi</strong>: cost-deterrence exponent in the power-cost form.</li>
            <li><strong>lambda</strong>: distance-decay rate in the exponential-cost form.</li>
            <li><strong>k_i</strong>: current degree of candidate node <em>i</em>.</li>
            <li><strong>K_i</strong>: capacity of candidate node <em>i</em>.</li>
            <li><strong>c_ni</strong>: Euclidean distance from arriving node <em>n</em> to candidate node <em>i</em>.</li>
            <li><strong>eps</strong>: small positive regularization constant.</li>
            <li><strong>N</strong> widget: target number of arrival steps to realize.</li>
            <li><strong>kappa</strong> widget: number of links each new node attempts to form.</li>
            <li><strong>m0</strong> widget: seed-graph size.</li>
            <li><strong>K</strong> widget: homogeneous node capacity when capacity mode is constant.</li>
            <li><strong>Capacity mode</strong> widget: homogeneous, uniform, or lognormal capacity at birth.</li>
            <li><strong>Impedance type</strong> widget: power-cost or exponential-distance kernel.</li>
            <li><strong>Planarity mode</strong> widget: none, reject crossings, or split crossings.</li>
            <li><strong>Mesh adjacency</strong> widget: restricts feasible targets to local lattice neighbors in lattice-biased runs.</li>
            <li><strong>mesh nearest q</strong> widget: keeps only the nearest <em>q</em> admissible targets before probability normalization.</li>
            <li><strong>mesh angle bias</strong> widget: penalizes target links that deviate from the allowed lattice-angle family.</li>
            <li><strong>Selection rule</strong> widget: baseline kernel or access-weighted kernel.</li>
            <li><strong>Access semantics</strong> widget: network access, seed-only access, or weighted opportunity access used by the accessibility layer and access-weighted extensions.</li>
            <li><strong>Access metric</strong> widget: cumulative or gravity accessibility used in access-weighted target choice.</li>
            <li><strong>access strength</strong> widget: strength of the accessibility term in target choice.</li>
          </ul>
        </div>
      </details>
    `;
}

  function renderSidebar() {
    const warnings = validateSimulationParams(state.params).filter((entry) => entry.level === 'warning').map((entry) => entry.message);
    const triangularFamily = latticeBasisStepDegrees(state.params) === 60;
    const batchOnlyDisabled = state.ui.activePrimaryTab !== 'batch';
    const meshDisabled = state.params.meshMode !== 'grid_bias';
    const powerImpedanceDisabled = state.params.impedanceMode !== 'power';
    const exponentialImpedanceDisabled = state.params.impedanceMode !== 'exponential';
    const arrivalAccessDisabled = state.params.arrivalPreferenceMode !== 'access';
    const selectionAccessDisabled = state.params.selectionKernelMode !== 'access';
    const adjacencyOptions = triangularFamily
      ? [
        { value: 'none', label: 'None' },
        { value: 'rook', label: 'Nearest edge-neighbor (6)' },
        { value: 'queen', label: 'Expanded local ring (12)' },
      ]
      : [
        { value: 'none', label: 'None' },
        { value: 'rook', label: 'Nearest edge-neighbor (4)' },
        { value: 'queen', label: 'Edge-plus-corner (8)' },
      ];
    refs.sidebar.innerHTML = `
      ${panelHeader('Parameters', 'sidebar')}
      ${panelBody('sidebar', `
        <div class="sidebar-actions">
          <button id="run-once">Run once</button>
          <button id="step-once">Step arrival</button>
          <button id="play-toggle">${state.playTimer ? 'Pause' : 'Play'}</button>
          <button id="reset-run">Reset</button>
        </div>
        <label class="field field--compact">
          <span>Preset</span>
          <select id="preset-select">
            <option value="" ${state.ui.selectedPresetId === '' ? 'selected' : ''}>Choose preset</option>
            ${scenarioPresets.map((preset) => `<option value="${preset.id}" ${state.ui.selectedPresetId === preset.id ? 'selected' : ''}>${preset.label}</option>`).join('')}
          </select>
        </label>
        ${sidebarSection('simulationScope', 'Simulation Scope', true, `
          ${sidebarSubpanel('Run size', 'Controls that define the scale and execution settings for the simulation.', `
            <div class="field-grid field-grid--tight">
              ${numberField('finalNodeCount', 'N', state.params.finalNodeCount, 1, state.params.m0, PARAM_LIMITS.finalNodeCount.max, true)}
              ${numberField('kappa', 'kappa', state.params.kappa, 1, 1, Math.min(PARAM_LIMITS.kappa.max, Math.max(state.params.finalNodeCount - 1, 1)), true)}
              ${numberField('rngSeed', 'RNG seed', state.params.rngSeed, 1, PARAM_LIMITS.rngSeed.min, PARAM_LIMITS.rngSeed.max, true)}
              ${numberField('animationSpeedMs', 'Animation ms', state.params.animationSpeedMs, 10, PARAM_LIMITS.animationSpeedMs.min, PARAM_LIMITS.animationSpeedMs.max, true)}
              ${numberField('replicationCount', 'Replications', state.params.replicationCount, 1, PARAM_LIMITS.replicationCount.min, PARAM_LIMITS.replicationCount.max, true, batchOnlyDisabled)}
            </div>
          `)}
        `)}
        ${sidebarSection('networkInitialization', 'Network Initialization', true, `
          ${sidebarSubpanel('Lattice framing', 'Optional geometric frame inherited by later exploratory arrival rules.', `
            <div class="field-grid field-grid--tight">
              <label class="field field--compact">
                <span>Mesh mode</span>
                <select id="meshMode">
                  <option value="off" ${state.params.meshMode === 'off' ? 'selected' : ''}>Off</option>
                  <option value="grid_bias" ${state.params.meshMode === 'grid_bias' ? 'selected' : ''}>Grid bias</option>
                </select>
              </label>
              <label class="field field--compact ${meshDisabled ? 'field--disabled' : ''}">
                <span>Mesh angle set</span>
                <select id="meshAngleSet" ${meshDisabled ? 'disabled' : ''}>
                  <option value="30" ${state.params.meshAngleSet === '30' ? 'selected' : ''}>30°</option>
                  <option value="45" ${state.params.meshAngleSet === '45' ? 'selected' : ''}>45°</option>
                  <option value="60" ${state.params.meshAngleSet === '60' ? 'selected' : ''}>60°</option>
                  <option value="90" ${state.params.meshAngleSet === '90' ? 'selected' : ''}>90°</option>
                </select>
              </label>
            </div>
          `)}
          ${sidebarSubpanel('Seed and capacity at birth', 'Controls for the initial network and node capacities before the growth loop begins.', `
            <div class="field-grid field-grid--tight">
              ${numberField('m0', 'm0', state.params.m0, 1, Math.max(2, state.params.kappa + 1), Math.min(PARAM_LIMITS.m0.max, state.params.finalNodeCount), true)}
              ${numberField('capacityValue', 'K', typeof state.params.capacityValue === 'number' ? state.params.capacityValue : 1000, 1, Math.max(1, state.params.kappa, state.params.m0 - 1), PARAM_LIMITS.capacityValue.max, true)}
              <label class="field field--compact">
                <span>Seed graph</span>
                <select id="seedGraphType">
                  <option value="complete" ${state.params.seedGraphType === 'complete' ? 'selected' : ''}>Complete</option>
                  <option value="ring" ${state.params.seedGraphType === 'ring' ? 'selected' : ''}>Ring</option>
                  <option value="grid" ${state.params.seedGraphType === 'grid' ? 'selected' : ''}>Small grid</option>
                  <option value="cross" ${state.params.seedGraphType === 'cross' ? 'selected' : ''}>Point lattice</option>
                </select>
              </label>
              <label class="field field--compact">
                <span>Capacity mode</span>
                <select id="capacityMode">
                  <option value="homogeneous" ${state.params.capacityMode === 'homogeneous' ? 'selected' : ''}>Constant</option>
                  <option value="uniform" ${state.params.capacityMode === 'uniform' ? 'selected' : ''}>Uniform</option>
                  <option value="lognormal" ${state.params.capacityMode === 'lognormal' ? 'selected' : ''}>Lognormal</option>
                </select>
              </label>
            </div>
            ${state.params.capacityMode === 'uniform' ? `
              <div class="field-grid field-grid--tight">
                ${numberField('capacityLow', 'K low', state.params.capacityParams.low ?? 4, 1, PARAM_LIMITS.capacityLow.min, PARAM_LIMITS.capacityLow.max, true)}
                ${numberField('capacityHigh', 'K high', state.params.capacityParams.high ?? 12, 1, Math.max(PARAM_LIMITS.capacityHigh.min, state.params.capacityParams.low ?? 4), PARAM_LIMITS.capacityHigh.max, true)}
              </div>
            ` : ''}
            ${state.params.capacityMode === 'lognormal' ? `
              <div class="field-grid field-grid--tight">
                ${numberField('capacityMean', 'K log-mean', state.params.capacityParams.mean ?? 1.5, 0.1, PARAM_LIMITS.capacityMean.min, PARAM_LIMITS.capacityMean.max, true)}
                ${numberField('capacitySigma', 'K log-sigma', state.params.capacityParams.sigma ?? 0.35, 0.05, PARAM_LIMITS.capacitySigma.min, PARAM_LIMITS.capacitySigma.max, true)}
              </div>
            ` : ''}
          `)}
        `)}
        ${sidebarSection('arrivalModel', 'Arrival Model', true, `
          ${arrivalNotationMarkup()}
          ${sidebarSubpanel('Arrival process', 'How candidate sites for new nodes are generated after initialization.', `
            <div class="field-grid field-grid--tight">
              <label class="field field--compact">
                <span>Arrival mode</span>
                <select id="arrivalMode">
                  <option value="uniform" ${state.params.arrivalMode === 'uniform' ? 'selected' : ''}>Uniform in square</option>
                  <option value="uniform_lattice" ${state.params.arrivalMode === 'uniform_lattice' ? 'selected' : ''}>Uniform on lattice</option>
                  <option value="network" ${state.params.arrivalMode === 'network' ? 'selected' : ''}>Near existing network</option>
                  <option value="frontier" ${state.params.arrivalMode === 'frontier' ? 'selected' : ''}>Outside occupied region</option>
                </select>
              </label>
              ${numberField('arrivalDistanceFactor', 'arrival distance', state.params.arrivalDistanceFactor ?? 1, 0.1, PARAM_LIMITS.arrivalDistanceFactor.min, PARAM_LIMITS.arrivalDistanceFactor.max, true, meshDisabled)}
              ${numberField('arrivalDistanceSdFactor', 'arrival distance sd', state.params.arrivalDistanceSdFactor ?? 0.35, 0.05, PARAM_LIMITS.arrivalDistanceSdFactor.min, PARAM_LIMITS.arrivalDistanceSdFactor.max, true, meshDisabled)}
              ${numberField('meshSpacingFactor', 'mesh spacing', state.params.meshSpacingFactor ?? 0, 0.05, PARAM_LIMITS.meshSpacingFactor.min, PARAM_LIMITS.meshSpacingFactor.max, true, meshDisabled)}
            </div>
          `)}
          ${sidebarSubpanel('Arrival preferences', 'Optional ranking terms that bias which admissible arrival site is used.', `
            <div class="field-grid field-grid--tight">
              <label class="field field--compact">
                <span>Arrival preference</span>
                <select id="arrivalPreferenceMode">
                  <option value="baseline" ${state.params.arrivalPreferenceMode === 'baseline' ? 'selected' : ''}>Baseline arrival ranking</option>
                  <option value="access" ${state.params.arrivalPreferenceMode === 'access' ? 'selected' : ''}>Access-weighted arrivals</option>
                </select>
              </label>
              <label class="field field--compact ${arrivalAccessDisabled ? 'field--disabled' : ''}">
                <span>Arrival access metric</span>
                <select id="arrivalAccessMetric" ${arrivalAccessDisabled ? 'disabled' : ''}>
                  <option value="gravity" ${state.params.arrivalAccessMetric === 'gravity' ? 'selected' : ''}>Gravity access</option>
                  <option value="cumulative" ${state.params.arrivalAccessMetric === 'cumulative' ? 'selected' : ''}>Cumulative access</option>
                </select>
              </label>
              ${numberField('arrivalAccessStrength', 'arrival access strength', state.params.arrivalAccessStrength ?? 0, 0.1, PARAM_LIMITS.arrivalAccessStrength.min, PARAM_LIMITS.arrivalAccessStrength.max, true, arrivalAccessDisabled)}
            </div>
          `)}
        `)}
        ${sidebarSection('connectivityModel', 'Connectivity Panel', true, `
          ${connectivityNotationMarkup()}
          ${sidebarSubpanel('Attachment kernel', 'Controls that shape how feasible targets are weighted once an arrival site is fixed.', `
            <div class="field-grid field-grid--tight">
              ${numberField('alpha', 'alpha', state.params.alpha, 0.1, PARAM_LIMITS.alpha.min, PARAM_LIMITS.alpha.max, true)}
              ${numberField('beta', 'beta', state.params.beta, 0.1, PARAM_LIMITS.beta.min, PARAM_LIMITS.beta.max, true)}
              ${numberField('phi', 'phi', state.params.phi, 0.1, PARAM_LIMITS.phi.min, PARAM_LIMITS.phi.max, true, powerImpedanceDisabled)}
              ${numberField('lambda', 'lambda', state.params.lambda ?? 1, 0.1, PARAM_LIMITS.lambda.min, PARAM_LIMITS.lambda.max, true, exponentialImpedanceDisabled)}
              <label class="field field--compact">
                <span>Impedance type</span>
                <select id="impedanceMode">
                  <option value="power" ${state.params.impedanceMode === 'power' ? 'selected' : ''}>Power cost</option>
                  <option value="exponential" ${state.params.impedanceMode === 'exponential' ? 'selected' : ''}>Exponential cost</option>
                </select>
              </label>
              <label class="field field--compact">
                <span>Selection rule</span>
                <select id="selectionKernelMode">
                  <option value="baseline" ${state.params.selectionKernelMode === 'baseline' ? 'selected' : ''}>Baseline kernel</option>
                  <option value="access" ${state.params.selectionKernelMode === 'access' ? 'selected' : ''}>Access-weighted kernel</option>
                </select>
              </label>
              <label class="field field--compact">
                <span>Access semantics</span>
                <select id="accessSemantics">
                  <option value="network" ${state.params.accessSemantics === 'network' ? 'selected' : ''}>Network access</option>
                  <option value="seed" ${state.params.accessSemantics === 'seed' ? 'selected' : ''}>Seed-only access</option>
                  <option value="opportunity" ${state.params.accessSemantics === 'opportunity' ? 'selected' : ''}>Weighted opportunity access</option>
                </select>
              </label>
              <label class="field field--compact ${selectionAccessDisabled ? 'field--disabled' : ''}">
                <span>Access metric</span>
                <select id="accessSelectionMetric" ${selectionAccessDisabled ? 'disabled' : ''}>
                  <option value="gravity" ${state.params.accessSelectionMetric === 'gravity' ? 'selected' : ''}>Gravity access</option>
                  <option value="cumulative" ${state.params.accessSelectionMetric === 'cumulative' ? 'selected' : ''}>Cumulative access</option>
                </select>
              </label>
              ${numberField('accessSelectionStrength', 'access strength', state.params.accessSelectionStrength ?? 0, 0.1, PARAM_LIMITS.accessSelectionStrength.min, PARAM_LIMITS.accessSelectionStrength.max, true, selectionAccessDisabled)}
            </div>
          `)}
          ${sidebarSubpanel('Topology constraints', 'Rules that restrict which nearby targets remain admissible once the kernel is evaluated.', `
            <div class="field-grid field-grid--tight">
              <label class="field field--compact">
                <span>Planarity mode</span>
                <select id="planarityMode">
                  <option value="none" ${state.params.planarityMode === 'none' ? 'selected' : ''}>None</option>
                  <option value="reject_crossings" ${state.params.planarityMode === 'reject_crossings' ? 'selected' : ''}>Reject crossings</option>
                  <option value="split_crossings" ${state.params.planarityMode === 'split_crossings' ? 'selected' : ''}>Split crossings</option>
                </select>
              </label>
              <label class="field field--compact ${meshDisabled ? 'field--disabled' : ''}">
                <span>Mesh adjacency</span>
                <select id="meshAdjacencyMode" ${meshDisabled ? 'disabled' : ''}>
                  ${adjacencyOptions.map((option) => `<option value="${option.value}" ${state.params.meshAdjacencyMode === option.value ? 'selected' : ''}>${option.label}</option>`).join('')}
                </select>
              </label>
              ${numberField('meshNearestCount', 'mesh nearest q', state.params.meshNearestCount ?? 6, 1, PARAM_LIMITS.meshNearestCount.min, PARAM_LIMITS.meshNearestCount.max, true, meshDisabled)}
              ${numberField('meshOrthogonalBias', 'mesh angle bias', state.params.meshOrthogonalBias ?? 0, 0.1, PARAM_LIMITS.meshOrthogonalBias.min, PARAM_LIMITS.meshOrthogonalBias.max, true, meshDisabled)}
              ${numberField('accessibilityRadius', 'access radius', state.params.accessibilityRadius ?? 0.75, 0.05, PARAM_LIMITS.accessibilityRadius.min, PARAM_LIMITS.accessibilityRadius.max, true)}
              ${numberField('accessibilityDecay', 'access decay', state.params.accessibilityDecay ?? 3, 0.1, PARAM_LIMITS.accessibilityDecay.min, PARAM_LIMITS.accessibilityDecay.max, true)}
            </div>
          `)}
        `)}
        ${sidebarSection('batchNotes', 'Batch, accessibility, and notes', false, `
          <label class="field field--compact">
            <span>Scenario notes</span>
            <textarea id="notes" rows="3">${escapeHtml(state.params.notes)}</textarea>
          </label>
          <div class="control-row">
            <button id="run-batch">Run batch</button>
            <button id="save-baseline">Save baseline</button>
            <button id="save-comparison">Copy scenario</button>
          </div>
          <div class="control-row">
            <button id="export-scenario">Export scenario</button>
            <button id="import-scenario-trigger">Import scenario</button>
            <input id="import-scenario-file" class="hidden" type="file" accept="application/json" />
          </div>
          <div class="control-row">
            <button id="export-graph-json">Export graph JSON</button>
            <button id="export-network-svg">Export network SVG</button>
            <button id="export-network-png">Export network PNG</button>
          </div>
          <div class="control-row">
            <button id="export-gmns-node">Export GMNS nodes</button>
            <button id="export-gmns-link">Export GMNS links</button>
          </div>
        `)}
        ${warnings.length > 0 ? `<div class="warning-list">${warnings.map((warning) => `<p>${escapeHtml(warning)}</p>`).join('')}</div>` : ''}
      `)}
    `;
    const arrivalNotationCard = refs.sidebar.querySelector('#arrival-notation-card');
    if (arrivalNotationCard) {
      arrivalNotationCard.addEventListener('toggle', (event) => {
        state.ui.arrivalNotationExpanded = event.currentTarget.open;
      });
    }
    const connectivityNotationCard = refs.sidebar.querySelector('#connectivity-notation-card');
    if (connectivityNotationCard) {
      connectivityNotationCard.addEventListener('toggle', (event) => {
        state.ui.connectivityNotationExpanded = event.currentTarget.open;
      });
    }
    refs.sidebar.querySelectorAll('[data-sidebar-section]').forEach((section) => {
      section.addEventListener('toggle', (event) => {
        state.ui.sidebarSections[event.currentTarget.dataset.sidebarSection] = event.currentTarget.open;
      });
    });
    wirePanelToggle(refs.sidebar);

    if (state.ui.collapsedPanels.sidebar) {
      return;
    }

    refs.sidebar.querySelector('#preset-select').addEventListener('change', (event) => {
      if (event.target.value) {
        applyPreset(event.target.value);
      }
    });
    const numericFields = [
      'finalNodeCount', 'alpha', 'beta', 'phi', 'lambda', 'arrivalDistanceFactor', 'arrivalDistanceSdFactor', 'meshNearestCount', 'meshOrthogonalBias', 'meshSpacingFactor', 'accessibilityRadius', 'accessibilityDecay', 'arrivalAccessStrength', 'accessSelectionStrength', 'kappa', 'm0', 'capacityValue', 'rngSeed', 'animationSpeedMs', 'replicationCount',
    ];
    numericFields.forEach((field) => {
      const input = refs.sidebar.querySelector(`#${field}`);
      if (input) {
        const commit = () => setParam(field, Number(input.value));
        input.addEventListener('input', commit);
        input.addEventListener('change', commit);
      }
    });
    refs.sidebar.querySelector('#capacityMode').addEventListener('change', (event) => setParam('capacityMode', event.target.value));
    refs.sidebar.querySelector('#impedanceMode').addEventListener('change', (event) => setParam('impedanceMode', event.target.value));
    refs.sidebar.querySelector('#planarityMode').addEventListener('change', (event) => setParam('planarityMode', event.target.value));
    refs.sidebar.querySelector('#meshMode').addEventListener('change', (event) => setParam('meshMode', event.target.value));
    refs.sidebar.querySelector('#meshAngleSet').addEventListener('change', (event) => setParam('meshAngleSet', event.target.value));
    refs.sidebar.querySelector('#meshAdjacencyMode').addEventListener('change', (event) => setParam('meshAdjacencyMode', event.target.value));
    refs.sidebar.querySelector('#seedGraphType').addEventListener('change', (event) => setParam('seedGraphType', event.target.value));
    refs.sidebar.querySelector('#arrivalMode').addEventListener('change', (event) => setParam('arrivalMode', event.target.value));
    refs.sidebar.querySelector('#arrivalPreferenceMode').addEventListener('change', (event) => setParam('arrivalPreferenceMode', event.target.value));
    refs.sidebar.querySelector('#arrivalAccessMetric').addEventListener('change', (event) => setParam('arrivalAccessMetric', event.target.value));
    refs.sidebar.querySelector('#selectionKernelMode').addEventListener('change', (event) => setParam('selectionKernelMode', event.target.value));
    refs.sidebar.querySelector('#accessSemantics').addEventListener('change', (event) => setParam('accessSemantics', event.target.value));
    refs.sidebar.querySelector('#accessSelectionMetric').addEventListener('change', (event) => setParam('accessSelectionMetric', event.target.value));
    const capacityLow = refs.sidebar.querySelector('#capacityLow');
    if (capacityLow) {
      capacityLow.addEventListener('change', () => setParam('capacityParams', { ...state.params.capacityParams, low: Number(capacityLow.value) }));
    }
    const capacityHigh = refs.sidebar.querySelector('#capacityHigh');
    if (capacityHigh) {
      capacityHigh.addEventListener('change', () => setParam('capacityParams', { ...state.params.capacityParams, high: Number(capacityHigh.value) }));
    }
    const capacityMean = refs.sidebar.querySelector('#capacityMean');
    if (capacityMean) {
      capacityMean.addEventListener('change', () => setParam('capacityParams', { ...state.params.capacityParams, mean: Number(capacityMean.value) }));
    }
    const capacitySigma = refs.sidebar.querySelector('#capacitySigma');
    if (capacitySigma) {
      capacitySigma.addEventListener('change', () => setParam('capacityParams', { ...state.params.capacityParams, sigma: Number(capacitySigma.value) }));
    }
    refs.sidebar.querySelector('#notes').addEventListener('change', (event) => setParam('notes', event.target.value));

    refs.sidebar.querySelector('#run-once').addEventListener('click', () => {
      startRunOnce();
    });
    refs.sidebar.querySelector('#step-once').addEventListener('click', () => {
      stopRunning();
      state.simulation = stepSimulation(state.simulation);
      refreshDerived();
    });
    refs.sidebar.querySelector('#play-toggle').addEventListener('click', () => {
      if (state.playTimer) {
        stopPlaying();
        renderSidebar();
      } else {
        startPlaying();
        renderSidebar();
      }
    });
    refs.sidebar.querySelector('#reset-run').addEventListener('click', () => {
      resetSimulation();
      render();
    });
    refs.sidebar.querySelector('#run-batch').addEventListener('click', runBatch);
    refs.sidebar.querySelector('#save-baseline').addEventListener('click', saveBaseline);
    refs.sidebar.querySelector('#save-comparison').addEventListener('click', saveComparison);
    refs.sidebar.querySelector('#export-scenario').addEventListener('click', () => exportText('scenario.json', JSON.stringify(scenarioDocument(state.params), null, 2), 'application/json'));
    refs.sidebar.querySelector('#import-scenario-trigger').addEventListener('click', () => refs.sidebar.querySelector('#import-scenario-file').click());
    refs.sidebar.querySelector('#import-scenario-file').addEventListener('change', async (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) {
        return;
      }
      try {
        const text = await file.text();
        state.params = sanitizeParams(mergeScenarioParams(parseScenarioDocument(text).params));
        state.ui.selectedPresetId = detectMatchingPresetId(state.params);
        setHashFromParams();
        resetSimulation();
        render();
      } catch (error) {
        window.alert(error.message);
      }
    });
    refs.sidebar.querySelector('#export-graph-json').addEventListener('click', async () => copyGraphJson());
    refs.sidebar.querySelector('#export-network-svg').addEventListener('click', () => exportText('network.svg', graphSvg(state.simulation), 'image/svg+xml;charset=utf-8'));
    refs.sidebar.querySelector('#export-network-png').addEventListener('click', async () => {
      if (state.cy) {
        const uri = state.cy.png({ full: true, scale: 2, bg: '#ffffff' });
        const anchor = document.createElement('a');
        anchor.href = uri;
        anchor.download = 'network.png';
        anchor.click();
      }
    });
    refs.sidebar.querySelector('#export-gmns-node').addEventListener('click', () => exportText('gmns_node.csv', gmnsNodeCsv(state.simulation), 'text/csv;charset=utf-8'));
    refs.sidebar.querySelector('#export-gmns-link').addEventListener('click', () => exportText('gmns_link.csv', gmnsLinkCsv(state.simulation), 'text/csv;charset=utf-8'));
  }

  function renderRunControls() {
    const last = state.simulation.lastStepDetails;
    function renderCandidateTable(diagnostics) {
      if (!diagnostics || !diagnostics.entries || diagnostics.entries.length === 0) {
        return '';
      }
      return `
        <div class="candidate-table-wrap">
          <table class="candidate-table">
            <thead>
              <tr>
                <th>node</th>
                <th>d</th>
                <th>cap</th>
                <th>adj</th>
                <th>local</th>
                <th>cross</th>
                <th>nearest-q</th>
                <th>access</th>
                <th>weight</th>
                <th>p</th>
                <th>chosen</th>
              </tr>
            </thead>
            <tbody>
              ${diagnostics.entries.map((entry) => `
                <tr>
                  <td>${escapeHtml(entry.nodeId)}</td>
                  <td>${entry.distance.toFixed(3)}</td>
                  <td>${entry.hasCapacity ? 'y' : 'n'}</td>
                  <td>${entry.adjacent ? 'y' : 'n'}</td>
                  <td>${entry.local ? 'y' : 'n'}</td>
                  <td>${entry.crossing ? 'y' : 'n'}</td>
                  <td>${entry.withinNearestNonCrossingQ || entry.withinNearestAdjacentQ ? 'y' : 'n'}</td>
                  <td>${Number(entry.accessValue ?? 0).toFixed(3)}</td>
                  <td>${entry.round1Weight !== null ? Number(entry.round1Weight).toFixed(4) : '—'}</td>
                  <td>${entry.round1Probability !== null ? Number(entry.round1Probability).toFixed(4) : '—'}</td>
                  <td>${entry.round1Selected ? 'y' : 'n'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }
    function renderSiteAudit(audit, label = 'Arrival-site audit') {
      if (!audit) {
        return '';
      }
      if (audit.preferred || audit.fallback) {
        return `
          ${audit.preferred ? renderSiteAudit(audit.preferred, 'Projected-site audit') : ''}
          ${audit.fallback ? renderSiteAudit(audit.fallback, 'Fallback network-site audit') : ''}
        `;
      }
      return `
        <p><strong>${escapeHtml(label)}</strong>: ${audit.considered} lattice neighbor sites checked, ${audit.candidates} surviving, ${audit.outOfBounds} out of bounds, ${audit.spacingBlocked} blocked by spacing, ${audit.zeroAttachable} with no attachable targets.</p>
        ${audit.samples && audit.samples.length > 0 ? `
          <div class="note" style="max-height:9rem; overflow:auto; border-top:1px solid #d0d5dd; padding-top:0.5rem;">
            ${audit.samples.map((entry) => `
              <p>
                site (${Number(entry.u).toFixed(0)}, ${Number(entry.v).toFixed(0)}):
                ${escapeHtml(String(entry.reason).replaceAll('_', ' '))}
                ${Number.isFinite(entry.nearestDistance) ? `, nearest=${entry.nearestDistance.toFixed(3)}` : ''}
                ${entry.blockerId ? `, blocker=${escapeHtml(entry.blockerId)}${Number.isFinite(entry.blockerLatticeU) && Number.isFinite(entry.blockerLatticeV) ? `@(${Number(entry.blockerLatticeU).toFixed(0)}, ${Number(entry.blockerLatticeV).toFixed(0)})` : ''}` : ''}
                ${entry.blockerGeneratedBy ? `, blocker-type=${escapeHtml(String(entry.blockerGeneratedBy).replaceAll('_', ' '))}` : ''}
                ${Number.isFinite(entry.attachableNeighborCount) ? `, attachable=${entry.attachableNeighborCount}` : ''}
                ${Number.isFinite(entry.futureGrowthCount) ? `, future=${entry.futureGrowthCount}` : ''}
              </p>
            `).join('')}
          </div>
        ` : ''}
      `;
    }
    refs.runControls.innerHTML = `
      ${panelHeader('Run status', 'runControls', `<span class="status-pill ${state.simulation.status}">${state.simulation.status}</span>`)}
      ${panelBody('runControls', `
        <p class="note">Termination: ${escapeHtml(state.simulation.terminationReason || 'not terminated')} | truncation events: ${state.simulation.truncationEvents}</p>
        <p class="note">Current step: ${state.simulation.currentStep} / ${state.params.finalNodeCount} | current node count: ${state.metrics.nodeCount}</p>
        <p class="note">The step control advances one full node arrival, including all sequential without-replacement link choices for that new node.</p>
        ${last ? `
          <div class="warning-list" style="background:#f8fafc;border-color:#d0d5dd;color:#344054;margin-top:0.75rem;">
            <p><strong>${last.arrivalCommitted === false ? 'Last attempted arrival' : 'Last arrival'}</strong>: ${escapeHtml(last.newNodeId)} connected to ${last.selectedTargetIds.length > 0 ? escapeHtml(last.selectedTargetIds.join(', ')) : 'no feasible targets'}.</p>
            ${typeof last.retryCount === 'number' ? `<p>Arrival retries before placement settled: ${last.retryCount}</p>` : ''}
            ${last.arrivalSource ? `<p>Arrival source path: ${escapeHtml(String(last.arrivalSource).replaceAll('_', ' '))}</p>` : ''}
            <p>Truncation: ${last.truncationOccurred ? 'yes' : 'no'}${last.truncationOccurred ? ` | missing links: ${last.missingLinks}` : ''}</p>
            ${last.arrivalCommitted === false ? `<p>This arrival was rejected because ${escapeHtml(String(last.failureReason || 'no_feasible_targets')).replaceAll('_', ' ')}.</p>` : ''}
            ${last.arrivalSiteAudit ? renderSiteAudit(last.arrivalSiteAudit) : ''}
            ${last.createdIntersectionIds && last.createdIntersectionIds.length > 0 ? `<p>Split crossings created ${last.createdIntersectionIds.length} intersection node${last.createdIntersectionIds.length === 1 ? '' : 's'}: ${escapeHtml(last.createdIntersectionIds.join(', '))}.</p>` : ''}
            ${last.selectionRounds.length > 0 ? `
              <p><strong>Sequential choices</strong></p>
              ${last.selectionRounds.map((round, index) => {
                const selectedIndex = round.feasibleNodeIds.indexOf(round.selectedId);
                const selectedProbability = selectedIndex >= 0 ? round.probabilities[selectedIndex] : null;
                return `<p>Round ${index + 1}: chose ${escapeHtml(round.selectedId)} from ${round.feasibleNodeIds.length} feasible nodes${selectedProbability !== null ? ` at p = ${selectedProbability.toFixed(3)}` : ''}.</p>`;
              }).join('')}
            ` : '<p>No feasible candidates were available at this arrival.</p>'}
            ${last.candidateDiagnostics ? `
              <p><strong>Round-1 candidate audit</strong>: ${last.candidateDiagnostics.counts.capacityAvailable} with capacity, ${last.candidateDiagnostics.counts.adjacentAvailable} adjacent, ${last.candidateDiagnostics.counts.localAdjacentAvailable} adjacent and local, ${last.candidateDiagnostics.counts.crossingLocalAvailable} adjacent/local/crossing, ${last.candidateDiagnostics.counts.nonCrossingAdjacentAvailable} adjacent/local/non-crossing, ${last.candidateDiagnostics.counts.round1Feasible} surviving the current round-1 filter.</p>
              <div class="note" style="max-height:11rem; overflow:auto; border-top:1px solid #d0d5dd; padding-top:0.5rem;">
                ${last.candidateDiagnostics.entries.slice(0, 10).map((entry) => `
                  <p>
                    ${escapeHtml(entry.nodeId)}:
                    d=${entry.distance.toFixed(3)},
                    cap=${entry.hasCapacity ? 'y' : 'n'},
                    adj=${entry.adjacent ? 'y' : 'n'},
                    local=${entry.local ? 'y' : 'n'},
                    cross=${entry.crossing ? 'y' : 'n'},
                    nearest-q=${entry.withinNearestNonCrossingQ ? 'y' : 'n'},
                    round1=${entry.round1Feasible ? 'y' : 'n'}
                  </p>
                `).join('')}
              </div>
              ${renderCandidateTable(last.candidateDiagnostics)}
            ` : ''}
          </div>
        ` : ''}
      `)}
    `;
    wirePanelToggle(refs.runControls);
  }

  function renderMainPanel() {
    if (state.ui.activePrimaryTab === 'comparison') {
      if (state.cy) {
        state.cy.destroy();
        state.cy = null;
      }
      renderComparisonView();
      return;
    }
    if (state.ui.activePrimaryTab === 'batch') {
      if (state.cy) {
        state.cy.destroy();
        state.cy = null;
      }
      renderBatchView();
      return;
    }
    renderNetworkView();
  }

  function renderComparisonView() {
    const currentMetrics = computeNetworkMetrics(state.simulation.nodes, state.simulation.edges, state.simulation.params.degreeThreshold);
    const baselineMetrics = state.baseline ? computeNetworkMetrics(state.baseline.state.nodes, state.baseline.state.edges, state.baseline.state.params.degreeThreshold) : null;
    refs.mainPanel.innerHTML = `
      ${panelHeader('Scenario comparison', 'mainPanel')}
      ${panelBody('mainPanel', `
        ${baselineMetrics ? `
          <article class="comparison-card">
            <h3>Current run vs baseline</h3>
            <dl class="comparison-grid">
              ${comparisonMetric('Mean degree', baselineMetrics.meanDegree, currentMetrics.meanDegree)}
              ${comparisonMetric('Degree Gini', baselineMetrics.degreeGini, currentMetrics.degreeGini)}
              ${comparisonMetric('Share at capacity', baselineMetrics.shareAtCapacity, currentMetrics.shareAtCapacity)}
              ${comparisonMetric('Mean edge length', baselineMetrics.meanEdgeLength, currentMetrics.meanEdgeLength)}
              ${comparisonMetric('Clustering', baselineMetrics.averageClustering, currentMetrics.averageClustering)}
            </dl>
          </article>
        ` : '<p class="panel__hint">Save a baseline run to unlock one-parameter exploration comparisons.</p>'}
        ${state.comparisons.map((comparison) => {
          const metrics = computeNetworkMetrics(comparison.state.nodes, comparison.state.edges, comparison.state.params.degreeThreshold);
          return `
            <article class="comparison-card">
              <div class="panel__header">
                <h3>${escapeHtml(comparison.label)}</h3>
                <button data-remove-comparison="${comparison.id}">Remove</button>
              </div>
              <dl class="comparison-grid">
                <div><dt>Nodes</dt><dd>${metrics.nodeCount}</dd></div>
                <div><dt>Edges</dt><dd>${metrics.edgeCount}</dd></div>
                <div><dt>Mean degree</dt><dd>${metrics.meanDegree.toFixed(3)}</dd></div>
                <div><dt>Clustering</dt><dd>${metrics.averageClustering.toFixed(3)}</dd></div>
              </dl>
            </article>
          `;
        }).join('')}
      `)}
    `;
    wirePanelToggle(refs.mainPanel);
    if (state.ui.collapsedPanels.mainPanel) {
      return;
    }
    refs.mainPanel.querySelectorAll('[data-remove-comparison]').forEach((button) => {
      button.addEventListener('click', () => removeComparison(button.dataset.removeComparison));
    });
  }

  function renderBatchView() {
    refs.mainPanel.innerHTML = `
      ${panelHeader('Batch experiments', 'mainPanel', `<button id="run-batch-main">${state.batch.running ? 'Running...' : 'Run batch'}</button>`)}
      ${panelBody('mainPanel', `
        <p class="panel__hint">Batch runs execute in a browser worker using the same simulation logic as the single-run view.</p>
        <div class="progress-bar"><div class="progress-bar__fill" style="width:${(state.batch.progress || 0) * 100}%"></div></div>
        ${state.batch.result ? `
          <div class="control-row">
            <button id="export-batch-csv">Export batch CSV</button>
            <button id="export-batch-json">Export batch JSON</button>
          </div>
          ${renderBatchTable(state.batch.result)}
        ` : '<p class="note">Run a batch to populate aggregated scenario summaries.</p>'}
        <div class="saved-list">
          <h3>Saved batch summaries</h3>
          ${state.batch.saved.map((entry) => `<article class="saved-list__item"><strong>${escapeHtml(entry.label)}</strong><span>${new Date(entry.createdAt).toLocaleString()}</span></article>`).join('')}
        </div>
      `)}
    `;
    wirePanelToggle(refs.mainPanel);
    if (state.ui.collapsedPanels.mainPanel) {
      return;
    }
    refs.mainPanel.querySelector('#run-batch-main').addEventListener('click', runBatch);
    const csvButton = refs.mainPanel.querySelector('#export-batch-csv');
    if (csvButton) {
      csvButton.addEventListener('click', () => exportText('batch-summary.csv', batchResultCsv(state.batch.result), 'text/csv;charset=utf-8'));
    }
    const jsonButton = refs.mainPanel.querySelector('#export-batch-json');
    if (jsonButton) {
      jsonButton.addEventListener('click', () => exportText('batch-summary.json', JSON.stringify(state.batch.result, null, 2), 'application/json'));
    }
  }

  function renderNetworkView() {
    if (state.cy) {
      state.cy.destroy();
      state.cy = null;
    }
    const paper = state.ui.activePrimaryTab === 'paper' || state.ui.paperMode;
    refs.mainPanel.innerHTML = `
      ${panelHeader('Network view', 'mainPanel', `
        <div class="control-row">
          <button id="network-png">Export PNG</button>
          <button id="network-svg">Export SVG</button>
        </div>
      `)}
      ${panelBody('mainPanel', `
        <div class="network-toolbar">
          <label>Node colour
            <select id="node-color-mode">
              ${['degree', 'residual_capacity', 'age', 'component', 'saturated', 'access_cumulative', 'access_gravity'].map((mode) => `<option value="${mode}" ${state.ui.nodeColorMode === mode ? 'selected' : ''}>${mode.replace(/_/g, ' ')}</option>`).join('')}
            </select>
          </label>
          ${checkbox('edgeColorByLength', 'edge length colours', state.ui.edgeColorByLength)}
          ${checkbox('showBoundary', 'unit square boundary', state.ui.showBoundary)}
          ${state.params.meshMode === 'grid_bias' ? checkbox('showLatticeOverlay', 'show lattice', state.ui.showLatticeOverlay) : ''}
          ${checkbox('showCoordinates', 'coordinates', state.ui.showCoordinates)}
          ${checkbox('showScaleBar', 'scale bar', state.ui.showScaleBar)}
          ${checkbox('highlightSaturated', 'highlight saturated', state.ui.highlightSaturated)}
          ${checkbox('highlightNewest', 'highlight newest', state.ui.highlightNewest)}
          ${checkbox('showAttachmentWeights', 'attachment weights', state.ui.showAttachmentWeights)}
        </div>
        <div class="network-stage ${paper ? 'paper' : ''}">
          <svg id="network-choropleth" class="network-choropleth hidden" aria-hidden="true"></svg>
          <svg id="network-lattice-overlay" class="network-lattice-overlay hidden" aria-hidden="true"></svg>
          <svg id="network-reference-overlay" class="network-reference-overlay hidden" aria-hidden="true"></svg>
          <div id="network-canvas"></div>
          ${state.ui.showBoundary ? '<div class="network-boundary"></div>' : ''}
          <div id="network-tooltip" class="network-tooltip hidden"></div>
        </div>
        ${networkLegendMarkup()}
        <div class="network-footer">
          <span>Node count ${state.metrics.nodeCount}</span>
          <span>Edge count ${state.metrics.edgeCount}</span>
          <span>Crossings ${state.metrics.crossingCount ?? 'NA'}</span>
          <span>Split nodes ${state.metrics.generatedIntersectionNodes}</span>
          <span>Lonely nodes ${state.metrics.lonelyNodeCount}</span>
        </div>
        <p class="note">The attachment-weight labels show the current probabilities for the first sequential choice of the most recent arrival. Use Step arrival and the run-status panel to inspect later rounds in that same arrival.</p>
        ${paper ? `
          <div style="margin-top:1rem">
            <label class="field">
              <span>Figure caption draft</span>
              <textarea id="figure-caption" class="paper-caption" placeholder="Draft a paper-ready caption for the current figure.">${escapeHtml(state.ui.figureCaptionDraft)}</textarea>
            </label>
          </div>
        ` : ''}
      `)}
    `;
    wirePanelToggle(refs.mainPanel);
    if (state.ui.collapsedPanels.mainPanel) {
      return;
    }

    refs.mainPanel.querySelector('#network-png').addEventListener('click', () => {
      if (state.cy) {
        const anchor = document.createElement('a');
        anchor.href = state.cy.png({ full: true, scale: 2, bg: '#ffffff' });
        anchor.download = 'network.png';
        anchor.click();
      }
    });
    refs.mainPanel.querySelector('#network-svg').addEventListener('click', () => exportText('network.svg', graphSvg(state.simulation), 'image/svg+xml;charset=utf-8'));
    refs.mainPanel.querySelector('#node-color-mode').addEventListener('change', (event) => {
      state.ui.nodeColorMode = event.target.value;
      renderNetworkGraph();
    });
    ['edgeColorByLength', 'showBoundary', 'showLatticeOverlay', 'showCoordinates', 'showScaleBar', 'highlightSaturated', 'highlightNewest', 'showAttachmentWeights'].forEach((key) => {
      const element = refs.mainPanel.querySelector(`#${key}`);
      if (element) {
        element.addEventListener('change', (event) => {
          state.ui[key] = event.target.checked;
          renderMainPanel();
          renderCharts();
        });
      }
    });
    const caption = refs.mainPanel.querySelector('#figure-caption');
    if (caption) {
      caption.addEventListener('input', (event) => {
        state.ui.figureCaptionDraft = event.target.value;
      });
    }
    renderNetworkGraph();
  }

  function componentColor(componentId) {
    return COMPONENT_COLORS[componentId % COMPONENT_COLORS.length];
  }

  function gradientColor(value, min, max) {
    const t = max > min ? (value - min) / (max - min) : 0.5;
    const start = [232, 241, 245];
    const end = [11, 79, 108];
    const channel = (index) => Math.round(start[index] + (end[index] - start[index]) * Math.max(0, Math.min(1, t)));
    return `rgb(${channel(0)}, ${channel(1)}, ${channel(2)})`;
  }

  function withAlpha(rgbColor, alpha) {
    const match = rgbColor.match(/\d+/g);
    if (!match || match.length < 3) {
      return rgbColor;
    }
    return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${alpha})`;
  }

  function nodeLegendMarkup() {
    if (state.ui.nodeColorMode === 'component') {
      const items = Array.from(new Set(Object.values(state.metrics.componentAssignments || {}))).slice(0, 5);
      return `
        <div class="legend-row">
          <span class="legend-label">Components</span>
          ${items.map((componentId) => `<span class="legend-item"><span class="legend-swatch" style="background:${componentColor(componentId)}"></span>C${componentId}</span>`).join('')}
        </div>
      `;
    }
    if (state.ui.nodeColorMode === 'saturated') {
      return `
        <div class="legend-row">
          <span class="legend-label">Node colour</span>
          <span class="legend-item"><span class="legend-swatch" style="background:#0b4f6c"></span>not saturated</span>
          <span class="legend-item"><span class="legend-swatch" style="background:#b42318"></span>saturated</span>
        </div>
      `;
    }

    let values = state.simulation.nodes.map((node) => node.degree);
    let label = 'Degree';
    if (state.ui.nodeColorMode === 'residual_capacity') {
      values = state.simulation.nodes.map((node) => node.residualCapacity);
      label = 'Residual capacity';
    } else if (state.ui.nodeColorMode === 'age') {
      values = state.simulation.nodes.map((node) => node.birthStep);
      label = 'Age';
    } else if (state.ui.nodeColorMode === 'access_cumulative') {
      values = state.simulation.nodes.map((node) => state.transportAccessibility?.cumulativeById?.[node.id] ?? 0);
      label = 'Cumulative access';
    } else if (state.ui.nodeColorMode === 'access_gravity') {
      values = state.simulation.nodes.map((node) => state.transportAccessibility?.gravityById?.[node.id] ?? 0);
      label = 'Gravity access';
    }
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 1);
    return `
      <div class="legend-row">
        <span class="legend-label">${escapeHtml(label)}</span>
        <span class="legend-gradient" style="background:linear-gradient(90deg, ${gradientColor(min, min, max)}, ${gradientColor((min + max) / 2, min, max)}, ${gradientColor(max, min, max)})"></span>
        <span class="legend-bound">${min.toFixed(2)}</span>
        <span class="legend-bound">${max.toFixed(2)}</span>
      </div>
    `;
  }

  function specialLegendMarkup() {
    return `
      <div class="legend-row">
        <span class="legend-label">Special markers</span>
        <span class="legend-item"><span class="legend-node newest"></span>newest</span>
        <span class="legend-item"><span class="legend-node selected"></span>selected target</span>
        <span class="legend-item"><span class="legend-node lonely"></span>lonely node</span>
        <span class="legend-item"><span class="legend-node split"></span>split node</span>
        <span class="legend-item"><span class="legend-edge split"></span>split link</span>
      </div>
    `;
  }

  function latticeLegendMarkup() {
    if (state.params.meshMode !== 'grid_bias' || !state.ui.showLatticeOverlay) {
      return '';
    }
    return `
      <div class="legend-row">
        <span class="legend-label">Lattice overlay</span>
        <span class="legend-item"><span class="legend-swatch" style="background:rgba(11, 79, 108, 0.22)"></span>all lattice sites</span>
        <span class="legend-item"><span class="legend-swatch" style="background:rgba(247, 144, 9, 0.35); border-color:rgba(247, 144, 9, 0.7)"></span>current arrival candidates</span>
        <span class="legend-item">arrival nodes should snap to these sites; split nodes need not</span>
      </div>
    `;
  }

  function edgeLegendMarkup() {
    if (!state.ui.edgeColorByLength) {
      return '<div class="legend-row"><span class="legend-label">Edges</span><span class="legend-item"><span class="legend-edge base"></span>arrival links</span><span class="legend-item"><span class="legend-edge split"></span>split links</span></div>';
    }
    const lengths = state.simulation.edges.filter((edge) => edge.generatedBy !== 'split_crossing').map((edge) => edge.length);
    const min = Math.min(...lengths, 0);
    const max = Math.max(...lengths, 1);
    return `
      <div class="legend-row">
        <span class="legend-label">Edge length</span>
        <span class="legend-gradient" style="background:linear-gradient(90deg, ${gradientColor(min, min, max)}, ${gradientColor((min + max) / 2, min, max)}, ${gradientColor(max, min, max)})"></span>
        <span class="legend-bound">${min.toFixed(2)}</span>
        <span class="legend-bound">${max.toFixed(2)}</span>
        <span class="legend-item"><span class="legend-edge split"></span>split links</span>
      </div>
    `;
  }

  function networkLegendMarkup() {
    return `
      <div class="network-legend">
        ${nodeLegendMarkup()}
        ${edgeLegendMarkup()}
        ${latticeLegendMarkup()}
        ${specialLegendMarkup()}
      </div>
    `;
  }

  function renderNetworkChoropleth() {
    const svgElement = refs.mainPanel.querySelector('#network-choropleth');
    const container = refs.mainPanel.querySelector('.network-stage');
    if (!svgElement || !container || !state.cy) {
      return;
    }
    if (!state.ui.nodeColorMode.startsWith('access_') || !state.transportAccessibility?.available) {
      svgElement.innerHTML = '';
      svgElement.classList.add('hidden');
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width <= 0 || height <= 0) {
      return;
    }
    svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svgElement.classList.remove('hidden');

    const nodes = state.cy.nodes().map((cyNode) => {
      const id = cyNode.id();
      const rendered = cyNode.renderedPosition();
      const value = state.ui.nodeColorMode === 'access_cumulative'
        ? state.transportAccessibility.cumulativeById[id] ?? 0
        : state.transportAccessibility.gravityById[id] ?? 0;
      return { id, x: rendered.x, y: rendered.y, value };
    }).filter((node) => Number.isFinite(node.x) && Number.isFinite(node.y));

    if (nodes.length < 2) {
      svgElement.innerHTML = '';
      return;
    }

    const min = Math.min(...nodes.map((node) => node.value), 0);
    const max = Math.max(...nodes.map((node) => node.value), 1);
    const delaunay = d3.Delaunay.from(nodes, (node) => node.x, (node) => node.y);
    const voronoi = delaunay.voronoi([0, 0, width, height]);
    svgElement.innerHTML = nodes.map((node, index) => {
      const path = voronoi.renderCell(index);
      return `<path d="${path}" fill="${withAlpha(gradientColor(node.value, min, max), 0.3)}" stroke="${withAlpha('#d0d5dd', 0.35)}" stroke-width="0.6"></path>`;
    }).join('');
  }

  function renderNetworkLatticeOverlay() {
    const svgElement = refs.mainPanel.querySelector('#network-lattice-overlay');
    const container = refs.mainPanel.querySelector('.network-stage');
    if (!svgElement || !container || !state.cy) {
      return;
    }
    if (state.params.meshMode !== 'grid_bias' || !state.ui.showLatticeOverlay) {
      svgElement.innerHTML = '';
      svgElement.classList.add('hidden');
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width <= 0 || height <= 0) {
      return;
    }
    svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svgElement.classList.remove('hidden');

    const allPoints = projectedLatticePoints(state.simulation);
    // The overlay visualizes the primary candidate list for the active arrival
    // mode. It does not show every later fallback path, rescue-site path, or
    // random fallback that chooseArrivalPoint() may still use.
    let frontierPoints = [];
    if (state.params.arrivalMode === 'network') {
      frontierPoints = networkBiasedLatticeCandidates(state.simulation);
    } else if (state.params.arrivalMode === 'frontier') {
      frontierPoints = projectedLatticeCandidates(state.simulation);
    } else if (state.params.arrivalMode === 'uniform_lattice') {
      const spacingNodes = arrivalSpacingNodes(state.simulation);
      frontierPoints = projectedLatticePoints(state.simulation).filter((point) =>
        nearestExistingDistance(point, spacingNodes) >= Math.max(0.01, averageEdgeLength(state.simulation.edges) * (state.params.meshSpacingFactor ?? 0)),
      );
    }
    const pan = state.cy.pan();
    const zoom = state.cy.zoom();
    const rendered = (point) => ({
      x: point.x * 1000 * zoom + pan.x,
      y: (1 - point.y) * 1000 * zoom + pan.y,
    });

    const baseDots = allPoints.map((point) => {
      const position = rendered(point);
      return `<circle cx="${position.x.toFixed(2)}" cy="${position.y.toFixed(2)}" r="2.4" fill="rgba(11, 79, 108, 0.22)"></circle>`;
    }).join('');
    const frontierDots = frontierPoints.map((point) => {
      const position = rendered(point);
      return `<circle cx="${position.x.toFixed(2)}" cy="${position.y.toFixed(2)}" r="3.8" fill="rgba(247, 144, 9, 0.35)" stroke="rgba(247, 144, 9, 0.7)" stroke-width="0.9"></circle>`;
    }).join('');
    svgElement.innerHTML = `${baseDots}${frontierDots}`;
  }

  function renderNetworkReferenceOverlay() {
    const svgElement = refs.mainPanel.querySelector('#network-reference-overlay');
    const container = refs.mainPanel.querySelector('.network-stage');
    if (!svgElement || !container || !state.cy) {
      return;
    }
    if (!state.ui.showCoordinates && !state.ui.showScaleBar) {
      svgElement.innerHTML = '';
      svgElement.classList.add('hidden');
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width <= 0 || height <= 0) {
      return;
    }
    svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svgElement.classList.remove('hidden');

    const topLeft = renderedPointFromUnit({ x: 0, y: 0 });
    const topRight = renderedPointFromUnit({ x: 1, y: 0 });
    const bottomLeft = renderedPointFromUnit({ x: 0, y: 1 });
    const pixelsPerUnitX = Math.abs(topRight.x - topLeft.x);
    const pixelsPerUnitY = Math.abs(bottomLeft.y - topLeft.y);
    const pixelsPerUnit = Math.max(1, (pixelsPerUnitX + pixelsPerUnitY) / 2);
    const pieces = [];

    if (state.ui.showCoordinates) {
      [0, 0.25, 0.5, 0.75, 1].forEach((tick) => {
        const xPoint = renderedPointFromUnit({ x: tick, y: 1 });
        pieces.push(
          `<line x1="${xPoint.x.toFixed(2)}" y1="${(bottomLeft.y - 7).toFixed(2)}" x2="${xPoint.x.toFixed(2)}" y2="${bottomLeft.y.toFixed(2)}" stroke="rgba(11,79,108,0.45)" stroke-width="1"/>`,
          `<text x="${xPoint.x.toFixed(2)}" y="${(bottomLeft.y - 11).toFixed(2)}" text-anchor="middle" fill="#344054" font-size="10">${tick.toFixed(2)}</text>`
        );
        const yPoint = renderedPointFromUnit({ x: 0, y: 1 - tick });
        pieces.push(
          `<line x1="${topLeft.x.toFixed(2)}" y1="${yPoint.y.toFixed(2)}" x2="${(topLeft.x + 7).toFixed(2)}" y2="${yPoint.y.toFixed(2)}" stroke="rgba(11,79,108,0.45)" stroke-width="1"/>`,
          `<text x="${(topLeft.x + 11).toFixed(2)}" y="${(yPoint.y + 3).toFixed(2)}" text-anchor="start" fill="#344054" font-size="10">${tick.toFixed(2)}</text>`
        );
      });
      pieces.push(
        `<text x="${(bottomLeft.x + pixelsPerUnitX / 2).toFixed(2)}" y="${(bottomLeft.y - 24).toFixed(2)}" text-anchor="middle" fill="#475467" font-size="10">x in unit-square coordinates</text>`,
        `<text x="${(topLeft.x + 24).toFixed(2)}" y="${(topLeft.y + pixelsPerUnitY / 2).toFixed(2)}" transform="rotate(-90 ${(topLeft.x + 24).toFixed(2)} ${(topLeft.y + pixelsPerUnitY / 2).toFixed(2)})" text-anchor="middle" fill="#475467" font-size="10">y in unit-square coordinates</text>`
      );
    }

    if (state.ui.showScaleBar) {
      const unitLength = chooseScaleBarUnits(pixelsPerUnit);
      const pixelLength = unitLength * pixelsPerUnit;
      const y = Math.max(24, bottomLeft.y - 18);
      const x2 = Math.min(width - 18, topRight.x - 18);
      const x1 = x2 - pixelLength;
      pieces.push(
        `<line x1="${x1.toFixed(2)}" y1="${y.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y.toFixed(2)}" stroke="#344054" stroke-width="2"/>`,
        `<line x1="${x1.toFixed(2)}" y1="${(y - 5).toFixed(2)}" x2="${x1.toFixed(2)}" y2="${(y + 5).toFixed(2)}" stroke="#344054" stroke-width="2"/>`,
        `<line x1="${x2.toFixed(2)}" y1="${(y - 5).toFixed(2)}" x2="${x2.toFixed(2)}" y2="${(y + 5).toFixed(2)}" stroke="#344054" stroke-width="2"/>`,
        `<text x="${((x1 + x2) / 2).toFixed(2)}" y="${(y - 8).toFixed(2)}" text-anchor="middle" fill="#344054" font-size="10">${unitLength.toFixed(2)} unit length</text>`
      );
    }

    svgElement.innerHTML = pieces.join('');
  }

  function renderNetworkGraph() {
    if (!cytoscape || !refs.mainPanel.querySelector('#network-canvas')) {
      return;
    }
    const historyMetrics = state.simulation.history.length > 0
      ? state.simulation.history[state.simulation.history.length - 1].metrics
      : computeNetworkMetrics(state.simulation.nodes, state.simulation.edges, state.params.degreeThreshold);
    const latestRound = state.simulation.lastStepDetails && state.simulation.lastStepDetails.selectionRounds[0];
    const maxEdgeLength = Math.max(...state.simulation.edges.map((edge) => edge.length), 1);
    const cumulativeValues = Object.values(state.transportAccessibility?.cumulativeById || {});
    const gravityValues = Object.values(state.transportAccessibility?.gravityById || {});
    const elements = [
      ...state.simulation.nodes.map((node) => {
        let color = '#0b4f6c';
        if (state.ui.nodeColorMode === 'saturated') {
          color = node.saturated ? '#b42318' : '#0b4f6c';
        } else if (state.ui.nodeColorMode === 'age') {
          color = gradientColor(node.birthStep, 0, Math.max(...state.simulation.nodes.map((entry) => entry.birthStep), 1));
        } else if (state.ui.nodeColorMode === 'residual_capacity') {
          color = gradientColor(node.residualCapacity, 0, Math.max(...state.simulation.nodes.map((entry) => entry.capacity), 1));
        } else if (state.ui.nodeColorMode === 'component') {
          color = componentColor(historyMetrics.componentAssignments[node.id] ?? 0);
        } else if (state.ui.nodeColorMode === 'access_cumulative') {
          color = gradientColor(state.transportAccessibility?.cumulativeById?.[node.id] ?? 0, 0, Math.max(...cumulativeValues, 1));
        } else if (state.ui.nodeColorMode === 'access_gravity') {
          color = gradientColor(state.transportAccessibility?.gravityById?.[node.id] ?? 0, 0, Math.max(...gravityValues, 1));
        } else {
          color = gradientColor(node.degree, 0, Math.max(...state.simulation.nodes.map((entry) => entry.degree), 1));
        }

        const isNewest = state.ui.highlightNewest && node.id === state.simulation.lastStepDetails?.newNodeId;
        const isSelected = state.ui.highlightNewest && state.simulation.lastStepDetails?.selectedTargetIds.includes(node.id);
        const attachmentIndex = latestRound ? latestRound.feasibleNodeIds.indexOf(node.id) : -1;
        const probability = attachmentIndex >= 0 ? latestRound.probabilities[attachmentIndex] : null;

        return {
          data: {
            id: node.id,
            color,
            size: 12 + Math.sqrt(node.degree) * 3.8,
            outlineColor: node.generatedBy === 'split_crossing'
              ? '#f79009'
              : node.lonely
                ? '#667085'
                : isNewest
                  ? '#f79009'
                  : isSelected
                    ? '#12b76a'
                    : state.ui.highlightSaturated && node.saturated
                      ? '#b42318'
                      : '#ffffff',
            outlineWidth: node.generatedBy === 'split_crossing' || node.lonely || isNewest || isSelected || (state.ui.highlightSaturated && node.saturated) ? 3 : 1,
            probabilityLabel: state.ui.showAttachmentWeights && probability !== null ? probability.toFixed(3) : '',
          },
          position: { x: node.x * 1000, y: (1 - node.y) * 1000 },
          classes: [
            isNewest ? 'newest-node' : '',
            isSelected ? 'selected-target' : '',
            node.saturated ? 'saturated-node' : '',
            node.generatedBy === 'split_crossing' ? 'split-node' : '',
            node.lonely ? 'lonely-node' : '',
          ].filter(Boolean).join(' '),
        };
      }),
      ...state.simulation.edges.map((edge) => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          color: edge.generatedBy === 'split_crossing' ? '#f79009' : state.ui.edgeColorByLength ? gradientColor(edge.length, 0, maxEdgeLength) : '#98a2b3',
          generatedBy: edge.generatedBy || 'arrival',
        },
        classes: edge.generatedBy === 'split_crossing' ? 'split-edge' : '',
      })),
    ];

    if (!state.cy) {
      state.cy = cytoscape({
        container: refs.mainPanel.querySelector('#network-canvas'),
        elements,
        layout: { name: 'preset' },
        style: [
          {
            selector: 'node',
            style: {
              'background-color': 'data(color)',
              width: 'data(size)',
              height: 'data(size)',
              shape: 'ellipse',
              label: 'data(probabilityLabel)',
              'font-size': 10,
              color: '#344054',
              'text-background-color': '#ffffff',
              'text-background-opacity': 0.95,
              'text-background-padding': 2,
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
            selector: '.split-node',
            style: {
              shape: 'diamond',
            },
          },
          {
            selector: '.lonely-node',
            style: {
              shape: 'round-rectangle',
            },
          },
          {
            selector: '.split-edge',
            style: {
              'line-style': 'dashed',
              width: 2,
              opacity: 0.95,
            },
          },
        ],
        minZoom: 0.4,
        maxZoom: 3,
        wheelSensitivity: 0.15,
      });
      const tooltip = refs.mainPanel.querySelector('#network-tooltip');
      state.cy.on('mouseover', 'node', (event) => {
        const node = state.simulation.nodes.find((entry) => entry.id === event.target.id());
        if (!node) {
          return;
        }
        tooltip.innerHTML = `
          <strong>${node.id}</strong><br/>
          degree: ${node.degree}<br/>
          capacity: ${node.capacity.toFixed(2)}<br/>
          residual: ${node.residualCapacity.toFixed(2)}<br/>
          weight: ${(node.weight ?? 1).toFixed(2)}<br/>
          production share: ${(node.typeShare ?? 0.5).toFixed(2)}<br/>
          attraction share: ${(1 - (node.typeShare ?? 0.5)).toFixed(2)}<br/>
          lonely: ${node.lonely ? 'yes' : 'no'}<br/>
          ${node.lonely ? `lonely reason: ${escapeHtml(String(node.lonelyReason || 'unknown')).replaceAll('_', ' ')}<br/>` : ''}
          generated by: ${node.generatedBy || 'arrival'}<br/>
          cumulative access: ${(state.transportAccessibility?.cumulativeById?.[node.id] ?? 0).toFixed(2)}<br/>
          gravity access: ${(state.transportAccessibility?.gravityById?.[node.id] ?? 0).toFixed(3)}<br/>
          access value: ${(node.accessValue ?? 0).toFixed(3)}<br/>
          position: (${node.x.toFixed(3)}, ${node.y.toFixed(3)})<br/>
          birth step: ${node.birthStep}
        `;
        tooltip.style.left = `${event.renderedPosition.x + 18}px`;
        tooltip.style.top = `${event.renderedPosition.y + 18}px`;
        tooltip.classList.remove('hidden');
      });
      state.cy.on('mouseover', 'edge', (event) => {
        const edge = state.simulation.edges.find((entry) => entry.id === event.target.id());
        if (!edge) {
          return;
        }
        tooltip.innerHTML = `
          <strong>${edge.id}</strong><br/>
          endpoints: ${edge.source}, ${edge.target}<br/>
          length: ${edge.length.toFixed(3)}<br/>
          type: ${edge.generatedBy || 'arrival'}<br/>
          created: ${edge.birthStep}
        `;
        tooltip.style.left = `${event.renderedPosition.x + 18}px`;
        tooltip.style.top = `${event.renderedPosition.y + 18}px`;
        tooltip.classList.remove('hidden');
      });
      state.cy.on('mouseout', () => tooltip.classList.add('hidden'));
    }

    state.cy.json({ elements });
    state.cy.layout({ name: 'preset' }).run();
    renderNetworkChoropleth();
    renderNetworkLatticeOverlay();
    renderNetworkReferenceOverlay();
    state.cy.off('pan zoom resize');
    state.cy.on('pan zoom resize', () => {
      renderNetworkChoropleth();
      renderNetworkLatticeOverlay();
      renderNetworkReferenceOverlay();
    });
  }

function renderMetricsPanel() {
    const metrics = state.metrics;
    const rows = [
      ['Nodes', metrics.nodeCount],
      ['Edges', metrics.edgeCount],
      ['Split nodes', metrics.generatedIntersectionNodes],
      ['Split links', metrics.splitLinkCount],
      ['Split events', metrics.splitEvents],
      ['Crossing candidates seen', metrics.crossingCandidatesEncountered],
      ['Crossing candidates admitted', metrics.crossingCandidatesAdmitted],
      ['Lonely nodes', metrics.lonelyNodeCount],
      ['Mean degree', metrics.meanDegree],
      ['Max degree', metrics.maxDegree],
      ['Degree Gini', metrics.degreeGini],
      ['Share at capacity', metrics.shareAtCapacity],
      ['Components', metrics.connectedComponents],
      ['Largest component share', metrics.largestComponentShare],
      ['Average clustering', metrics.averageClustering],
      ['Average path length (LCC)', metrics.averagePathLengthLargestComponent],
      ['Diameter (LCC)', metrics.diameterLargestComponent],
      ['Assortativity', metrics.degreeAssortativity],
      ['Mean edge length', metrics.meanEdgeLength],
      ['Median edge length', metrics.medianEdgeLength],
      ['Total network length', metrics.totalNetworkLength],
      ['Leaf share', metrics.fractionLeaves],
      ['High-degree share', metrics.fractionDegreeAboveThreshold],
      ['Cyclomatic number', metrics.cyclomaticNumber],
      ['Dominant growth sector', metrics.dominantDirectionSector],
      ['Dominant sector share', metrics.dominantDirectionShare],
      ['East-West bias', metrics.eastWestBias],
      ['North-South bias', metrics.northSouthBias],
    ];
    refs.metricsPanel.innerHTML = `
      ${panelHeader('Metrics', 'metricsPanel')}
      ${panelBody('metricsPanel', `
        <dl class="metrics-grid">
          ${rows.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${typeof value === 'number' ? value.toFixed(3) : value ?? 'NA'}</dd></div>`).join('')}
        </dl>
        <div class="metrics-footer">
          <p>Termination reason: ${escapeHtml(state.simulation.terminationReason || 'still active')}</p>
          <p>Truncation events: ${state.simulation.truncationEvents}</p>
          <p>Tail model: ${escapeHtml(String(state.tail.preferredModel).replace(/_/g, ' '))}</p>
        </div>
      `)}
    `;
    wirePanelToggle(refs.metricsPanel);
  }

function renderInsightsPanel() {
    const insights = [];
    if (state.baseline) {
      const baselineMetrics = computeNetworkMetrics(state.baseline.state.nodes, state.baseline.state.edges, state.baseline.state.params.degreeThreshold);
      if (state.metrics.meanEdgeLength < baselineMetrics.meanEdgeLength - 0.02) {
        insights.push('Higher spatial deterrence shortened average edge length relative to the saved baseline.');
      }
      if (state.metrics.degreeGini < baselineMetrics.degreeGini - 0.02) {
        insights.push('Finite capacity appears to have truncated the upper degree tail relative to the baseline.');
      }
      if (state.metrics.averageClustering > baselineMetrics.averageClustering + 0.02) {
        insights.push('The current parameter setting increased clustering relative to the baseline comparison.');
      }
    }
    if (state.params.kappa >= 3 && state.metrics.cyclomaticNumber > 0) {
      insights.push('Higher kappa is supporting denser local closure and reducing tree-like growth.');
    }
    if (state.metrics.shareAtCapacity > 0.25) {
      insights.push('A substantial share of nodes is saturated, so capacity constraints are materially shaping attachment opportunities.');
    }
    if (Math.abs(state.metrics.eastWestBias) > 0.18) {
      insights.push(`Growth is showing a directional east-west bias (${state.metrics.eastWestBias > 0 ? 'east-heavy' : 'west-heavy'}) relative to the lattice anchor.`);
    }
    if (Math.abs(state.metrics.northSouthBias) > 0.18) {
      insights.push(`Growth is showing a directional north-south bias (${state.metrics.northSouthBias > 0 ? 'north-heavy' : 'south-heavy'}) relative to the lattice anchor.`);
    }
    if (state.simulation.status === 'early_stopped') {
      insights.push('Growth terminated early because no feasible nodes remained under the active capacity constraints.');
    }
    if (insights.length === 0) {
      insights.push('This run is close to its current baseline on the tracked summary metrics. Try varying one mechanism at a time to surface clearer regime changes.');
    }
    refs.insightsPanel.innerHTML = `
      ${panelHeader('Insights', 'insightsPanel')}
      ${panelBody('insightsPanel', `<ul class="insight-list">${insights.map((insight) => `<li>${escapeHtml(insight)}</li>`).join('')}</ul>`)}
    `;
    wirePanelToggle(refs.insightsPanel);
  }

  function renderAccessibilityPanel() {
    const access = state.transportAccessibility;
    const candidateAccess = state.candidateAccessibility;
    const potentialAccess = state.potentialAccessibility;
    const liveSummary = access?.available
      ? `Transport accessibility updated. Mean cumulative access ${access.meanCumulative.toFixed(2)} within radius ${state.params.accessibilityRadius.toFixed(2)}, mean gravity access ${access.meanGravity.toFixed(3)} with decay ${state.params.accessibilityDecay.toFixed(2)}.`
      : access?.message || 'Transport accessibility unavailable.';
    refs.accessibilityPanel.innerHTML = `
      ${panelHeader('Transport accessibility', 'accessibilityPanel', `${access?.available ? '<button id="export-accessibility-csv">Export node CSV</button>' : ''}${candidateAccess?.available ? '<button id="export-candidate-accessibility-csv">Export candidate CSV</button>' : ''}${potentialAccess?.available ? '<button id="export-potential-accessibility-csv">Export potential CSV</button>' : ''}`)}
      ${panelBody('accessibilityPanel', access?.available ? `
        <p class="panel__hint">Shortest-path accessibility over network edge length, using <strong>${escapeHtml(String(access?.semantics || state.params.accessSemantics || 'network').replace('_', ' '))}</strong> destination semantics.</p>
        <dl class="metrics-grid">
          <div><dt>Radius</dt><dd>${state.params.accessibilityRadius.toFixed(3)}</dd></div>
          <div><dt>Decay</dt><dd>${state.params.accessibilityDecay.toFixed(3)}</dd></div>
          <div><dt>Mean cumulative</dt><dd>${access.meanCumulative.toFixed(3)}</dd></div>
          <div><dt>Mean gravity</dt><dd>${access.meanGravity.toFixed(3)}</dd></div>
          <div><dt>Best cumulative node</dt><dd>${escapeHtml(access.maxCumulativeNodeId || 'NA')} (${(access.maxCumulative ?? 0).toFixed(3)})</dd></div>
          <div><dt>Best gravity node</dt><dd>${escapeHtml(access.maxGravityNodeId || 'NA')} (${(access.maxGravity ?? 0).toFixed(3)})</dd></div>
        </dl>
        <p class="note">Use the network node-colour menu to switch to <em>access cumulative</em> or <em>access gravity</em>; those modes now add a choropleth-style accessibility surface in the network view.</p>
        <p class="note">${state.params.selectionKernelMode === 'access'
          ? `Target selection is currently access-weighted using ${escapeHtml(state.params.accessSelectionMetric)} accessibility with strength ${Number(state.params.accessSelectionStrength ?? 0).toFixed(2)}.`
          : 'Target selection is currently using the baseline kernel only.'}</p>
        ${candidateAccess?.available ? `
          <div style="margin-top:0.9rem">
            <p><strong>Current arrival-candidate accessibility</strong> (${escapeHtml(String(candidateAccess.source || 'unknown').replaceAll('_', ' '))})</p>
            <dl class="metrics-grid">
              <div><dt>Candidate sites</dt><dd>${candidateAccess.rows.length}</dd></div>
              <div><dt>Realizable now</dt><dd>${candidateAccess.realizableCount ?? candidateAccess.rows.length}</dd></div>
              <div><dt>Mean candidate cumulative</dt><dd>${Number(candidateAccess.meanCumulative ?? 0).toFixed(3)}</dd></div>
              <div><dt>Mean candidate gravity</dt><dd>${Number(candidateAccess.meanGravity ?? 0).toFixed(3)}</dd></div>
              <div><dt>Best cumulative site</dt><dd>${candidateAccess.bestCumulative ? `(${candidateAccess.bestCumulative.u}, ${candidateAccess.bestCumulative.v}) = ${candidateAccess.bestCumulative.cumulative.toFixed(3)}` : 'NA'}</dd></div>
              <div><dt>Best gravity site</dt><dd>${candidateAccess.bestGravity ? `(${candidateAccess.bestGravity.u}, ${candidateAccess.bestGravity.v}) = ${candidateAccess.bestGravity.gravity.toFixed(3)}` : 'NA'}</dd></div>
            </dl>
          </div>
        ` : `<p class="note">${escapeHtml(candidateAccess?.message || 'Candidate-site accessibility is unavailable for the current arrival mode.')}</p>`}
        ${potentialAccess?.available ? `
          <div style="margin-top:0.9rem">
            <p><strong>All potential lattice-site accessibility</strong> (${escapeHtml(String(potentialAccess.source || 'unknown').replaceAll('_', ' '))})</p>
            <dl class="metrics-grid">
              <div><dt>Potential sites</dt><dd>${potentialAccess.rows.length}</dd></div>
              <div><dt>Realizable now</dt><dd>${potentialAccess.realizableCount ?? 0}</dd></div>
              <div><dt>Mean potential cumulative</dt><dd>${Number(potentialAccess.meanCumulative ?? 0).toFixed(3)}</dd></div>
              <div><dt>Mean potential gravity</dt><dd>${Number(potentialAccess.meanGravity ?? 0).toFixed(3)}</dd></div>
              <div><dt>Best potential cumulative</dt><dd>${potentialAccess.bestCumulative ? `(${potentialAccess.bestCumulative.u}, ${potentialAccess.bestCumulative.v}) = ${potentialAccess.bestCumulative.cumulative.toFixed(3)}` : 'NA'}</dd></div>
              <div><dt>Best potential gravity</dt><dd>${potentialAccess.bestGravity ? `(${potentialAccess.bestGravity.u}, ${potentialAccess.bestGravity.v}) = ${potentialAccess.bestGravity.gravity.toFixed(3)}` : 'NA'}</dd></div>
            </dl>
            <p class="note">Potential-site accessibility covers all currently empty in-bounds lattice sites. Sites with no attachable local targets are listed as not realizable under the current rules.</p>
          </div>
        ` : `<p class="note">${escapeHtml(potentialAccess?.message || 'Potential-site accessibility is unavailable for the current run.')}</p>`}
      ` : `<p class="panel__hint">${escapeHtml(access?.message || 'Transport accessibility is unavailable for this run.')}</p>`)}
    `;
    wirePanelToggle(refs.accessibilityPanel);
    if (!state.ui.collapsedPanels.accessibilityPanel) {
      const button = refs.accessibilityPanel.querySelector('#export-accessibility-csv');
      if (button) {
        button.addEventListener('click', () => {
          const rows = ['id,cumulative_access,gravity_access'];
          state.simulation.nodes.forEach((node) => {
            rows.push([node.id, access.cumulativeById[node.id] ?? 0, access.gravityById[node.id] ?? 0].join(','));
          });
          exportText('transport-accessibility.csv', rows.join('\n'), 'text/csv;charset=utf-8');
        });
      }
      const candidateButton = refs.accessibilityPanel.querySelector('#export-candidate-accessibility-csv');
      if (candidateButton && candidateAccess?.available) {
        candidateButton.addEventListener('click', () => {
          const rows = ['lattice_u,lattice_v,x,y,attachable_neighbor_count,provisional_targets,realizable_now,candidate_cumulative_access,candidate_gravity_access'];
          candidateAccess.rows.forEach((row) => {
            rows.push([
              row.u,
              row.v,
              row.x.toFixed(6),
              row.y.toFixed(6),
              row.attachableNeighborCount,
              `"${row.provisionalTargetIds.join('|')}"`,
              row.realizableNow ? 1 : 0,
              row.realizableNow ? row.cumulative.toFixed(6) : '',
              row.realizableNow ? row.gravity.toFixed(6) : '',
            ].join(','));
          });
          exportText('candidate-site-accessibility.csv', rows.join('\n'), 'text/csv;charset=utf-8');
        });
      }
      const potentialButton = refs.accessibilityPanel.querySelector('#export-potential-accessibility-csv');
      if (potentialButton && potentialAccess?.available) {
        potentialButton.addEventListener('click', () => {
          const rows = ['lattice_u,lattice_v,x,y,is_current_candidate,attachable_neighbor_count,provisional_targets,realizable_now,potential_cumulative_access,potential_gravity_access'];
          potentialAccess.rows.forEach((row) => {
            rows.push([
              row.u,
              row.v,
              row.x.toFixed(6),
              row.y.toFixed(6),
              row.isCurrentCandidate ? 1 : 0,
              row.attachableNeighborCount,
              `"${row.provisionalTargetIds.join('|')}"`,
              row.realizableNow ? 1 : 0,
              row.realizableNow ? row.cumulative.toFixed(6) : '',
              row.realizableNow ? row.gravity.toFixed(6) : '',
            ].join(','));
          });
          exportText('potential-site-accessibility.csv', rows.join('\n'), 'text/csv;charset=utf-8');
        });
      }
    }
    refs.accessibilityLive.textContent = liveSummary;
  }

  function renderCharts() {
    refs.chartPanel.innerHTML = `
      ${panelHeader('Charts', 'chartPanel')}
      ${panelBody('chartPanel', `
        <div class="tab-bar">
          ${[
            ['degree', 'Degree histogram'],
            ['ccdf', 'Degree CCDF'],
            ['edgeLength', 'Edge lengths'],
            ['timeSeries', 'Time series'],
            ['scatter', 'Scatter'],
            ['batch', 'Batch'],
          ].map(([id, label]) => `<button data-chart-tab="${id}" class="${state.ui.activeChartTab === id ? 'active' : ''}">${label}</button>`).join('')}
        </div>
        <div id="chart-content"></div>
      `)}
    `;
    wirePanelToggle(refs.chartPanel);
    if (state.ui.collapsedPanels.chartPanel) {
      return;
    }
    refs.chartPanel.querySelectorAll('[data-chart-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        state.ui.activeChartTab = button.dataset.chartTab;
        renderCharts();
      });
    });
    const container = refs.chartPanel.querySelector('#chart-content');
    if (state.ui.activeChartTab === 'degree') {
      renderDegreeHistogram(container);
    } else if (state.ui.activeChartTab === 'ccdf') {
      renderCcdf(container);
    } else if (state.ui.activeChartTab === 'edgeLength') {
      renderEdgeLengthHistogram(container);
    } else if (state.ui.activeChartTab === 'timeSeries') {
      renderTimeSeries(container);
    } else if (state.ui.activeChartTab === 'scatter') {
      renderScatter(container);
    } else {
      renderBatchChart(container);
    }
  }

  function chartFrame(title, subtitle) {
    return `
      <div class="chart-frame__header">
        <div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(subtitle)}</p>
        </div>
        <div class="control-row">
          <button data-chart-export="svg">Export SVG</button>
          <button data-chart-export="png">Export PNG</button>
        </div>
      </div>
      <div class="chart-stage"></div>
    `;
  }

  function wireChartExport(container, svgFilename, pngFilename) {
    const svgButton = container.querySelector('[data-chart-export="svg"]');
    const pngButton = container.querySelector('[data-chart-export="png"]');
    svgButton.addEventListener('click', () => {
      const svg = container.querySelector('svg');
      if (svg) {
        exportText(svgFilename, svg.outerHTML, 'image/svg+xml;charset=utf-8');
      }
    });
    pngButton.addEventListener('click', async () => {
      const svg = container.querySelector('svg');
      if (svg) {
        await exportSvgAsPng(pngFilename, svg.outerHTML, 1200, 700);
      }
    });
  }

  function renderDegreeHistogram(container) {
    container.innerHTML = chartFrame('Degree histogram', 'Observed degree frequencies in the current run.');
    const stage = container.querySelector('.chart-stage');
    const width = 760;
    const height = 360;
    const margin = { top: 28, right: 28, bottom: 46, left: 64 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const degrees = state.simulation.nodes.map((node) => node.degree);
    const maxDegree = Math.max(...degrees, 0);
    const counts = new Map();
    degrees.forEach((degree) => counts.set(degree, (counts.get(degree) || 0) + 1));
    const data = d3.range(0, maxDegree + 1).map((degree) => ({ degree, count: counts.get(degree) || 0 }));
    const maxCount = Math.max(...data.map((entry) => entry.count), 1);
    const svg = d3.create('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('class', 'chart-svg');
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleBand().domain(data.map((entry) => String(entry.degree))).range([0, innerWidth]).padding(0.12);
    const y = d3.scaleLinear().domain([0, maxCount]).range([innerHeight, 0]);
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y).ticks(Math.min(8, maxCount + 1)).tickFormat(d3.format('d'));
    g.selectAll('rect').data(data).enter().append('rect')
      .attr('x', (entry) => x(String(entry.degree)))
      .attr('y', (entry) => y(entry.count))
      .attr('width', x.bandwidth())
      .attr('height', (entry) => innerHeight - y(entry.count))
      .attr('fill', '#0b4f6c')
      .attr('opacity', 0.82);
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((axis) => axis.selectAll('text').attr('fill', '#667085').attr('font-size', 10))
      .call((axis) => axis.selectAll('path,line').attr('stroke', '#98a2b3'));
    g.append('g')
      .call(yAxis)
      .call((axis) => axis.selectAll('text').attr('fill', '#667085').attr('font-size', 10))
      .call((axis) => axis.selectAll('path,line').attr('stroke', '#98a2b3'));
    g.append('text').attr('x', innerWidth / 2).attr('y', innerHeight + 34).attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', '#344054').text('Degree');
    g.append('text').attr('x', -innerHeight / 2).attr('y', -46).attr('transform', 'rotate(-90)').attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', '#344054').text('Count');
    stage.appendChild(svg.node());
    wireChartExport(container, 'degree-histogram.svg', 'degree-histogram.png');
  }

  function renderEdgeLengthHistogram(container) {
    container.innerHTML = chartFrame('Edge-length histogram', state.params.planarityMode === 'split_crossings'
      ? 'Original intended link lengths before any split-crossing subdivision.'
      : 'Distance distribution under the preserved unit-square geometry.');
    const stage = container.querySelector('.chart-stage');
    const width = 760;
    const height = 360;
    const margin = { top: 28, right: 28, bottom: 46, left: 64 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const lengths = (state.simulation.referenceLinks && state.simulation.referenceLinks.length > 0
      ? state.simulation.referenceLinks
      : state.simulation.edges).map((edge) => edge.length);
    const svg = d3.create('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('class', 'chart-svg');
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const bins = d3.bin().domain([0, Math.max(...lengths, 1)]).thresholds(18)(lengths);
    const x = d3.scaleLinear().domain([0, Math.max(...lengths, 1)]).range([0, innerWidth]);
    const y = d3.scaleLinear().domain([0, Math.max(...bins.map((bin) => bin.length), 1)]).nice().range([innerHeight, 0]);
    const xAxis = d3.axisBottom(x).ticks(6);
    const yAxis = d3.axisLeft(y).ticks(6).tickFormat(d3.format('d'));
    g.selectAll('rect').data(bins).enter().append('rect')
      .attr('x', (bin) => x(bin.x0 || 0) + 1)
      .attr('y', (bin) => y(bin.length))
      .attr('width', (bin) => Math.max(x(bin.x1 || 0) - x(bin.x0 || 0) - 2, 0))
      .attr('height', (bin) => innerHeight - y(bin.length))
      .attr('fill', '#2f855a')
      .attr('opacity', 0.82);
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((axis) => axis.selectAll('text').attr('fill', '#667085').attr('font-size', 10))
      .call((axis) => axis.selectAll('path,line').attr('stroke', '#98a2b3'));
    g.append('g')
      .call(yAxis)
      .call((axis) => axis.selectAll('text').attr('fill', '#667085').attr('font-size', 10))
      .call((axis) => axis.selectAll('path,line').attr('stroke', '#98a2b3'));
    g.append('text').attr('x', innerWidth / 2).attr('y', innerHeight + 34).attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', '#344054').text('Edge length');
    g.append('text').attr('x', -innerHeight / 2).attr('y', -46).attr('transform', 'rotate(-90)').attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', '#344054').text('Count');
    stage.appendChild(svg.node());
    wireChartExport(container, 'edge-length-histogram.svg', 'edge-length-histogram.png');
  }

  function renderCcdf(container) {
    container.innerHTML = chartFrame('Degree CCDF', `Tail diagnostics: preferred model ${String(state.tail.preferredModel).replace(/_/g, ' ')}.`);
    const stage = container.querySelector('.chart-stage');
    const width = 760;
    const height = 360;
    const margin = { top: 28, right: 28, bottom: 46, left: 64 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const support = state.tail.support.length > 0 ? state.tail.support : [1];
    const ccdf = state.tail.ccdf.length > 0 ? state.tail.ccdf : [1];
    const svg = d3.create('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('class', 'chart-svg');
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLog().domain([Math.max(1, support[0]), Math.max(...support, 1)]).range([0, innerWidth]);
    const y = d3.scaleLog().domain([Math.max(1e-3, Math.min(...ccdf)), 1]).range([innerHeight, 0]);
    const xAxis = d3.axisBottom(x).ticks(6, '~g');
    const yAxis = d3.axisLeft(y).ticks(6, '~g');
    const line = d3.line().x((_, index) => x(support[index])).y((value) => y(Math.max(value, 1e-3)));
    g.append('path').attr('d', line(ccdf)).attr('fill', 'none').attr('stroke', '#0b4f6c').attr('stroke-width', 2.2);
    g.selectAll('circle').data(support).enter().append('circle')
      .attr('cx', (value) => x(value))
      .attr('cy', (_, index) => y(Math.max(ccdf[index], 1e-3)))
      .attr('r', 2.4)
      .attr('fill', '#0b4f6c');
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((axis) => axis.selectAll('text').attr('fill', '#667085').attr('font-size', 10))
      .call((axis) => axis.selectAll('path,line').attr('stroke', '#98a2b3'));
    g.append('g')
      .call(yAxis)
      .call((axis) => axis.selectAll('text').attr('fill', '#667085').attr('font-size', 10))
      .call((axis) => axis.selectAll('path,line').attr('stroke', '#98a2b3'));
    g.append('text').attr('x', innerWidth / 2).attr('y', innerHeight + 34).attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', '#344054').text('Degree (log scale)');
    g.append('text').attr('x', -innerHeight / 2).attr('y', -46).attr('transform', 'rotate(-90)').attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', '#344054').text('CCDF (log scale)');
    stage.appendChild(svg.node());
    wireChartExport(container, 'degree-ccdf.svg', 'degree-ccdf.png');
  }

  function renderTimeSeries(container) {
    container.innerHTML = chartFrame('Growth time series', 'Trajectory diagnostics recorded across simulation steps.');
    const stage = container.querySelector('.chart-stage');
    const width = 760;
    const height = 360;
    const margin = { top: 28, right: 28, bottom: 46, left: 64 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const series = [
      { key: 'maxDegree', label: 'Max degree', color: '#0b4f6c' },
      { key: 'shareAtCapacity', label: 'Share saturated', color: '#b42318' },
      { key: 'averageClustering', label: 'Clustering', color: '#2f855a' },
      { key: 'connectedComponents', label: 'Component count', color: '#805ad5' },
      { key: 'totalNetworkLength', label: 'Total length', color: '#c05621' },
    ];
    const points = state.simulation.history.map((snapshot) => ({
      step: snapshot.step,
      maxDegree: snapshot.metrics.maxDegree,
      shareAtCapacity: snapshot.metrics.shareAtCapacity,
      averageClustering: snapshot.metrics.averageClustering,
      connectedComponents: snapshot.metrics.connectedComponents,
      totalNetworkLength: snapshot.metrics.totalNetworkLength,
    }));
    const svg = d3.create('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('class', 'chart-svg');
    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLinear().domain([0, Math.max(...points.map((point) => point.step), 1)]).range([0, innerWidth]);
    const y = d3.scaleLinear().domain([0, Math.max(...series.flatMap((item) => points.map((point) => point[item.key])), 1)]).nice().range([innerHeight, 0]);
    const xAxis = d3.axisBottom(x).ticks(6).tickFormat(d3.format('d'));
    const yAxis = d3.axisLeft(y).ticks(6);
    series.forEach((item) => {
      const line = d3.line().x((point) => x(point.step)).y((point) => y(point[item.key]));
      g.append('path').attr('d', line(points)).attr('fill', 'none').attr('stroke', item.color).attr('stroke-width', 2);
    });
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((axis) => axis.selectAll('text').attr('fill', '#667085').attr('font-size', 10))
      .call((axis) => axis.selectAll('path,line').attr('stroke', '#98a2b3'));
    g.append('g')
      .call(yAxis)
      .call((axis) => axis.selectAll('text').attr('fill', '#667085').attr('font-size', 10))
      .call((axis) => axis.selectAll('path,line').attr('stroke', '#98a2b3'));
    g.append('text').attr('x', innerWidth / 2).attr('y', innerHeight + 34).attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', '#344054').text('Step');
    g.append('text').attr('x', -innerHeight / 2).attr('y', -46).attr('transform', 'rotate(-90)').attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', '#344054').text('Metric value');
    const legend = g.append('g').attr('transform', `translate(${Math.max(innerWidth - 160, 0)}, 6)`);
    series.forEach((item, index) => {
      const row = legend.append('g').attr('transform', `translate(0, ${index * 16})`);
      row.append('line').attr('x1', 0).attr('x2', 16).attr('y1', 0).attr('y2', 0).attr('stroke', item.color).attr('stroke-width', 2);
      row.append('text').attr('x', 22).attr('y', 4).attr('font-size', 10).attr('fill', '#475467').text(item.label);
    });
    stage.appendChild(svg.node());
    wireChartExport(container, 'growth-time-series.svg', 'growth-time-series.png');
  }

  function renderScatter(container) {
    container.innerHTML = chartFrame('Scatter diagnostics', 'Degree-age and degree-capacity relationships for the current run.');
    const stage = container.querySelector('.chart-stage');
    const width = 760;
    const height = 360;
    const svg = d3.create('svg').attr('viewBox', `0 0 ${width} ${height}`).attr('class', 'chart-svg');
    const panels = [
      { title: 'Degree vs age', points: state.simulation.nodes.map((node) => ({ x: node.birthStep, y: node.degree })), color: '#0b4f6c' },
      { title: 'Degree vs residual capacity', points: state.simulation.nodes.map((node) => ({ x: node.residualCapacity, y: node.degree })), color: '#2f855a' },
    ];
    panels.forEach((panel, panelIndex) => {
      const margin = { top: 40, right: 24, bottom: 42, left: 58 };
      const innerWidth = width / 2 - margin.left - margin.right - 24;
      const innerHeight = height - margin.top - margin.bottom;
      const offsetX = panelIndex * (width / 2) + margin.left + panelIndex * 12;
      const g = svg.append('g').attr('transform', `translate(${offsetX},${margin.top})`);
      const x = d3.scaleLinear().domain([0, Math.max(...panel.points.map((point) => point.x), 1)]).range([0, innerWidth]);
      const y = d3.scaleLinear().domain([0, Math.max(...panel.points.map((point) => point.y), 1)]).range([innerHeight, 0]);
      const xAxis = d3.axisBottom(x).ticks(5);
      const yAxis = d3.axisLeft(y).ticks(5);
      g.append('text').attr('x', innerWidth / 2).attr('y', -10).attr('text-anchor', 'middle').attr('font-size', 11).attr('fill', '#344054').text(panel.title);
      g.selectAll('circle').data(panel.points).enter().append('circle')
        .attr('cx', (point) => x(point.x))
        .attr('cy', (point) => y(point.y))
        .attr('r', 3)
        .attr('fill', panel.color)
        .attr('opacity', 0.75);
      g.append('g')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(xAxis)
        .call((axis) => axis.selectAll('text').attr('fill', '#667085').attr('font-size', 10))
        .call((axis) => axis.selectAll('path,line').attr('stroke', '#98a2b3'));
      g.append('g')
        .call(yAxis)
        .call((axis) => axis.selectAll('text').attr('fill', '#667085').attr('font-size', 10))
        .call((axis) => axis.selectAll('path,line').attr('stroke', '#98a2b3'));
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 34)
        .attr('text-anchor', 'middle')
        .attr('font-size', 10)
        .attr('fill', '#344054')
        .text(panelIndex === 0 ? 'Birth step' : 'Residual capacity');
      g.append('text')
        .attr('x', -innerHeight / 2)
        .attr('y', -40)
        .attr('transform', 'rotate(-90)')
        .attr('text-anchor', 'middle')
        .attr('font-size', 10)
        .attr('fill', '#344054')
        .text('Degree');
    });
    stage.appendChild(svg.node());
    wireChartExport(container, 'scatter-diagnostics.svg', 'scatter-diagnostics.png');
  }

  function renderBatchChart(container) {
    container.innerHTML = chartFrame('Batch summaries', 'Aggregated means, variation, and early-stop behavior across replications.');
    const stage = container.querySelector('.chart-stage');
    if (!state.batch.result) {
      stage.innerHTML = '<p class="note">Run a batch to populate this table.</p>';
      return;
    }
    stage.innerHTML = renderBatchTable(state.batch.result);
    const svgButton = container.querySelector('[data-chart-export="svg"]');
    const pngButton = container.querySelector('[data-chart-export="png"]');
    svgButton.disabled = true;
    pngButton.disabled = true;
  }

  function renderBatchTable(result) {
    return `
      <div class="batch-table-wrap">
        <table class="batch-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Replications</th>
              <th>Early-stop rate</th>
              <th>Truncation rate</th>
              <th>Mean degree</th>
              <th>Degree Gini</th>
              <th>Mean edge length</th>
            </tr>
          </thead>
          <tbody>
            ${result.summaries.map((summary) => `
              <tr>
                <td>${escapeHtml(summary.scenarioLabel)}</td>
                <td>${summary.replications}</td>
                <td>${summary.earlyStopRate.toFixed(3)}</td>
                <td>${summary.truncationRate.toFixed(3)}</td>
                <td>${summary.metrics.meanDegree.mean.toFixed(3)}</td>
                <td>${summary.metrics.degreeGini.mean.toFixed(3)}</td>
                <td>${summary.metrics.meanEdgeLength.mean.toFixed(3)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function batchResultCsv(result) {
    const rows = ['scenario,replications,earlyStopRate,truncationRate,meanDegree,degreeGini,meanEdgeLength'];
    result.summaries.forEach((summary) => {
      rows.push([
        summary.scenarioLabel,
        summary.replications,
        summary.earlyStopRate,
        summary.truncationRate,
        summary.metrics.meanDegree.mean,
        summary.metrics.degreeGini.mean,
        summary.metrics.meanEdgeLength.mean,
      ].join(','));
    });
    return rows.join('\n');
  }

  function createBatchWorker() {
    const workerFunctions = [
      clone,
      createRng,
      nextRandom,
      randomUniform,
      randomPoint,
      averageEdgeLength,
      meshAngleStepDegrees,
      allowedMeshAngles,
      smallestAngleDifference,
      snapAngleToAllowed,
      generateCrossSeedCells,
      latticeCoordinatesForPoint,
      assignLatticeCoordinates,
      isMeshAdjacentCandidate,
      latticeNeighborOffsets,
      countAttachableMeshNeighbors,
      meshBasisForAngle,
      solveBasisCoefficients,
      pointFromBasis,
      dominantAllowedAngle,
      projectedLatticeGeometry,
      projectedLatticePoints,
      projectedLatticeCandidates,
      networkBiasedLatticeCandidates,
      nearestExistingDistance,
      randomLogNormal,
      randomNormal,
      weightedChoiceIndex,
      deriveSeed,
      resolveCapacityValue,
      minimumCapacityForBirth,
      sampleCapacity,
      updateCapacityState,
      euclideanDistance,
      nodeIdFromIndex,
      edgeIdFor,
      nodeMap,
      cross2d,
      segmentIntersectionPoint,
      edgeWouldCrossExisting,
      findCrossingsForConnection,
      incrementNodeDegree,
      recordReferenceLink,
      removeEdgeFromState,
      addEdgeToState,
      createGeneratedIntersectionNode,
      applyConnectionWithPlanarity,
      validateSimulationParams,
      createSeedGraph,
      computeMeshLogAdjustment,
      computeAttachmentWeight,
      computeFeasibleProbabilities,
      selectSequentialNeighbors,
      gini,
      buildAdjacency,
      connectedComponents,
      averageClustering,
      bfsDistances,
      largestComponentStats,
      degreeAssortativity,
      median,
      countSquares,
      ccw,
      segmentsCross,
      crossingDiagnostics,
      computeNetworkMetrics,
      empiricalCcdf,
      hurwitzZeta,
      powerLawAlphaMle,
      powerLawKs,
      powerLawAic,
      exponentialFit,
      lognormalFit,
      fitTailModels,
      historySnapshot,
      initializeSimulation,
      stepSimulation,
      runSimulation,
      summarizeMetric,
      summarizeBatchScenario,
      runBatchConfig,
    ];
    const source = `
const VERY_LARGE = 'very_large';
const NON_CROSSING_RETRY_LIMIT = ${NON_CROSSING_RETRY_LIMIT};
${workerFunctions.map((fn) => fn.toString()).join('\n\n')}
self.onmessage = (event) => {
  const { type, config } = event.data || {};
  if (type !== 'run-batch') return;
  const result = runBatchConfig(config, (progress) => self.postMessage({ type: 'progress', progress }));
  self.postMessage({ type: 'result', result });
};
`;
    const blob = new Blob([source], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    return { worker: new Worker(url), url };
  }

  function currentBatchConfig() {
    return {
      scenarios: scenarioPresets.slice(0, 4).map((preset) => ({
        id: preset.id,
        label: preset.label,
        params: sanitizeParams(mergeScenarioParams(preset.params)),
      })),
      replications: state.params.replicationCount,
    };
  }

  function completeBatch(result) {
    state.batch.result = result;
    state.batch.progress = 1;
    state.batch.running = false;
    state.batch.saved = [
      {
        id: `batch-${Date.now()}`,
        createdAt: new Date().toISOString(),
        label: 'latest batch',
        result,
      },
      ...state.batch.saved.slice(0, 9),
    ];
    storeBatchResults();
    render();
  }

  function runBatchFallback(config) {
    const runs = [];
    const jobs = [];
    config.scenarios.forEach((scenario) => {
      for (let replication = 0; replication < config.replications; replication += 1) {
        jobs.push({ scenario, replication });
      }
    });
    const total = jobs.length;
    let index = 0;

    function processChunk() {
      const chunkSize = 1;
      const limit = Math.min(index + chunkSize, total);
      for (; index < limit; index += 1) {
        const job = jobs[index];
        const seed = deriveSeed(job.scenario.params.rngSeed, job.scenario.id, job.replication);
        const runState = runSimulation({ ...job.scenario.params, rngSeed: seed });
        const metrics = computeNetworkMetrics(runState.nodes, runState.edges, runState.params.degreeThreshold);
        const tail = fitTailModels(runState.nodes.map((node) => node.degree));
        runs.push({
          scenarioId: job.scenario.id,
          scenarioLabel: job.scenario.label,
          replication: job.replication,
          seed,
          metrics,
          earlyStopped: runState.status === 'early_stopped',
          terminationReason: runState.terminationReason,
          truncationEvents: runState.truncationEvents,
          totalMissingLinks: runState.totalMissingLinks,
          tail,
        });
      }
      state.batch.progress = total > 0 ? index / total : 1;
      if (state.ui.activePrimaryTab === 'batch') {
        renderBatchView();
      }
      if (index < total) {
        window.setTimeout(processChunk, 0);
        return;
      }
      const result = {
        config,
        runs,
        summaries: config.scenarios.map((scenario) => summarizeBatchScenario(runs.filter((run) => run.scenarioId === scenario.id))),
      };
      completeBatch(result);
    }

    processChunk();
  }

  function runBatch() {
    if (state.batch.running) {
      return;
    }
    state.ui.activePrimaryTab = 'batch';
    state.batch.running = true;
    state.batch.progress = 0.01;
    render();
    const config = currentBatchConfig();

    if (window.location.protocol === 'file:') {
      runBatchFallback(config);
      return;
    }

    const { worker, url } = createBatchWorker();
    worker.onmessage = (event) => {
      if (event.data.type === 'progress') {
        state.batch.progress = event.data.progress;
        if (state.ui.activePrimaryTab === 'batch') {
          renderBatchView();
        }
        return;
      }
      if (event.data.type === 'result') {
        completeBatch(event.data.result);
        worker.terminate();
        URL.revokeObjectURL(url);
      }
    };
    worker.onerror = () => {
      worker.terminate();
      URL.revokeObjectURL(url);
      runBatchFallback(config);
    };
    worker.postMessage({
      type: 'run-batch',
      config,
    });
  }

  function render() {
    refs.shell.className = state.ui.activePrimaryTab === 'paper' || state.ui.paperMode ? 'app-shell app-shell--paper' : 'app-shell';
    renderPrimaryTabs();
    renderSidebar();
    renderRunControls();
    renderMainPanel();
    renderMetricsPanel();
    renderInsightsPanel();
    renderAccessibilityPanel();
    renderCharts();
  }

  function numberField(id, label, value, step, min, max, compact = false, disabled = false) {
    return `<label class="field ${compact ? 'field--compact' : ''} ${disabled ? 'field--disabled' : ''}"><span>${escapeHtml(label)}</span><input id="${id}" type="number" value="${value}" step="${step}" min="${min}" ${Number.isFinite(max) ? `max="${max}"` : ''} ${disabled ? 'disabled' : ''} /></label>`;
  }

  function sidebarSection(id, title, open, body) {
    const expanded = state.ui.sidebarSections[id] ?? open;
    return `
      <details class="sidebar-section" data-sidebar-section="${id}" ${expanded ? 'open' : ''}>
        <summary>${escapeHtml(title)}</summary>
        <div class="sidebar-section__body">${body}</div>
      </details>
    `;
  }

  function checkbox(id, label, checked) {
    return `<label><input id="${id}" type="checkbox" ${checked ? 'checked' : ''}/> ${escapeHtml(label)}</label>`;
  }

  function comparisonMetric(label, baseline, current) {
    const delta = current - baseline;
    return `
      <div>
        <dt>${escapeHtml(label)}</dt>
        <dd>${current.toFixed(3)} <span class="delta ${delta >= 0 ? 'up' : 'down'}">${delta >= 0 ? '+' : ''}${delta.toFixed(3)}</span></dd>
      </div>
    `;
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  document.getElementById('toggle-paper').addEventListener('click', () => {
    state.ui.paperMode = !state.ui.paperMode;
    render();
  });
  document.getElementById('export-bundle').addEventListener('click', exportCurrentBundle);
  document.getElementById('copy-graph-json').addEventListener('click', async () => copyGraphJson());

  initializeAppState();
  render();
