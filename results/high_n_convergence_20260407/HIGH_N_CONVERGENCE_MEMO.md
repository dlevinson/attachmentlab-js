# High-N Convergence Memo

This memo tests whether the remaining clustering gap in the strict baseline appears to shrink at larger executed size for selected headline scenarios.

Scenarios:

- BA benchmark
- General model

Sizes and replications:

- N=1000, 16 replications
- N=2000, 8 replications
- N=5000, 4 replications

## BA benchmark

- N=1000: clustering 0.0261 vs target 0.028 (rel diff 0.068), mean edge length 0.528 vs target 0.521, max degree 75.00, Gini 0.392, tail power_law.
- N=2000: clustering 0.0161 vs target 0.028 (rel diff 0.427), mean edge length 0.523 vs target 0.521, max degree 117.50, Gini 0.391, tail power_law.
- N=5000: clustering 0.0084 vs target 0.028 (rel diff 0.701), mean edge length 0.523 vs target 0.521, max degree 184.25, Gini 0.391, tail power_law.

## General model

- N=1000: clustering 0.0091 vs target 0.009 (rel diff 0.010), mean edge length 0.357 vs target 0.349, max degree 16.00, Gini 0.337, tail exponential.
- N=2000: clustering 0.0061 vs target 0.009 (rel diff 0.326), mean edge length 0.357 vs target 0.349, max degree 16.00, Gini 0.339, tail exponential.
- N=5000: clustering 0.0029 vs target 0.009 (rel diff 0.677), mean edge length 0.351 vs target 0.349, max degree 16.00, Gini 0.338, tail exponential.

## Interpretation

Use this table to judge whether clustering is converging toward the paper as N increases, while edge length and other baseline metrics remain stable.
