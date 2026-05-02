import type { SimulationParams, SimulationState } from '../types/model';
import { getBrowserParityEngine } from './browserParity';

const engine = getBrowserParityEngine();

export function createDefaultParams(): SimulationParams {
  return engine.createDefaultParams();
}

export function sanitizeSimulationParams(params: Partial<SimulationParams> | SimulationParams): SimulationParams {
  return engine.sanitizeParams(params);
}

export function initializeSimulation(params: SimulationParams): SimulationState {
  return engine.initializeSimulation(engine.sanitizeParams(params));
}

export function stepSimulation(state: SimulationState): SimulationState {
  return engine.stepSimulation(state);
}

export function runSimulation(params: SimulationParams): SimulationState {
  return engine.runSimulation(engine.sanitizeParams(params));
}
