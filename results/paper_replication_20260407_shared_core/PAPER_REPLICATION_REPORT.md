# Paper Replication Report

This report compares the shared core in `src/standalone/browser-core.js` against the executed benchmark targets reported in the attached April 7, 2026 paper.

## Inputs

- headline suite: 16 replications at N=1000
- one-factor subset: 12 replications at N=1000
- heterogeneous capacity suite: 16 replications at N=1000
- strict baseline execution path only:
  - arrivalMode = uniform
  - meshMode = off
  - planarityMode = none
  - baseline arrival and target selection

## Headline replication

- BA benchmark: max degree 83.56 vs 82.31, Gini 0.391 vs 0.388, clustering 0.030 vs 0.028, mean edge length 0.527 vs 0.521, tail power_law vs power_law.
- Capacity only: max degree 16.00 vs 16.00, Gini 0.335 vs 0.335, clustering 0.007 vs 0.007, mean edge length 0.522 vs 0.521, tail exponential vs exponential.
- Spatial only: max degree 86.25 vs 85.50, Gini 0.391 vs 0.389, clustering 0.036 vs 0.035, mean edge length 0.348 vs 0.351, tail power_law vs power_law.
- General model: max degree 15.94 vs 16.00, Gini 0.336 vs 0.336, clustering 0.010 vs 0.009, mean edge length 0.354 vs 0.349, tail exponential vs exponential.

## One-factor checks

- phi_0: mean edge length 0.531 vs 0.526, clustering 0.0320 vs 0.0075, cyclomatic 1001 vs NA, path length NA vs NA.
- phi_2: mean edge length 0.155 vs 0.157, clustering 0.0680 vs 0.0721, cyclomatic 1001 vs NA, path length NA vs NA.
- kappa_1: mean edge length 0.346 vs NA, clustering 0.0004 vs 0.00035, cyclomatic 6 vs 6, path length NA vs 8.19.
- kappa_4: mean edge length 0.351 vs NA, clustering 0.0146 vs 0.0151, cyclomatic 2991 vs 2991, path length NA vs 3.58.

## Heterogeneous capacity checks

- constant_capacity: max degree 16.00 vs 16.00, Gini 0.336 vs 0.337, share at capacity 0.0048 vs 0.0039, clustering 0.0097 vs 0.0096.
- uniform_capacity: max degree 22.25 vs 22.94, Gini 0.354 vs 0.354, share at capacity 0.0022 vs 0.0019, clustering 0.0117 vs 0.0121.
- lognormal_capacity: max degree 52.13 vs 48.69, Gini 0.382 vs 0.382, share at capacity 0.0021 vs 0.0019, clustering 0.0212 vs 0.0197.

## Preliminary interpretation

- If the regime ordering matches but the levels drift, treat that as quantitative implementation drift rather than conceptual failure.
- Any early-stop rate above zero in this strict paper benchmark indicates a mismatch relative to the executed paper benchmark.
- Tail mismatches should be interpreted cautiously because they are sensitive to finite-size effects and the exact fitting workflow.
