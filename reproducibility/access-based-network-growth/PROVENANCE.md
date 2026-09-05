# Provenance

This archive records the code and outputs used for the September 2026 revision of “Access-Based Network Growth: Preferential Attachment with Capacity, Cost, and Connectivity,” submitted to *Applied Network Science*.

## Revision history represented here

- The four-scenario, one-factor sensitivity, and beta-capacity grid outputs use deterministic simulations with seeds derived from the suite, scenario, network size, and replication index.
- The degree-tail tables were regenerated from saved integer degree sequences using a common support and discrete likelihoods for the power-law, geometric-exponential, and discretised-lognormal candidates.
- The heterogeneous-capacity block was rerun after capacity draws were defined as integer degree ceilings. Uniform draws are integers from 8 through 24, inclusive. Lognormal draws are rounded to the nearest integer.
- The access-guided block was rerun after candidate-site access adopted the selected destination semantics. Every completed graph is evaluated with the same set of exogenous origins and unit-weight destinations; generated junctions remain traversable.
- On September 5, 2026, seed sanitisation was corrected to preserve the full unsigned 32-bit range. The prior upper limit of 2,147,483,647 collapsed larger requested seeds to the same effective seed. The retain/reject crossing configurations and reject/seed/opportunity access configurations were rerun (20 replications). The crossing-split and target-access configurations retain their four valid saved seeds and runs. Every current TypeScript run ledger records its effective seed.
- The 24-run Figure 2 selection pool was refreshed after the seed correction. The capacity-only and access-based representatives changed. The BA and spatial-only runs retain the same graph realisations. Representative exporters check the effective seed, and archive verification independently reconstructs graph metrics from nodes and edges.
- The seed correction changes the crossing retain mean segment length to 0.5118 and reject clustering to 0.744. Common gravity-access means are 64.50 (reject), 66.13 (target), 66.32 (seed), and 66.27 (opportunity). Their sample standard deviations are 0.23, 0.13, 0.17, and 0.13. Relative gravity gains for the three split strategies are 2.5%, 2.8%, and 2.7%.
- Selected tail supports containing one or two observed values now return observed counts and support labels, with fitted parameters and AICs omitted. Other tail fits were regenerated from the same saved degree sequences. The underlying 596 Python growth simulations and their main numerical summaries are unchanged by the September 5 corrections.
- Capacity axes display the implemented finite non-binding value K=1017 for the N=1000 sensitivity/grid designs. The seed correction and this labelling change leave the reported capacity, distance, and multi-link entry findings unchanged.

## Source boundaries

The archive contains authored simulation code, synthetic simulation outputs, derived tables, and figures. It contains no confidential, personal, licensed, or proprietary input data.

The repository currently has no separate software license. Standard copyright applies to reuse beyond examination and reproduction of the reported analysis.
