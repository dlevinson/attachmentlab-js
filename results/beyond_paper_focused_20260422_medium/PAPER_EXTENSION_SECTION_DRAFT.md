# Draft Extension Section

## Planarity and accessibility as transport-growth extensions

Beyond the baseline replication results, the extended model supports two
mechanism families that appear theoretically and empirically distinct from the
original generalized growth kernel: planarity handling and accessibility-based
selection.

First, planarity is not simply a post-processing rule. Under matched
free-geometry conditions, the three planarity settings define three different
growth mechanisms. The unconstrained case admits crossing-rich growth, the
`reject_crossings` rule suppresses crossing admissions entirely, and the
`split_crossings` rule admits local crossing candidates and converts them into
new junctions. In the focused medium-scale comparison,
`split_crossings` generated about `93` split events and `17,626` intersection
nodes, while `reject_crossings` generated none. The resulting networks differ
not only visually but structurally: `reject_crossings` yields a highly triadic,
short-link planar fabric, whereas `split_crossings` produces a dense
junction-forming regime with extremely short effective edge segments.

Second, accessibility semantics become substantively important once split
planarity is active. In a shared split-capable mesh setting, the accessibility
mechanism remains active across all cases, but the meaning of accessibility as a
destination logic changes the realized access field markedly. When target
selection is weighted by network accessibility, mean gravity access is highest
(`≈121.6`). When both arrival and target choice use opportunity-based access, it
falls to an intermediate level (`≈61.0`). When both use seed-only access, it
falls sharply (`≈3.5`). These differences arise while split events and admitted
crossing counts remain of similar magnitude across the split cases, implying
that the accessibility semantics alter which destinations matter rather than
whether the split-planar mechanism is active.

Taken together, these results suggest that the extended model can support a
transport-growth interpretation that is not available in the baseline
generalized model alone. Split-based planarization acts as a junction-formation
mechanism, while accessibility semantics act as competing destination logics
within that mechanism. This extension family appears stable enough to motivate a
short extension subsection in the present paper or, alternatively, a follow-on
paper focused specifically on planar transport-growth and accessibility-guided
network formation.

## Shorter insertable version

As an extension beyond the baseline generalized model, we compared alternative
planarity rules and accessibility semantics. The results indicate that
`split_crossings` is not merely a stricter rendering of planar growth: it acts
as a junction-forming node-creation mechanism distinct from both unconstrained
and reject-crossings growth. In addition, once split-planar growth is active,
the accessibility semantics used for arrival and target choice become
substantive. Network-based, opportunity-based, and seed-only accessibility
produce sharply different realized accessibility levels even under the same
split-capable geometric regime. These findings suggest that planarity and
accessibility together define a promising transport-growth extension of the
baseline model.
