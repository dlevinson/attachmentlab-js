# Intended Model Behavior

This document states the intended behavior of the generalized preferential-attachment model in human-readable form. It is the target specification for auditing the current standalone browser implementation in [`web/main.js`](../web/main.js).

## Baseline model

The intended baseline model is an undirected simple graph:

- no self-loops
- no duplicate edges
- no multi-edges

At each arrival step, one new node `n` is added at position `(x_n, y_n)` in the unit square.

The node then attempts to form `kappa` links to existing feasible nodes. Links are chosen sequentially and without replacement. After each chosen link:

- the degree of the chosen existing node increases by one
- feasibility is recomputed
- the probability distribution is recomputed for the remaining picks in the same arrival

## Attachment kernel

The default kernel is:

```text
w_ni = (k_i + eps)^alpha * max(K_i - k_i, 0)^beta * (c_ni + eps)^(-phi)
```

with:

- `k_i`: current degree of candidate node `i`
- `K_i`: capacity of candidate node `i`
- `c_ni`: Euclidean distance from arriving node `n` to candidate `i`
- `alpha >= 0`: preferential-attachment strength
- `beta >= 0`: saturation pressure from remaining capacity
- `phi >= 0`: cost-deterrence exponent
- `eps > 0`: small regularizing constant

An alternative impedance form is also intended:

```text
w_ni = (k_i + eps)^alpha * max(K_i - k_i, 0)^beta * exp(-lambda * c_ni)
```

with `lambda >= 0`.

The normalized selection probability is:

```text
P_ni = w_ni / sum_j w_nj
```

where the sum is only over feasible candidates.

## Feasibility in the baseline model

In the intended baseline model, a candidate is feasible if:

- it already exists in the graph
- it is not the arriving node
- it is not already connected to the arriving node in the current arrival round
- it has not already been chosen earlier in that same arrival
- it has residual capacity, meaning `k_i < K_i`

If the feasible set has fewer than the remaining required links:

- the arriving node connects to all remaining feasible candidates
- the model records a truncation event

If no feasible candidates exist:

- growth stops early
- the model records the reason

The baseline model does not include lonely temporary nodes. An arrival with zero feasible candidates is an early-stop event, not a stranded node insertion.

## Seed and capacity expectations

Default expectations:

- `m0 = 5`
- seed graph is complete unless another seed is chosen
- `m0 >= kappa + 1`
- node arrivals are uniform random in the unit square
- capacity is homogeneous by default

If homogeneous capacity `K` is selected, the intended meaning is that all nodes use that same capacity rule. The requested `K` should remain the governing capacity parameter rather than being silently increased later by implementation details.

## Rendering expectations

The intended graph geometry is the simulated geometry:

- node coordinates are part of the model, not a visualization convenience
- the default graph view should preserve those coordinates exactly
- no force-directed layout should be used as the default network geometry

## Intended exploratory extensions

The user later requested exploratory extensions beyond the baseline model. These are useful for transport-style and grid-like experiments, but they are extensions, not part of the core generalized preferential-attachment specification.

### Planarity-related extensions

Three behaviors are conceptually distinct:

1. `none`
   The baseline model ignores crossings.

2. `reject_crossings`
   A candidate edge that would cross an existing edge is treated as infeasible.

3. `split_crossings`
   If a new edge crosses an existing edge, a new intersection node is inserted and the crossed link is subdivided.

These extensions should be clearly separated from the baseline model because they change the feasible set and, in the split case, even change node creation logic.

### Mesh and lattice extensions

The user requested exploratory grid-like growth with requirements such as:

- arrivals should be interpretable as occurring on a projected outward lattice
- arrivals should tend to occur near the existing network rather than anywhere in the square
- adjacency rules should be natural for the active lattice family
- growth should behave more like contiguous accretion, “sort of like dominoes”

For a square-family lattice that suggests immediate orthogonal or local-ring neighbors.

For a triangular-family lattice that suggests the natural one-cell neighbor set of that lattice, not square-lattice labels like rook/queen in the conceptual model.

### Transport accessibility

The user requested transport accessibility in the spirit of `Ultimo`-style network accessibility:

- accessibility should be visible in the network view
- exports should eventually be GMNS-compatible
- accessibility should be a transport layer, not merely an assistive-text summary

## Audit questions implied by the intended model

The intended model raises several concrete audit questions:

1. Does the current code stop growth when no feasible targets exist, or does it insert lonely nodes?
2. Does the current code preserve the requested homogeneous capacity `K`, especially in the seed?
3. Does mesh mode only affect arrival placement, or does it also narrow the attachment feasible set?
4. Are reject/split crossing rules applied consistently?
5. Are arrivals on the intended projected lattice, and do boundary conditions behave sensibly?
6. Are diagnostics and UI labels describing what the code really does?
