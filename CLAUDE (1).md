# CLAUDE.md — Fuktmackan

## What this project is

A web-based interactive tool for visualizing moisture (fukt) behavior through a multi-layer wall construction. It is built for a moisture consultant who wants to:

1. **Explain** to clients and colleagues how moisture behaves through a wall — particularly the counterintuitive difference between relative humidity (RF) in air vs. in solid materials
2. **Calculate** stationary moisture distribution using the Glaser method — replacing manual Excel-based Glaser calculations with a real-time interactive visualization

The target users are building professionals (moisture consultants, architects, engineers) and students learning building physics.

---

## Core physics — read this before touching the calculation logic

### The Glaser method (stationär fuktfördelning)
The Glaser method calculates the **stationary** (steady-state) distribution of temperature and moisture through a multi-layer wall. It assumes fixed boundary conditions (indoor/outdoor climate) and no dynamic effects.

**Temperature distribution** through each layer is linear, proportional to each layer's thermal resistance:
- R = d / λ (thickness in meters / thermal conductivity in W/mK)
- Temperature drops linearly across each layer proportional to its R-value relative to total R

**Vapour pressure / vapour content distribution** through each layer is linear, proportional to each layer's vapour resistance:
- Z = d / δ (thickness / vapour permeability), or given directly as Sd-value (m)
- Vapour pressure drops linearly across each layer proportional to its Z-value relative to total Z

**Saturation vapour pressure** at any point depends only on temperature at that point (lookup from standard table, e.g. Magnus formula approximation).

**Relative humidity at any point** = actual vapour pressure / saturation vapour pressure at that temperature.

**Condensation risk** = RF reaches or exceeds 100% at any point in the construction.

### Key concept: RF in air vs. RF in solid materials
This is the most important thing the tool must communicate visually:

- In **air**: RF depends heavily on temperature. Same absolute moisture, lower temperature = higher RF. This is intuitive.
- In **solid materials**: RF is governed by the **sorption curve** of the material, not temperature directly. RF in a material barely changes when temperature changes — to change RF in a material, the actual moisture content must change. This is counterintuitive and is what the tool should make visible.

### Critical RF thresholds (used for warnings/highlights in UI)
- > 75% RF: Risk of mold growth on wood and most building materials
- > 85% RF: Risk of mold growth in mineral wool
- > 95% RF: Risk of rot in untreated wood
- 100% RF: Condensation

---

## Tech stack

- **React + Vite** — frontend only, no backend
- **No database** — all material data lives in `src/data/materials.json`
- **No authentication**
- All Glaser calculations are pure functions in `src/utils/glaser.js`
- Charting via **Recharts** (already available in React ecosystem)
- Styling via **Tailwind CSS**

---

## Project structure

```
src/
  data/
    materials.json        # All material properties
  utils/
    glaser.js             # Pure calculation functions (temperature, vapour pressure, RF)
    physics.js            # Helper physics functions (saturation pressure, Magnus formula)
  components/
    WallBuilder.jsx       # UI for adding/removing/reordering layers
    LayerControls.jsx     # Slider + number input for thickness and vapour resistance per layer
    GlaserChart.jsx       # Main visualization: wall cross-section + temperature + RF curves
    BoundaryConditions.jsx # Indoor/outdoor: temperature + RF inputs
    ResultsPanel.jsx      # Summary table: per-layer values, condensation warnings
  App.jsx
```

---

## Material data structure

Each material in `materials.json` has:

```json
{
  "id": "mineral_wool",
  "name": "Mineral Wool (Mineralull)",
  "lambda": 0.036,        // Thermal conductivity W/(mK)
  "mu": 1.3,              // Vapour diffusion resistance factor (dimensionless)
  "defaultThickness": 0.15, // meters
  "color": "#f5a623",     // Color used in wall visualization
  "category": "insulation"
}
```

Vapour resistance of a layer: Z = (mu × d) / delta_air, where delta_air ≈ 1.85×10⁻¹⁰ kg/(m·s·Pa)

Alternatively the Sd-value can be used: Sd = mu × d (in meters), which is the more common practical unit.

### Materials to include at launch

| Material | λ (W/mK) | μ (-) | Notes |
|---|---|---|---|
| Concrete (Betong) | 1.7 | 130 | Dense concrete |
| Lightweight concrete (Lättbetong/Ytong) | 0.12 | 8 | |
| Brick (Tegel) | 0.6 | 16 | |
| Wood / timber (Trä) | 0.14 | 40 | Across grain |
| Mineral wool (Mineralull) | 0.036 | 1.3 | Glass/stone wool |
| Rigid foam EPS (Cellplast EPS) | 0.038 | 60 | |
| Rigid foam XPS | 0.035 | 150 | |
| Gypsum board (Gips) | 0.25 | 8 | |
| OSB board | 0.13 | 200 | |
| Plywood | 0.14 | 300 | |
| Vapour barrier plastic (Plastfolie) | 0.2 | 100000 | Very high mu, thin |
| Air gap (Luftspalt) | 0.2 | 0.5 | Treat as low resistance |
| Render / Puts | 0.87 | 20 | |

---

## Calculation functions (glaser.js)

### Inputs
- `layers`: array of `{ materialId, thickness, mu }` — ordered inside to outside
- `indoor`: `{ temperature: number (°C), rh: number (0–1) }`
- `outdoor`: `{ temperature: number (°C), rh: number (0–1) }`

### Outputs per layer boundary (x-positions through wall)
- `temperature`: °C at each boundary
- `vapourPressure`: Pa at each boundary  
- `saturationPressure`: Pa at each boundary (from temperature)
- `relativeHumidity`: 0–1 at each boundary
- `condensationRisk`: boolean

### Saturation vapour pressure (Magnus approximation)
```js
function saturationPressure(T) {
  // T in Celsius, returns Pa
  return 610.78 * Math.exp((17.27 * T) / (T + 237.3));
}
```

---

## UI behavior

### Wall builder
- User can add layers, remove layers, reorder them (drag or arrow buttons)
- Each layer shows a color-coded block proportional to its thickness

### Per-layer controls
- **Thickness**: slider + number input field, synced bidirectionally
- **Vapour resistance (μ or Sd)**: slider + number input field, synced bidirectionally
- When a slider moves, the chart updates in real time

### Main chart (GlaserChart)
- X-axis: position through wall in mm (inside = left, outside = right)
- Y-axis left: Temperature (°C)
- Y-axis right: Relative humidity (%)
- Plotted lines:
  - Temperature curve (blue)
  - Actual RF curve (orange/red)
  - Saturation RF = 100% line (dashed red) — condensation threshold
- Background color bands showing each material layer
- Highlight / warning marker where RF ≥ 100% (condensation point)

### Results panel
- Table showing per-layer: material name, thickness, R-value, Z-value (vapour resistance)
- Summary: total R, U-value, total vapour resistance
- Condensation warning if any point exceeds 100% RF
- Mold risk warning if any point exceeds 75% RF

### Boundary conditions
- Indoor temperature (°C) — default 20
- Indoor relative humidity (%) — default 50
- Outdoor temperature (°C) — default -10 (Swedish winter)
- Outdoor relative humidity (%) — default 85

---

## What NOT to build (for now)
- No backend, no API, no database
- No user accounts or saved projects
- No transient / dynamic moisture calculations (only steady-state Glaser)
- No rain load or wind pressure effects
- No 2D effects (1D only through wall layers)
- No mobile-optimized layout (desktop first)

---

## Verified example — use this to check calculation correctness

A classic Swedish timber-frame exterior wall (träregelvägg), winter conditions.

### Wall layers (inside → outside)
| Layer | Thickness | λ (W/mK) | μ (-) | R (m²K/W) | Sd (m) |
|---|---|---|---|---|---|
| Gypsum board | 13 mm | 0.25 | 8 | 0.0520 | 0.104 |
| Vapour barrier (plastic) | 0.2 mm | 0.2 | 100 000 | 0.0010 | 20.000 |
| Mineral wool | 150 mm | 0.036 | 1.3 | 4.1667 | 0.195 |
| OSB board | 12 mm | 0.13 | 200 | 0.0923 | 2.400 |
| Mineral wool (outer) | 50 mm | 0.036 | 1.3 | 1.3889 | 0.065 |
| Render / Puts | 10 mm | 0.87 | 20 | 0.0115 | 0.200 |

Surface resistances: Rsi = 0.13, Rse = 0.04 m²K/W

### Boundary conditions
- **Indoor:** 20°C, 50% RF → vapour pressure = 1169.1 Pa
- **Outdoor:** -10°C, 85% RF → vapour pressure = 242.8 Pa

### Expected results (verified)
- Total R = 5.8824 m²K/W
- U-value = 0.170 W/(m²K)
- Total Sd = 22.964 m

| Position | After layer | T (°C) | Psat (Pa) | Pv (Pa) | RF (%) | Warning |
|---|---|---|---|---|---|---|
| 0 mm | Inner surface | +19.34 | 2243.9 | 1169.1 | 52.1% | — |
| 13 mm | Gypsum | +19.07 | 2207.2 | 1164.9 | 52.8% | — |
| 13.2 mm | Vapour barrier | +19.07 | 2206.5 | 358.2 | 16.2% | — |
| 163 mm | Mineral wool | -2.18 | 520.3 | 350.3 | 67.3% | — |
| 175 mm | OSB | -2.65 | 502.4 | 253.5 | 50.5% | — |
| 225 mm | Mineral wool (outer) | -9.74 | 291.7 | 250.9 | 86.0% | ⚠️ Mold risk |
| 235 mm | Render (outer surface) | -9.80 | 290.4 | 242.8 | 83.6% | ⚠️ Mold risk |

### What this example shows
- The vapour barrier (plastfolie) does its job — it drops vapour pressure from 1165 Pa to 358 Pa across just 0.2 mm, because its Sd-value (20 m) dominates the total vapour resistance
- No condensation (RF never reaches 100%) — this is a well-functioning wall
- But the outer mineral wool and render reach 86% RF in winter — mold risk threshold
- This is a good teaching example: moving or removing the vapour barrier shows immediately how condensation risk appears inside the wall

### Saturation pressure formula (Magnus approximation)
```js
function saturationPressure(T) {
  // T in Celsius, returns Pa
  return 610.78 * Math.exp((17.27 * T) / (T + 237.3));
}
```

Verify: saturationPressure(20) ≈ 2338 Pa, saturationPressure(-10) ≈ 286 Pa

---

## Tone / language
- UI text in **English**
- Code and comments in **English**
- Variable names should use full descriptive names (e.g. `thermalResistance` not `R`, `vapourPressure` not `vp`)
