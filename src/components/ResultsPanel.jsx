/**
 * ResultsPanel — per-layer table and summary from the Glaser calculation.
 *
 * Props:
 *   glaserResult: return value of calculateGlaser (null when no layers)
 *   layers: UI layer array — same order as glaserResult.layers
 */

const MOLD_THRESHOLD        = 0.75;
const MOLD_MINERAL_THRESHOLD = 0.85;
const ROT_THRESHOLD         = 0.95;
const CONDENSATION_THRESHOLD = 1.00;

export default function ResultsPanel({ glaserResult, layers }) {
  if (!glaserResult || layers.length === 0) {
    return null;
  }

  // Per-layer rows. For layer i: boundaries[i] is the indoor face, boundaries[i+1] is the outdoor face.
  const rows = layers.map((layer, i) => {
    const calc = glaserResult.layers[i];
    const rhIndoorFace  = glaserResult.boundaries[i].relativeHumidity;
    const rhOutdoorFace = glaserResult.boundaries[i + 1].relativeHumidity;
    const maxRh = Math.max(rhIndoorFace, rhOutdoorFace);
    return {
      name:              layer.name,
      color:             layer.color,
      thicknessMm:       layer.thickness * 1000,
      thermalResistance: calc.thermalResistance,
      sdValue:           calc.sdValue,
      maxRh,
    };
  });

  // Determine worst warning level across all boundaries
  const maxRhOverall = Math.max(
    ...glaserResult.boundaries.map(b => b.relativeHumidity)
  );
  const hasCondensation = glaserResult.condensationRisk;
  const hasMoldRisk     = maxRhOverall >= MOLD_THRESHOLD;

  return (
    <div className="space-y-4">
      {/* Warnings */}
      {hasCondensation && (
        <Warning level="error">
          Condensation risk — relative humidity reaches 100% inside the wall. Moisture will
          accumulate. Consider adding or moving the vapour barrier.
        </Warning>
      )}
      {!hasCondensation && hasMoldRisk && (
        <Warning level="warning">
          Mold risk — relative humidity exceeds 75% at one or more points in the wall.
        </Warning>
      )}

      {/* Per-layer table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
              <th className="pb-2 pr-4">Material</th>
              <th className="pb-2 pr-4 text-right">Thickness</th>
              <th className="pb-2 pr-4 text-right">R-value</th>
              <th className="pb-2 pr-4 text-right">Sd-value</th>
              <th className="pb-2 text-right">Max RH</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="py-2 pr-4">
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-sm border border-gray-300 shrink-0"
                      style={{ backgroundColor: row.color }}
                    />
                    {row.name}
                  </span>
                </td>
                <td className="py-2 pr-4 text-right font-mono text-gray-700">
                  {formatMm(row.thicknessMm)}
                </td>
                <td className="py-2 pr-4 text-right font-mono text-gray-700">
                  {row.thermalResistance.toFixed(4)}
                </td>
                <td className="py-2 pr-4 text-right font-mono text-gray-700">
                  {row.sdValue.toFixed(3)}
                </td>
                <td className="py-2 text-right">
                  <RhBadge rh={row.maxRh} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-gray-300 font-semibold text-gray-800">
              <td className="pt-2 pr-4">Total</td>
              <td className="pt-2 pr-4 text-right font-mono">
                {formatMm(rows.reduce((s, r) => s + r.thicknessMm, 0))}
              </td>
              <td className="pt-2 pr-4 text-right font-mono">
                {glaserResult.totalThermalResistance.toFixed(4)}
              </td>
              <td className="pt-2 pr-4 text-right font-mono">
                {glaserResult.totalSdValue.toFixed(3)}
              </td>
              <td />
            </tr>
            <tr className="text-xs text-gray-500">
              <td className="pt-0.5 pr-4" />
              <td className="pt-0.5 pr-4 text-right">mm</td>
              <td className="pt-0.5 pr-4 text-right">m²K/W</td>
              <td className="pt-0.5 pr-4 text-right">m</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Summary strip */}
      <div className="flex flex-wrap gap-6 border-t border-gray-200 pt-3 text-sm">
        <Stat label="Total R" value={glaserResult.totalThermalResistance.toFixed(3)} unit="m²K/W" />
        <Stat label="U-value" value={glaserResult.uValue.toFixed(3)} unit="W/(m²K)" />
        <Stat label="Total Sd" value={glaserResult.totalSdValue.toFixed(3)} unit="m" />
      </div>
    </div>
  );
}

// ── Small helpers ────────────────────────────────────────────────────────────

function formatMm(mm) {
  // Show one decimal for thin layers, zero decimals for thicker ones
  return mm < 10 ? `${mm.toFixed(1)}` : `${Math.round(mm)}`;
}

function RhBadge({ rh }) {
  const pct = (rh * 100).toFixed(1);
  let cls = 'text-gray-600';
  if (rh >= CONDENSATION_THRESHOLD)   cls = 'text-red-700 font-bold';
  else if (rh >= ROT_THRESHOLD)        cls = 'text-red-600 font-semibold';
  else if (rh >= MOLD_MINERAL_THRESHOLD) cls = 'text-orange-600 font-semibold';
  else if (rh >= MOLD_THRESHOLD)       cls = 'text-amber-600 font-semibold';
  return <span className={`font-mono ${cls}`}>{pct} %</span>;
}

function Warning({ level, children }) {
  const styles = {
    error:   'bg-red-50 border-red-300 text-red-800',
    warning: 'bg-amber-50 border-amber-300 text-amber-800',
  };
  const icons = { error: '⚠', warning: '⚠' };
  return (
    <div className={`flex gap-2 border rounded-lg px-4 py-3 text-sm ${styles[level]}`}>
      <span>{icons[level]}</span>
      <span>{children}</span>
    </div>
  );
}

function Stat({ label, value, unit }) {
  return (
    <div>
      <span className="text-xs text-gray-500">{label}</span>
      <div className="font-mono font-semibold text-gray-800">
        {value} <span className="text-xs font-normal text-gray-500">{unit}</span>
      </div>
    </div>
  );
}
