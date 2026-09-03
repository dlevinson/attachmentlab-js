import type { ScenarioDocument, SimulationParams } from '../types/model';
import { createDefaultParams } from '../model/simulator';

export function parseScenarioDocument(text: string): ScenarioDocument {
  const raw = JSON.parse(text) as Partial<ScenarioDocument>;
  if (raw.version !== 1 || !raw.params) {
    throw new Error('Unsupported scenario document.');
  }
  return raw as ScenarioDocument;
}

export function mergeScenarioParams(params: Partial<SimulationParams>): SimulationParams {
  const defaults = createDefaultParams();
  return {
    ...defaults,
    ...params,
    capacityParams: {
      ...defaults.capacityParams,
      ...params.capacityParams,
    },
  };
}
