# Revision Gaps

This note lists the main gaps that were not fully resolvable inside the current workspace session.

1. The manuscript now reflects a stronger revision benchmark, but not the full intended batch.
The current paper is written against [network_science_revision.yaml](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/configs/network_science_revision.yaml), with outputs in [results/benchmark_revision](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/benchmark_revision). That revision benchmark is meaningfully deeper than the earlier fast pass, but it is still smaller than the broader [benchmark.yaml](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/configs/benchmark.yaml) full-grid / 50-replication design.

2. No empirical section was added.
Per your stated priority, the revised paper is framed as a theory-plus-simulation contribution. It does not yet estimate the model on observed network growth data or compare fit against BA on real cases.

3. The access micro-foundation remains reduced-form.
The manuscript now tightens the bridge from marginal access to the attachment kernel by presenting the kernel as a separable approximation to marginal access gain. But it still does not derive Equation 3 from a fully solved accessibility model with explicit opportunity and impedance primitives.

4. No formal asymptotic proofs were added.
The current contribution is simulation-based. The paper now states limiting cases and reported tail-fit evidence, but it does not prove when the generalized model is power-law, truncated-tail, or fragmented in the large-network limit.

5. Boundary conditions remain only partially mapped.
In the executed revision benchmark, all runs remained connected and no scenario terminated early because the feasible set was empty. That means the paper can honestly report that fragmentation was not observed in the explored envelope, but it cannot yet characterize the thresholds at which fragmentation begins.
