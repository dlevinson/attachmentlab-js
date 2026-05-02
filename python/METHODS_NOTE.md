# Methods Note

## Simulation design

We simulate network growth in an undirected simple graph embedded in a two-dimensional unit square. The seed network contains `m0` nodes arranged as a complete graph, and each seed node is assigned a capacity at birth. At every subsequent time step, a new node arrives at a uniformly random location in `[0, 1]^2` and attempts to form `kappa` links to existing feasible nodes.

Candidate node `i` is feasible when its current degree `k_i` is strictly below its capacity `K_i`. The default attachment weight for an arriving node `n` is

```text
w_ni = (k_i + eps)^alpha * max(K_i - k_i, 0)^beta * (c_ni + eps)^(-phi),
```

where `c_ni` is the Euclidean distance between the arriving node `n` and candidate node `i`, `alpha >= 0` controls preferential attachment, `beta >= 0` controls saturation pressure, `phi >= 0` controls distance deterrence, and `eps` is a small positive constant used only for numerical stability. Attachment probabilities are obtained by normalizing these weights across feasible existing nodes. Neighbors are chosen sequentially without replacement, and node degrees are updated after each realized link.

If fewer than `kappa` feasible existing nodes remain, the arriving node attaches to all feasible nodes and the run records a truncation event. If no feasible existing nodes remain at the start of an arrival step, growth terminates early and the termination reason is written to the results.

## Capacity variants

The framework supports:

- homogeneous capacities, with a common constant `K` for all nodes,
- heterogeneous capacities drawn at node birth from a uniform or lognormal distribution.

For validity, sampled capacities are lower-bounded by the degree required at birth: `m0 - 1` for seed nodes and `kappa` for later arrivals.

## BA nesting

The generalized model nests the Barabási-Albert benchmark exactly when

```text
alpha = 1, beta = 0, phi = 0, K_i = very_large, kappa = m.
```

Under that restriction, the saturation term becomes constant, the cost term becomes constant, and the attachment probability reduces to being proportional to current degree. In that sense, the BA model is the unrestricted topological special case of the present formulation.

## Outputs

For each replication, the framework saves:

- run-level network metrics,
- node-level degree sequences,
- representative network realizations for the headline scenarios,
- publication-ready figures in PNG and PDF,
- summary tables in CSV and LaTeX,
- Clauset-style degree-tail diagnostics.

The tail-fitting workflow chooses `k_min` by minimizing the Kolmogorov-Smirnov distance for a discrete power-law tail, estimates the tail exponent by maximum likelihood, and compares the power-law fit against exponential and lognormal alternatives using log-likelihood-based diagnostics. This is meant to avoid over-reliance on straight-line fits in log-log plots.
