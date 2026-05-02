# Refined R1: Strict baseline kernel

Recover the cleanest baseline browser-model behavior without mesh, planarity, or access extensions.

## Settings

- live browser model extracted from `web/main.js`
- replications per scenario: 10
- scenarios: 9

## Reading guide

- Strict baseline isolates the kernel cleanly: compare phi=0 versus phi=5 on mean edge length (0.367 vs 0.375).
- Capacity binding is visible only if low-K runs separate meaningfully from high-K runs in max degree and saturation (14.000 / 0.1% vs 14.000 / 0.0%).
- Alpha and kappa should now be interpretable without mesh confounds; compare alpha=0 vs alpha=2 and kappa=1 vs kappa=3 directly.

## Summary table reference

See the paired CSV and JSON outputs for exact scenario-level metrics.
