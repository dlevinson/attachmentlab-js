# Tranche B: Arrival-process comparison

Compare arrival rules while keeping the target-selection side as close as possible.

## Settings

- pilot browser-model batch
- replications per scenario: 6
- scenarios: 4

## Findings

- Arrival placement changes geometry strongly. Uniform-in-square produces mean edge length 0.381, while uniform-on-lattice, near-network, and frontier arrivals produce 0.378, 0.378, and 0.382 respectively.
- Near-existing-network and frontier arrivals should be read as explicit geometry extensions rather than mild tweaks to the baseline, because they also change directional bias and boundary contact through the lattice frame.
- If frontier and near-network results are close, that suggests the current attachability filters dominate over the arrival-shell distinction. If they diverge, the difference is being created by site generation itself.

## Summary table reference

See the paired CSV/JSON outputs for exact scenario-level metrics.
