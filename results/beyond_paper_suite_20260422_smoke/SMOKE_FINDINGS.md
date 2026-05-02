# Beyond-Paper Smoke Findings

This note summarizes the revised smoke-scale beyond-paper run after relaxing the
BP3 interaction design.

## Bottom line

The beyond-paper program now has two genuinely active extension families:

- `split_crossings` in free geometry
- `split_crossings` inside a looser square-lattice interaction regime

That is a much stronger starting point than the first smoke pass, because the
interaction tranche is no longer dormant.

## What looks genuinely interesting already

### 1. Split crossings remains a real node-creation mechanism

The free-geometry split case still produces a qualitatively different regime:

- `crossingCandidatesEncountered ≈ 75,634.5`
- `crossingCandidatesAdmitted = 186`
- `splitEvents = 48`
- `generatedIntersectionNodes = 4,594`

So the headline beyond-paper planarity result is still intact: split-based
planarization is not cosmetic, and it creates junction-forming growth rather
than merely pruning links.

### 2. The mesh interaction tranche is alive now

The revised BP3 split cases produced substantial activity:

- `interaction_split_target`: admitted crossings `84.5`, split events `80`
- `interaction_split_both_seed`: admitted crossings `85`, split events `81`
- `interaction_split_both_opportunity`: admitted crossings `85`, split events `81`

By contrast, the matched reject cases still admitted no crossings and performed
no splitting.

That means we now have a real interaction family to study:

- same mesh framing
- same broad transport logic
- different planarity/access rules

### 3. Accessibility semantics remain distinct as destination models

The semantics are still clearly separated:

- `network` gravity access is around `27.1`
- `opportunity` gravity access is around `12.6`
- `seed` gravity access is around `1.9`

In the revised BP3 split cases, that difference carries through too:

- `split + target access (network)` gravity access `≈ 63.4`
- `split + both + seed` gravity access `≈ 3.4`
- `split + both + opportunity` gravity access `≈ 31.8`

So the semantics layer is not only numerically distinct in BP2; it now remains
distinct inside an active planarity regime.

## What is still weak

### 1. The BP1 mesh planarity cases are still overconstrained

The original mesh-only BP1 scenarios remain flat:

- `planarity_mesh_reject`
- `planarity_mesh_split`

both still produced zero admitted crossings and zero split events.

So BP1 is useful mainly as a control that says "this particular transport mesh
specification is too restrictive for split activity," not yet as the main
planarity finding.

### 2. Accessibility changes regime meaning more than low-level morphology

The access-weighted scenarios are now clearly differentiating:

- accessibility levels
- directional bias
- split-enabled interaction outcomes

But they are still not radically separating on every classic summary metric.
That suggests access is currently acting more like a regime selector than a
simple clustering or edge-length lever.

## Interpretation

The strongest beyond-paper candidates now are:

- split-based planarization as a junction-forming transport-growth mechanism
- accessibility semantics as distinct notions of destination opportunity inside
  that transport-growth process

The key conceptual insight is that planarity and accessibility should not be
studied as isolated toggles. Once split planarity is active, accessibility
semantics begin to matter in a way that is much closer to your intended
transport interpretation.

## Recommended next tranche

1. Run BP1/BP2/BP3 at medium scale with the revised BP3 design.
2. Check whether the BP3 split cases remain distinct and stable.
3. If they do, write a focused memo on:
   - junction creation under split planarity
   - how `network`, `seed`, and `opportunity` access differ as growth logics
4. Only after that decide whether to add an accessibility-to-node-weight
   feedback tranche.
