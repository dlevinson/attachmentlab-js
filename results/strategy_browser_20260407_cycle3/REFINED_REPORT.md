# Browser Strategy Refined Report

This report summarizes the refined second-stage execution against the live browser model in `web/main.js`.

## Design

- model source: browser engine extracted from `web/main.js`
- goal: recover more interpretable mechanism effects after the first full pass showed strong family interactions
- style: strict families first, then stress tranches to activate dormant mechanisms

## Main findings

### 1. Strict baseline behavior

- phi=0 mean edge length: 0.522
- phi=5 mean edge length: 0.110
- K=4 saturation: 96.9%
- K=64 saturation: 0.0%

### 2. Strict mesh behavior

- 90 / edge-neighbor / near-network clustering: 0.000
- 60 / edge-neighbor / near-network clustering: 0.398
- 90 / frontier mean edge length: 0.085
- 60 / frontier mean edge length: 0.091

### 3. Activated planarity

- free split generated intersections: 1258.500
- mesh split generated intersections: 19.000
- free split admitted crossing candidates: 91.500
- mesh split admitted crossing candidates: 19.000

### 4. Accessibility semantics

- free no-access mean gravity: 10.039
- free network-access mean gravity: 11.083
- free seed-only mean gravity: 0.752
- free opportunity mean gravity: 4.898
- mesh no-access mean gravity: 22.794
- mesh network-access mean gravity: 21.220
- mesh seed-only mean gravity: 1.485
- mesh opportunity mean gravity: 11.651

### 5. Targeted stress checks

- stress free split intersections: 1287.500
- stress mesh split intersections: 19.000
- stress free opportunity mean gravity: 5.034
- stress mesh opportunity mean gravity: 10.385

## Interpretation

This refined run should be read as a second-stage design pass. Its main purpose is not to close the project, but to separate mechanism families cleanly enough that the next experimental iteration can focus on the genuinely informative levers.
