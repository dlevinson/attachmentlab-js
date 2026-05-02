# General Attachment Lab

This repository now has two distinct workspaces:

- [`src/`](src) contains the new React + TypeScript browser app.
- [`web/`](web) contains a browser-openable deliverable with one `index.html` and one bundled-style `main.js`.
- [`python/`](python) contains the legacy Python simulation study and its reproducible experiment pipeline.

The browser app is being built as the primary product: an interactive research tool for simulating, visualising, comparing, and exporting generalized preferential-attachment networks while preserving true model coordinates in the main network view.

If you want the simplest browser entry point, open [`web/index.html`](web/index.html). It loads the standalone [`web/main.js`](web/main.js) app and uses CDN copies of Cytoscape.js and D3.

If you want a standalone end-user guide for that browser-openable version, see [`USER_GUIDE.md`](USER_GUIDE.md).

## Browser App Scope

The web app is designed to let a researcher:

- run a single simulation or step through growth interactively
- preserve true simulated coordinates in the default network view
- inspect metrics, distributions, tail diagnostics, and regime shifts
- compare baseline and modified scenarios side by side
- run batch replications in a web worker
- export graphs, charts, tables, and saved scenarios

## Repository Layout

- [`package.json`](package.json) defines the web app toolchain.
- [`src/types/`](src/types) contains shared TypeScript contracts.
- [`src/model/`](src/model) contains the pure simulation engine port.
- [`src/metrics/`](src/metrics) contains graph metrics and tail diagnostics.
- [`src/components/`](src/components) contains the main research-tool interface panels.
- [`src/workers/`](src/workers) contains the batch execution worker.
- [`MODEL.md`](MODEL.md), [`METHODS.md`](METHODS.md), and [`ARCHITECTURE.md`](ARCHITECTURE.md) document the model, metrics, and code layout.
- [`python/README.md`](python/README.md) documents the legacy Python workflow.

## Working Areas

Use the root for the browser app:

```bash
npm install
npm run dev
npm run build
npm run test:run
```

For analysis and replication:

```bash
npm run analyze:paper -- --smoke
npm run analyze:paper -- --medium
npm run analyze:full -- --smoke
npm run analyze:full -- --medium
npm run analyze:all -- --smoke
npm run analyze:all -- --medium
```

Omit the profile flag for the largest paper-facing run.

The main app entry point is [`src/app/App.tsx`](src/app/App.tsx).

The main research-analysis references are:

- [`TESTING_STRATEGY.md`](TESTING_STRATEGY.md)
- [`EXPERIMENT_RUNBOOK.md`](EXPERIMENT_RUNBOOK.md)
- [`FULL_MODEL_TEST_SUITE.md`](FULL_MODEL_TEST_SUITE.md)
- [`audit/PAPER_REPLICATION_TARGETS_20260407.md`](audit/PAPER_REPLICATION_TARGETS_20260407.md)

For the browser-openable standalone version:

```bash
open web/index.html
```

Use the legacy study from the Python subfolder:

```bash
cd python
python -m src.run_experiments --config configs/benchmark.yaml
```
