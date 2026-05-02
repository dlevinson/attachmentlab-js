# Refined R1: Strict baseline kernel

Recover interpretable kernel behavior with settings chosen so cost and capacity can actually bind.

## Settings

- live browser model extracted from `web/main.js`
- replications per scenario: 8
- scenarios: 9

## Reading guide

- Strict baseline isolates the kernel cleanly: compare phi=0 versus phi=5 on mean edge length (0.517 vs 0.109).
- Capacity binding is tested with a ring seed and beta=2 so low-K runs separate meaningfully from high-K runs in max degree and saturation (4.000 / 97.1% vs 24.500 / 0.0%).
- Alpha and kappa should now be interpretable without mesh confounds; compare alpha=0 vs alpha=2 and kappa=1 vs kappa=3 directly.

## Summary table reference

See the paired CSV and JSON outputs for exact scenario-level metrics.
