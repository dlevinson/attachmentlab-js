# Browser-First Audit Note (2026-04-07)

This note records the first remediation cycle against the standalone browser model in [`web/main.js`](../web/main.js). The aim of this cycle was not to redesign the model. The aim was to identify confirmed implementation mismatches, repair the ones we could do cleanly, and tighten the next testing tranche so remaining anomalies are more interpretable.

## Confirmed mismatches

### 1. Baseline probability normalization was still contaminated by mesh logic

The browser model already filtered candidates in `selectSequentialNeighbors(...)` using mesh adjacency, locality, nearest-`q`, and optional reject-crossings screens. But `computeFeasibleProbabilities(...)` was also filtering by `isMeshAdjacentCandidate(...)` before computing weights and normalizing probabilities.

That meant:

- the baseline attachment kernel was not purely capacity-plus-kernel weighting
- exploratory mesh logic was leaking into a function that should have remained baseline math
- the browser engine was harder to compare with the TypeScript baseline engine

### 2. Crossing diagnostics and split logic used different geometric notions of crossing

The split/reject logic used `segmentIntersectionPoint(...)`, which only counts strict interior intersections. But the network metrics used a looser `segmentsCross(...)` test.

That meant:

- visual or summary crossing counts could be nonzero
- while `split_crossings` saw no actual split events
- and the tranche results could misleadingly suggest dormant split mode even when the metric said crossings existed

### 3. Accessibility semantics were implicit and easy to misread

The browser accessibility layer treated all realized nodes as equal destinations. That is a useful network-centrality diagnostic, but it is not the same thing as:

- accessibility to seed nodes
- accessibility to weighted opportunities
- or accessibility to exogenous destinations

This mismatch already showed up in interpretation: newer interior nodes could score higher than seed nodes, which felt surprising if the user expected seed-based access.

## Confirmed changes in this cycle

### Browser model

The following fixes were applied in [`web/main.js`](../web/main.js):

- `computeFeasibleProbabilities(...)` is now capacity-only. Mesh, locality, and planarity screens stay outside the kernel.
- `crossingDiagnostics(...)` now uses the same interior-intersection test as split/reject logic.
- transport accessibility now has explicit semantics:
  - `network`
  - `seed`
  - `opportunity`
- the sidebar exposes `Access semantics` directly.
- transport-accessibility text now states which semantics are being used.
- planarity diagnostics now track:
  - `crossingCandidatesEncountered`
  - `crossingCandidatesAdmitted`
- those counters are included in runtime metrics and batch summaries.

### TypeScript engine

The following alignment work was applied to the TypeScript engine:

- shared types now include:
  - `SeedGraphType = 'cross'`
  - `AccessSemantics`
  - node-level `weight`, `typeShare`, `accessValue`, `accessCumulative`, `accessGravity`
  - metric fields for split and planarity diagnostics
- seed and arrival nodes now initialize those node fields explicitly
- custom seed construction no longer silently raises capacity after wiring; it now throws if the seed exceeds the chosen capacity rules
- network crossing metrics now use the same strict interior-intersection logic as the browser audit pass

## Still unresolved after this cycle

### 1. Weak browser baseline `phi` effect

The current browser refined tranches previously showed a weak or even reversed `phi` signal in strict baseline runs. The cleanup above removes one confirmed leak, but it does not by itself guarantee a strong `phi` signal because strict baseline runs already had mesh off.

This remains a tranche-level question for the rerun:

- if the signal strengthens, the previous contamination was partly to blame
- if it does not, the next audit target should be the batch/tranche design or another hidden baseline interaction

### 2. Dormant split mode under tranche conditions

The browser model has produced split nodes in interactive use, but the refined headless tranches were reporting zero split events. After unifying crossing diagnostics, the next rerun should tell us whether:

- split mode was genuinely dormant under those scenarios
- or the previous metric path was overstating crossings

If split mode still stays dormant under the activated/stress tranches, that should trigger a direct code audit of candidate admissibility rather than another large batch.

### 3. Opportunity semantics are only partly informative with current defaults

`opportunity` access currently uses:

- `weight`
- `1 - typeShare`

But current defaults are:

- `weight = 1`
- `typeShare = 0.5`

So `opportunity` access only becomes meaningfully different once node weights or type shares vary. That is acceptable for now, but it means `seed` versus `network` is the more interpretable first comparison.

## What the next cycle should prove

The next tranche rerun should answer four concrete questions:

1. Does strict baseline now show a clearer `phi` effect?
2. Do split diagnostics become non-dormant in the activated/stress planarity tranche?
3. Do `network` and `seed` accessibility semantics diverge clearly in both values and morphology?
4. Are the browser and TypeScript baseline engines now closer in interpretation, even if the browser still carries more extensions?

If the answer to any of those is still “no”, the next cycle should narrow again rather than broaden.
