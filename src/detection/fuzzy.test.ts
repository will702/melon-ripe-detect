import { describe, it, expect } from 'vitest'
import { fuzzyRipeIndex, preparingRGBValues } from './fuzzy'

describe('fuzzyRipeIndex — ground truth matches Python scikit-fuzzy', () => {
  it('b=30 g=80 r=130 → index≈8.6 (Ripe)', () => {
    const r = fuzzyRipeIndex({ b: 30, g: 80, r: 130 })
    expect(r.verdict).toBe('Ripe')
    expect(r.index).toBeCloseTo(8.6, 1)
  })

  it('b=90 g=60 r=5 → index≈1.4 (Under Ripe, tweak fires: b→120, r→-20)', () => {
    const r = fuzzyRipeIndex({ b: 90, g: 60, r: 5 })
    expect(r.verdict).toBe('Under Ripe')
    expect(r.index).toBeCloseTo(1.4, 1)
  })

  it('b=65 g=100 r=100 → index≈5.0 (About to Ripe)', () => {
    const r = fuzzyRipeIndex({ b: 65, g: 100, r: 100 })
    expect(r.verdict).toBe('About to Ripe')
    expect(r.index).toBeCloseTo(5.0, 1)
  })

  it('b=60 g=100 r=25 → index≈1.4 (Under Ripe, tweak: b→90, r→0)', () => {
    const r = fuzzyRipeIndex({ b: 60, g: 100, r: 25 })
    expect(r.verdict).toBe('Under Ripe')
    expect(r.index).toBeCloseTo(1.4, 1)
  })

  it('b=50 g=80 r=80 → index≈5.0 (About to Ripe)', () => {
    const r = fuzzyRipeIndex({ b: 50, g: 80, r: 80 })
    expect(r.verdict).toBe('About to Ripe')
    expect(r.index).toBeCloseTo(5.0, 1)
  })

  it('b=20 g=70 r=140 → index≈8.6 (Ripe)', () => {
    const r = fuzzyRipeIndex({ b: 20, g: 70, r: 140 })
    expect(r.verdict).toBe('Ripe')
    expect(r.index).toBeCloseTo(8.6, 1)
  })

  it('b=85 g=50 r=10 → index≈1.4 (Under Ripe, tweak: b→115, r→-15)', () => {
    const r = fuzzyRipeIndex({ b: 85, g: 50, r: 10 })
    expect(r.verdict).toBe('Under Ripe')
    expect(r.index).toBeCloseTo(1.4, 1)
  })

  it('returns 4 MFCurve objects for Blue, Green, Red, Index', () => {
    const r = fuzzyRipeIndex({ b: 50, g: 80, r: 80 })
    expect(r.curves).toHaveLength(4)
    expect(r.curves.map(c => c.name)).toEqual(['Blue', 'Green', 'Red', 'Index'])
  })

  it('Index curve has 3 terms with non-negative firingStrength', () => {
    const r = fuzzyRipeIndex({ b: 50, g: 80, r: 80 })
    const idx = r.curves.find(c => c.name === 'Index')!
    expect(idx.terms).toHaveLength(3)
    idx.terms.forEach(t => expect(t.firingStrength).toBeGreaterThanOrEqual(0))
  })
})

describe('preparingRGBValues', () => {
  it('applies tweak when bl>=40, gr>r+4, bl>=55', () => {
    const [bl, gr, r] = preparingRGBValues(60, 100, 25)
    expect(bl).toBe(90)
    expect(gr).toBe(100)
    expect(r).toBe(0)
  })

  it('does not apply tweak when bl < 40', () => {
    const [bl, gr, r] = preparingRGBValues(30, 100, 10)
    expect(bl).toBe(30)
    expect(gr).toBe(100)
    expect(r).toBe(10)
  })

  it('does not apply tweak when gr <= r + 4', () => {
    // bl=60 >= 40, but gr=29 is NOT > r+4=25+4=29 (29 > 29 is false) → no tweak
    const [bl, gr, r] = preparingRGBValues(60, 29, 25)
    expect(bl).toBe(60)
    expect(gr).toBe(29)
    expect(r).toBe(25)
  })

  it('does not apply tweak when bl < 55 (but bl >= 40)', () => {
    // bl=45 >= 40, gr=100 > r+4=29, but bl=45 < 55 → no tweak
    const [bl, gr, r] = preparingRGBValues(45, 100, 25)
    expect(bl).toBe(45)
    expect(r).toBe(25)
  })
})
