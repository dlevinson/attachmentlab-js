# Paper Replication Targets

Source paper:

- [`A_General_Model_of_Network_Growth__Preferential_Attachment_with_Capacity__Cost__and_Connectivity-2.pdf`](/Users/dlev2617/Downloads/A_General_Model_of_Network_Growth__Preferential_Attachment_with_Capacity__Cost__and_Connectivity-2.pdf)

This note extracts the benchmark design and headline quantitative targets that the shared core should approximately reproduce.

## Simulation Design

From Section 6 of the paper:

- undirected simple graphs
- embedded in the unit square
- seed nodes and arriving nodes drawn independently from `U([0,1]^2)`
- default seed network: complete graph on `m0 = 5`
- requirement: `m0 >= kappa + 1`

Benchmark structure:

1. headline scenarios
2. one-factor comparative statics
3. compact `beta–K` interaction grid
4. heterogeneous-capacity comparison

Replication counts:

- headline suite: `16` replications at `N ∈ {200, 1000}`
- one-factor and `beta–K` suites: `12` replications at `N = 1000`
- heterogeneous-capacity comparison: `16` replications at `N = 1000`

## Headline Scenario Parameters

At `N = 1000`, Table 2 defines:

- BA benchmark: `alpha=1`, `beta=0`, `phi=0`, `kappa=2`, `K=very_large`
- Capacity only: `alpha=1`, `beta=1`, `phi=0`, `kappa=2`, `K=16`
- Spatial only: `alpha=1`, `beta=0`, `phi=1`, `kappa=2`, `K=very_large`
- General model: `alpha=1`, `beta=1`, `phi=1`, `kappa=2`, `K=16`

## Headline Quantitative Targets

From Table 3 at `N = 1000`:

| Scenario | Max degree | Degree Gini | Clustering | Mean edge length | Preferred tail |
| --- | ---: | ---: | ---: | ---: | --- |
| BA benchmark | 82.31 | 0.388 | 0.028 | 0.521 | Power law |
| Capacity only | 16.00 | 0.335 | 0.007 | 0.521 | Exponential |
| Spatial only | 85.50 | 0.389 | 0.035 | 0.351 | Power law |
| General model | 16.00 | 0.336 | 0.009 | 0.349 | Exponential |

## One-Factor Sensitivity Targets

From the paper text:

- increasing `phi` from `0` to `2` should reduce mean edge length from `0.526` to `0.157`
- increasing `phi` from `0` to `2` should raise clustering from `0.0075` to `0.0721`
- increasing `kappa` from `1` to `4` should:
  - raise cyclomatic number from `6` to `2991`
  - reduce average shortest-path length from `8.19` to `3.58`
  - raise clustering from `0.00035` to `0.0151`

## Heterogeneous Capacity Targets

From Table 4 at `N = 1000`:

| Capacity specification | Max degree | Degree Gini | Share at capacity | Clustering |
| --- | ---: | ---: | ---: | ---: |
| Constant `K=16` | 16.00 | 0.337 | 0.0039 | 0.0096 |
| Uniform `U[8,24]` | 22.94 | 0.354 | 0.0019 | 0.0121 |
| Lognormal, mean ≈ 16 | 48.69 | 0.382 | 0.0019 | 0.0197 |

Lognormal parameters already used elsewhere in the repo:

- `mu = 2.647588722239781`
- `sigma = 0.5`

## Structural Acceptance Checks

The paper also states:

- no run in the explored benchmark envelope terminated early
- all benchmark networks remained connected
- capacity-constrained cases should favor exponential tails
- BA should only clearly favor a power-law tail at larger executed size

## Replication Interpretation Rules

- treat the current shared core as replicated if the regime ordering matches and the main metric gaps are reasonably close
- treat large deviations in level, even when ordering is correct, as implementation drift requiring audit
- treat any early-stop behavior in the strict paper benchmark as a likely mismatch unless directly explained by a documented change in model semantics
