/**
 * WallBuilder — add, remove, and reorder wall layers.
 *
 * Props:
 *   layers:         array of layer objects (see App.jsx for shape)
 *   onLayersChange(newLayers)
 *   materials:      full materials array from materials.json
 */
import { useState } from 'react';
import LayerControls from './LayerControls.jsx';

export default function WallBuilder({ layers, onLayersChange, materials }) {
  const [selectedMaterialId, setSelectedMaterialId] = useState(materials[0]?.id ?? '');

  function addLayer() {
    const material = materials.find(m => m.id === selectedMaterialId);
    if (!material) return;

    const newLayer = {
      key: crypto.randomUUID(),
      materialId: material.id,
      name: material.name,
      lambda: material.lambda,
      mu: material.mu,
      thickness: material.defaultThickness,
      color: material.color,
    };

    onLayersChange([...layers, newLayer]);
  }

  function updateLayer(key, updates) {
    onLayersChange(layers.map(l => l.key === key ? { ...l, ...updates } : l));
  }

  function removeLayer(key) {
    onLayersChange(layers.filter(l => l.key !== key));
  }

  function moveLayer(index, direction) {
    const next = [...layers];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= next.length) return;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    onLayersChange(next);
  }

  return (
    <div>
      {/* Add layer controls */}
      <div className="flex gap-2 mb-4">
        <select
          value={selectedMaterialId}
          onChange={e => setSelectedMaterialId(e.target.value)}
          className="flex-1 border rounded px-2 py-1.5 text-sm"
        >
          {materials.map(m => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <button
          onClick={addLayer}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Add layer
        </button>
      </div>

      {/* Direction labels */}
      {layers.length > 0 && (
        <div className="flex justify-between text-xs text-gray-400 mb-1 px-1">
          <span>← Indoor</span>
          <span>Outdoor →</span>
        </div>
      )}

      {/* Layer list */}
      <div className="space-y-2">
        {layers.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8 border border-dashed rounded-lg">
            No layers yet — add a material above.
          </p>
        )}
        {layers.map((layer, index) => (
          <LayerControls
            key={layer.key}
            layer={layer}
            onChange={updates => updateLayer(layer.key, updates)}
            onRemove={() => removeLayer(layer.key)}
            onMoveUp={() => moveLayer(index, -1)}
            onMoveDown={() => moveLayer(index, 1)}
            isFirst={index === 0}
            isLast={index === layers.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
