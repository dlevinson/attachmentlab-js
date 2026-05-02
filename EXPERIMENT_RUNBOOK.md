# EXPERIMENT RUNBOOK

This runbook turns the high-level strategy in [TESTING_STRATEGY.md](TESTING_STRATEGY.md) into a practical sequence of experiment tranches.

It is intentionally short. It is meant to be used while running the app, not as a second theory document.

## Execution Entry Points

For scripted analysis rather than interactive clicking, use:

- `npm run analyze:paper -- --smoke|--medium`
- `npm run analyze:full -- --smoke|--medium`
- `npm run analyze:beyond -- --smoke|--medium`
- `npm run analyze:all -- --smoke|--medium`

Omit the profile flag for the largest paper-facing run.

## General Rules

- change one parameter block at a time
- keep a shared seed schedule across compared scenarios
- record both summary metrics and visible anomalies
- do not mix baseline and extension results in the same interpretation table unless clearly labeled

## Shared Defaults

Unless the tranche says otherwise:

- `N = 250`
- 20 replications
- one saved representative run per scenario
- one batch summary per scenario

## Tranche A. Baseline Reference Set

Purpose:

- establish that the baseline model behaves plausibly before extensions are interpreted

Use:

- `arrivalMode = uniform_square`
- `meshMode = off`
- `planarityMode = none`

Scenarios:

1. BA benchmark
2. Capacity-only
3. Spatial-only
4. General model

Record:

- node count
- edge count
- mean degree
- max degree
- degree Gini
- clustering
- path length
- edge-length summaries
- early-stop rate
- truncation rate

Questions:

- does increasing `phi` shorten chosen links
- does low `K` visibly truncate the tail
- does `kappa = 1` remain tree-like

## Tranche B. Arrival-Process Comparison

Purpose:

- isolate arrival placement from target-choice effects

Keep the kernel fixed and compare:

1. `uniform_square`
2. `uniform_lattice`
3. `near_existing_network`
4. `outside_occupied_region`

Record:

- edge-length summaries
- directional bias
- boundary-contact rate
- accessibility summaries
- representative network snapshots

Questions:

- how much geometry comes from where nodes appear
- which arrival mode creates the strongest directional bias

## Tranche C. Lattice and Mesh

Purpose:

- study grid-like structure without planarity confounds

Use:

- `meshMode = grid_bias`
- `planarityMode = none`

Compare:

- `meshAngleSet = 60`
- `meshAngleSet = 90`

Then vary one at a time:

- adjacency rule
- `meshNearestCount`
- `meshSpacingFactor`
- `meshOrthogonalBias`

Record:

- directional bias
- local clustering
- boundary-contact rate
- early-stop rate
- representative morphology

Questions:

- which settings create contiguous accretion
- which settings create drift without meaningful structure

## Tranche D. Planarity

Purpose:

- determine whether crossing handling changes the process structurally

Use one square-family and one triangular-family lattice setup.

Compare:

1. `none`
2. `reject_crossings`
3. `split_crossings`

Record:

- crossing count
- split-node count
- split-event count
- early-stop rate
- truncation rate
- path length
- accessibility summaries

Questions:

- does `reject_crossings` mostly suppress crossings or mostly kill growth
- does `split_crossings` create a different morphology rather than merely planarizing the same one

## Tranche E. Accessibility As Mechanism

Purpose:

- test whether accessibility should become a direct rule rather than just a diagnostic

Use one stable baseline case and one stable lattice case.

Compare:

1. no access weighting
2. access in arrival preference only
3. access in target selection only
4. access in both

Record:

- accessibility distribution
- seed-node versus non-seed accessibility
- mean path length
- clustering
- directional bias
- representative snapshots

Questions:

- does accessibility weighting improve transport coherence
- or does it mainly reinforce interior centrality

## Output Template

For each scenario, save:

- scenario name
- exact parameter settings
- seed schedule
- batch summary
- one representative run image
- 3 to 5 bullet findings
- unresolved anomalies

## Interpretation Rules

- if an effect appears only in one seed, treat it as anecdotal
- if an effect appears in the summary distribution, treat it as structural
- if a pattern depends on mesh or planarity helpers, do not describe it as a result of the baseline generalized model

## Immediate Next Use

If only one tranche is run next, it should be:

- Tranche A for baseline confidence

If two are run, use:

- Tranche A
- then Tranche D

That gives the clearest short-term distinction between core model behavior and transport-style extensions.

## Beyond-Paper Program

Once paper replication is accepted as sufficient, use:

- `npm run analyze:beyond -- --smoke`
- `npm run analyze:beyond -- --medium`
- `npm run analyze:beyond:focused -- --smoke`
- `npm run analyze:beyond:focused -- --medium`
- `npm run analyze:beyond`

That runner is organized around:

- planarity as a transport-growth extension
- accessibility semantics as direct growth rules
- planarity × accessibility interaction

The detailed design is in [BEYOND_PAPER_RESEARCH_PLAN.md](BEYOND_PAPER_RESEARCH_PLAN.md).

Once the broad beyond-paper suite identifies stable mechanisms, use the focused
runner:

- `npm run analyze:beyond:focused -- --medium`

It isolates the two strongest current extension claims:

- planarity as a junction-forming growth family
- accessibility semantics inside an active split-planarity regime

## Refined Runbook

Use this second-stage runbook after one full browser-model pass has already been completed.

### Refined Tranche R1. Strict baseline kernel

Purpose:

- recover a clean estimate of the original generalized-model behavior inside the browser implementation

Use only:

- `arrivalMode = uniform_square`
- `meshMode = off`
- `planarityMode = none`
- `arrivalPreferenceMode = baseline`
- `selectionKernelMode = baseline`

Vary:

- `phi` with `beta = 0` and high `K`
- `K` with a low-degree seed and higher `beta`
- `kappa`
- optionally `alpha`

Success criterion:

- the expected baseline signals are visible without needing mesh or access helpers

### Refined Tranche R2. Strict mesh growth

Purpose:

- isolate what lattice framing and local admissibility do on their own

Use:

- `meshMode = grid_bias`
- `planarityMode = none`
- no accessibility weighting

Compare:

- `90°` versus `60°`
- nearest-edge versus expanded-ring adjacency
- `near_existing_network` versus `outside_occupied_region`

Success criterion:

- geometry differences are attributable mainly to lattice family and local feasibility

### Refined Tranche R3. Activated planarity

Purpose:

- make planarity modes experimentally distinct

Design principle:

- do not accept a tranche where split counts remain zero and reject-crossing behavior is indistinguishable from `none`

Preferred settings:

- lower cost deterrence
- higher `kappa`
- smaller `N` so split runs finish
- looser locality screens
- one non-mesh case and one mesh case

Success criterion:

- `none`, `reject_crossings`, and `split_crossings` diverge in crossings, admitted crossing candidates, split counts, or stopping behavior

### Refined Tranche R4. Accessibility semantics

Purpose:

- compare destination semantics directly under the same weighting rule

Compare:

- no access weighting
- realized-network access weighting
- seed-only access weighting
- weighted-opportunity access weighting

Use one non-mesh case and one mesh case if runtime allows.

Success criterion:

- identify whether access is acting more like centrality reinforcement, seed attraction, or opportunity attraction

### Refined Tranche R5. Targeted stress checks

Repeat only the mechanism family that remains ambiguous.

Suggested cases:

- one strong free split case
- one strong mesh split case
- one strong opportunity-weighted case

Repeat rule:

- redesign the tranche before rerunning it
- do not simply increase replications on an uninformative design
