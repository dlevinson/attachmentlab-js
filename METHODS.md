# METHODS

The app computes run-level graph summaries directly from the simulated node and edge records.

Core metrics include node count, edge count, mean and maximum degree, degree Gini, share of saturated nodes, connected components, largest-component share, clustering, assortativity, path-length statistics on the largest component, edge-length summaries, leaf share, high-degree share, and cyclomatic number.

Additional diagnostics include triangle count, square count, and an edge-crossing estimate for moderate graph sizes.

Tail diagnostics are descriptive rather than confirmatory. The app provides:

- empirical degree CCDFs
- a simple `k_min` scan by minimizing KS distance
- a discrete power-law tail exponent estimate by MLE
- AIC-based comparisons against exponential and lognormal alternatives

Batch summaries aggregate replication outputs by scenario using means, standard deviations, and selected quantiles.
