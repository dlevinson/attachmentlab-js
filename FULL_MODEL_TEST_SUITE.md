# Full Model Test Suite

This suite extends beyond strict paper replication. It is meant to probe the layered model families implemented in the shared core:

1. baseline generalized model
2. arrival extensions
3. lattice / mesh extensions
4. planarity extensions
5. accessibility extensions

The suite is intentionally comparative rather than exhaustive. Each tranche changes one mechanism family at a time and records both summary metrics and qualitative regime shifts.

## Tranche F1. Strict Baseline

Purpose:

- re-check the baseline generalized model under the shared core

Use:

- `arrivalMode = uniform`
- `meshMode = off`
- `planarityMode = none`
- `arrivalPreferenceMode = baseline`
- `selectionKernelMode = baseline`

Compare:

- BA benchmark
- Capacity only
- Spatial only
- General model

## Tranche F2. Arrival Family

Purpose:

- isolate the effect of where nodes appear

Use:

- shared baseline kernel
- no mesh or planarity confounds unless explicitly needed

Compare:

- `uniform`
- `uniform_lattice`
- `network`
- `frontier`

## Tranche F3. Lattice and Mesh

Purpose:

- identify when grid-like or contiguous accretion patterns emerge

Compare:

- `meshAngleSet = 60` vs `90`
- nearest-edge vs expanded adjacency
- low vs high spacing

## Tranche F4. Planarity

Purpose:

- establish whether planarity meaningfully changes growth rather than simply rejecting links

Compare:

- `none`
- `reject_crossings`
- `split_crossings`

Record:

- crossing candidates encountered
- crossing candidates admitted
- split events
- generated intersection nodes

## Tranche F5. Accessibility Semantics

Purpose:

- distinguish accessibility as centrality from accessibility to seed or opportunity destinations

Compare:

- `network`
- `seed`
- `opportunity`

Under:

- arrival weighting only
- target weighting only
- both

## Outputs

Each suite run should produce:

- one CSV summary per tranche
- one JSON raw result bundle
- one markdown memo
- one synthesis note highlighting cross-tranche insights

## Execution Profiles

Use the analysis scripts at the repo root:

- `npm run analyze:paper -- --smoke`
- `npm run analyze:paper -- --medium`
- `npm run analyze:paper`
- `npm run analyze:full -- --smoke`
- `npm run analyze:full -- --medium`
- `npm run analyze:full`
- `npm run analyze:beyond -- --smoke`
- `npm run analyze:beyond -- --medium`
- `npm run analyze:beyond`
- `npm run analyze:beyond:focused -- --smoke`
- `npm run analyze:beyond:focused -- --medium`
- `npm run analyze:beyond:focused`
- `npm run analyze:all -- --smoke`
- `npm run analyze:all -- --medium`
- `npm run analyze:all`

Profile guidance:

- `smoke`: fast iteration, useful for checking ordering and diagnostics
- `medium`: overnight-friendly intermediate run
- `full`: paper-facing batch scale

The paper-facing replication suite and the broader full-model suite should be interpreted together. The replication suite checks whether the corrected shared core still reproduces the benchmark envelope described in the paper. The broader suite asks what the extensions add beyond that envelope.

For the dedicated extension-first program, see [BEYOND_PAPER_RESEARCH_PLAN.md](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/BEYOND_PAPER_RESEARCH_PLAN.md).

For a paper-facing comparison bundle around the strongest extension claims, use
the focused runner:

- `npm run analyze:beyond:focused -- --medium`

That runner produces figure-ready CSVs for:

- `planarity_core`
- `access_interaction`

## Interpretation Rules

- do not interpret extension effects as baseline-model results
- use regime ordering before level matching when comparing exploratory tranches
- treat strong interaction effects as findings in their own right rather than as noise
