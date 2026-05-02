# Tranche D: Planarity comparison

Compare none, reject-crossings, and split-crossings on square and triangular lattice families.

## Settings

- pilot browser-model batch
- replications per scenario: 4
- scenarios: 6

## Findings

- Reject-crossings and split-crossings are not neutral variants. Compare early-stop rates and split counts directly: reject-crossings suppresses admissibility, while split-crossings changes the network-growth mechanism itself.
- Square and triangular planarity cases should be interpreted separately because the same planarity rule acts on different local geometry and candidate shells.
- If split-crossings produces generated intersection nodes without lowering crossing counts as much as reject-crossings does, it should be treated as a transport-growth extension rather than as a strict planarity fix.

## Summary table reference

See the paired CSV/JSON outputs for exact scenario-level metrics.
