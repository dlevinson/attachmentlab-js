# Provenance

This archive records the code and outputs used for the September 2026 revision of “Access-Based Network Growth: Preferential Attachment with Capacity, Cost, and Connectivity,” submitted to *Applied Network Science*.

## Revision history represented here

- The four-scenario, one-factor sensitivity, and beta-capacity grid outputs use deterministic simulations with seeds derived from the suite, scenario, network size, and replication index.
- The degree-tail tables were regenerated from saved integer degree sequences using a common support and discrete likelihoods for the power-law, geometric-exponential, and discretised-lognormal candidates.
- The heterogeneous-capacity block was rerun after capacity draws were defined as integer degree ceilings. Uniform draws are integers from 8 through 24, inclusive. Lognormal draws are rounded to the nearest integer.
- The access-guided block was rerun after candidate-site access adopted the selected destination semantics. Every completed graph is evaluated with the same set of exogenous origins and unit-weight destinations; generated junctions remain traversable.
- The crossing-handling block uses the saved four-replication design because its results do not depend on the access-destination correction.

## Source boundaries

The archive contains authored simulation code, synthetic simulation outputs, derived tables, and figures. It contains no confidential, personal, licensed, or proprietary input data.

The repository currently has no separate software license. Standard copyright applies to reuse beyond examination and reproduction of the reported analysis.
