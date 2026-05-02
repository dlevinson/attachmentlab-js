# Browser Strategy Refined Report

This report summarizes the refined second-stage execution against the live browser model in `web/main.js`.

## Design

- model source: browser engine extracted from `web/main.js`
- goal: recover more interpretable mechanism effects after the first full pass showed strong family interactions
- style: strict families first, then stress tranches to activate dormant mechanisms

## Main findings

### 1. Strict baseline behavior

- phi=0 mean edge length: 0.517
- phi=5 mean edge length: 0.109
- K=4 saturation: 97.1%
- K=64 saturation: 0.0%

### 2. Strict mesh behavior

- 90 / edge-neighbor / near-network clustering: 0.000
- 60 / edge-neighbor / near-network clustering: 0.371
- 90 / frontier mean edge length: 0.085
- 60 / frontier mean edge length: 0.091

### 3. Activated planarity

- free split generated intersections: 1334.000
- mesh split generated intersections: 18.750
- free split admitted crossing candidates: 91.750
- mesh split admitted crossing candidates: 18.750

### 4. Accessibility semantics

- free no-access mean gravity: 9.893
- free network-access mean gravity: 11.569
- free seed-only mean gravity: 0.775
- free opportunity mean gravity: 4.971
- mesh no-access mean gravity: 22.448
- mesh network-access mean gravity: 21.835
- mesh seed-only mean gravity: 1.466
- mesh opportunity mean gravity: 11.429

### 5. Targeted stress checks

- stress free split intersections: 1259.250
- stress mesh split intersections: 19.250
- stress free opportunity mean gravity: 5.196
- stress mesh opportunity mean gravity: 10.911

## Interpretation

This refined run should be read as a second-stage design pass. Its main purpose is not to close the project, but to separate mechanism families cleanly enough that the next experimental iteration can focus on the genuinely informative levers.
