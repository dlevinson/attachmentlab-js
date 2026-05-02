# Medium Synthesis: Replication Status and Next Decision

This note synthesizes the completed medium-scale research run using:

- [paper_replication/PAPER_REPLICATION_REPORT.md](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/research_program_20260407_medium/paper_replication/PAPER_REPLICATION_REPORT.md)
- [paper_replication/headline_comparison.csv](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/research_program_20260407_medium/paper_replication/headline_comparison.csv)
- [paper_replication/sensitivity_comparison.csv](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/research_program_20260407_medium/paper_replication/sensitivity_comparison.csv)
- [paper_replication/heterogeneous_comparison.csv](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/research_program_20260407_medium/paper_replication/heterogeneous_comparison.csv)
- [full_model_suite/FULL_MODEL_SUITE_MEMO.md](/Users/dlev2617/Documents/Code/GTNG%20General%20Theory%20of%20Network%20Growth/results/research_program_20260407_medium/full_model_suite/FULL_MODEL_SUITE_MEMO.md)

## Medium-scale replication verdict

At medium scale, the shared core is now replicating most of the paper's benchmark structure well enough to treat the baseline as broadly faithful.

The strongest matches are:

- mean edge length
  - BA: `0.526` vs paper `0.521`
  - Capacity only: `0.535` vs `0.521`
  - Spatial only: `0.350` vs `0.351`
  - General model: `0.356` vs `0.349`
- degree inequality
  - BA: `0.392` vs `0.388`
  - Capacity only: `0.337` vs `0.335`
  - Spatial only: `0.391` vs `0.389`
  - General model: `0.333` vs `0.336`
- constrained max degree
  - Capacity only: `16.00` vs `16.00`
  - General model: `16.00` vs `16.00`
- tail ordering
  - all four headline scenarios match the paper's preferred tail family
- benchmark robustness
  - no headline runs stopped early

So the medium run answers the main smoke-stage question in the positive direction: the corrected shared core is not merely getting the regime ordering right. It is now getting most headline levels reasonably close too.

## Remaining mismatch

The one metric that is still systematically high is clustering.

Headline clustering gaps:

- BA benchmark: `0.0474` vs paper `0.028`
- Capacity only: `0.0106` vs `0.007`
- Spatial only: `0.0656` vs `0.035`
- General model: `0.0171` vs `0.009`

This same pattern appears in the one-factor and heterogeneous-capacity comparisons:

- `phi_0`: `0.0580` vs target `0.0075`
- `phi_2`: `0.0806` vs target `0.0721`
- constant `K=16`: `0.0179` vs `0.0096`
- uniform `U[8,24]`: `0.0293` vs `0.0121`
- lognormal mean approx `16`: `0.0408` vs `0.0197`

The important nuance is that the direction of movement is still right:

- raising `phi` raises clustering
- increasing `kappa` raises clustering and cyclomatic number
- heterogeneous `K_i` raises clustering relative to constant `K`

So the clustering issue is now mostly a level mismatch, not a direction mismatch.

## What medium scale tells us that smoke could not

Medium scale resolves several doubts from the smoke pass.

1. The weak browser-baseline signal was mostly a harness interpretation problem, not a dead model. The corrected medium replication now shows strong and sensible edge-length and capacity effects.

2. BA and spatial headline cases are much closer to the paper's heavy-tailed behavior than they were at smoke scale. This supports the claim that the shared core is converging in the intended direction as size increases.

3. The benchmark envelope is stable. There are no early stops in the headline, one-factor, or heterogeneous-capacity replication tranches.

4. The broader full-model suite is useful for extension behavior, but it should not be mistaken for the paper-replication benchmark. Its baseline tranche uses a different exploratory design and therefore should not be used to judge strict paper fidelity.

## Full-model extension takeaways

The medium full-model suite confirms that the major extensions are now live and experimentally distinct:

- `split_crossings` is no longer dormant
  - encountered crossing candidates: `9436.00`
  - admitted: `82.67`
  - split events: `22.00`
  - intersection nodes: `1216.67`
- accessibility semantics are implemented and separable, even if under the tested mesh settings they do not yet produce large topological differences

That means the project now has two coherent uses:

- paper-facing replication of the generalized baseline family
- exploratory extension research beyond the paper

## Decision

The medium results are strong enough to justify running and interpreting the full paper-replication profile.

The main caveat to carry forward is explicit:

- treat clustering as the one remaining watchpoint
- do not describe the current implementation as a perfect level match yet
- describe it instead as a good replication on edge length, inequality, degree constraints, and tail ordering, with clustering still somewhat elevated

## Suggested next steps

1. Run the full paper-replication profile as the final replication checkpoint.
2. Keep the strict-baseline clustering audit attached to that interpretation.
3. If clustering remains high at full scale, investigate it as a remaining implementation-or-specification difference rather than blocking the rest of the research program.
4. Continue using the full-model suite for beyond-paper insights rather than forcing it into the replication role.

## Bottom line

Medium scale changes the project status materially.

We are no longer asking, "Does the corrected shared core behave sensibly at all?"

We are now asking a narrower and more research-interesting question:

- does clustering converge closer to the paper at full scale, or is it a persistent difference in model realization?

That is a good place to be.
