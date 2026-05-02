# Tranche C: Lattice and mesh regularization

Compare square and triangular lattice families and local neighbor rules without planarity confounds.

## Settings

- pilot browser-model batch
- replications per scenario: 5
- scenarios: 4

## Findings

- Square and triangular lattice families are materially different in the live browser model: compare mean clustering 0.098 versus 0.073 and east-west bias -0.029 versus 0.017.
- Expanded local rings increase admissible local choices and should therefore be read as feasibility changes, not merely cosmetic adjacency variants.
- If queen-like adjacency raises clustering and total network length relative to rook-like adjacency, then much of the apparent mesh effect is coming from expanded admissibility rather than from the original kernel.

## Summary table reference

See the paired CSV/JSON outputs for exact scenario-level metrics.
