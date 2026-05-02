# Strict Baseline Clustering Audit (2026-04-08)

This note audits the remaining clustering gap in the strict baseline replication path after the shared-core cleanup and medium-scale rerun.

The immediate question is not whether clustering is higher than the paper. The question is whether that gap is coming from:

- a metric bug
- a hidden extension leak into strict baseline
- or a genuine modeling/finite-size difference

## Scope of the audit

The audit focuses on the strict baseline path in the shared browser core, not on mesh, planarity, or accessibility extensions.

The relevant intended baseline settings are:

- `arrivalMode = uniform`
- `meshMode = off`
- `planarityMode = none`
- baseline arrival preference
- baseline target selection kernel

The most important code paths inspected were:

- seed construction in [src/standalone/browser-core.js](../src/standalone/browser-core.js)
- attachment weight computation in [src/standalone/browser-core.js](../src/standalone/browser-core.js)
- sequential neighbor selection in [src/standalone/browser-core.js](../src/standalone/browser-core.js)
- clustering metric computation in [src/metrics/networkMetrics.ts](../src/metrics/networkMetrics.ts)

## Findings

### 1. The clustering metric itself looks standard

`averageClustering(...)` in [src/metrics/networkMetrics.ts](../src/metrics/networkMetrics.ts) computes the mean of local clustering coefficients over all nodes:

- degree `< 2` contributes `0`
- for each node, it counts links among neighbors
- it adds `(2 * triangles) / (degree * (degree - 1))`
- it divides by total node count

That is a conventional average local clustering coefficient. Nothing in this implementation obviously explains a systematic upward bias on its own.

### 2. The strict baseline selection path is now cleanly separated from mesh logic

The browser core now keeps exploratory geometry logic outside the baseline probability normalization:

- `computeFeasibleProbabilities(...)` is explicitly documented as capacity-only normalization
- mesh adjacency, locality, and reject-crossings screens happen outside that function
- `selectSequentialNeighbors(...)` returns `nodes` unchanged when `meshMode !== 'grid_bias'`

So there is no obvious remaining leak where mesh filtering is still contaminating the strict baseline kernel when mesh mode is off.

### 3. The strict baseline path still begins from a complete seed

For paper-facing headline scenarios, `seedGraphType = 'complete'` and `m0 = 5` remain the intended defaults. In `createSeedGraph(...)`, the non-mesh `complete` case wires every seed node to every other seed node.

That matters because:

- the initial `K5` seed is maximally clustered
- every new arrival with `kappa = 2` attaches into a graph that already contains many neighbor-neighbor ties
- this is a plausible source of persistent local triangle formation, especially at medium rather than full scale

This is not a bug. It is part of the intended model. But it is a real contributor to why clustering can stay above the paper's reported level in finite runs.

### 4. Sequential `kappa = 2` attachment naturally encourages local triangle closure

The strict baseline still uses sequential without-replacement selection. Once the first target is chosen, the second target is drawn from a slightly updated feasible set with the same arriving node.

Even without mesh or planarity extensions, that can create more local closure than a one-shot pair draw would, especially when:

- the seed is already dense
- cost is low or absent
- popular nodes are linked to other popular nodes

Again, this is not obviously an implementation defect. It is a structural feature of the model realization.

### 5. Medium evidence suggests a level mismatch, not a direction mismatch

From the medium replication:

- BA clustering: `0.0474` vs paper `0.028`
- Capacity only: `0.0106` vs `0.007`
- Spatial only: `0.0656` vs `0.035`
- General model: `0.0171` vs `0.009`

But the directional comparative statics are correct:

- higher `phi` raises clustering
- higher `kappa` raises clustering
- heterogeneous capacity raises clustering

That pattern argues against a broken clustering metric. It looks more like the model is generating too many triangles in level while still responding correctly to parameter changes.

## Provisional interpretation

At this point, the most likely explanation is:

- not a metric bug
- not a hidden mesh/planarity/access leak into strict baseline
- but a remaining level difference driven by seed density, finite size, and the exact sequential attachment realization

This does not mean the issue is unimportant. It means the remaining question is narrower than before.

## What to test next if the clustering gap remains at full scale

If the full paper-replication run still shows systematically high clustering, the next focused tests should be:

1. a seed-sensitivity audit
   - compare complete `m0 = 5` against alternative seeds only as a diagnostic, not as a paper replacement
2. a finite-size audit
   - compare `N = 500` against `N = 1000` and possibly `N = 2000`
3. a selection-mechanism audit
   - verify whether the paper's intended sequential-without-replacement interpretation exactly matches the current realization

Those tests would answer whether the gap is:

- a benign finite-size persistence effect
- a seed-realization effect
- or a final baseline implementation mismatch

## Conclusion

The strict baseline clustering gap is still real, but this audit does not find evidence that it is being caused by an obviously wrong metric or by exploratory extensions leaking into baseline runs.

The current best interpretation is:

- replication is already good on edge length, inequality, degree constraints, and tail ordering
- clustering remains somewhat too high in level
- the gap is more likely due to dense seed and finite-size/sequential-attachment effects than to an outright coding bug

That is enough to justify proceeding to the full paper-replication profile, while keeping clustering as the one explicit watchpoint.
