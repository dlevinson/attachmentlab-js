# Browser Strategy Refined Report

This report summarizes the refined second-stage execution against the live browser model in `web/main.js`.

## Design

- model source: browser engine extracted from `web/main.js`
- goal: recover more interpretable mechanism effects after the first full pass showed strong family interactions
- style: strict families first, then stress tranches to activate dormant mechanisms

## Main findings

### 1. Strict baseline behavior

- phi=0 mean edge length: 0.367
- phi=5 mean edge length: 0.375
- K=4 saturation: 0.1%
- K=64 saturation: 0.0%

### 2. Strict mesh behavior

- 90 / edge-neighbor / near-network clustering: 0.088
- 60 / edge-neighbor / near-network clustering: 0.087
- 90 / frontier mean edge length: 0.389
- 60 / frontier mean edge length: 0.381

### 3. Activated planarity

- free split generated intersections: 0.000
- mesh split generated intersections: 0.000
- free reject crossing count: 2085.800
- free none crossing count: 2139.000

### 4. Current accessibility semantics

- free no-access mean gravity: 9.893
- free access-both mean gravity: 10.816
- mesh no-access mean gravity: 9.489
- mesh access-both mean gravity: 9.652

### 5. Stress tranches

- planarity stress free split intersections: 0.000
- planarity stress mesh split intersections: 0.000
- access stress free both mean gravity: 10.285
- access stress mesh both mean gravity: 10.743

## Interpretation

This refined run should be read as a second-stage design pass. Its main purpose is not to close the project, but to separate mechanism families cleanly enough that the next experimental iteration can focus on the genuinely informative levers.
