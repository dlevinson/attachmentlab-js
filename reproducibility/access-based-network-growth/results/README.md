# Result files

## `baseline/`

This directory is the complete output of `python/configs/paper_revision.yaml` under the archived Python code and lockfile. `runs.csv` contains one row per replication, `degree_sequences.csv.gz` contains the node degrees used in the tail diagnostics, and `summary_by_scenario.csv` aggregates the replications. The `tables/`, `figures/`, and `text/` subdirectories are derived from those saved run-level files.

## `transport_extensions/`

`focused_results.json` stores configurations, seeds, run-level metrics, and summaries for the crossing and access-guided blocks. `focused_summary.csv` is the compact scenario summary. `representative_states.json` stores the selected graphs used for the crossing figure.

The `corrected_access_comparison/` directory records the common-basis evaluation used in the manuscript. `corrected_access_runs.csv` contains one row per scenario and replication, and `corrected_access_summary.csv` provides the reported means and standard deviations. Its representative-state file assigns access values to exogenous nodes while retaining generated junctions as traversable nodes.

## `baseline_visualisation/`

The headline ledger and representative states support the visualisation-only `N=500` comparison in Figure 1. The manuscript's quantitative four-scenario estimates come from `baseline/`.

Run `make verify` from the archive root to check the reported values against these files.
