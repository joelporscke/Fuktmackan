/**
 * GlaserChart — Recharts visualization of Glaser calculation results.
 *
 * Props:
 *   glaserResult: return value of calculateGlaser (null when no layers)
 *   layers: UI layer array (for colors and names; same order as glaserResult.layers)
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

const MOLD_THRESHOLD = 75;   // % RH
const CONDENSATION_THRESHOLD = 100; // % RH

export default function GlaserChart({ glaserResult, layers }) {
  if (!glaserResult || layers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border border-dashed rounded-lg text-sm text-gray-400">
        Add wall layers to see the moisture chart.
      </div>
    );
  }

  // Chart data: one point per boundary
  const chartData = glaserResult.boundaries.map(b => ({
    position: parseFloat(b.position.toFixed(2)),
    temperature: parseFloat(b.temperature.toFixed(2)),
    relativeHumidityPct: parseFloat((b.relativeHumidity * 100).toFixed(1)),
    vapourPressure: parseFloat(b.vapourPressure.toFixed(1)),
    saturationPressure: parseFloat(b.saturationPressure.toFixed(1)),
    condensationRisk: b.condensationRisk,
  }));

  // Temperature axis domain with 3° padding
  const temps = chartData.map(d => d.temperature);
  const tempDomainMin = Math.floor(Math.min(...temps) - 3);
  const tempDomainMax = Math.ceil(Math.max(...temps) + 3);

  // Layer background bands: layer[i] spans from boundary[i] to boundary[i+1]
  const bands = layers.map((layer, i) => ({
    x1: parseFloat(glaserResult.boundaries[i].position.toFixed(2)),
    x2: parseFloat(glaserResult.boundaries[i + 1].position.toFixed(2)),
    color: layer.color,
    name: layer.name,
  }));

  // Warning points: RH > MOLD_THRESHOLD at any boundary
  const warningPoints = glaserResult.boundaries.filter(
    b => b.relativeHumidity * 100 > MOLD_THRESHOLD
  );

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={420}>
        <ComposedChart
          data={chartData}
          margin={{ top: 16, right: 64, bottom: 32, left: 16 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          {/* Material background bands — rendered first so lines draw on top */}
          {bands.map((band, i) => (
            <ReferenceArea
              key={i}
              x1={band.x1}
              x2={band.x2}
              yAxisId="temp"
              fill={band.color}
              fillOpacity={0.22}
              stroke="#d1d5db"
              strokeWidth={0.5}
            />
          ))}

          <XAxis
            dataKey="position"
            type="number"
            domain={[0, 'dataMax']}
            tickFormatter={v => `${v}`}
            label={{
              value: 'Position through wall (mm)  ←inside  outside→',
              position: 'insideBottom',
              offset: -18,
              style: { fontSize: 11, fill: '#6b7280' },
            }}
          />

          {/* Left Y-axis: temperature */}
          <YAxis
            yAxisId="temp"
            orientation="left"
            domain={[tempDomainMin, tempDomainMax]}
            tickFormatter={v => `${v}°`}
            label={{
              value: 'Temperature (°C)',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              style: { fontSize: 11, fill: '#3b82f6' },
            }}
            tick={{ fill: '#3b82f6', fontSize: 11 }}
          />

          {/* Right Y-axis: relative humidity */}
          <YAxis
            yAxisId="rh"
            orientation="right"
            domain={[0, 110]}
            tickFormatter={v => `${v}%`}
            label={{
              value: 'Relative Humidity (%)',
              angle: 90,
              position: 'insideRight',
              offset: 16,
              style: { fontSize: 11, fill: '#f97316' },
            }}
            tick={{ fill: '#f97316', fontSize: 11 }}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* 100% RH condensation threshold — dashed red line */}
          <ReferenceLine
            yAxisId="rh"
            y={CONDENSATION_THRESHOLD}
            stroke="#ef4444"
            strokeDasharray="6 3"
            strokeWidth={1.5}
          />

          {/* 75% mold risk reference — subtle dashed amber line */}
          <ReferenceLine
            yAxisId="rh"
            y={MOLD_THRESHOLD}
            stroke="#f59e0b"
            strokeDasharray="4 4"
            strokeWidth={1}
          />

          {/* Temperature curve */}
          <Line
            yAxisId="temp"
            dataKey="temperature"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3.5, fill: '#3b82f6', stroke: 'white', strokeWidth: 1.5 }}
            name="Temperature (°C)"
            isAnimationActive={false}
          />

          {/* Actual RH curve */}
          <Line
            yAxisId="rh"
            dataKey="relativeHumidityPct"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ r: 3.5, fill: '#f97316', stroke: 'white', strokeWidth: 1.5 }}
            name="Relative Humidity (%)"
            isAnimationActive={false}
          />

          {/* Warning markers at RH > 75% */}
          {warningPoints.map((b, i) => {
            const rhPct = parseFloat((b.relativeHumidity * 100).toFixed(1));
            const isCond = b.condensationRisk;
            return (
              <ReferenceDot
                key={i}
                x={parseFloat(b.position.toFixed(2))}
                y={rhPct}
                yAxisId="rh"
                r={7}
                fill={isCond ? '#ef4444' : '#f59e0b'}
                stroke="white"
                strokeWidth={2}
              />
            );
          })}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <ChartLegend layers={layers} hasWarning={warningPoints.length > 0} hasCondensation={glaserResult.condensationRisk} />
    </div>
  );
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;

  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs space-y-1 min-w-44">
      <div className="font-semibold text-gray-700 mb-1">{d.position} mm</div>
      <div className="flex justify-between gap-4">
        <span className="text-blue-600">Temperature</span>
        <span className="font-mono">{d.temperature.toFixed(1)} °C</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-orange-500">Rel. humidity</span>
        <span className={`font-mono ${d.relativeHumidityPct >= 100 ? 'text-red-600 font-bold' : d.relativeHumidityPct >= 75 ? 'text-amber-600' : ''}`}>
          {d.relativeHumidityPct.toFixed(1)} %
        </span>
      </div>
      <div className="border-t border-gray-100 pt-1 mt-1 space-y-1 text-gray-500">
        <div className="flex justify-between gap-4">
          <span>Vapour pressure</span>
          <span className="font-mono">{d.vapourPressure} Pa</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>Saturation pressure</span>
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

function ChartLegend({ layers, hasWarning, hasCondensation }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-600 px-1">
      {/* Curve legend */}
      <LegendItem color="#3b82f6" label="Temperature (°C)" />
      <LegendItem color="#f97316" label="Relative humidity (%)" />
      <LegendItem color="#ef4444" dashed label="100% — condensation threshold" />
      <LegendItem color="#f59e0b" dashed label="75% — mold risk threshold" />

      {/* Material swatches */}
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

      {/* Warnings */}
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
        <line
          x1="0" y1="5" x2="24" y2="5"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={dashed ? '5 3' : undefined}
        />
      </svg>
      {label}
    </span>
  );
}
