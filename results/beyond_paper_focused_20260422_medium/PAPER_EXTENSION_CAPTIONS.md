# Draft Figure Captions

## Figure 1. Planarity as a growth mechanism

Comparison of three growth rules under matched free-geometry conditions. The
unconstrained case permits crossing-rich growth, `reject_crossings` suppresses
crossing admissions entirely, and `split_crossings` admits local crossing
candidates and converts them into generated junctions. In the medium-scale
focused run, `split_crossings` produced about `93` split events and `17,626`
generated intersection nodes, whereas `reject_crossings` produced none. This
shows that split-based planarization is not a cosmetic rendering choice but a
distinct node-creation mechanism.

## Figure 2. Accessibility semantics under split planarity

Comparison of accessibility-weighted transport-growth regimes under a shared
split-planarity mesh setting. The split machinery remains active across the
cases, but the accessibility semantics induce sharply different realized access
fields: `network` access produces the highest mean gravity accessibility
(`≈121.6`), `opportunity` access an intermediate regime (`≈61.0`), and
`seed` access the weakest (`≈3.5`). Thus the semantics determine which
destinations matter, even when the same junction-forming growth process remains
in force.

## Optional appendix caption

Appendix Figure A1. Focused extension comparison tables for the beyond-paper
analysis. Bars show clustering, mean edge length, admitted crossing candidates,
split events, generated intersection nodes, and mean accessibility metrics for
the focused medium-scale scenarios reported in
[focused_summary.csv](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/beyond_paper_focused_20260422_medium/focused_summary.csv).
