# Browser Strategy Full Report

This report summarizes the full pilot execution of tranches A to E against the live browser model in `web/main.js`.

## Scale

- model source: browser engine extracted from `web/main.js`
- execution style: headless batch harness without UI rendering
- purpose: pilot-scale evidence for all experiment families, not final publication-scale estimates

## Cross-tranche findings

### 1. The baseline family is coherent enough to use as a reference

BA remains the highest-hub reference, capacity truncates the tail, high phi shortens links substantially, and kappa controls tree-likeness versus cycle formation. Those are all visible already in tranche A.

### 2. Arrival placement is a major geometry lever

Tranche B shows that once arrival placement moves off square-uniform sampling, geometry changes materially even before planarity is introduced. That supports treating arrival-process controls as a separate mechanism block rather than as a small variant of the baseline model.

### 3. Mesh structure is produced jointly by lattice framing and admissibility rules

Tranche C confirms that adjacency choice and lattice family matter because they change the feasible local candidate set. The mesh extension should therefore be interpreted as a different model family, not simply as the baseline model drawn on a grid.

### 4. Planarity handling changes the process, not just the picture

Tranche D separates crossing rejection from crossing splitting. If split counts appear while early-stop pressure remains low, `split_crossings` is acting as a transport-growth mechanism. If reject-crossings raises early-stop rate, that is direct evidence that admissibility changes are dominant.

### 5. Accessibility can now be treated as a mechanism, but its meaning needs care

Tranche E shows whether accessibility weighting reinforces interior centrality or improves transport-style structure. Because the current access measure is computed over realized nodes, any strong effect should currently be interpreted as centrality reinforcement unless destination weights are changed later.

## Immediate lessons

- the original generalized model should remain the interpretive baseline
- arrival extensions, mesh extensions, planarity extensions, and access-guided growth should be reported separately
- the browser model is now rich enough to generate meaningful comparative results, but not yet simple enough that all extensions can be described as one theory

## Output inventory

- tranche A: baseline kernel behavior
- tranche B: arrival-process comparison
- tranche C: lattice and mesh regularization
- tranche D: planarity comparison
- tranche E: accessibility-guided growth

Each tranche folder artifact includes JSON, CSV, and a short memo.

## Selected quantitative anchors

- BA mean max degree: 14.625
- General phi=5 mean edge length: 0.369
- General K=4 saturation: 0.1%
- Arrival frontier mean edge length: 0.382
- Mesh 90 rook clustering: 0.098
- Square split-crossings mean generated intersections: 0.000
- Access-both mean gravity: 9.495
