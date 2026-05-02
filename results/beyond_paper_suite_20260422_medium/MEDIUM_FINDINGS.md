# Beyond-Paper Medium Findings

This note interprets the revised medium-scale beyond-paper suite.

## Bottom line

The medium run strengthens two beyond-paper claims:

1. `split_crossings` is a real junction-forming growth mechanism.
2. accessibility semantics matter much more once split-based planarity is
   active than they do in the plain mesh-only accessibility tranche.

The medium run also confirms one limitation:

- the original BP1 mesh-only planarity cases remain too restrictive to activate
  split behavior on their own.

## 1. Planarity is not just a constraint; split planarity is a different model family

The free-geometry planarity tranche stays sharply differentiated:

- `planarity_free_none`
  - clustering `≈ 0.123`
  - mean edge length `≈ 0.537`
  - admitted crossings `≈ 357`
- `planarity_free_reject`
  - clustering `≈ 0.776`
  - mean edge length `≈ 0.266`
  - admitted crossings `0`
- `planarity_free_split`
  - clustering `≈ 0.170`
  - mean edge length `≈ 0.0046`
  - admitted crossings `≈ 368`
  - split events `≈ 93`
  - generated intersection nodes `≈ 17,626`

That is not a minor variant of the baseline. `reject_crossings` and
`split_crossings` are producing fundamentally different network-construction
logics:

- `reject_crossings` channels growth into a highly triadic, short-link planar
  fabric
- `split_crossings` creates huge numbers of generated junctions and an
  ultra-fine effective edge network

This is probably the clearest paper-worthy beyond-paper mechanism in the code
base right now.

## 2. Accessibility semantics are distinct as opportunity models

In the standalone accessibility tranche, the semantics continue to separate
cleanly:

- `network` access
  - mean gravity `≈ 45.21`
  - mean cumulative `≈ 131.63`
- `opportunity` access
  - mean gravity `≈ 20.36`
  - mean cumulative `≈ 57.90`
- `seed` access
  - mean gravity `≈ 1.89`
  - mean cumulative `≈ 6.18`

The structural summary metrics in BP2 remain close:

- clustering stays `0`
- mean edge length stays `≈ 0.057`

So BP2 by itself still reads as:

- strong semantic difference in what "access" means
- weak standalone difference in global morphology under the current lattice
  regime

That is still useful. It says the semantics are real, but BP2 alone is not yet
the strongest "new figure" candidate.

## 3. The interaction tranche is now the most promising transport-growth result

Once split planarity is active, the access semantics remain distinct and the
difference is no longer merely cosmetic.

### Reject interaction controls

- `interaction_reject_none`
  - gravity access `≈ 63.98`
  - clustering `≈ 0.452`
  - split events `0`
- `interaction_reject_arrival`
  - gravity access `≈ 3.27`
  - clustering `≈ 0.447`
  - split events `0`

The reject cases separate strongly on accessibility but stay structurally close.

### Split interaction cases

- `interaction_split_target`
  - gravity access `≈ 121.56`
  - split events `≈ 167.75`
  - admitted crossings `≈ 172.5`
  - clustering `≈ 0.468`
- `interaction_split_both_seed`
  - gravity access `≈ 3.49`
  - split events `≈ 169`
  - admitted crossings `≈ 172`
  - clustering `≈ 0.470`
- `interaction_split_both_opportunity`
  - gravity access `≈ 61.00`
  - split events `≈ 169`
  - admitted crossings `≈ 172`
  - clustering `≈ 0.470`

The important result is not clustering. It is that under the same split-capable
transport-growth setting:

- `network` semantics create a very high realized accessibility regime
- `opportunity` semantics create a strong but lower-access regime
- `seed` semantics create a dramatically weaker-access regime

while the split machinery itself remains active in all three.

That gives us a clean conceptual statement:

> Planarity can create the same junction-forming transport-growth process under
> very different destination logics, and those logics materially change the
> accessibility field even when coarse morphology is similar.

That is a much stronger beyond-paper contribution than plain "access as a node
color."

## 4. What is still not working as a headline result

The BP1 mesh-only planarity controls are still flat:

- `planarity_mesh_reject`
- `planarity_mesh_split`

both still show:

- zero admitted crossings
- zero split events
- zero intersection nodes

So the medium results suggest we should stop expecting that original BP1 mesh
control pair to be the main transport-planarity story. It is better treated as
an overconstrained comparison point.

## 5. What seems worth folding back into the paper

Most credible candidate:

- `split_crossings` as a junction-forming growth mechanism distinct from both
  unconstrained and reject-crossings growth

Second credible candidate:

- accessibility semantics as competing destination models within a planar
  transport-growth process

More tentative:

- the specific mesh-only planarity tranche in its current form

## Recommended next step

1. Build one focused figure/memo around:
   - `planarity_free_none`
   - `planarity_free_reject`
   - `planarity_free_split`
2. Build one focused interaction figure/memo around:
   - `interaction_split_target`
   - `interaction_split_both_seed`
   - `interaction_split_both_opportunity`
3. Only after that decide whether to introduce accessibility-to-weight feedback
   as the next extension family.
