# Generalized Preferential Attachment Simulation Study

This folder contains the original Python implementation and experiment pipeline. The repository root now hosts the browser-based JavaScript app, while this directory preserves the reproducible research code in its own workspace.

This repository contains a reproducible simulation framework for a generalized preferential attachment model with four mechanisms:

1. economies of scale through preferential attachment (`alpha`),
2. node capacity and saturation (`beta` and `K`),
3. dyadic connection cost deterrence (`phi`),
4. multiple initial attachments for each arriving node (`kappa`).

The implementation uses an undirected simple graph with no self-loops and no duplicate edges. New nodes are placed in a two-dimensional unit square, and connection cost is the Euclidean distance from the arriving node to each feasible existing node.

## Model

For arriving node `n` and candidate node `i`, the default attachment weight is:

```text
w_ni = (k_i + eps)^alpha * max(K_i - k_i, 0)^beta * (c_ni + eps)^(-phi)
```

with probabilities normalized over feasible existing nodes only. Neighbors are chosen sequentially without replacement, degrees are updated after each link, and growth stops early if no feasible nodes remain.

The BA model is nested as the special case:

```text
alpha = 1, beta = 0, phi = 0, K_i = very_large, kappa = m
```

## Project Structure

- [`src/general_attachment.py`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/python/src/general_attachment.py) implements the growth model.
- [`src/metrics.py`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/python/src/metrics.py) computes run-level network outcomes.
- [`src/tail_fits.py`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/python/src/tail_fits.py) performs degree-tail diagnostics.
- [`src/plots.py`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/python/src/plots.py) generates publication-ready figures.
- [`src/run_experiments.py`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/python/src/run_experiments.py) is the command-line entry point.
- [`configs/benchmark.yaml`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/python/configs/benchmark.yaml) defines reproducible experiment suites.
- [`configs/benchmark_fast.yaml`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/python/configs/benchmark_fast.yaml) defines the compact benchmark used for the checked-in output bundle.
- [`tests/test_general_attachment.py`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/python/tests/test_general_attachment.py) covers core logic and BA special-case checks.

## Run The Experiments

Create an environment with the dependencies listed in [`pyproject.toml`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/python/pyproject.toml), then run from this `python/` directory:

```bash
python -m src.run_experiments --config configs/benchmark.yaml
```

For the compact benchmark that produces the paper-facing bundle more quickly:

```bash
python -m src.run_experiments --config configs/benchmark_fast.yaml
```

To execute only a subset of suites:

```bash
python -m src.run_experiments --config configs/benchmark.yaml --suite headline,sensitivity
```

To regenerate figures, LaTeX tables, captions, and the acceptance summary from existing CSV outputs without rerunning the simulations:

```bash
python -m src.run_experiments --config configs/benchmark_fast.yaml --postprocess-only
```

Outputs are written deterministically to [`../results/benchmark`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/benchmark).
The compact executed bundle in this workspace is written to [`../results/benchmark_fast`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/benchmark_fast).

## Reproducibility Notes

- Each replication receives a deterministic seed derived from the suite name, scenario, final node count, and replication number.
- All plots are saved to both PNG and PDF.
- Tables are saved to CSV and LaTeX.
- Degree sequences are saved per replication in compressed long format for downstream statistical checks.
- Acceptance checks are computed from realized outputs and written to disk instead of being asserted by assumption.

## Runtime

The larger [`configs/benchmark.yaml`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/python/configs/benchmark.yaml) file preserves the broader specification, including a 50-replication full-grid suite. The compact [`configs/benchmark_fast.yaml`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/python/configs/benchmark_fast.yaml) file is the practical interactive-run counterpart used to generate the saved outputs in this session.
