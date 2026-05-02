# ARCHITECTURE

The repository is split into two workspaces:

- `src/` for the browser app
- `python/` for the legacy reproducible study

During the current audit/remediation phase, the active implementation reference is the shared standalone engine source in [`src/standalone/browser-core.js`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/src/standalone/browser-core.js). The browser-deliverable [`web/main.js`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js) should now be treated as a generated artifact built from:

- [`src/standalone/browser-core.js`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/src/standalone/browser-core.js)
- [`src/standalone/browser-app.js`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/src/standalone/browser-app.js)

The tranche harnesses and the TypeScript parity wrapper should consume that shared core source directly so browser delivery, TS simulation, and experiment scripts stop drifting.

The current model taxonomy should be read as four layered families:

- baseline generalized model
- arrival extensions
- lattice/mesh extensions
- planarity/accessibility extensions

Baseline behavior means:

- `arrivalMode = uniform_square`
- `meshMode = off`
- `planarityMode = none`
- baseline arrival and target selection

Exploratory controls must not affect that baseline path unless they are explicitly enabled. In particular, `split_crossings` should be interpreted as a distinct transport-growth family rather than as a cosmetic variant of the baseline model.

Within the repository:

- `src/standalone/browser-core.js` contains the shared browser-audited pure engine
- `src/standalone/browser-app.js` contains standalone browser UI wiring
- `web/main.js` is the generated standalone bundle

Within the TypeScript app:

- `src/model/` contains pure simulation logic
- `src/metrics/` contains graph summaries and tail diagnostics
- `src/store/` owns the Zustand state model
- `src/graph/` adapts simulation state into Cytoscape elements and styles
- `src/components/` contains research-tool UI panels
- `src/charts/` contains SVG chart views driven by D3 utilities
- `src/workers/` contains the batch execution worker
- `src/utils/` contains validation, import/export, and persistence helpers

The simulation engine is intentionally UI-agnostic so single runs, batch workers, and tests all share the same model code.
