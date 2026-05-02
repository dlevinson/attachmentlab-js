# Refined R1: Strict baseline kernel

Recover interpretable kernel behavior with settings chosen so cost and capacity can actually bind.

## Settings

- live browser model extracted from `web/main.js`
- replications per scenario: 4
- scenarios: 9

## Reading guide

- Strict baseline isolates the kernel cleanly: compare phi=0 versus phi=5 on mean edge length (0.522 vs 0.110).
- Capacity binding is tested with a ring seed and beta=2 so low-K runs separate meaningfully from high-K runs in max degree and saturation (4.000 / 96.9% vs 25.250 / 0.0%).
- Alpha and kappa should now be interpretable without mesh confounds; compare alpha=0 vs alpha=2 and kappa=1 vs kappa=3 directly.

## Summary table reference

See the paired CSV and JSON outputs for exact scenario-level metrics.
