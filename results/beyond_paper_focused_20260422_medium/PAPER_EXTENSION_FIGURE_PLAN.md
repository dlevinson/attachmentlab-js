# Paper Extension Figure Plan

This note translates the focused medium-scale beyond-paper bundle into a small
set of paper-facing figures.

Primary evidence bundle:

- [focused_summary.csv](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/beyond_paper_focused_20260422_medium/focused_summary.csv)
- [planarity_core_figure.csv](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/beyond_paper_focused_20260422_medium/planarity_core_figure.csv)
- [access_interaction_figure.csv](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/beyond_paper_focused_20260422_medium/access_interaction_figure.csv)
- [FOCUSED_MEMO.md](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/beyond_paper_focused_20260422_medium/FOCUSED_MEMO.md)

## Overall recommendation

If only one extension figure is added to the current paper, it should be a
two-panel figure:

- Panel A: planarity core comparison
- Panel B: split-planarity accessibility interaction

If two extension figures are acceptable, split them into:

1. a planarity mechanism figure
2. an accessibility semantics under split planarity figure

## Figure 1. Planarity as a growth mechanism

### Purpose

Show that `split_crossings` is not a cosmetic rendering choice. It defines a
different growth process from both unconstrained and reject-crossings growth.

### Recommended structure

Panel A: representative network snapshots

- `planarity_free_none`
- `planarity_free_reject`
- `planarity_free_split`

All should use the same node color and edge styling rules.

Panel B: compact bar chart or dot plot using:

- `averageClustering`
- `meanEdgeLength`
- `crossingCandidatesAdmitted`
- `splitEvents`
- `generatedIntersectionNodes`

### Metrics to display

From [planarity_core_figure.csv](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/beyond_paper_focused_20260422_medium/planarity_core_figure.csv):

- `none`
  - clustering `0.123`
  - mean edge length `0.537`
  - admitted crossings `357`
  - split events `0`
  - generated intersection nodes `0`
- `reject_crossings`
  - clustering `0.776`
  - mean edge length `0.266`
  - admitted crossings `0`
  - split events `0`
  - generated intersection nodes `0`
- `split_crossings`
  - clustering `0.170`
  - mean edge length `0.0046`
  - admitted crossings `368`
  - split events `93`
  - generated intersection nodes `17,626`

### Main message

`reject_crossings` and `split_crossings` should be interpreted as different
network-growth mechanisms, not as two ways to draw the same graph.

## Figure 2. Accessibility semantics under split planarity

### Purpose

Show that once split-based planarization is active, the chosen accessibility
semantics substantially reshape the realized accessibility field.

### Recommended structure

Panel A: representative network snapshots

- `interaction_reject_none`
- `interaction_split_target`
- `interaction_split_both_seed`
- `interaction_split_both_opportunity`

Panel B: compact bar chart or dot plot using:

- `meanGravityAccess`
- `meanCumulativeAccess`
- `crossingCandidatesAdmitted`
- `splitEvents`
- `averageClustering`
- `meanEdgeLength`

### Metrics to display

From [access_interaction_figure.csv](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/beyond_paper_focused_20260422_medium/access_interaction_figure.csv):

- `reject / no access`
  - gravity access `63.98`
  - cumulative access `187.47`
  - admitted crossings `0`
  - split events `0`
  - clustering `0.452`
  - mean edge length `0.065`
- `split / target access`
  - gravity access `121.56`
  - cumulative access `352.23`
  - admitted crossings `172.5`
  - split events `167.75`
  - clustering `0.468`
  - mean edge length `0.047`
- `split / both with seed access`
  - gravity access `3.49`
  - cumulative access `8.98`
  - admitted crossings `172`
  - split events `169`
  - clustering `0.470`
  - mean edge length `0.047`
- `split / both with opportunity access`
  - gravity access `61.00`
  - cumulative access `177.29`
  - admitted crossings `172`
  - split events `169`
  - clustering `0.470`
  - mean edge length `0.047`

### Main message

Under an active split-planarity transport-growth regime, accessibility
semantics are not merely a diagnostic. They select materially different
destination logics while the same junction-forming mechanism remains active.

## Minimal paper insertion option

If space is tight, include only Figure 1 in the main paper and move Figure 2 to
an appendix or online supplement.

That gives:

- one clean methodological extension result in the main text
- one conceptually rich accessibility result nearby but not required for the
  core replication story

## Best full insertion option

If there is room for a short extension subsection, include both figures in a
new section after the replication section:

- first, planarity as mechanism
- second, accessibility semantics within split-planar growth
