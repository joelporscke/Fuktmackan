/**
 * BoundaryConditions — inputs for indoor and outdoor climate.
 *
 * Props:
 *   indoor:  { temperature: number (°C), relativeHumidity: number (0–1) }
 *   outdoor: { temperature: number (°C), relativeHumidity: number (0–1) }
 *   onIndoorChange(field, value)  — field is 'temperature' or 'relativeHumidity'
 *   onOutdoorChange(field, value)
 */
export default function BoundaryConditions({ indoor, outdoor, onIndoorChange, onOutdoorChange }) {
  return (
    <div className="flex gap-6">
      <ClimatePanel
        label="Indoor"
        climate={indoor}
        onChange={onIndoorChange}
        tempMin={-10}
        tempMax={35}
      />
      <ClimatePanel
        label="Outdoor"
        climate={outdoor}
        onChange={onOutdoorChange}
        tempMin={-40}
        tempMax={30}
      />
    </div>
  );
}

function ClimatePanel({ label, climate, onChange, tempMin, tempMax }) {
  const rhPercent = Math.round(climate.relativeHumidity * 100);

  function handleTemperature(e) {
    const value = Number(e.target.value);
    if (!isNaN(value)) onChange('temperature', value);
  }

  function handleRH(e) {
    const value = Number(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      onChange('relativeHumidity', value / 100);
    }
  }

  return (
    <div className="border rounded-lg p-4 flex-1 bg-white">
      <h3 className="font-semibold text-sm text-gray-700 mb-3">{label}</h3>
      <div className="space-y-3">
        <Field label="Temperature (°C)">
          <input
            type="range"
            min={tempMin}
            max={tempMax}
            step={0.5}
            value={climate.temperature}
            onChange={handleTemperature}
            className="w-full"
          />
          <NumberInput
            value={climate.temperature}
            onChange={handleTemperature}
            min={tempMin}
            max={tempMax}
            step={0.5}
            unit="°C"
          />
        </Field>

        <Field label="Relative Humidity (%)">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={rhPercent}
            onChange={handleRH}
            className="w-full"
          />
          <NumberInput
            value={rhPercent}
            onChange={handleRH}
            min={0}
            max={100}
            step={1}
            unit="%"
          />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function NumberInput({ value, onChange, min, max, step, unit }) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-16 text-sm border rounded px-1 py-0.5 text-right"
      />
      <span className="text-xs text-gray-500">{unit}</span>
    </div>
  );
}
