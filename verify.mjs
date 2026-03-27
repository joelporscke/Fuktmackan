// Verification script — runs the verified example from CLAUDE.md and prints results.
// Run with: node verify.mjs

import { calculateGlaser } from './src/utils/glaser.js';
import { saturationPressure, vapourPressure } from './src/utils/physics.js';

// Verify the Magnus formula spot-checks first
console.log('--- Magnus formula spot-checks ---');
console.log(`saturationPressure(20)  = ${saturationPressure(20).toFixed(1)} Pa  (expected ≈ 2338 Pa)`);
console.log(`saturationPressure(-10) = ${saturationPressure(-10).toFixed(1)} Pa  (expected ≈ 286 Pa)`);
console.log();

// Verified example from CLAUDE.md: classic Swedish timber-frame wall
const layers = [
  { thickness: 0.013,  lambda: 0.25,   mu: 8      },  // Gypsum board
  { thickness: 0.0002, lambda: 0.2,    mu: 100000 },  // Vapour barrier
  { thickness: 0.15,   lambda: 0.036,  mu: 1.3    },  // Mineral wool
  { thickness: 0.012,  lambda: 0.13,   mu: 200    },  // OSB board
  { thickness: 0.05,   lambda: 0.036,  mu: 1.3    },  // Mineral wool (outer)
  { thickness: 0.01,   lambda: 0.87,   mu: 20     },  // Render / Puts
];

const indoor  = { temperature: 20,  relativeHumidity: 0.50 };
const outdoor = { temperature: -10, relativeHumidity: 0.85 };

const result = calculateGlaser(layers, indoor, outdoor);

// Print totals
console.log('--- Wall totals ---');
console.log(`Total R   = ${result.totalThermalResistance.toFixed(4)} m²K/W  (expected 5.8824)`);
console.log(`U-value   = ${result.uValue.toFixed(3)} W/(m²K)  (expected 0.170)`);
console.log(`Total Sd  = ${result.totalSdValue.toFixed(3)} m  (expected 22.964)`);
console.log(`Indoor Pv = ${vapourPressure(20, 0.5).toFixed(1)} Pa  (expected 1169.1)`);
console.log(`Outdoor Pv= ${vapourPressure(-10, 0.85).toFixed(1)} Pa  (expected 242.8)`);
console.log();

// Print per-layer R and Sd
const layerNames = ['Gypsum', 'Vapour barrier', 'Mineral wool', 'OSB', 'Mineral wool (outer)', 'Render'];
const expectedR  = [0.0520, 0.0010, 4.1667, 0.0923, 1.3889, 0.0115];
const expectedSd = [0.104, 20.000, 0.195, 2.400, 0.065, 0.200];

console.log('--- Per-layer values ---');
result.layers.forEach((layer, i) => {
  console.log(
    `${layerNames[i].padEnd(20)} R=${layer.thermalResistance.toFixed(4)} (exp ${expectedR[i].toFixed(4)})` +
    `  Sd=${layer.sdValue.toFixed(3)} (exp ${expectedSd[i].toFixed(3)})`
  );
});
console.log();

// Print boundaries
const expectedBoundaries = [
  { position: 0,     label: 'Inner surface',       T: 19.34,  Psat: 2243.9, Pv: 1169.1, RH: 52.1 },
  { position: 13,    label: 'After Gypsum',         T: 19.07,  Psat: 2207.2, Pv: 1164.9, RH: 52.8 },
  { position: 13.2,  label: 'After Vapour barrier', T: 19.07,  Psat: 2206.5, Pv: 358.2,  RH: 16.2 },
  { position: 163,   label: 'After Mineral wool',   T: -2.18,  Psat: 520.3,  Pv: 350.3,  RH: 67.3 },
  { position: 175,   label: 'After OSB',            T: -2.65,  Psat: 502.4,  Pv: 253.5,  RH: 50.5 },
  { position: 225,   label: 'After Min.wool outer', T: -9.74,  Psat: 291.7,  Pv: 250.9,  RH: 86.0 },
  { position: 235,   label: 'Outer surface',        T: -9.80,  Psat: 290.4,  Pv: 242.8,  RH: 83.6 },
];

console.log('--- Boundary results (calculated vs expected) ---');
console.log(
  'Position'.padEnd(10) +
  'Label'.padEnd(24) +
  'T calc/exp'.padEnd(20) +
  'Psat calc/exp'.padEnd(22) +
  'Pv calc/exp'.padEnd(22) +
  'RH% calc/exp'
);
result.boundaries.forEach((b, i) => {
  const exp = expectedBoundaries[i];
  const rhPct = (b.relativeHumidity * 100).toFixed(1);
  console.log(
    `${b.position.toFixed(1).padEnd(10)}` +
    `${exp.label.padEnd(24)}` +
    `${b.temperature.toFixed(2)} / ${exp.T.toFixed(2)}`.padEnd(20) +
    `${b.saturationPressure.toFixed(1)} / ${exp.Psat.toFixed(1)}`.padEnd(22) +
    `${b.vapourPressure.toFixed(1)} / ${exp.Pv.toFixed(1)}`.padEnd(22) +
    `${rhPct}% / ${exp.RH.toFixed(1)}%`
  );
});
console.log();
console.log(`Condensation risk: ${result.condensationRisk}  (expected false)`);
