import { useState, useEffect, useMemo } from 'react';
import materials from './data/materials.json';
import { calculateGlaser } from './utils/glaser.js';
import BoundaryConditions from './components/BoundaryConditions.jsx';
import WallBuilder from './components/WallBuilder.jsx';
import GlaserChart from './components/GlaserChart.jsx';
import ResultsPanel from './components/ResultsPanel.jsx';

// Default layers: the verified example from CLAUDE.md (classic Swedish timber-frame wall)
function makeDefaultLayers() {
  function makeLayer(materialId, thicknessM) {
    const mat = materials.find(m => m.id === materialId);
    return {
      key: crypto.randomUUID(),
      materialId: mat.id,
      name: mat.name,
      lambda: mat.lambda,
      mu: mat.mu,
      thickness: thicknessM,
      color: mat.color,
    };
  }
  return [
    makeLayer('gypsum_board',   0.013),
    makeLayer('vapour_barrier', 0.0002),
    makeLayer('mineral_wool',   0.15),
    makeLayer('osb',            0.012),
    makeLayer('mineral_wool',   0.05),
    makeLayer('render',         0.01),
  ];
}

export default function App() {
  const [indoor,  setIndoor]  = useState({ temperature: 20,  relativeHumidity: 0.50 });
  const [outdoor, setOutdoor] = useState({ temperature: -10, relativeHumidity: 0.85 });
  const [layers,  setLayers]  = useState(makeDefaultLayers);

  // Glaser result — recomputed whenever inputs change
  const glaserResult = useMemo(() => {
    if (layers.length === 0) return null;
    const glaserLayers = layers.map(l => ({
      thickness: l.thickness,
      lambda:    l.lambda,
      mu:        l.mu,
    }));
    return calculateGlaser(glaserLayers, indoor, outdoor);
  }, [layers, indoor, outdoor]);

  // Console logging for verification
  useEffect(() => {
    if (!glaserResult) {
      console.log('[Fuktmackan] No layers defined.');
      return;
    }
    console.group('[Fuktmackan] Glaser result');
    console.log('Indoor:', indoor, '| Outdoor:', outdoor);
    console.log(
      `Total R = ${glaserResult.totalThermalResistance.toFixed(4)} m²K/W` +
      `  |  U = ${glaserResult.uValue.toFixed(3)} W/(m²K)` +
      `  |  Total Sd = ${glaserResult.totalSdValue.toFixed(3)} m`
    );
    console.log('Condensation risk:', glaserResult.condensationRisk);
    console.table(
      glaserResult.boundaries.map(b => ({
        'pos (mm)': b.position.toFixed(1),
        'T (°C)':   b.temperature.toFixed(2),
        'Psat (Pa)': b.saturationPressure.toFixed(1),
        'Pv (Pa)':   b.vapourPressure.toFixed(1),
        'RH (%)':    (b.relativeHumidity * 100).toFixed(1),
        'cond.':     b.condensationRisk,
      }))
    );
    console.groupEnd();
  }, [glaserResult, indoor, outdoor]);

  function handleIndoorChange(field, value) {
    setIndoor(prev => ({ ...prev, [field]: value }));
  }

  function handleOutdoorChange(field, value) {
    setOutdoor(prev => ({ ...prev, [field]: value }));
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Fuktmackan</h1>
        <p className="text-sm text-gray-500 mt-1">Stationary moisture analysis — Glaser method</p>
      </header>

      <section>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Climate conditions
        </h2>
        <BoundaryConditions
          indoor={indoor}
          outdoor={outdoor}
          onIndoorChange={handleIndoorChange}
          onOutdoorChange={handleOutdoorChange}
        />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Wall construction — inside → outside
        </h2>
        <WallBuilder
          layers={layers}
          onLayersChange={setLayers}
          materials={materials}
        />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Moisture distribution
        </h2>
        <GlaserChart glaserResult={glaserResult} layers={layers} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
          Results
        </h2>
        <ResultsPanel glaserResult={glaserResult} layers={layers} />
      </section>
    </div>
  );
}
