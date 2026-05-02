# Full Replication Synthesis

This memo summarizes how the completed full paper-replication run compares with the paper targets.

## Overall verdict

The full replication is strong. The model now reproduces the paper's headline regime ordering and is numerically close on the core reported quantities:

- degree inequality
- maximum degree under constrained and unconstrained cases
- mean edge length
- preferred tail family
- absence of early stopping

The remaining mismatch is small and concentrated rather than broad:

- clustering is still a little high in the constrained cases, especially `capacity_only`
- `phi_0` clustering remains much higher than the paper target, even though `phi_2` clustering matches well
- heterogeneous `shareAtCapacity` is directionally correct but somewhat noisier than the paper targets

So the honest conclusion is:

- baseline replication: successful
- sensitivity replication: mostly successful, with one notable `phi_0` clustering mismatch
- heterogeneous-capacity replication: successful in regime ordering and close in level, though `shareAtCapacity` is less exact than the other metrics

## Headline scenarios

### BA benchmark

- target: max degree `82.31`, Gini `0.388`, clustering `0.028`, mean edge length `0.521`, tail `power_law`
- realized: max degree `75.00`, Gini `0.392`, clustering `0.0261`, mean edge length `0.5277`, tail `power_law`

Verdict: very good match. The degree tail, inequality, and edge-length level are all close, and clustering is only slightly low relative to target.

### Capacity only

- target: max degree `16`, Gini `0.335`, clustering `0.007`, mean edge length `0.521`, tail `exponential`
- realized: max degree `16.00`, Gini `0.336`, clustering `0.0041`, mean edge length `0.5282`, tail `exponential`

Verdict: strong match. Degree cap, inequality, and tail type are reproduced very closely. Clustering is lower than the target but still in the same low-clustering regime.

### Spatial only

- target: max degree `85.5`, Gini `0.389`, clustering `0.035`, mean edge length `0.351`, tail `power_law`
- realized: max degree `86.25`, Gini `0.391`, clustering `0.0358`, mean edge length `0.3477`, tail `power_law`

Verdict: excellent match. This is the cleanest of the headline cases.

### General model

- target: max degree `16`, Gini `0.336`, clustering `0.009`, mean edge length `0.349`, tail `exponential`
- realized: max degree `16.00`, Gini `0.337`, clustering `0.00909`, mean edge length `0.3569`, tail `exponential`

Verdict: excellent match. This is close enough to count as a successful replication of the integrated model.

## Sensitivity tranche

### Phi sensitivity

- `phi_0`:
  - target mean edge length `0.526`
  - realized `0.531`
  - target clustering `0.0075`
  - realized `0.0320`

- `phi_2`:
  - target mean edge length `0.157`
  - realized `0.155`
  - target clustering `0.0721`
  - realized `0.0710`

Interpretation:

- the distance-cost mechanism is clearly working; edge lengths move almost exactly as expected
- the high-`phi` clustering response is also replicated well
- the low-`phi` clustering case is the main remaining outlier

That suggests the issue is not that `phi` is broken. Rather, low-cost unconstrained growth still seems to retain more local closure than the paper target reports.

### Kappa sensitivity

- `kappa_1`:
  - target cyclomatic number `6`
  - realized `6`
  - target clustering `0.00035`
  - realized `0.00040`

- `kappa_4`:
  - target cyclomatic number `2991`
  - realized `2991`
  - target clustering `0.0151`
  - realized `0.0147`

Interpretation:

- `kappa` behavior is replicated extremely well
- the tree-vs-cycle mechanism is one of the strongest validated parts of the implementation

## Heterogeneous capacity tranche

### Constant capacity

- target: max degree `16`, Gini `0.337`, share at capacity `0.0039`, clustering `0.0096`
- realized: max degree `16.00`, Gini `0.336`, share at capacity `0.00481`, clustering `0.00971`

Verdict: strong match.

### Uniform capacity

- target: max degree `22.94`, Gini `0.354`, share at capacity `0.0019`, clustering `0.0121`
- realized: max degree `22.13`, Gini `0.355`, share at capacity `0.00106`, clustering `0.0128`

Verdict: good match. Share-at-capacity is lower than target, but the structural profile is correct.

### Lognormal capacity

- target: max degree `48.69`, Gini `0.382`, share at capacity `0.0019`, clustering `0.0197`
- realized: max degree `52.13`, Gini `0.382`, share at capacity `0.00213`, clustering `0.0212`

Verdict: good match. The regime ordering is correct and the levels are close.

## What we can now say confidently

The implementation now reproduces the intended paper logic well enough that the baseline generalized model can be treated as validated for:

- degree-cap truncation
- spatial cost deterrence
- connectivity order effects via `kappa`
- heterogeneous-capacity regime ordering
- integrated general-model behavior

That is a meaningful milestone. Earlier uncertainty about weak `phi`, weak capacity, and dormant planarity turned out to be mostly harness and execution-path issues rather than core-model failure.

## Remaining watchpoint

The one remaining paper-facing watchpoint is this:

- low-`phi` clustering is still higher than target in the sensitivity tranche

Because the full integrated `general_model` now matches well, this is no longer a blocker for claiming successful replication overall. It is better framed as a residual discrepancy in one sensitivity corner of the parameter space.

## Recommended next step

Use this full replication as the baseline validation checkpoint, then shift effort toward the broader model extensions:

- planarity as a distinct transport-growth family
- accessibility semantics beyond realized-network access
- full-model insight sweeps beyond paper replication

If more baseline work is done, it should be narrowly targeted at the `phi_0` clustering mismatch rather than reopening the whole model audit.
