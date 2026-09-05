# Access-Based Network Growth: reproducibility archive

This directory reproduces the numerical results and figures in the September 2026 revision of:

David Levinson, Somwrita Sarkar, Nazanin Tajik, and Alireza Ermagun, “Access-Based Network Growth: Preferential Attachment with Capacity, Cost, and Connectivity,” submitted to *Applied Network Science*.

## Contents

| Path | Contents |
|---|---|
| `python/` | Python model, experiment configuration, tests, and locked environment for the four-scenario, sensitivity, beta-capacity, capacity-distribution, and degree-tail blocks. |
| `src/` | TypeScript model and metrics used for the crossing and access-guided extensions. |
| `tools/` | Experiment entry points, representative-state exporters, figure scripts, and reported-value checks. |
| `results/baseline/` | Run-level output, degree sequences, derived summaries, tables, and figures for the principal simulation blocks. |
| `results/transport_extensions/` | Crossing and access-guided extension outputs. |
| `results/baseline_visualisation/` | Saved states used for the four-case graph and accessibility illustration. |
| `paper-figures/` | Exact figure files supplied with the revised manuscript. |
| `PROVENANCE.md` | Corrections, reruns, and release boundary. |
| `MANIFEST.csv` | File inventory, categories, sizes, and SHA-256 hashes. |
| `SHA256SUMS` | Checksums for the archived source, results, and figures. |

All data in this archive are generated simulations.

## Software

- Python 3.10 or newer
- [uv](https://docs.astral.sh/uv/) for the locked Python environment
- Node.js 22 or newer and npm for the TypeScript extension
- GNU Make is optional; every command is also shown directly below

The recorded lockfiles are `python/uv.lock` and `package-lock.json`.

## Quick verification

From this directory:

```bash
uv sync --directory python --frozen
npm ci
make test
make verify
```

`make test` runs the Python and TypeScript test suites. `make verify` checks the quoted values, distinct effective replication seeds, and representative-graph metrics reconstructed independently from the saved nodes and edges.

## Full reproduction

The principal Python experiment contains 596 deterministic replications:

```bash
make reproduce-baseline
```

The transport extensions and their common-basis access evaluation use:

```bash
make reproduce-extensions
```

The representative `N=500` graph-accessibility illustration replays the four selected runs recorded in the committed headline run ledger:

```bash
make reproduce-paper-visualisation
```

The complete six-replication selection process can be rerun with:

```bash
npm run rerun:paper-visualisation-selection
```

The selection rerun computes the metric and tail-diagnostic bundle for all 24 candidate realisations. Accessibility needed only for target guidance is skipped when that guidance is disabled; this leaves growth unchanged.

Regenerate all paper-facing figures after the simulation commands:

```bash
make figures
```

The direct commands are recorded in `Makefile` and `package.json`.

## Paper-to-output map

| Manuscript item | Archived evidence |
|---|---|
| Four comparison scenarios | `results/baseline/tables/table_02_headline_summary.csv` and `results/baseline/runs.csv` |
| One-factor comparative statics | `results/baseline/tables/table_03_sensitivity_summary.csv` |
| Beta-capacity interaction | `results/baseline/summary_by_scenario.csv` and figures 04, 06a, and 06b in its `figures/` directory |
| Heterogeneous integer capacities | `results/baseline/tables/table_05_heterogeneous_capacity.csv` |
| Degree CCDF and tail diagnostics | `results/baseline/degree_sequences.csv.gz` and `results/baseline/tail_fits.csv` |
| Crossing-handling comparison | `results/transport_extensions/focused_summary.csv` |
| Access-guided comparison | `results/transport_extensions/corrected_access_comparison/corrected_access_runs.csv` and `corrected_access_summary.csv` |
| Representative graph and access figures | `paper-figures/` and the saved representative-state files under `results/` |

The simulations use independent deterministic seed streams for each named suite. Identical parameter settings in different design blocks consequently have independent replication draws. TypeScript run ledgers store both the requested `seed` and the `effectiveSeed` retained by the simulation; the valid range is 1 through 4,294,967,295.

The focused September 5 correction can be replayed on older saved transport outputs with `npx vite-node tools/correct_replication_seeds.ts`. It reruns configurations affected by the former signed-seed ceiling and checkpoints each completed configuration under `.cache/seed-correction`, keyed by source and configuration. `npx vite-node tools/recompute_paper_access_comparison.ts --from-saved-runs` summarises the validated common-access run ledger and replays the four selected representative graphs, checking their access values against the ledger. The default command replays every access run. `cd python && uv run python ../tools/refresh_saved_baseline_diagnostics.py` refreshes tail diagnostics and capacity-axis labels from saved baseline data.

## Checksums and citation

Run `shasum -a 256 -c SHA256SUMS` from this directory to verify the archived files. Regenerate the inventory after intentional changes with `cd python && uv run python ../tools/update_manifest.py`. Citation metadata appear in `CITATION.cff`.

See `PROVENANCE.md` for the revision-specific corrections and release boundary.
