# Beyond-Paper Research Plan

This plan starts after baseline paper replication has been accepted as good enough for the original generalized model. The goal is no longer "does the implementation match the paper?" but rather "what new, stable, interpretable regimes do the extensions create?"

The model should now be treated as a nested family:

1. baseline generalized model
2. arrival extensions
3. lattice / mesh extensions
4. planarity extensions
5. accessibility-weighted extensions

The most promising beyond-paper mechanisms are:

- planarity as a structural transport-growth extension
- accessibility as a direct growth mechanism rather than a post-hoc diagnostic
- the interaction between planarity and accessibility

## Framing Questions

The next research phase should answer five questions.

### Q1. Does planarity create a genuinely new growth family?

We want to know whether:

- `reject_crossings` mainly suppresses growth
- `split_crossings` mainly planarizes the same growth
- or `split_crossings` produces a genuinely distinct junction-forming regime

### Q2. What kind of accessibility matters?

We currently support:

- `network` access
- `seed` access
- `opportunity` access

The research question is whether these semantics produce meaningfully different growth outcomes when they directly affect:

- arrival-site choice
- target selection
- both together

### Q3. Is accessibility a viable primary selection mechanism?

This is the conceptual extension most likely to matter for future theory. We want to compare:

- cost-only selection
- cost plus accessibility
- accessibility-driven arrivals
- accessibility-driven arrivals and target selection together

### Q4. How do planarity and accessibility interact?

Transport-like networks should not be studied with planarity and accessibility isolated forever. The key question is whether:

- access weighting amplifies corridor formation under planarity
- or whether planarity counteracts access-driven concentration

### Q5. What is strong enough to fold back into the paper?

A beyond-paper result is a candidate for inclusion if it is:

- mechanistically clear
- robust across replications
- visually and metrically distinct
- explainable in one figure and one paragraph

## Research Tranches

The recommended order is deliberate.

### Tranche BP1. Planarity

Purpose:

- establish whether planarity meaningfully changes growth morphology and summary metrics

Families:

- `none`
- `reject_crossings`
- `split_crossings`

Contexts:

- free geometry baseline
- structured mesh geometry

Metrics to record:

- crossing candidates encountered
- crossing candidates admitted
- split events
- generated intersection nodes
- mean edge length
- cyclomatic number
- clustering
- accessibility
- directional bias

Success criterion:

- `split_crossings` must be measurably distinct from `reject_crossings`

### Tranche BP2. Accessibility Semantics

Purpose:

- determine whether different destination semantics produce distinct and interpretable regimes

Compare:

- `network`
- `seed`
- `opportunity`

Modes:

- arrival-only weighting
- target-only weighting
- both

Metrics to record:

- mean cumulative access
- mean gravity access
- max-node access
- clustering
- mean edge length
- directional bias
- degree inequality

Success criterion:

- at least two access semantics should produce clearly different metric profiles

### Tranche BP3. Planarity × Accessibility Interaction

Purpose:

- test whether access-weighted growth behaves differently once planarity is active

Compare:

- no access weighting
- arrival-only access weighting
- target-only access weighting
- both

Within:

- `reject_crossings`
- `split_crossings`

Metrics to record:

- split activity
- accessibility outcomes
- clustering
- path length
- directional bias

Success criterion:

- identify whether accessibility makes planar growth more corridor-like, more hub-like, or both

### Tranche BP4. Mesh Framing as Transport Scaffolding

Purpose:

- ask whether lattice/mesh framing creates substantive transport-like regimes, not just nicer pictures

Compare:

- `60°` lattice family
- `90°` lattice family
- adjacency variants
- spacing variants

This tranche matters mainly if BP1 and BP3 suggest morphology is becoming transport-like.

### Tranche BP5. Accessibility Feedback to Node Weight

Purpose:

- create the first explicit network-to-land-use feedback loop

Initial rule:

- node `weight` is updated from accessibility at a fixed interval
- `typeShare` remains stored but inactive

This is likely the first stage of a coupled physical/access/land-use model and may be better treated as a later extension paper if it becomes too large.

## Outputs

Each beyond-paper suite run should produce:

- one tranche summary CSV
- one JSON result bundle
- one memo per run
- one synthesis note that answers:
  - what is robust
  - what is surprising
  - what is paper-worthy
  - what should remain future work

## Interpretation Rules

- baseline replication results are not to be mixed with extension claims unless clearly labeled
- visual novelty is not enough; the metric profile must also be distinct
- if a result only appears under one geometry family or one seed schedule, treat it as provisional
- if `split_crossings` or access weighting changes both morphology and metrics, treat that as a real extension finding

## Immediate Implementation Sequence

1. implement `run-beyond-paper-suite.ts`
2. add a smoke-scale suite with:
   - BP1 planarity
   - BP2 accessibility semantics
   - BP3 interaction
3. write a first synthesis memo from the smoke-scale run
4. only then scale to medium/full profiles

## Working Hypotheses

The most plausible beyond-paper insights to look for are:

- `split_crossings` creates a junction-forming transport-growth regime, not just planarization
- `seed` and `opportunity` access produce more corridor-oriented growth than realized-network access
- access weighting and planarity interact nonlinearly rather than additively
- structured mesh framing may become genuinely informative only once planarity and accessibility are both active
