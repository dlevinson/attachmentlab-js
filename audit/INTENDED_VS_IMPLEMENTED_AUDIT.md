# Intended vs Implemented Audit

This audit compares the intended model behavior in [`audit/INTENDED_MODEL_BEHAVIOR.md`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/audit/INTENDED_MODEL_BEHAVIOR.md) with the current standalone implementation in [`web/main.js`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js).

## Primary findings

### 1. Mesh mode changes the feasible attachment set, not just arrival placement

**Current code**

- [`web/main.js:346`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js#L346) `isMeshAdjacentCandidate(...)`
- [`web/main.js:1303`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js#L1303) `computeFeasibleProbabilities(...)`
- [`web/main.js:1534`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js#L1534) `selectSequentialNeighbors(...)`

**Mismatch**

The intended baseline model defines feasibility through capacity, existing-graph membership, and without-replacement logic. In the current implementation, mesh mode can also:

- require lattice adjacency
- cap the candidate set to the nearest `q` lattice-adjacent nodes
- add an angle-based mesh weight adjustment

So mesh mode is not just a spatial visualization or placement bias. It changes the attachment mechanism itself.

### 2. The current implementation used to insert lonely nodes instead of early-stopping

**Current code**

- [`web/main.js:2213`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js#L2213) `stepSimulation(...)`

**Mismatch**

The intended baseline model says that if no feasible nodes exist, growth stops and records the reason. The active cleanup tranche has now removed lonely-node insertion from the normal execution path, but the file still contains lonely-node UI/metric remnants from the earlier behavior. That transition state should be simplified further so the code and UI describe one execution model cleanly.

### 3. Rescue-site logic hid core model/implementation failures

**Current code**

- [`web/main.js:636`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js#L636) `bestRescueLatticeCandidate(...)`
- [`web/main.js:2262`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js#L2262) rescue invocation inside `stepSimulation(...)`

**Mismatch**

The intended model does not contain a rescue-site pass. The current cleanup tranche has removed rescue from the normal execution path, but the helper still exists in the file and should either be deleted or moved behind an explicit audit/debug mode so it no longer blurs the model.

### 4. Homogeneous capacity `K` was not honored exactly in the seed graph

**Current code**

- [`web/main.js:1152`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js#L1152) `createSeedGraph(...)`
- especially [`web/main.js:1266`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js#L1266)

**Mismatch**

This cleanup tranche removes the post-seed capacity raising and instead rejects homogeneous `K` values that are below the selected seed graph’s maximum degree. That is much closer to the intended semantics, although heterogeneous seed-capacity semantics still deserve a separate audit later.

### 5. Arrival placement is a heuristic stack, not a single interpretable distribution

**Current code**

- [`web/main.js:1360`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js#L1360) `frontierArrivalPoint(...)`
- [`web/main.js:1481`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js#L1481) `chooseArrivalPoint(...)`

**Mismatch**

The intended exploratory behavior talked about arrivals being:

- uniform in the square
- outside the occupied region
- near the existing network
- on a projected outward lattice

The current code implements these ideas through layered fallback heuristics rather than a clean stated arrival distribution. This is likely one source of the “nodes suddenly run to the edge of the box” behavior, because once higher-priority candidate lists empty out, lower-priority fallbacks take over.

### 6. Boundary behavior is tied to the unit square in a stronger way than the model narrative suggests

**Current code**

- [`web/main.js:395`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js#L395) `unsaturatedFrontierNodes(...)`
- [`web/main.js:484`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js#L484) `projectedLatticeCandidates(...)`
- [`web/main.js:1360`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js#L1360) `frontierArrivalPoint(...)`

**Mismatch**

The code treats in-bounds lattice cells as the only admissible growth opportunities in several places. Once growth reaches the square boundary, frontier logic can become dominated by edge effects. That makes “contiguous lattice growth inside a finite window” behave differently from “network expands outward until clipped by observation window.”

This likely contributes to the strange late-stage edge behavior the user has been seeing.

### 7. Crossing diagnostics and crossing enforcement use different tests

**Current code**

- enforcement: [`web/main.js:815`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js#L815)
- diagnostics: [`web/main.js:1815`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js#L1815)

**Mismatch**

The planarity engine uses `segmentIntersectionPoint(...)`, which ignores endpoint touches and only counts true interior intersections. The metrics layer still uses the simpler `segmentsCross(...)` helper. So the enforcement logic and the reported crossing metric are not based on exactly the same geometric definition.

### 8. Split-crossings is a materially different model, but the UI still presents it as a planarity option beside reject-crossings

**Current code**

- [`web/main.js:945`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js#L945) `applyConnectionWithPlanarity(...)`

**Mismatch**

`split_crossings`:

- removes the crossed edge
- inserts an intersection node
- creates split edges
- continues the arrival connection through the new node chain

That is a different network-growth mechanism, not just a stricter admissibility rule. The current code implements it, but conceptually it should be documented as a different model family.

### 9. The active standalone file is too monolithic for reliable auditability

**Current code**

- [`web/main.js`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js) contains the engine, metrics, exports, and UI together.

**Mismatch**

The architecture doc says the engine should be modular and UI-agnostic, but the active browser-openable build is a single monolithic file. That makes intention-vs-realization drift much harder to catch, because engine changes, UI changes, and debugging fallbacks all accumulate in one place.

### 10. The lattice overlay is not a complete explanation of where arrivals may actually land

**Current code**

- [`web/main.js:1481`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js#L1481) `chooseArrivalPoint(...)`
- [`web/main.js:3586`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js#L3586) `renderNetworkLatticeOverlay(...)`

**Mismatch**

The orange overlay is rendered from the primary candidate list for the active arrival mode, but `chooseArrivalPoint(...)` can still fall through to other lists and fallback paths. So the visualization is helpful, but it is not a complete statement of all possible realized arrival points.

That makes it possible for users to see “those orange sites look right” while the actual realized arrival still ends up elsewhere.

### 11. A remembered lattice-angle hook exists in the code but is currently dormant

**Current code**

- [`web/main.js:447`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js#L447) `projectedLatticeGeometry(...)`

**Mismatch**

`projectedLatticeGeometry(...)` reads `state.lastLatticeAngle`, but the current standalone file does not appear to write that field anywhere. So part of the geometry-selection logic is structured as though there were persistent angle memory, but in practice that branch is inactive.

This is a smaller issue than the feasibility mismatches, but it is a sign that exploratory logic has accumulated partial state concepts that are not fully wired through.

## Likely causes of the current “plainly there are targets, but it says no non-crossing targets” symptom

The current code path suggests several likely causes:

1. Candidate-site choice and candidate-target choice are separate heuristics. A site can be a visible orange candidate yet still be a poor or invalid target site once full sequential selection is attempted.
2. Mesh adjacency and nearest-`q` filtering can remove otherwise obvious geometric neighbors before probability selection.
3. Boundary clipping can make lattice frontier opportunities look available visually while they are filtered out in candidate construction or target feasibility.
4. The model is mixing baseline PA logic with several extra lattice heuristics, so visual intuition and actual feasibility logic can diverge.

## Recommended next cleanup steps

### Separate model families explicitly

Create explicit conceptual layers:

1. baseline generalized PA model
2. lattice-arrival exploratory extension
3. planarity-reject extension
4. split-crossings transport extension

Each should have its own feasibility rules and tests.

### Remove rescue from normal operation

Keep rescue only as a debug mode or instrumented audit mode. It should not be part of the ordinary model pipeline while we are trying to verify correctness.

### Replace lonely fallback with explicit stop/reject behavior

For auditing, prefer:

- stop growth
- or reject that arrival and resample under a clearly stated rule

but do not silently convert “no target” into “new lonely node” unless that is an explicit modeled process.

### Preserve user-entered capacity semantics

If seed feasibility requires a higher `K`, surface that as:

- an error
- or an explicit automatic adjustment shown to the user

rather than silently increasing capacity inside `createSeedGraph(...)`.

### Split the standalone engine from the standalone UI

The fastest route to cleaner auditing is to extract the core simulation functions from `web/main.js` into a dedicated standalone engine module and leave the UI as a thin wrapper.
