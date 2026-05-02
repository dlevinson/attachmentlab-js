import { useRef } from 'react';
import type { SimulationParams } from '../types/model';
import { scenarioPresets } from '../presets/scenarios';
import { useSimulationStore } from '../store/useSimulationStore';
import { exportScenario } from '../utils/export';
import { mergeScenarioParams, parseScenarioDocument } from '../utils/import';

type ParamKey = keyof SimulationParams;

function NumberInput({
  label,
  value,
  onChange,
  step = 1,
  min,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" value={value} step={step} min={min} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

export default function ParameterPanel() {
  const params = useSimulationStore((state) => state.params);
  const warnings = useSimulationStore((state) => state.simulation.warnings);
  const setParam = useSimulationStore((state) => state.setParam);
  const importScenario = useSimulationStore((state) => state.importScenario);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateParam = <K extends ParamKey>(key: K, value: SimulationParams[K]) => setParam(key, value);

  const handleImport = async (file: File) => {
    const text = await file.text();
    const document = parseScenarioDocument(text);
    importScenario(mergeScenarioParams(document.params));
  };

  return (
    <aside className="panel panel--sidebar">
      <div className="panel__header">
        <h2>Parameters</h2>
      </div>
      <label className="field">
        <span>Preset</span>
        <select onChange={(event) => useSimulationStore.getState().loadPreset(event.target.value)} defaultValue="">
          <option value="" disabled>
            Choose preset
          </option>
          {scenarioPresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.label}
            </option>
          ))}
        </select>
      </label>
      <div className="field-grid">
        <NumberInput label="N final nodes" value={params.finalNodeCount} min={params.m0} onChange={(value) => updateParam('finalNodeCount', value)} />
        <NumberInput label="alpha" value={params.alpha} step={0.1} min={0} onChange={(value) => updateParam('alpha', value)} />
        <NumberInput label="beta" value={params.beta} step={0.1} min={0} onChange={(value) => updateParam('beta', value)} />
        <NumberInput label="phi" value={params.phi} step={0.1} min={0} onChange={(value) => updateParam('phi', value)} />
        <NumberInput label="lambda" value={params.lambda ?? 1} step={0.1} min={0} onChange={(value) => updateParam('lambda', value)} />
        <NumberInput label="kappa" value={params.kappa} min={1} onChange={(value) => updateParam('kappa', value)} />
        <NumberInput label="m0" value={params.m0} min={2} onChange={(value) => updateParam('m0', value)} />
        <NumberInput
          label="Capacity K"
          value={typeof params.capacityValue === 'number' ? params.capacityValue : 1000}
          min={1}
          onChange={(value) => updateParam('capacityValue', value)}
        />
        <NumberInput label="RNG seed" value={params.rngSeed} onChange={(value) => updateParam('rngSeed', value)} />
        <NumberInput label="Animation ms" value={params.animationSpeedMs} min={10} onChange={(value) => updateParam('animationSpeedMs', value)} />
        <NumberInput label="Replications" value={params.replicationCount} min={1} onChange={(value) => updateParam('replicationCount', value)} />
      </div>

      <label className="field">
        <span>Impedance type</span>
        <select value={params.impedanceMode} onChange={(event) => updateParam('impedanceMode', event.target.value as SimulationParams['impedanceMode'])}>
          <option value="power">Power cost</option>
          <option value="exponential">Exponential cost</option>
        </select>
      </label>

      <label className="field">
        <span>Seed graph</span>
        <select value={params.seedGraphType} onChange={(event) => updateParam('seedGraphType', event.target.value as SimulationParams['seedGraphType'])}>
          <option value="complete">Complete</option>
          <option value="ring">Ring</option>
          <option value="grid">Small grid</option>
        </select>
      </label>

      <label className="field">
        <span>Capacity mode</span>
        <select value={params.capacityMode} onChange={(event) => updateParam('capacityMode', event.target.value as SimulationParams['capacityMode'])}>
          <option value="homogeneous">Constant</option>
          <option value="uniform">Uniform</option>
          <option value="lognormal">Lognormal</option>
        </select>
      </label>

      {params.capacityMode === 'uniform' ? (
        <div className="field-grid">
          <NumberInput
            label="Uniform low"
            value={params.capacityParams?.low ?? 4}
            onChange={(value) => updateParam('capacityParams', { ...params.capacityParams, low: value })}
          />
          <NumberInput
            label="Uniform high"
            value={params.capacityParams?.high ?? 12}
            onChange={(value) => updateParam('capacityParams', { ...params.capacityParams, high: value })}
          />
        </div>
      ) : null}

      {params.capacityMode === 'lognormal' ? (
        <div className="field-grid">
          <NumberInput
            label="Lognormal mean"
            value={params.capacityParams?.mean ?? 1.5}
            step={0.1}
            onChange={(value) => updateParam('capacityParams', { ...params.capacityParams, mean: value })}
          />
          <NumberInput
            label="Lognormal sigma"
            value={params.capacityParams?.sigma ?? 0.35}
            step={0.05}
            onChange={(value) => updateParam('capacityParams', { ...params.capacityParams, sigma: value })}
          />
        </div>
      ) : null}

      <label className="field">
        <span>Scenario notes</span>
        <textarea value={params.notes} rows={4} onChange={(event) => updateParam('notes', event.target.value)} />
      </label>

      <div className="control-row">
        <button type="button" onClick={() => exportScenario('general-attachment-scenario', params)}>
          Export scenario
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Import scenario
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleImport(file);
            }
          }}
        />
      </div>

      {warnings.length > 0 ? (
        <div className="warning-list">
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}
    </aside>
  );
}
