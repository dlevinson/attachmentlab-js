# Current Standalone Implementation Behavior

This document describes what the current standalone browser implementation in [`web/main.js`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js) actually does today. It does not describe desired behavior unless the code already implements it.

## Scope

This summary is for the currently active browser-openable build:

- [`web/index.html`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/index.html)
- [`web/main.js`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js)

The React/TypeScript app under `src/` exists, but the active standalone debugging loop the user has been interacting with is the monolithic `web/main.js` build.

## Line-range walkthrough

### Lines 1-83: constants, limits, and presets

The file starts by defining:

- parameter limits
- scenario presets
- a sentinel `VERY_LARGE` capacity value
- a retry limit for reject-crossings placement

The `Grid-ish exploratory` preset is already an extended-mode scenario. It enables mesh mode, reject-crossings, a lattice-style seed, and spacing/angle restrictions. So the preset is not a pure baseline-model run.

### Lines 84-149: defaults and RNG

The file defines default parameters and a deterministic pseudo-random generator. Default parameters already include exploratory settings such as:

- `planarityMode`
- `meshMode`
- `meshAngleSet`
- `meshAdjacencyMode`
- accessibility settings

That means the standalone implementation’s parameter object is broader than the baseline model.

### Lines 152-324: lattice-family helpers and point-lattice seeds

The code defines:

- the active angular family (`30`, `45`, `60`, `90`)
- the underlying lattice basis family
- snapped allowed angles
- basis-vector transforms
- point-lattice seed cell generation

Important current behavior:

- `30` and `60` both use a triangular-family lattice basis
- `45` and `90` both use a square-family basis
- the seed generator for the `cross` seed is no longer a literal square cross; it is a point-lattice shell generator built from the active basis family

### Lines 324-680: lattice coordinates, adjacency, frontier, and rescue

This is where exploratory mesh logic becomes operational.

#### Lattice coordinates

`latticeCoordinatesForPoint(...)` and `assignLatticeCoordinates(...)` project points into the current stored lattice frame using the seed anchor and spacing. Nodes may therefore be treated as lattice nodes even though the baseline model itself never required lattice coordinates.

#### Adjacency

`isMeshAdjacentCandidate(...)` at lines 346-358 restricts adjacency when `meshMode === 'grid_bias'` and `meshAdjacencyMode !== 'none'`.

This means mesh mode does not merely bias arrivals. It can narrow the attachment feasible set itself.

`latticeNeighborOffsets(...)` at lines 361-371 defines the allowed neighbor offsets:

- triangular family: 6 neighbors in `rook`, 12 in `queen`
- square family: 4 neighbors in `rook`, 8 in `queen`

#### Frontier

`unsaturatedFrontierNodes(...)` at lines 395-419 treats a node as frontier only if:

- it has lattice coordinates
- it is unsaturated
- it has at least one unoccupied lattice neighbor that is still inside the unit square

#### Projected outward candidates

`projectedLatticeCandidates(...)` at lines 484-547 constructs outward-shell lattice cells:

- one shell beyond the current maximum source shell
- filtered by in-bounds geometry
- filtered by a minimum-separation rule
- sorted by radial distance and angle deviation

#### Near-existing-network candidates

`networkBiasedLatticeCandidates(...)` at lines 550-633 constructs a different candidate set:

- any unoccupied adjacent lattice cell of any occupied lattice cell
- filtered by minimum spacing
- filtered again by `countAttachableMeshNeighbors(...)`
- scored by attachable-neighbor count, future growth count, shell gain, outward gain, and other heuristics

This is not a direct mathematical model rule. It is an implementation heuristic for exploratory lattice growth.

Also, `projectedLatticeGeometry(...)` reads `state.lastLatticeAngle`, but the current standalone file does not write that field anywhere. So the geometry code contains a remembered-angle hook that is effectively dormant in the current implementation.

#### Rescue

`bestRescueLatticeCandidate(...)` at lines 636-689 still exists in the file as a helper, but after the current cleanup tranche it is no longer used by the normal execution path.

### Lines 705-997: distributions, capacities, edge mutation, and crossings

The file defines:

- normal and lognormal draws
- weighted sampling
- capacity sampling
- Euclidean geometry
- robust segment-intersection logic
- edge addition/removal
- split-crossing node insertion

Important current behavior:

- `edgeWouldCrossExisting(...)` at lines 815-829 uses the same interior-intersection logic as split-crossings
- `createGeneratedIntersectionNode(...)` at lines 927-943 creates new nodes for split-crossings and samples a normal birth capacity for them
- split-created nodes are ordinary nodes in the graph, but they are not automatically assigned lattice coordinates

### Lines 997-1150: validation and warnings

The validation layer checks errors and also emits many warnings for exploratory cases:

- non-planar complete seeds
- low capacity relative to seed degree and `kappa`
- high `phi` or `lambda`
- mesh regularization being active
- angle-family mismatches between seed and lattice

These warnings are descriptive, but they do not stop the code from applying additional exploratory constraints.

### Lines 1152-1271: seed graph construction

`createSeedGraph(...)` supports:

- `complete`
- `ring`
- `grid`
- `cross` (currently labeled in UI as point lattice)

Important current behavior at lines 1266-1268:

- after wiring the seed graph, each seed node’s capacity is raised to at least `max(sampled capacity, seed degree, kappa)`

So a requested homogeneous `K` is not always respected exactly in the seed. The code prioritizes internal seed feasibility over strict fidelity to the user-entered `K`.

### Lines 1274-1641: attachment weights, arrival placement, and sequential selection

#### Kernel

`computeAttachmentLogWeight(...)` implements the power-cost and exponential-cost forms.

`computeMeshLogAdjustment(...)` adds an extra angular penalty in mesh mode.

That means the final selection weight in mesh mode is not just the baseline attachment kernel. It is the baseline kernel plus a mesh-angle adjustment.

#### Feasible probabilities

`computeFeasibleProbabilities(...)` at lines 1303-1328:

- filters out capacity-saturated nodes
- filters again by mesh adjacency
- computes log weights
- exponentiates after max-log stabilization

So mesh adjacency is part of probability normalization, not just a later visual interpretation.

#### Arrival modes

`frontierArrivalPoint(...)` at lines 1360-1479 implements a layered heuristic:

1. in mesh mode, try a snapped-angle outward projected lattice candidate
2. else try exterior lattice points
3. else try the most separated lattice point
4. else try radial frontier sampling
5. else fall back to a fully random point

`chooseArrivalPoint(...)` at lines 1481-1532:

- `network` + mesh mode chooses from `networkBiasedLatticeCandidates(...)`
- if that fails, it falls back to `projectedLatticeCandidates(...)`
- if that fails, it delegates to `frontierArrivalPoint(...)`
- if mesh mode is on but arrival mode is otherwise uniform, it can still sample from any projected lattice point before the final random fallback

So the current arrival logic is heuristic and multi-stage rather than a single distribution draw.

#### Sequential neighbor choice

`selectSequentialNeighbors(...)` at lines 1534-1641:

- clones the candidate set
- filters by planarity if `reject_crossings`
- filters by mesh adjacency if mesh mode is active
- applies nearest-`q` truncation in mesh mode
- computes probabilities over the filtered set
- draws one target at a time without replacement
- updates working degrees and working edges after each pick

If the first-round feasible set is empty, it records an `emptyReason`, such as:

- `no_capacity_targets`
- `no_adjacent_targets`
- `no_non_crossing_targets`
- `no_feasible_targets`

### Lines 1643-2168: metrics and diagnostics

The file computes:

- graph metrics
- crossings diagnostics
- transport accessibility
- degree-tail fits
- history snapshots

Important current behavior:

- crossing diagnostics still use the simpler `segmentsCross(...)` metric helper at lines 1815-1839, which is not identical to the stricter interior-intersection test used by the planarity engine
- transport accessibility is shortest-path accessibility over realized edge lengths
- tail fitting is descriptive and AIC-based

### Lines 2177-2359: simulation lifecycle

`initializeSimulation(...)` creates the state, builds the seed graph, and stores warnings.

`stepSimulation(...)` is the most behaviorally important function in the file.

Current behavior:

1. If no existing nodes have residual capacity, the run early-stops with `no_feasible_nodes`.
2. Otherwise, the code samples an arrival point.
3. In `reject_crossings`, it can retry placement up to `NON_CROSSING_RETRY_LIMIT`.
4. If the chosen point still yields no selected targets, it can invoke `bestRescueLatticeCandidate(...)`.
5. If there are still no targets, the code now stops with an explicit failure reason rather than inserting a lonely node.
6. If targets exist, the arriving node is added and each selected link is applied.
7. In `split_crossings`, applying one selected arrival link can create extra intersection nodes and split edges.

Important consequence:

- `currentStep` counts committed arrival steps
- total node count can exceed `currentStep` in split-crossings mode
- the file still contains lonely-node display logic, but normal execution now prefers explicit early-stop behavior when an attempted arrival cannot realize any targets

### Lines 2362-2455: scenario documents, CSV, SVG, batch summaries

The implementation exports:

- scenario JSON
- node CSV
- edge CSV
- SVG graph images
- batch summaries

These exports are currently custom-format exports, not GMNS exports.

### Lines 2456-end: browser UI

The remainder of the file is a hand-built UI using:

- global app state object
- direct DOM rendering
- Cytoscape for network interaction
- D3 for charts

Important current behavior:

- the UI is not a thin view over a separate engine module; it lives in the same file as the model logic
- legends, run-status messages, lonely reasons, lattice overlays, and transport accessibility all depend on this same monolithic file
- the network tooltip reports `lonely reason` when available
- charts and exports are generated directly from the in-memory browser state
- the lattice overlay shows the primary candidate list for the current arrival mode, but not every fallback path or rescue-site path that the arrival logic may still use later

## Summary of current implementation character

The active standalone implementation is not just the baseline generalized preferential-attachment model. It is:

- the baseline model
- plus exploratory lattice geometry
- plus exploratory mesh adjacency constraints
- plus optional planarity rejection or splitting
- plus heuristic arrival scoring
- plus a lonely-node fallback
- plus a rescue-site safety net

That layered structure is the main reason an intention-vs-realization audit is necessary.
