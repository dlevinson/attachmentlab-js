# Morning Memo: Refined Browser-Model Strategy Run

This memo interprets the refined second-stage experiment run against the live browser implementation in [`web/main.js`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/web/main.js).

These were still pilot-scale tranches, but they were designed to be more interpretable than the first overnight sweep.

## What Changed In The Refined Pass

The refined run separated the browser model into clearer families:

- strict baseline kernel
- strict mesh growth
- activated planarity
- current accessibility semantics
- planarity stress
- accessibility stress

The main question was not only "what changes," but "which mechanisms actually activate strongly enough to be worth interpreting."

## Main Findings

### 1. The strict baseline still does not show a strong `phi` effect

In the clean baseline family, `phi = 0` and `phi = 5` were still unexpectedly close on mean edge length:

- `phi = 0`: `0.367`
- `phi = 5`: `0.375`

That is the opposite of what the original generalized model would suggest. It implies that, even with mesh and planarity turned off, the current browser implementation is still not recovering a strong pure cost-deterrence signal in the baseline tranche. This deserves focused debugging.

### 2. Capacity still is not binding strongly in the baseline tranche

The refined baseline comparison between `K = 4` and `K = 64` remained weak:

- `K = 4` share at capacity: `0.1%`
- `K = 64` share at capacity: `0.0%`

So under the current browser defaults, capacity is not acting as a major truncation mechanism in the strict baseline family. That is a substantive result: the browser implementation is currently operating in a regime where capacity rarely binds unless settings are pushed much harder.

### 3. Mesh geometry is real, but the square-vs-triangular contrast is modest

The strict mesh tranche did produce consistent but not dramatic differences:

- `90° / edge-neighbor / near-network` clustering: `0.088`
- `60° / edge-neighbor / near-network` clustering: `0.087`
- `90° / frontier / edge-neighbor` mean edge length: `0.389`
- `60° / frontier / edge-neighbor` mean edge length: `0.381`
- `60° / expanded local ring / near-network` mean gravity: `10.611`

The strongest mesh-family contrast in this refined pass was not square versus triangular per se. It was the expanded local ring versus edge-neighbor admissibility. That suggests local feasibility structure still matters more than lattice angle alone.

### 4. Planarity is still effectively dormant in the headless browser-engine runs

This is the clearest result of the refined pass.

Even after creating both an activated-planarity tranche and a stress tranche, the following remained true:

- `generatedIntersectionNodes_mean = 0` in all refined planarity scenarios
- `splitEvents_mean = 0` in all refined planarity scenarios

Examples:

- `planar_free_split`: `0.000` generated intersections
- `planar_mesh_split`: `0.000` generated intersections
- `stress_free_split`: `0.000` generated intersections
- `stress_mesh_split`: `0.000` generated intersections

This means that in the current headless browser-model execution path, `split_crossings` is not activating as an experimentally distinct mechanism, even when designed to do so. That is now strong evidence of an implementation bottleneck or hidden screen, not merely a weak experimental design.

### 5. Accessibility weighting is active, and it behaves more like centrality reinforcement than opportunity access

The refined access tranche showed clearer differences than the first overnight run.

Free-geometry family:

- no access weighting mean gravity: `9.893`
- access-weighted both mean gravity: `10.816`

Mesh family:

- no access weighting mean gravity: `9.489`
- access-weighted arrivals mean gravity: `10.696`
- access-weighted both mean gravity: `9.652`

The strongest effect was often not "both." In the mesh family, arrival-only weighting outperformed target-only and both on mean gravity. That supports the idea that the current access logic is acting more like a realized-network centrality feedback than a clean transport-opportunity mechanism.

The stress tranche reinforced that:

- `free / strong access both` mean gravity: `10.285`
- `mesh / strong access both` mean gravity: `10.743`

So accessibility weighting is active, but it is best interpreted as endogenous network-centrality weighting under the current implementation.

## What We Can Learn Right Now

The browser model is informative, but not yet in the way the original theory would suggest.

The clearest lessons are:

- The browser implementation contains strong mechanism interactions even in apparently clean tranches.
- Mesh growth is active and interpretable as a distinct family.
- Planarity splitting is not experimentally active in the headless browser-model runs, even under stress.
- Accessibility is active, but the current semantics are realized-network access, not seed or exogenous-opportunity access.

## Most Important Unresolved Issues

### 1. Baseline cost deterrence still looks too weak

The `phi` result should be stronger in a clean baseline family.

### 2. Capacity still does not bind much in baseline runs

This could reflect the current default regime, but it may also mean that `K`, `beta`, and the feasible-set logic are interacting in a way that keeps capacity mostly irrelevant in the tested range.

### 3. `split_crossings` needs dedicated implementation auditing

At this point the evidence is strong enough to stop treating this as a tranche-design issue. The split mechanism should be audited directly in code.

## Recommended Next Steps

1. Do a targeted code audit of the strict baseline kernel path, especially why `phi` does not strongly shorten links when mesh and planarity are off.
2. Audit the `split_crossings` execution path directly, because the refined runs suggest it is effectively unreachable or screened out in the current browser-engine path.
3. Add explicit alternative access semantics before overinterpreting accessibility-guided growth:
   - realized-network access
   - seed-only access
   - weighted-opportunity access
4. Only after those audits, rerun a third-stage tranche at larger `N`.

## Key Files

- summary report: [REFINED_REPORT.md](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/strategy_browser_20260406_refined/REFINED_REPORT.md)
- tranche summaries: [refined_r1_summary.csv](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/strategy_browser_20260406_refined/refined_r1_summary.csv), [refined_r2_summary.csv](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/strategy_browser_20260406_refined/refined_r2_summary.csv), [refined_r3_summary.csv](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/strategy_browser_20260406_refined/refined_r3_summary.csv), [refined_r4_summary.csv](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/strategy_browser_20260406_refined/refined_r4_summary.csv), [refined_r5_summary.csv](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/strategy_browser_20260406_refined/refined_r5_summary.csv), [refined_r6_summary.csv](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/strategy_browser_20260406_refined/refined_r6_summary.csv)
- runner: [run_browser_strategy_refined.mjs](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/tools/run_browser_strategy_refined.mjs)
