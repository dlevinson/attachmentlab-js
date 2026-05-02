# MODEL

The browser app implements an undirected simple graph growth process with no self-loops and no duplicate edges.

At each arrival step, a new node `n` is placed at `(x_n, y_n)` in the unit square. It attempts to form `kappa` links to feasible existing nodes, with sequential without-replacement selection and degree updates after every successful edge.

The default attachment kernel is:

```text
w_ni = (k_i + eps)^alpha * max(K_i - k_i, 0)^beta * (c_ni + eps)^(-phi)
```

where:

- `k_i` is the current degree of node `i`
- `K_i` is the capacity of node `i`
- `c_ni` is the Euclidean distance from the arriving node to candidate `i`
- `alpha >= 0` controls preferential attachment
- `beta >= 0` controls capacity saturation
- `phi >= 0` controls cost deterrence
- `eps` is a small positive constant

The alternative impedance mode is:

```text
w_ni = (k_i + eps)^alpha * max(K_i - k_i, 0)^beta * exp(-lambda * c_ni)
```

Default rendering preserves the simulated coordinates exactly. Cytoscape.js is used only as an interactive renderer over preset positions; it is not allowed to rearrange the network geometry in the main view.
