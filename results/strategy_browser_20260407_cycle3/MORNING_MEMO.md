# Morning Memo: Browser Model Cycle 3

## What This Cycle Established

This cycle fixed the tranche-runner override bug and reran the refined browser-first experiment plan against the live model in `web/main.js`.

The core acceptance criteria that were previously failing are now meaningfully satisfied:

- Baseline `phi` now has a strong and interpretable effect in strict baseline runs.
- Low `K` now genuinely binds and caps degree under settings designed to activate capacity.
- `split_crossings` is no longer dormant. It produces nonzero admitted crossing candidates, split events, and generated intersection nodes.
- Accessibility semantics are now distinguishable rather than collapsing into one implicit "network access" behavior.

## Main Results

### 1. Baseline generalized model is now interpretable again

In strict baseline runs:

- `phi = 0` produced mean edge length `0.522`
- `phi = 5` produced mean edge length `0.110`

That is the expected direction and a large effect.

Capacity also now behaves clearly when tested with a low-degree ring seed and higher `beta`:

- `K = 4` share at capacity: `96.9%`
- `K = 64` share at capacity: `0.0%`

This means the earlier weak-capacity result was a tranche-design problem, not proof that the implementation could not bind.

### 2. Mesh behavior is real, but it is a separate model family

Mesh-mode runs remain structurally different from the baseline model. The strongest differences are coming from local admissibility rules and lattice framing, not from the original generalized kernel alone.

Examples:

- `90° / edge-neighbor / near-network` clustering: `0.000`
- `60° / edge-neighbor / near-network` clustering: `0.398`

So the lattice family is materially shaping morphology.

### 3. Planarity is active, but split mode is qualitatively different

The planarity tranche now clearly distinguishes free and mesh split behavior:

- free split generated intersections: `1258.5`
- mesh split generated intersections: `19.0`
- free split admitted crossing candidates: `91.5`
- mesh split admitted crossing candidates: `19.0`

This is an important conceptual result: `split_crossings` is not just "planarity on." It is a different growth mechanism that can massively expand the realized graph.

### 4. Accessibility semantics matter

Under identical access-weighted rules, the semantics produce very different values:

Free geometry:

- network access mean gravity: `11.083`
- seed-only access mean gravity: `0.752`
- opportunity access mean gravity: `4.898`

Mesh geometry:

- network access mean gravity: `21.220`
- seed-only access mean gravity: `1.485`
- opportunity access mean gravity: `11.651`

So access semantics should remain explicit in the UI and documentation.

## What We Can Now Say With Confidence

1. The browser model is no longer hiding the main baseline mechanisms.
2. The earlier "weak phi" and "dormant split" findings were artifacts of tranche construction and harness bugs, not the actual engine alone.
3. The current app should be interpreted as a layered model system:
   - baseline generalized model
   - arrival extensions
   - lattice/mesh extensions
   - planarity extensions
   - accessibility semantics/extensions

## Remaining Caveats

### Free split is very explosive

The free-geometry split runs generate very large numbers of intersection nodes relative to target `N`. That may be acceptable if the intent is to model transport-like intersection creation, but it means:

- split mode should not be described as a minor variation on the baseline
- metrics need careful interpretation when split growth is active
- a future safeguard or alternative split policy may be desirable

### Mesh-mode growth is still strongly filtered

The mesh family is now interpretable, but many mesh outcomes are primarily consequences of explicit local admissibility rules. That is acceptable as long as we describe mesh mode as an extension, not as the same model with a different look.

## Recommended Next Steps

### Priority 1. Preserve this corrected testing harness

Treat this cycle's tranche design as the new default research harness for the browser model.

### Priority 2. Port the repaired semantics into the TypeScript engine

The strict baseline, planarity diagnostics, and access semantics should now be mirrored more faithfully into:

- `src/model/kernel.ts`
- `src/model/selection.ts`
- `src/model/simulator.ts`

### Priority 3. Decide how split mode should behave conceptually

There is now enough evidence to choose one of two paths:

- keep `split_crossings` as a deliberately different transport-growth family
- or redesign it to be more conservative if the current explosion is too strong

### Priority 4. Decide which access semantics should be primary

The current system supports multiple semantics, but the research question now becomes:

- should growth respond to realized-network centrality
- to seed nodes
- or to exogenous opportunities

That is a modeling choice, not just a UI choice.

## Bottom Line

I am satisfied that this cycle found and corrected the main implementation/harness issues that were obscuring interpretation.

The browser model now yields genuinely informative results. The next work should focus less on "is the engine alive?" and more on choosing which extended model family is the one you actually want to study.
