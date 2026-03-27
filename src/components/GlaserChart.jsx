/**
 * GlaserChart — three stacked charts sharing the same X-axis:
 *   1. Temperature (°C)
 *   2. Vapour content (g/m³)
 *   3. Relative humidity (%)
 *
 * All three charts use the same left/right margins and Y-axis width so their
 * plot areas align perfectly horizontally.
 *
 * Props:
 *   glaserResult: return value of calculateGlaser (null when no layers)
 *   layers: UI layer array (for colors and names)
 */
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
  ResponsiveContainer,
} from 'recharts';

const MOLD_THRESHOLD        = 75;
const CONDENSATION_THRESHOLD = 100;

// All three charts use identical horizontal margins and Y-axis width so the
// plot areas (the part that actually draws data) are left- and right-aligned.
const MARGIN_TOP_MID  = { top: 10, right: 20, left: 8, bottom: 0 };
const MARGIN_BOTTOM   = { top: 0,  right: 20, left: 8, bottom: 40 };
const YAXIS_WIDTH     = 54;

export default function GlaserChart({ glaserResult, layers }) {
  if (!glaserResult || layers.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 border border-dashed rounded-lg text-sm text-gray-400">
        Add wall layers to see the moisture chart.
      </div>
    );
  }

  // Build flat chart data — one point per boundary
  const chartData = glaserResult.boundaries.map(b => ({
    position:            parseFloat(b.position.toFixed(2)),
    temperature:         parseFloat(b.temperature.toFixed(2)),
    vapourContent:       parseFloat(b.vapourContent.toFixed(3)),
    relativeHumidityPct: parseFloat((b.relativeHumidity * 100).toFixed(1)),
    vapourPressure:      parseFloat(b.vapourPressure.toFixed(1)),
    saturationPressure:  parseFloat(b.saturationPressure.toFixed(1)),
    condensationRisk:    b.condensationRisk,
  }));

  const xDomain = [0, chartData[chartData.length - 1].position];

  // Temperature axis domain
  const temps  = chartData.map(d => d.temperature);
  const tempMin = Math.floor(Math.min(...temps) - 2);
  const tempMax = Math.ceil(Math.max(...temps)  + 2);

  // Vapour content axis domain
  const vcs  = chartData.map(d => d.vapourContent);
  const vcMin = Math.max(0, parseFloat((Math.min(...vcs) - 0.5).toFixed(1)));
  const vcMax = parseFloat((Math.max(...vcs) + 0.5).toFixed(1));

  // Layer background bands — identical in all three charts
  const bands = layers.map((layer, i) => ({
    x1:    parseFloat(glaserResult.boundaries[i].position.toFixed(2)),
    x2:    parseFloat(glaserResult.boundaries[i + 1].position.toFixed(2)),
    color: layer.color,
  }));

  const warningPoints = glaserResult.boundaries.filter(
    b => b.relativeHumidity * 100 > MOLD_THRESHOLD
  );

  return (
    <div className="w-full flex flex-col">

      {/* ── 1. Temperature ─────────────────────────────────────────────── */}
      <ResponsiveContainer width="100%" height={155}>
        <ComposedChart data={chartData} margin={MARGIN_TOP_MID} syncId="glaser">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          {bands.map((b, i) => (
            <ReferenceArea key={i} x1={b.x1} x2={b.x2}
              fill={b.color} fillOpacity={0.22} stroke="#d1d5db" strokeWidth={0.5} />
          ))}
          <XAxis
            dataKey="position" type="number" domain={xDomain}
            height={1} tick={false} axisLine={false} tickLine={false}
          />
          <YAxis
            width={YAXIS_WIDTH}
            domain={[tempMin, tempMax]}
            tickFormatter={v => `${v}°`}
            tick={{ fill: '#3b82f6', fontSize: 11 }}
            label={{ value: 'T (°C)', angle: -90, position: 'insideLeft',
              dx: 14, style: { fill: '#3b82f6', fontSize: 11 } }}
          />
          <Tooltip content={<ComprehensiveTooltip />} />
          <Line
            dataKey="temperature" stroke="#3b82f6" strokeWidth={2}
            dot={{ r: 3.5, fill: '#3b82f6', stroke: 'white', strokeWidth: 1.5 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* ── 2. Vapour content ──────────────────────────────────────────── */}
      <ResponsiveContainer width="100%" height={155}>
        <ComposedChart data={chartData} margin={MARGIN_TOP_MID} syncId="glaser">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          {bands.map((b, i) => (
            <ReferenceArea key={i} x1={b.x1} x2={b.x2}
              fill={b.color} fillOpacity={0.22} stroke="#d1d5db" strokeWidth={0.5} />
          ))}
          <XAxis
            dataKey="position" type="number" domain={xDomain}
            height={1} tick={false} axisLine={false} tickLine={false}
          />
          <YAxis
            width={YAXIS_WIDTH}
            domain={[vcMin, vcMax]}
            tickFormatter={v => `${v}`}
            tick={{ fill: '#10b981', fontSize: 11 }}
            label={{ value: 'v (g/m³)', angle: -90, position: 'insideLeft',
              dx: 14, style: { fill: '#10b981', fontSize: 11 } }}
          />
          <Tooltip content={<ComprehensiveTooltip />} />
          <Line
            dataKey="vapourContent" stroke="#10b981" strokeWidth={2}
            dot={{ r: 3.5, fill: '#10b981', stroke: 'white', strokeWidth: 1.5 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* ── 3. Relative humidity ───────────────────────────────────────── */}
      <ResponsiveContainer width="100%" height={210}>
        <ComposedChart data={chartData} margin={MARGIN_BOTTOM} syncId="glaser">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          {bands.map((b, i) => (
            <ReferenceArea key={i} x1={b.x1} x2={b.x2}
              fill={b.color} fillOpacity={0.22} stroke="#d1d5db" strokeWidth={0.5} />
          ))}
          <XAxis
            dataKey="position" type="number" domain={xDomain}
            tickFormatter={v => `${v}`}
            label={{
              value: 'Position (mm)  ←inside  outside→',
              position: 'insideBottom', offset: -22,
              style: { fontSize: 11, fill: '#6b7280' },
            }}
          />
          <YAxis
            width={YAXIS_WIDTH}
            domain={[0, 110]}
            tickFormatter={v => `${v}%`}
            tick={{ fill: '#f97316', fontSize: 11 }}
            label={{ value: 'RH (%)', angle: -90, position: 'insideLeft',
              dx: 14, style: { fill: '#f97316', fontSize: 11 } }}
          />
          <Tooltip content={<ComprehensiveTooltip />} />
          <ReferenceLine y={CONDENSATION_THRESHOLD}
            stroke="#ef4444" strokeDasharray="6 3" strokeWidth={1.5} />
          <ReferenceLine y={MOLD_THRESHOLD}
            stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1} />
          <Line
            dataKey="relativeHumidityPct" stroke="#f97316" strokeWidth={2}
            dot={{ r: 3.5, fill: '#f97316', stroke: 'white', strokeWidth: 1.5 }}
            isAnimationActive={false}
          />
          {warningPoints.map((b, i) => (
            <ReferenceDot
              key={i}
              x={parseFloat(b.position.toFixed(2))}
              y={parseFloat((b.relativeHumidity * 100).toFixed(1))}
              r={7}
              fill={b.condensationRisk ? '#ef4444' : '#f59e0b'}
              stroke="white" strokeWidth={2}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>

      {/* ── Legend ─────────────────────────────────────────────────────── */}
      <ChartLegend
        layers={layers}
        hasWarning={warningPoints.length > 0}
        hasCondensation={glaserResult.condensationRisk}
      />
    </div>
  );
}

// ── Tooltip ─────────────────────────────────────────────────────────────────
// One comprehensive tooltip used in all three charts so hovering any chart
// shows the full picture at that wall position.

function ComprehensiveTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs space-y-1 min-w-48">
      <div className="font-semibold text-gray-700 mb-1">{d.position} mm</div>

      <div className="flex justify-between gap-4">
        <span className="text-blue-600">Temperature</span>
        <span className="font-mono">{d.temperature.toFixed(1)} °C</span>
      </div>

      <div className="flex justify-between gap-4">
        <span className="text-emerald-600">Vapour content</span>
        <span className="font-mono">{d.vapourContent.toFixed(2)} g/m³</span>
      </div>

      <div className="flex justify-between gap-4">
        <span className="text-orange-500">Rel. humidity</span>
        <span className={`font-mono ${
          d.relativeHumidityPct >= 100 ? 'text-red-600 font-bold' :
          d.relativeHumidityPct >= 75  ? 'text-amber-600' : ''
        }`}>
          {d.relativeHumidityPct.toFixed(1)} %
        </span>
      </div>

      <div className="border-t border-gray-100 pt-1 mt-1 space-y-1 text-gray-400">
        <div className="flex justify-between gap-4">
          <span>Vapour pressure</span>
          <span className="font-mono">{d.vapourPressure} Pa</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Sat. pressure</span>
          <span className="font-mono">{d.saturationPressure} Pa</span>
        </div>
      </div>

      {d.condensationRisk && (
        <div className="text-red-600 font-semibold pt-1">⚠ Condensation risk</div>
      )}
      {!d.condensationRisk && d.relativeHumidityPct >= 75 && (
        <div className="text-amber-600 font-semibold pt-1">⚠ Mold risk (&gt;75%)</div>
      )}
    </div>
  );
}

// ── Legend ───────────────────────────────────────────────────────────────────

function ChartLegend({ layers, hasWarning, hasCondensation }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-600 px-1">
      <LegendItem color="#3b82f6"  label="Temperature (°C)" />
      <LegendItem color="#10b981"  label="Vapour content (g/m³)" />
      <LegendItem color="#f97316"  label="Relative humidity (%)" />
      <LegendItem color="#ef4444"  dashed label="100% — condensation threshold" />
      <LegendItem color="#f59e0b"  dashed label="75% — mold risk threshold" />

      <div className="w-full border-t border-gray-100 mt-1 pt-1.5 flex flex-wrap gap-x-4 gap-y-1">
        {layers.map(layer => (
          <span key={layer.key} className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-sm border border-gray-300"
              style={{ backgroundColor: layer.color }}
            />
            {layer.name}
          </span>
        ))}
      </div>

      {hasCondensation && (
        <div className="w-full text-red-600 font-semibold">
          ⚠ Condensation risk detected — RF reaches 100% somewhere in the wall.
        </div>
      )}
      {!hasCondensation && hasWarning && (
        <div className="w-full text-amber-600">
          ⚠ Mold risk — RF exceeds 75% at one or more points.
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label, dashed }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="24" height="10">
        <line x1="0" y1="5" x2="24" y2="5"
          stroke={color} strokeWidth="2"
          strokeDasharray={dashed ? '5 3' : undefined}
        />
      </svg>
      {label}
    </span>
  );
}
