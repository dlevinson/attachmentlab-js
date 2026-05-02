# Browser Batch Tranche A Results

This memo reports the first execution tranche from the current browser model in `web/main.js`.

## Scope

- headline reference scenarios: BA benchmark, capacity-only, spatial-only, general model
- focused one-factor sensitivity around the general model
- 20 replications per scenario
- `N = 250`
- `arrivalMode = uniform`
- `meshMode = off`
- `planarityMode = none`

## Headline findings

- BA benchmark has the highest mean max degree (39.900) and highest degree Gini (0.389), consistent with unconstrained hub formation.
- Capacity-only produces the highest saturation among the headline set (9.2%), confirming that finite capacity is already materially binding at `K = 8`.
- Spatial-only shortens mean edge length to 0.362 compared with the BA benchmark value 0.529, which shows that cost deterrence is active in the browser model's attachment stage.
- The general model combines shorter links (0.363) with more saturation (0.3%) and lower hub dominance than BA.

## Sensitivity findings

- Relative to the general baseline, `phi = 5` reduces mean edge length from 0.362 to 0.094, while `phi = 0` raises it to 0.522. In the baseline family, cost deterrence is therefore the clearest link-length control.
- `K = 4` raises saturation to 100.0% and lowers mean max degree to 4.000, while `K = 64` lowers saturation to 0.0% and allows larger hubs (32.300). Capacity is therefore the clearest tail-truncation lever.
- `kappa = 1` produces much lower mean clustering (0.001) than `kappa = 3` (0.042), supporting the interpretation that attachment multiplicity drives local cycle formation more directly than `alpha` does.
- `beta = 2` mainly behaves as a saturation-pressure modifier rather than a geometric one: its strongest movement is in saturation and max degree, not in mean edge length.

## What we can learn already

- The current browser model does preserve the baseline intuition that `phi` mainly acts on chosen link length, not arrival location, when mesh mode is off.
- Capacity and saturation are structurally important even without any lattice or planarity extensions.
- `kappa` is the most direct control over tree-likeness versus cyclicity in the baseline family.
- The baseline browser model is worth treating as a coherent reference family before interpreting any mesh, crossing, or accessibility extensions.
