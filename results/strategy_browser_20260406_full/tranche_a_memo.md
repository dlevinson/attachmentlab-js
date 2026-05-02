# Tranche A: Baseline kernel behavior

Rebuild confidence in the baseline browser model before interpreting extensions.

## Settings

- pilot browser-model batch
- replications per scenario: 8
- scenarios: 10

## Findings

- Within the baseline family, BA retains the highest mean max degree (14.625) and highest degree Gini (0.334), which supports using it as the unconstrained reference.
- Cost deterrence is the clearest link-length control: the general model with phi=5 has mean edge length 0.369, versus 0.382 when phi=0.
- Capacity is the clearest tail-truncation lever: K=4 forces mean max degree to 14.375 with saturation 0.1%, while K=64 allows mean max degree 14.750 with zero saturation.
- Attachment multiplicity is the clearest local-cycle lever: kappa=1 drives clustering down to 0.079, while kappa=3 raises it to 0.081.

## Summary table reference

See the paired CSV/JSON outputs for exact scenario-level metrics.
