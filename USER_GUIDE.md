# General Attachment Lab User Guide

This guide is for the standalone browser-deliverable version of the lab:

- [web/index.html](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/index.html)

It explains how to use the `file://` tool as a research lab for generalized preferential attachment, planarity, mesh framing, and accessibility experiments.

## Opening The Lab

The simplest way to use the tool is:

```bash
open web/index.html
```

The standalone app loads:

- [web/main.js](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js)
- Cytoscape.js from `unpkg`
- D3 from `jsdelivr`

Because the standalone page uses CDN libraries, opening `web/index.html` normally requires an internet connection the first time you use it in the browser session.

## What The Lab Is For

The standalone app is designed for four kinds of work:

1. Run one simulation and inspect the resulting network, metrics, and charts.
2. Step through the growth process arrival by arrival.
3. Compare a current run against a saved baseline or copied scenarios.
4. Run browser-side batch experiments using the same underlying simulation logic.

The network view preserves true simulated coordinates in the unit square. Cytoscape is used for interaction and D3 is used for charts and accessibility overlays.

## Layout

The app has three columns plus top-level tabs.

### Top-Level Tabs

- `Simulation`: main interactive mode.
- `Comparison`: compare the current run against a saved baseline and copied scenarios.
- `Batch`: run replications and export aggregated summaries.
- `Paper mode`: a cleaner presentation mode for figure production, with caption drafting.

### Left Column: Parameters

This is where you define the scenario and control execution.

### Center Column

- `Network view`
- `Run status`
- `Charts`

### Right Column

- `Metrics`
- `Insights`
- `Transport accessibility`

## Quick Start

If you want a fast baseline workflow:

1. Open [web/index.html](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/index.html).
2. Choose a `Preset`.
3. Leave `Simulation` tab active.
4. Click `Run once`.
5. Read:
   - the network in the center
   - summary metrics on the right
   - charts below the network
6. Change one mechanism at a time, then rerun.

Good first comparisons are:

- `BA benchmark` versus `General model`
- `phi = 0` versus higher `phi`
- lower versus higher `kappa`
- `none` versus `reject_crossings` versus `split_crossings`

## Running The Simulation

The sticky action buttons at the top of the sidebar are the main execution controls.

- `Run once`: run from the current parameter set to termination.
- `Step arrival`: advance by one arriving node.
- `Play` / `Pause`: animate repeated arrival steps using the current `Animation ms`.
- `Reset`: rebuild the simulation from the current parameter values and seed.

### When To Use Each One

- Use `Run once` when you want the final network quickly.
- Use `Step arrival` when you want to inspect local target choice, planarity events, or changing accessibility conditions.
- Use `Play` when you want a slow visual build-up of the network.
- Use `Reset` after changing parameters if you want to restart from a clean initial condition.

## Sidebar Parameters

The sidebar is grouped by model role rather than one long flat control list.

### Simulation Scope

This section controls run scale and execution settings.

- `N`: final number of exogenously arriving nodes.
- `kappa`: number of links each arriving node attempts to form.
- `RNG seed`: deterministic seed for reproducible runs.
- `Animation ms`: delay between arrivals when using `Play`.
- `Replications`: only active in `Batch` mode.

### Network Initialization

This section controls the starting graph before growth begins.

#### Lattice Framing

- `Mesh mode`: `Off` or `Grid bias`
- `Mesh angle set`: lattice family used when grid bias is active

This geometric frame can affect later arrival and topology rules, especially in mesh and planarity experiments.

#### Seed And Capacity At Birth

- `m0`: initial node count
- `K`: default capacity in the constant-capacity case
- `Seed graph`: `Complete`, `Ring`, `Small grid`, `Point lattice`
- `Capacity mode`: `Constant`, `Uniform`, or `Lognormal`

When `Capacity mode` is heterogeneous, additional controls appear for its parameters.

### Arrival Model

This section controls where new nodes appear before they choose targets.

#### Arrival Process

- `Uniform in square`: baseline spatial arrival over the unit square
- `Uniform on lattice`: arrival only on admissible lattice sites
- `Near existing network`: arrivals biased toward the current network
- `Outside occupied region`: frontier-style outward growth

Additional controls such as `arrival distance`, `arrival distance sd`, and `mesh spacing` are only active when the current mode makes them meaningful.

#### Arrival Preferences

- `Baseline arrival ranking`: no access weighting of candidate sites
- `Access-weighted arrivals`: rank admissible arrival sites by accessibility

If access-weighted arrivals are active, you can also set:

- `Arrival access metric`: `Gravity access` or `Cumulative access`
- `arrival access strength`

### Connectivity Panel

This section controls how feasible targets are weighted and constrained.

#### Attachment Kernel

- `alpha`: degree or accumulated-reach effect
- `beta`: residual-capacity effect
- `phi`: power-cost deterrence
- `lambda`: exponential-cost deterrence
- `Impedance type`: `Power cost` or `Exponential cost`
- `Selection rule`: `Baseline kernel` or `Access-weighted kernel`
- `Access semantics`: `Network access`, `Seed-only access`, or `Weighted opportunity access`

If access-weighted target selection is active, the panel also enables:

- `Access metric`
- `access strength`

#### Topology Constraints

- `Planarity mode`: `None`, `Reject crossings`, or `Split crossings`
- `Mesh adjacency`
- `mesh nearest q`
- `mesh angle bias`
- `access radius`
- `access decay`

These controls determine which targets are admissible after the arrival site is fixed and before the final connection set is realized.

### Notation Cards

The `Arrival Model notation` and `Connectivity Model notation` cards summarize the current model interpretation in compact mathematical form. They are closed by default and are useful when you want to connect the UI back to the formal model.

## Reading The Network View

The `Network view` is the main geometric display.

### What You See

- nodes at their simulated coordinates
- edges between realized node pairs
- optional split nodes and split links under `split_crossings`
- optional lattice overlay when `Grid bias` is active
- optional coordinate ticks and scale bar

### Toolbar Controls

You can change:

- node color mode
- whether edges are colored by length
- whether the unit-square boundary is shown
- whether the lattice overlay is shown
- whether coordinates are shown
- whether the scale bar is shown
- whether saturated nodes are highlighted
- whether the newest node and selected targets are highlighted
- whether attachment weights are shown

### Attachment-Weight Labels

When `attachment weights` is enabled, the node labels show the current probabilities for the **first sequential choice** of the most recent arrival. This is most useful after `Step arrival`, when you want to inspect one arrival in detail.

### Hover Tooltips

Hovering a node shows:

- degree
- capacity and residual capacity
- weight and type-share values
- accessibility values
- position
- birth step
- whether it is a split node or lonely node

Hovering an edge shows:

- endpoints
- length
- whether it is an arrival edge or split edge
- birth step

## Run Status

The `Run status` panel is collapsed by default. Open it when you want arrival-by-arrival diagnostics.

This is the best panel for checking:

- current status
- latest arrival
- selected targets
- sequential rounds of target choice
- planarity or truncation behavior during the run

Use it together with `Step arrival` when you want a more forensic view of the growth process.

## Metrics, Insights, And Charts

### Metrics Panel

The `Metrics` panel reports the main graph summary statistics, including:

- node and edge counts
- split nodes, split links, split events
- crossing candidates seen and admitted
- mean and max degree
- degree Gini
- share at capacity
- connected components
- clustering
- path length and diameter on the largest connected component
- assortativity
- edge-length statistics
- cyclomatic number
- directional-bias indicators

### Insights Panel

The `Insights` panel writes short automatic interpretations from the current run. It is not a substitute for the metrics, but it is useful for quick regime reading, especially when comparing the current run to a saved baseline.

### Charts Panel

The `Charts` panel provides tabs for:

- degree histogram
- edge-length histogram
- degree CCDF
- growth time series
- scatter diagnostics

Each chart can be exported as SVG or PNG.

## Transport Accessibility

The `Transport accessibility` panel summarizes shortest-path accessibility over realized network edge length.

It reports:

- radius and decay parameters
- mean cumulative access
- mean gravity access
- best cumulative-access node
- best gravity-access node

When available, it also reports:

- current arrival-candidate accessibility
- all potential lattice-site accessibility

These are especially useful when you are using:

- `Access-weighted arrivals`
- `Access-weighted kernel`
- non-default `Access semantics`

### Access Semantics

- `Network access`: all realized nodes act as destinations
- `Seed-only access`: only seed nodes count as destinations
- `Weighted opportunity access`: destination weight depends on node `weight` and `typeShare`

### Accessibility In The Network View

If you change node color mode to:

- `access cumulative`
- `access gravity`

the network view adds a choropleth-style surface behind the network so you can see the accessibility field directly.

## Comparison Mode

Use the `Comparison` tab when you want a current-versus-baseline reading.

Recommended workflow:

1. Run a baseline scenario in `Simulation`.
2. Use `Save baseline`.
3. Change one parameter or mechanism.
4. Run again.
5. Open `Comparison`.

The comparison tab highlights differences in:

- mean degree
- degree Gini
- share at capacity
- mean edge length
- clustering

You can also keep multiple copied scenarios with `Copy scenario`.

## Batch Mode

Use the `Batch` tab when you want replications rather than one-off runs.

### What Batch Mode Does

- uses the same simulation logic as the single-run view
- runs repeated replications in a browser worker
- aggregates results into summary tables

### How To Use It

1. Set your parameters in the sidebar.
2. Switch to `Batch`.
3. Set `Replications` in `Simulation Scope`.
4. Click `Run batch`.
5. Export results as CSV or JSON if needed.

## Presets

The `Preset` menu is the quickest way to move between benchmark scenarios.

Use presets when you want to:

- reproduce the paper-facing baseline regimes
- jump into a planarity or accessibility extension case
- avoid manual re-entry of many coupled parameters

After loading a preset, it is still a live scenario: you can modify individual parameters and rerun.

## Export And Save Options

The standalone lab supports several export paths.

### Header-Level Exports

- `Export data bundle`
- `Copy graph JSON`
- `Paper mode`

### Sidebar Exports

- `Export scenario`
- `Import scenario`
- `Export graph JSON`
- `Export network SVG`
- `Export network PNG`
- `Export GMNS nodes`
- `Export GMNS links`

### Main-Panel And Chart Exports

- network PNG and SVG
- chart SVG and PNG
- batch CSV and JSON
- accessibility CSV exports where available

## Paper Mode

`Paper mode` is a presentation-oriented view of the same scenario.

Use it when you want to:

- simplify the appearance for figures
- export a cleaner network figure
- draft a caption while looking at the current figure state

It does not change the model mechanics. It changes the presentation layer.

## Browser-Build Caveats

The standalone `file://` build is meant for interactive research use, but it is not an unlimited batch engine.

Important caveats:

- It depends on CDN-loaded Cytoscape.js and D3.
- `Transport accessibility` is disabled above `600` nodes in the standalone browser build to keep the UI responsive.
- Candidate-site and potential-site accessibility are also disabled above `600` realized nodes in the standalone browser build.
- The standalone app is best for interactive exploration, figure generation, and light-to-medium browser-side batching.
- Larger replication programs are better handled through the analysis scripts documented in [README.md](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/README.md).

## Suggested Workflows

### Baseline Regime Reading

1. Load a benchmark preset.
2. Run once.
3. Read the network, metrics, and charts.
4. Save a baseline.
5. Change one mechanism at a time.

### Stepwise Mechanism Inspection

1. Choose a scenario with `split_crossings`, mesh bias, or access weighting.
2. Reset.
3. Use `Step arrival`.
4. Watch the `Run status`, `Network view`, and `Metrics` panels together.

### Accessibility Experiment

1. Use a scenario with access weighting enabled.
2. Change `Access semantics`.
3. Rerun.
4. Switch node color mode to `access gravity` or `access cumulative`.
5. Compare the `Transport accessibility` panel and the network surface.

### Batch Comparison

1. Configure a scenario.
2. Move to `Batch`.
3. Set replications.
4. Run the batch.
5. Export CSV or JSON.

## Where To Look Next

For deeper background:

- [MODEL.md](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/MODEL.md)
- [METHODS.md](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/METHODS.md)
- [ARCHITECTURE.md](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/ARCHITECTURE.md)
- [TESTING_STRATEGY.md](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/TESTING_STRATEGY.md)
- [EXPERIMENT_RUNBOOK.md](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/EXPERIMENT_RUNBOOK.md)

If you are only using the browser-deliverable tool, this guide plus the in-app notation cards should be enough to get started.
