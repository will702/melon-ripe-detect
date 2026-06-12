import type { RGBValues, FuzzyResult, MFCurve } from './types'

// ---------------------------------------------------------------------------
// Membership function helpers — exact port of scikit-fuzzy
// ---------------------------------------------------------------------------

/**
 * Triangular MF matching scikit-fuzzy trimf exactly:
 *   x == b  → 1 (always, even when a==b or b==c)
 *   a < x < b (when a!=b) → rising slope
 *   b < x < c (when b!=c) → falling slope
 *   everything else → 0
 */
function trimf(x: number, a: number, b: number, c: number): number {
  if (x === b) return 1
  if (a !== b && x > a && x < b) return (x - a) / (b - a)
  if (b !== c && x > b && x < c) return (c - x) / (c - b)
  return 0
}

/**
 * Trapezoidal MF matching scikit-fuzzy trapmf exactly.
 * Uses the same piecewise logic as the Python implementation:
 *   start y=1, then overwrite with trimf sub-calls for edges,
 *   then zero out x<a and x>d.
 */
function trapmf(x: number, a: number, b: number, c: number, d: number): number {
  let y = 1.0
  if (x <= b) y = trimf(x, a, b, b)   // rising edge (or flat left when a==b)
  if (x >= c) y = trimf(x, c, c, d)   // falling edge (or flat right when c==d)
  if (x < a)  y = 0
  if (x > d)  y = 0
  return y
}

/** Generate evenly-spaced values in [start, stop] with given step */
function arange(start: number, stop: number, step: number): number[] {
  const result: number[] = []
  for (let v = start; v <= stop + step * 1e-9; v += step) {
    result.push(Math.round(v * 1e9) / 1e9) // avoid floating point drift
  }
  return result
}

// ---------------------------------------------------------------------------
// Precomputed universes and MF arrays
// ---------------------------------------------------------------------------

const blueUniverse  = arange(0, 100, 0.5)  // 201 points
const greenUniverse = arange(0, 120, 1)     // 121 points
const redUniverse   = arange(0, 140, 1)     // 141 points
const indexUniverse = arange(0, 10, 0.5)    // 21 points

// Blue MFs
const MF_L_blue   = blueUniverse.map(x => trapmf(x, 0, 0, 35, 46))
const MF_M_blue   = blueUniverse.map(x => trapmf(x, 45, 47, 47, 50) * 0.7)
const MF_H_blue   = blueUniverse.map(x => trapmf(x, 49, 59, 69, 79))
const MF_vH_blue  = blueUniverse.map(x => trapmf(x, 79, 80, 100, 100))

// Green MFs
const MF_L_green  = greenUniverse.map(x => trapmf(x, 0, 0, 70, 90))
const MF_H_green  = greenUniverse.map(x => trapmf(x, 89, 109, 120, 120))

// Red MFs
const MF_vL_red   = redUniverse.map(x => trapmf(x, 0, 0, 40, 80))
const MF_L_red    = redUniverse.map(x => trapmf(x, 80, 80, 110, 110))
const MF_H_red    = redUniverse.map(x => trapmf(x, 109, 130, 140, 140))

// Index MFs
const MF_underRipe   = indexUniverse.map(x => trapmf(x, 0, 0, 1, 4))
const MF_aboutToRipe = indexUniverse.map(x => trimf(x, 3.5, 5, 6.5))
const MF_ripe        = indexUniverse.map(x => trapmf(x, 6, 9, 10, 10))

// ---------------------------------------------------------------------------
// Evaluate MF at a crisp value using linear interpolation (or nearest index)
// ---------------------------------------------------------------------------

/** Evaluate a precomputed MF array at crisp value x, clamping to [0,1] */
function evalMF(universe: number[], mfArray: number[], x: number): number {
  // Find the index via direct computation for uniform grids
  const min = universe[0]
  const step = universe.length > 1 ? (universe[universe.length - 1] - min) / (universe.length - 1) : 1
  const idx = (x - min) / step

  if (idx <= 0) return mfArray[0]
  if (idx >= universe.length - 1) return mfArray[universe.length - 1]

  const lo = Math.floor(idx)
  const hi = lo + 1
  const t = idx - lo
  return mfArray[lo] * (1 - t) + mfArray[hi] * t
}

// ---------------------------------------------------------------------------
// Exported: RGB tweak that mirrors preparing_rgb_values
// ---------------------------------------------------------------------------

export function preparingRGBValues(bl: number, gr: number, r: number): [number, number, number] {
  if (bl >= 40) {
    if (gr > r + 4) {
      if (bl >= 55) {
        bl = bl + 30
        r = r - 25
      }
    }
  }
  return [bl, gr, r]
}

// ---------------------------------------------------------------------------
// Main fuzzy inference
// ---------------------------------------------------------------------------

export function fuzzyRipeIndex(rgb: RGBValues): FuzzyResult {
  let { b, g, r } = rgb;
  [b, g, r] = preparingRGBValues(b, g, r)

  // --- Evaluate input MFs ---
  const μ_L_blue  = evalMF(blueUniverse, MF_L_blue, b)
  const μ_M_blue  = evalMF(blueUniverse, MF_M_blue, b)
  const μ_H_blue  = evalMF(blueUniverse, MF_H_blue, b)
  const μ_vH_blue = evalMF(blueUniverse, MF_vH_blue, b)

  const μ_L_green = evalMF(greenUniverse, MF_L_green, g)
  const μ_H_green = evalMF(greenUniverse, MF_H_green, g)

  const μ_vL_red  = evalMF(redUniverse, MF_vL_red, r)
  const μ_L_red   = evalMF(redUniverse, MF_L_red, r)
  const μ_H_red   = evalMF(redUniverse, MF_H_red, r)

  // --- Rule firing ---

  // Rules 1 & 2 → "About to Ripe"
  const act_atr_1 = Math.max(
    Math.min(μ_H_blue, μ_H_green, μ_H_red),
    Math.min(μ_H_blue, μ_H_green, μ_L_red),
    Math.min(μ_H_blue, μ_L_green, μ_L_red),
    Math.min(μ_H_blue, μ_L_green, μ_H_red),
  )
  const act_atr_2 = Math.max(
    Math.min(μ_M_blue, μ_H_green, μ_H_red),
    Math.min(μ_M_blue, μ_H_green, μ_L_red),
    Math.min(μ_M_blue, μ_L_green, μ_L_red),
    Math.min(μ_M_blue, μ_L_green, μ_H_red),
  )
  const act_atr = Math.max(act_atr_1, act_atr_2)

  // Rule 3 → "Under Ripe"
  const act_ur = Math.min(μ_vH_blue, μ_vL_red)

  // Rule 4 → "Ripe"
  const act_ripe = Math.max(
    Math.min(μ_L_blue, μ_H_red),
    Math.min(μ_M_blue, μ_H_red),
  )

  // --- Output activation (Mamdani clipping) & aggregation ---
  const aggregated = indexUniverse.map((_, i) =>
    Math.max(
      Math.min(MF_underRipe[i],   act_ur),
      Math.min(MF_aboutToRipe[i], act_atr),
      Math.min(MF_ripe[i],        act_ripe),
    )
  )

  // --- Centroid defuzzification (matches scikit-fuzzy centroid exactly) ---
  // Uses piecewise trapezoid/triangle area moments, not a simple discrete sum.
  let sumMomentArea = 0.0
  let sumArea = 0.0
  for (let i = 1; i < indexUniverse.length; i++) {
    const x1 = indexUniverse[i - 1]
    const x2 = indexUniverse[i]
    const y1 = aggregated[i - 1]
    const y2 = aggregated[i]
    if ((y1 === 0.0 && y2 === 0.0) || x1 === x2) continue
    let moment: number, area: number
    if (y1 === y2) {                          // rectangle
      moment = 0.5 * (x1 + x2)
      area   = (x2 - x1) * y1
    } else if (y1 === 0.0) {                  // right triangle (height y2)
      moment = (2.0 / 3.0) * (x2 - x1) + x1
      area   = 0.5 * (x2 - x1) * y2
    } else if (y2 === 0.0) {                  // left triangle (height y1)
      moment = (1.0 / 3.0) * (x2 - x1) + x1
      area   = 0.5 * (x2 - x1) * y1
    } else {                                  // general trapezoid
      moment = (2.0 / 3.0 * (x2 - x1) * (y2 + 0.5 * y1)) / (y1 + y2) + x1
      area   = 0.5 * (x2 - x1) * (y1 + y2)
    }
    sumMomentArea += moment * area
    sumArea       += area
  }
  const index = sumArea < 1e-300 ? -1 : sumMomentArea / sumArea

  // --- Verdict ---
  let verdict: FuzzyResult['verdict']
  if (index === -1 || index < 0) {
    verdict = 'False positive'
  } else if (index < 3.5) {
    verdict = 'Under Ripe'
  } else if (index < 6.5) {
    verdict = 'About to Ripe'
  } else {
    verdict = 'Ripe'
  }

  // --- Build curves for chart rendering ---
  const curves: MFCurve[] = [
    {
      name: 'Blue',
      universe: [0, 100],
      terms: [
        { label: 'L_blue',  points: MF_L_blue,  firingStrength: μ_L_blue },
        { label: 'M_blue',  points: MF_M_blue,  firingStrength: μ_M_blue },
        { label: 'H_blue',  points: MF_H_blue,  firingStrength: μ_H_blue },
        { label: 'vH_blue', points: MF_vH_blue, firingStrength: μ_vH_blue },
      ],
    },
    {
      name: 'Green',
      universe: [0, 120],
      terms: [
        { label: 'L_green', points: MF_L_green, firingStrength: μ_L_green },
        { label: 'H_green', points: MF_H_green, firingStrength: μ_H_green },
      ],
    },
    {
      name: 'Red',
      universe: [0, 140],
      terms: [
        { label: 'vL_red', points: MF_vL_red, firingStrength: μ_vL_red },
        { label: 'L_red',  points: MF_L_red,  firingStrength: μ_L_red },
        { label: 'H_red',  points: MF_H_red,  firingStrength: μ_H_red },
      ],
    },
    {
      name: 'Index',
      universe: [0, 10],
      terms: [
        { label: 'Under ripe',    points: MF_underRipe,   firingStrength: act_ur },
        { label: 'About to ripe', points: MF_aboutToRipe, firingStrength: act_atr },
        { label: 'Ripe',          points: MF_ripe,         firingStrength: act_ripe },
      ],
    },
  ]

  return { index, verdict, curves }
}

// ---------------------------------------------------------------------------
// Helper: return raw MF arrays for display (used before inference)
// ---------------------------------------------------------------------------

export function computeMFCurves(): {
  blue: MFCurve
  green: MFCurve
  red: MFCurve
  index: MFCurve
} {
  return {
    blue: {
      name: 'Blue',
      universe: [0, 100],
      terms: [
        { label: 'L_blue',  points: MF_L_blue,  firingStrength: 0 },
        { label: 'M_blue',  points: MF_M_blue,  firingStrength: 0 },
        { label: 'H_blue',  points: MF_H_blue,  firingStrength: 0 },
        { label: 'vH_blue', points: MF_vH_blue, firingStrength: 0 },
      ],
    },
    green: {
      name: 'Green',
      universe: [0, 120],
      terms: [
        { label: 'L_green', points: MF_L_green, firingStrength: 0 },
        { label: 'H_green', points: MF_H_green, firingStrength: 0 },
      ],
    },
    red: {
      name: 'Red',
      universe: [0, 140],
      terms: [
        { label: 'vL_red', points: MF_vL_red, firingStrength: 0 },
        { label: 'L_red',  points: MF_L_red,  firingStrength: 0 },
        { label: 'H_red',  points: MF_H_red,  firingStrength: 0 },
      ],
    },
    index: {
      name: 'Index',
      universe: [0, 10],
      terms: [
        { label: 'Under ripe',    points: MF_underRipe,   firingStrength: 0 },
        { label: 'About to ripe', points: MF_aboutToRipe, firingStrength: 0 },
        { label: 'Ripe',          points: MF_ripe,         firingStrength: 0 },
      ],
    },
  }
}
