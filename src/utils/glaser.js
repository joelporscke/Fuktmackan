/**
 * Glaser method — pure stationary moisture calculation functions.
 *
 * Inputs to calculateGlaser:
 *   layers: Array of { thickness (m), lambda (W/mK), mu (-) }, ordered inside → outside
 *   indoor: { temperature (°C), relativeHumidity (0–1) }
 *   outdoor: { temperature (°C), relativeHumidity (0–1) }
 *   surfaceResistances: { interior (m²K/W), exterior (m²K/W) }  — defaults to ISO 6946 values
 *
 * Output boundaries: N+1 points for N layers.
 *   Point 0   = inner surface of the wall (indoor face, after interior surface resistance)
 *   Point 1..N = after each successive layer (point N = outdoor face)
 *
 * Note: lambda is the thermal conductivity. The caller (UI) is responsible for
 * looking up lambda from materials.json using the materialId stored in UI state.
 */

import { saturationPressure, vapourPressure } from './physics.js';

// ISO 6946 standard surface resistances for walls (m²K/W)
const DEFAULT_SURFACE_RESISTANCES = { interior: 0.13, exterior: 0.04 };

/**
 * Thermal resistance of a single layer.
 * @param {number} thickness - Thickness in meters
 * @param {number} lambda - Thermal conductivity in W/(mK)
 * @returns {number} R-value in m²K/W
 */
export function thermalResistance(thickness, lambda) {
  return thickness / lambda;
}

/**
 * Sd-value (equivalent air layer thickness) of a single layer.
 * @param {number} thickness - Thickness in meters
 * @param {number} mu - Vapour diffusion resistance factor (dimensionless)
 * @returns {number} Sd in meters
 */
export function sdValue(thickness, mu) {
  return mu * thickness;
}

/**
 * Main Glaser calculation. Returns temperatures, vapour pressures, saturation
 * pressures, relative humidities, and condensation risk at every layer boundary.
 *
 * @param {Array<{thickness: number, lambda: number, mu: number}>} layers
 * @param {{temperature: number, relativeHumidity: number}} indoor
 * @param {{temperature: number, relativeHumidity: number}} outdoor
 * @param {{interior: number, exterior: number}} [surfaceResistances]
 * @returns {{
 *   boundaries: Array<{
 *     position: number,
 *     temperature: number,
 *     vapourPressure: number,
 *     saturationPressure: number,
 *     relativeHumidity: number,
 *     condensationRisk: boolean,
 *   }>,
 *   layers: Array<{ thermalResistance: number, sdValue: number }>,
 *   totalThermalResistance: number,
 *   uValue: number,
 *   totalSdValue: number,
 *   condensationRisk: boolean,
 * }}
 */
export function calculateGlaser(layers, indoor, outdoor, surfaceResistances = DEFAULT_SURFACE_RESISTANCES) {
  const { interior: Rsi, exterior: Rse } = surfaceResistances;

  // Per-layer derived values
  const layerValues = layers.map(layer => ({
    thermalResistance: thermalResistance(layer.thickness, layer.lambda),
    sdValue: sdValue(layer.thickness, layer.mu),
    thickness: layer.thickness,
  }));

  const totalLayerR = layerValues.reduce((sum, l) => sum + l.thermalResistance, 0);
  const totalThermalResistance = Rsi + totalLayerR + Rse;
  const totalSdValue = layerValues.reduce((sum, l) => sum + l.sdValue, 0);
  const uValue = 1 / totalThermalResistance;

  const indoorVapourPressure = vapourPressure(indoor.temperature, indoor.relativeHumidity);
  const outdoorVapourPressure = vapourPressure(outdoor.temperature, outdoor.relativeHumidity);
  const deltaTemperature = indoor.temperature - outdoor.temperature;
  const deltaVapourPressure = indoorVapourPressure - outdoorVapourPressure;

  // Build boundary points.
  // Temperature drops proportionally to cumulative thermal resistance (including Rsi).
  // Vapour pressure drops proportionally to cumulative Sd (no surface vapour resistance).
  const boundaries = [];

  // Point 0: inner surface (after Rsi, before layer 1)
  {
    const cumulativeR = Rsi;
    const cumulativeSd = 0;
    const temperature = indoor.temperature - (cumulativeR / totalThermalResistance) * deltaTemperature;
    const vp = indoorVapourPressure - (totalSdValue > 0 ? (cumulativeSd / totalSdValue) * deltaVapourPressure : 0);
    const satPressure = saturationPressure(temperature);
    boundaries.push({
      position: 0,
      temperature,
      vapourPressure: vp,
      saturationPressure: satPressure,
      relativeHumidity: vp / satPressure,
      condensationRisk: vp >= satPressure,
    });
  }

  // Points 1..N: after each layer
  let cumulativeR = Rsi;
  let cumulativeSd = 0;
  let cumulativeThicknessMm = 0;

  for (const layer of layerValues) {
    cumulativeR += layer.thermalResistance;
    cumulativeSd += layer.sdValue;
    cumulativeThicknessMm += layer.thickness * 1000;

    const temperature = indoor.temperature - (cumulativeR / totalThermalResistance) * deltaTemperature;
    const vp = indoorVapourPressure - (totalSdValue > 0 ? (cumulativeSd / totalSdValue) * deltaVapourPressure : 0);
    const satPressure = saturationPressure(temperature);

    boundaries.push({
      position: cumulativeThicknessMm,
      temperature,
      vapourPressure: vp,
      saturationPressure: satPressure,
      relativeHumidity: vp / satPressure,
      condensationRisk: vp >= satPressure,
    });
  }

  const condensationRisk = boundaries.some(b => b.condensationRisk);

  return {
    boundaries,
    layers: layerValues.map(l => ({
      thermalResistance: l.thermalResistance,
      sdValue: l.sdValue,
    })),
    totalThermalResistance,
    uValue,
    totalSdValue,
    condensationRisk,
  };
}
