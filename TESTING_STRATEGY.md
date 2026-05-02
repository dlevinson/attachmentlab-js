# TESTING STRATEGY

This document describes a research-oriented testing strategy for the generalized network-growth app. The aim is not to enumerate every parameter combination. The aim is to create a disciplined way to learn which mechanisms matter, where the implementation is brittle, and which observed patterns are robust enough to interpret.

The strategy is organized around a small number of experiment families, a small number of headline hypotheses, and a staged workflow from correctness to interpretation.

## Purpose

The app currently contains:

- a baseline generalized preferential-attachment model
- several arrival-process extensions
- lattice and mesh extensions
- planarity extensions
- accessibility-weighted extensions

These should be tested as related but distinct model families. If they are all swept together, the result is a large table of numbers with weak interpretability.

## Design Principles

The testing program should follow five principles.

### 1. Separate model families before comparing parameter effects

The baseline model should be understood first. Then arrival, mesh, planarity, and accessibility extensions should be added one block at a time.

### 2. Prefer hypotheses over exhaustive grids

Each experiment family should answer a short list of questions such as:

- does cost deterrence materially shorten links?
- does capacity truncate the degree tail?
- does lattice framing change growth geometry because of arrival placement, target feasibility, or both?

### 3. Compare distributions, not anecdotes

Single runs are useful for visualization and debugging, but insight should come from repeated runs with shared seed schedules.

### 4. Record mechanism diagnostics as well as final metrics

The final graph is not enough. The app should also record why growth stopped, why truncation occurred, how many sites were rejected, and when planarity logic changed the path.

### 5. Keep interpretation tied to the intended model

Any result should be labeled as belonging to:

- the baseline model
- an exploratory arrival extension
- a lattice-growth extension
- a planarity extension
- or an accessibility-guided extension

## Experiment Families

The testing program can be organized into five experiment families.

## Family 1. Baseline kernel behavior

This family should use the closest available implementation of the intended generalized model:

- `arrivalMode = uniform_square`
- `meshMode = off`
- `planarityMode = none`

This family answers:

- how strongly `alpha` promotes hub formation
- how strongly `beta` matters when capacity binds
- how strongly `phi` or `lambda` discourages long links
- when `kappa` changes the graph from tree-like to more cyclic

This family is the reference point for all later comparisons.

## Family 2. Arrival-process effects

This family changes only where nodes appear, while keeping the connectivity mechanism as fixed as possible.

Compare:

- `uniform_square`
- `uniform_lattice`
- `near_existing_network`
- `outside_occupied_region`

This family answers:

- how much geometry comes from arrival placement alone
- whether frontier-style arrivals create directional drift
- how strongly boundary effects influence later growth

## Family 3. Lattice and mesh regularization

This family activates grid-biased growth and studies how much of the resulting structure is caused by explicit lattice constraints rather than the original attachment kernel.

The questions are:

- does mesh mode create contiguous accretion or just hidden feasibility filters
- which lattice family produces stable structure
- whether adjacency, spacing, and local-candidate limits change geometry in expected ways

This family should be tested without planarity first.

## Family 4. Planarity and transport-style constraints

This family compares:

- `none`
- `reject_crossings`
- `split_crossings`

It should be interpreted carefully because `split_crossings` is not merely a planarity option. It is a different growth mechanism that creates new nodes and edges.

This family answers:

- whether rejecting crossings mainly reduces crossings or mainly stops growth
- whether split crossings create a genuinely different transport-style morphology
- where crossing handling changes the growth path most strongly

## Family 5. Accessibility-guided growth

This family asks whether accessibility should remain a diagnostic, or become part of the growth mechanism itself.

Compare:

- no accessibility weighting
- accessibility in target selection only
- accessibility in arrival preference only
- accessibility in both

This family answers:

- whether accessibility rewards central or seed nodes
- whether it amplifies corridor formation
- whether it produces more transport-like network growth than the surrogate local rules do

## Headline Hypotheses

The experiment program should be framed around a few explicit hypotheses.

### H1. Cost deterrence changes attachment more than arrival geometry

In the intended baseline model, `phi` and `lambda` act on target choice, not on the spatial sampling of new arrivals.

### H2. Capacity alters tail behavior only when it genuinely binds

Low `K` and higher `beta` should flatten the degree distribution, raise truncation, and increase early-stop pressure.

### H3. Much of apparent grid-like behavior comes from arrival rules and feasibility rules, not the original attachment kernel

If this is true, lattice experiments should be interpreted as model extensions, not just as spatial cases of the same theory.

### H4. Planarity handling is not neutral

`reject_crossings` and `split_crossings` should produce different morphology, different stopping behavior, and different accessibility patterns.

### H5. Accessibility can become a direct mechanism, but current accessibility is closer to centrality than to exogenous opportunity access

If access is used directly in selection, we should expect it to reinforce realized-network centrality unless destination weights are defined more explicitly.

## Workflow

The testing workflow should proceed in four passes.

### Pass 1. Correctness

Verify invariants:

- no self-loops
- no duplicate edges
- no node exceeds capacity
- feasible probabilities sum to one
- sequential without-replacement logic works
- deterministic seeds reproduce outcomes

### Pass 2. Reference behavior

Establish a small set of stable reference scenarios:

- BA benchmark
- capacity-only
- spatial-only
- general model
- one mesh scenario
- one reject-crossings scenario
- one split-crossings scenario

### Pass 3. Focused sensitivity

Use one-factor sweeps around each reference scenario. This is the main tool for learning which parameters actually matter.

### Pass 4. Regime mapping

For the small set of parameters that appear decisive, build 2D mini-grids to identify regime boundaries and qualitative shifts.

## Refinement Loop

The first full browser-model campaign showed that several effects are present but partly masked by interaction between extensions. That means the testing program now needs a recurring refinement loop rather than a one-shot sweep.

Each refinement cycle should do four things.

### 1. Separate families more aggressively

Do not mix strict baseline, strict mesh, planarity, and accessibility cases in the same tranche unless the explicit goal is to compare families.

### 2. Choose settings that activate the mechanism being tested

If a mechanism is dormant under the current screens, the tranche should be redesigned. For example:

- if `split_crossings` produces no splits, loosen locality or use a geometry that actually generates crossings
- if accessibility weighting only produces tiny shifts, isolate it in a case where arrival and target screens are otherwise stable

### 3. Use tranche-specific diagnostics

Every refined tranche should include the diagnostics that explain the mechanism under test, not just final graph metrics. For example:

- planarity tranches need split-event and crossing-resolution counts
- arrival tranches need site-audit counts and direction-sector summaries
- accessibility tranches need realized-node versus seed-node access comparisons

### 4. Iterate until one of two conditions is met

Stop refining a tranche only when:

- the mechanism effect is clearly interpretable, or
- the tranche demonstrates that the mechanism is weak or dormant in the current implementation

## Refined Experiment Families

The next stage should therefore use a refined set of families.

### Family R1. Strict baseline kernel

Use only:

- `arrivalMode = uniform_square`
- `meshMode = off`
- `planarityMode = none`
- no accessibility weighting

This family is the cleanest estimate of what the browser implementation still preserves from the intended generalized model.

### Family R2. Strict mesh growth

Use:

- `meshMode = grid_bias`
- no planarity
- no accessibility weighting

Compare square and triangular lattice families, adjacency rules, and arrival rules, but keep the connectivity side fixed.

The goal is to learn what mesh growth itself does before crossings or accessibility are added.

### Family R3. Activated planarity

Design the settings so crossing opportunities actually occur. If the current local screens suppress crossings too strongly, the tranche should use looser locality, smaller `N`, or non-mesh placement to ensure that `none`, `reject_crossings`, and `split_crossings` genuinely diverge.

The goal is not to preserve every other feature. The goal is to make planarity handling experimentally visible.

This tranche should explicitly report:

- crossing candidates encountered
- crossing candidates admitted
- generated intersection nodes
- split events

### Family R4. Accessibility semantics

Treat accessibility as a semantic choice, not a single scalar.

Compare:

- no accessibility weighting
- realized-network access weighting
- seed-only access weighting
- weighted-opportunity access weighting

This family should be interpreted as a direct comparison of access semantics, not merely as a strength sweep.

### Family R5. Future access semantics

This family should remain available for future extensions such as:

- hybrid seed-plus-network access
- destination classes with distinct production/attraction weights
- access-dependent land-use feedback

## Metrics

The existing graph metrics in [METHODS.md](METHODS.md) should remain the core summaries. But mechanism-level diagnostics are just as important.

The experiment program should always record:

- graph size and density
- degree inequality and tail diagnostics
- clustering and cycle formation
- component structure
- edge-length summaries
- early-stop rate
- truncation rate
- split-node and split-event counts
- crossing counts
- directional bias
- boundary-contact rate
- accessibility summaries

## What We Can Already Learn

Even before a formal experiment campaign, the debugging work already supports several provisional lessons.

### 1. The original general model is not an arrival-bias model

In the baseline formulation, arrivals are exogenous in space. Spatial cost enters attachment, not node placement.

### 2. Mesh mode is a genuine model extension

It changes not only placement but also candidate feasibility and local choice structure.

### 3. Boundary conditions are first-order in lattice growth

Once growth is clipped to a finite window, edge effects can dominate later structure.

### 4. Split crossings should be interpreted as a transport-growth mechanism

It changes node creation itself, so it belongs in a different interpretive category from simple crossing rejection.

### 5. Accessibility semantics are now part of the model specification

When realized nodes are treated as opportunities, newer interior nodes can outrank seed nodes. Seed-only and opportunity-weighted semantics should therefore be treated as distinct model families, not just display variants.

## First Execution Tranche

The first useful experiment tranche should be short and disciplined rather than broad.

### Tranche A. Rebuild baseline confidence

Run the four headline scenarios under:

- 20 shared seeds
- `N = 250`
- no mesh
- no planarity

Vary only:

- `alpha`
- `beta`
- `phi`
- `kappa`
- `K`

Goal:

- establish that the baseline model behaves sensibly before interpreting extensions

Refinement:

- use a `phi` comparison with `beta = 0` and high `K`
- use a capacity comparison with a non-complete low-degree seed so `K = 4` is legal and actually binds

### Tranche B. Arrival versus attachment

Fix one kernel and compare the arrival modes.

Goal:

- measure how much geometry is driven by node placement rather than target weighting

### Tranche C. Planarity comparison

Run one square-family lattice case and one triangular-family lattice case with:

- `none`
- `reject_crossings`
- `split_crossings`

Goal:

- establish whether planarity handling changes morphology, stopping behavior, and accessibility in structurally different ways

Refinement:

- use smaller `N` and crossing-prone settings so `split_crossings` is activated rather than dormant

### Tranche D. Accessibility as mechanism

Run one stable baseline and one stable lattice scenario with:

- no access weighting
- network access
- seed-only access
- weighted opportunity access

Goal:

- test whether semantic choice changes growth and morphology, not merely whether stronger access weighting amplifies the same pattern

## Deliverables

Each tranche should produce:

- one short memo of findings
- one batch summary table
- one compact figure set
- one list of unresolved anomalies

Each refinement cycle should additionally produce:

- one explicit note on whether the mechanism under test was activated strongly enough
- one decision on whether the tranche should be repeated, redesigned, or retired

That keeps the testing program cumulative, interpretable, and manageable.

## Bottom Line

Yes, the project can support systematic learning without becoming enumerative. The right structure is:

- a few model families
- a few hypotheses
- a few reference scenarios
- focused sensitivity around them
- and clear separation between baseline theory and exploratory extensions

That is enough to produce real insight while staying small enough to remain scientifically interpretable.
