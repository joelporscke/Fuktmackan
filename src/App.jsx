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

function SectionHeading({ children }) {
  return (
    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
      {children}
    </h2>
  );
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
    <div className="h-screen flex flex-col overflow-hidden bg-gray-50">

      {/* Top header bar */}
      <header className="shrink-0 px-6 py-3 bg-white border-b border-gray-200 flex items-baseline gap-3">
        <h1 className="text-lg font-bold text-gray-900">Fuktmackan</h1>
        <p className="text-sm text-gray-400">Stationary moisture analysis — Glaser method</p>
      </header>

      {/* Two-column body — each column scrolls independently */}
      <div className="flex flex-1 min-h-0 gap-0">

        {/* Left: controls */}
        <div className="w-[520px] shrink-0 flex flex-col gap-6 overflow-y-auto p-6 border-r border-gray-200 bg-white">
          <section>
            <SectionHeading>Climate conditions</SectionHeading>
            <BoundaryConditions
              indoor={indoor}
              outdoor={outdoor}
              onIndoorChange={handleIndoorChange}
              onOutdoorChange={handleOutdoorChange}
            />
          </section>

          <section>
            <SectionHeading>Wall construction — inside → outside</SectionHeading>
            <WallBuilder
              layers={layers}
              onLayersChange={setLayers}
              materials={materials}
            />
          </section>
        </div>

        {/* Right: chart + results */}
        <div className="flex-1 min-w-0 flex flex-col gap-6 overflow-y-auto p-6">
          <section>
            <SectionHeading>Moisture distribution</SectionHeading>
            <GlaserChart glaserResult={glaserResult} layers={layers} />
          </section>

          <section>
            <SectionHeading>Results</SectionHeading>
            <ResultsPanel glaserResult={glaserResult} layers={layers} />
          </section>
        </div>

      </div>
    </div>
  );
}
