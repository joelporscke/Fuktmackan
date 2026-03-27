/**
 * LayerControls — thickness and mu sliders + inputs for a single wall layer.
 *
 * Props:
 *   layer:      { key, materialId, name, lambda, mu, thickness, color }
 *   onChange(updates)  — partial layer object to merge
 *   onRemove()
 *   onMoveUp()
 *   onMoveDown()
 *   isFirst: boolean
 *   isLast: boolean
 */
export default function LayerControls({ layer, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  const thicknessMm = Math.round(layer.thickness * 1000 * 10) / 10;

  function handleThicknessSlider(e) {
    onChange({ thickness: Number(e.target.value) / 1000 });
  }

  function handleThicknessInput(e) {
    const mm = parseFloat(e.target.value);
    if (!isNaN(mm) && mm > 0) onChange({ thickness: mm / 1000 });
  }

  function handleMuSlider(e) {
    onChange({ mu: Number(e.target.value) });
  }

  function handleMuInput(e) {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) onChange({ mu: value });
  }

  const sdValue = (layer.mu * layer.thickness).toFixed(3);

  return (
    <div className="flex items-start gap-3 border rounded-lg p-3 bg-white">
      {/* Color swatch */}
      <div
        className="w-4 shrink-0 rounded mt-1"
        style={{ backgroundColor: layer.color, minHeight: '2.5rem' }}
      />

      {/* Controls */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-sm truncate">{layer.name}</span>
          <span className="text-xs text-gray-400 ml-2 shrink-0">
            λ={layer.lambda} W/mK · Sd={sdValue} m
          </span>
        </div>

        <div className="space-y-2">
          {/* Thickness */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-20 shrink-0">Thickness</label>
            <input
              type="range"
              min={1}
              max={500}
              step={0.5}
              value={thicknessMm}
              onChange={handleThicknessSlider}
              className="flex-1"
            />
            <input
              type="number"
              min={0.1}
              max={2000}
              step={0.5}
              value={thicknessMm}
              onChange={handleThicknessInput}
              className="w-20 text-sm border rounded px-1 py-0.5 text-right"
            />
            <span className="text-xs text-gray-500 w-6">mm</span>
          </div>

          {/* μ (mu) */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-20 shrink-0">μ (mu)</label>
            <input
              type="range"
              min={0.5}
              max={300}
              step={0.5}
              value={Math.min(layer.mu, 300)}
              onChange={handleMuSlider}
              className="flex-1"
            />
            <input
              type="number"
              min={0.5}
              step={0.5}
              value={layer.mu}
              onChange={handleMuInput}
              className="w-20 text-sm border rounded px-1 py-0.5 text-right"
            />
            <span className="text-xs text-gray-500 w-6">—</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-1 shrink-0">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move up (towards indoor)"
        >
          ↑
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className="px-2 py-1 text-xs border rounded hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Move down (towards outdoor)"
        >
          ↓
        </button>
        <button
          onClick={onRemove}
          className="px-2 py-1 text-xs border border-red-200 text-red-500 rounded hover:bg-red-50"
          title="Remove layer"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
