# Smoke Synthesis: Replication and Beyond-Paper Signals

This note summarizes what the completed smoke-scale combined research run establishes, using:

- [`paper_replication/PAPER_REPLICATION_REPORT.md`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/research_program_20260407_smoke/paper_replication/PAPER_REPLICATION_REPORT.md)
- [`paper_replication/headline_comparison.csv`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/research_program_20260407_smoke/paper_replication/headline_comparison.csv)
- [`full_model_suite/FULL_MODEL_SUITE_MEMO.md`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/research_program_20260407_smoke/full_model_suite/FULL_MODEL_SUITE_MEMO.md)
- [`full_model_suite/suite_summary.csv`](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/research_program_20260407_smoke/full_model_suite/suite_summary.csv)

## Replication Takeaways

The corrected shared core is now reproducing the benchmark regime ordering of the paper much better than earlier browser-only passes.

What already lines up well:

- Mean edge length is very close to the paper in the headline scenarios:
  - BA: `0.518` vs paper `0.521`
  - Capacity only: `0.522` vs paper `0.521`
  - Spatial only: `0.355` vs paper `0.351`
  - General model: `0.359` vs paper `0.349`
- Capacity-constrained cases cap max degree where expected:
  - Capacity only: `15` vs paper `16`
  - General model: `15` vs paper `16`
- Degree inequality is also close in the constrained cases:
  - Capacity only Gini: `0.336` vs paper `0.335`
  - General model Gini: `0.327` vs paper `0.336`
- No early-stop behavior appears in the benchmark envelope, matching the paper.

What is directionally right but still not level-matched:

- BA and spatial max degree are much lower than the `N=1000` paper targets, which is expected at smoke scale (`N=200` here).
- Tail classification remains mostly exponential in the smoke run, again consistent with this being too small for strong tail identification.

What is still notably off:

- Clustering is consistently too high relative to the paper:
  - BA: `0.084` vs `0.028`
  - Capacity only: `0.031` vs `0.007`
  - Spatial only: `0.090` vs `0.035`
  - General model: `0.039` vs `0.009`

So the current state is:

- edge-length and capacity-truncation behavior are convincingly on track
- benchmark connectivity/clustering levels still look too meshy or too triangle-rich
- a larger replication profile is still needed before making a final paper-fidelity claim

## Sensitivity Takeaways

The one-factor smoke tranche is already highly informative:

- Raising `phi` from `0` to `2` shortens mean edge length strongly: `0.532 -> 0.211`
- Raising `kappa` from `1` to `4` changes topology strongly:
  - cyclomatic number: `6 -> 591`
  - path length: `5.94 -> 2.82`
  - clustering: `0.0030 -> 0.0584`

These are the right directions relative to the paper, even if the exact clustering levels remain higher than reported in the benchmark text.

Heterogeneous capacity is also behaving plausibly:

- constant max degree: `16`
- uniform max degree: `18`
- lognormal max degree: `25.5`

So dispersion in `K_i` is already restoring hub inequality in the expected order.

## Beyond-Paper Findings

The broader full-model suite is already producing insights the original benchmark does not address.

### 1. Mesh framing is a real model extension, not a cosmetic view

The mesh tranche shows large morphological differences between square and triangular local admissibility:

- `90 edge-neighbor` clustering: `0.000`
- `90 edge-plus-corner` clustering: `0.400`
- `60 nearest-edge` clustering: `0.378`
- `60 expanded ring` clustering: `0.404`

So lattice family plus local admissibility are doing substantial structural work. These should not be described as baseline generalized-model effects.

### 2. Planarity is now experimentally active

The smoke planarity tranche clearly distinguishes the three planarity families:

- `none`: admits crossings freely
- `reject_crossings`: suppresses them and increases local clustering
- `split_crossings`: produces a radically different realized graph

At smoke scale:

- `split_crossings` encountered `5243.5` crossing candidates
- admitted `66`
- generated `844` intersection nodes
- performed `18` split events

That confirms `split_crossings` is no longer dormant. It also confirms it should be treated as a transport-growth family, not a mild variant of baseline growth.

### 3. Accessibility semantics matter, but differently than a classical opportunity model

The full-model smoke suite shows distinct behavior for:

- no access weighting
- network access weighting
- seed-only access weighting
- opportunity access weighting

Even in a small run, these semantics produce different path lengths, direction shares, and degree inequality. That supports keeping access semantics explicit in both the UI and the testing design.

## Immediate Suggestions

1. Use the smoke run as the current proof that the corrected shared core is behaving sensibly and is worth scaling up.
2. Use the medium and full profiles to answer the remaining replication question, especially whether clustering remains systematically high.
3. Keep interpreting results by model family:
   - baseline generalized model
   - arrival extension
   - mesh extension
   - planarity extension
   - accessibility extension
4. If clustering remains high at larger scale, audit triangle creation and seed effects in the strict baseline again rather than treating the edge-length match alone as sufficient.

## Bottom Line

The main unfinished question is no longer whether the engine is alive or whether the testing harness works. Those are in good shape.

The remaining open question is narrower and more interesting:

- does the corrected shared core converge toward the paper's benchmark levels at larger scale, especially for clustering and tail behavior?

That is exactly what the medium and full profiles are for.
