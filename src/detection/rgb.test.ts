import { describe, it, expect } from 'vitest'
import { extractRGB } from './rgb'

function makeImageData(pixels: number[][]): ImageData {
  // pixels is array of [R, G, B, A] tuples (standard canvas RGBA layout)
  const data = new Uint8ClampedArray(pixels.flatMap(p => p))
  return new ImageData(data, pixels.length, 1)
}

describe('extractRGB', () => {
  it('returns 0,0,0 for empty/black pixel', () => {
    const id = makeImageData([[0, 0, 0, 255]])
    expect(extractRGB(id)).toEqual({ b: 0, g: 0, r: 0 })
  })

  it('pure red pixel normalizes to r=255, g=0, b=0', () => {
    const id = makeImageData([[200, 0, 0, 255]])
    expect(extractRGB(id)).toEqual({ b: 0, g: 0, r: 255 })
  })

  it('pure blue pixel normalizes to b=255, g=0, r=0', () => {
    const id = makeImageData([[0, 0, 200, 255]])
    expect(extractRGB(id)).toEqual({ b: 255, g: 0, r: 0 })
  })

  it('equal channels normalize to 85,85,85 (255/3 each, rounded)', () => {
    const id = makeImageData([[100, 100, 100, 255]])
    const result = extractRGB(id)
    expect(result.b).toBe(85)
    expect(result.g).toBe(85)
    expect(result.r).toBe(85)
  })

  it('known values: r=60 g=100 b=80 → normalization matches Python', () => {
    // mean R=60, G=100, B=80, total=240
    // r_norm = round(60/240*255) = round(63.75) = 64
    // g_norm = round(100/240*255) = round(106.25) = 106
    // b_norm = round(80/240*255) = round(85) = 85
    const id = makeImageData([[60, 100, 80, 255]])
    const result = extractRGB(id)
    expect(result.b).toBe(85)
    expect(result.g).toBe(106)
    expect(result.r).toBe(64)
  })

  it('averages across multiple pixels', () => {
    // 2 pixels: [100,0,0,255] and [0,100,0,255]
    // mean R=50, G=50, B=0, total=100
    // r=128, g=128, b=0 (round(50/100*255) = round(127.5) = 128 in JS)
    const id = makeImageData([[100, 0, 0, 255], [0, 100, 0, 255]])
    const result = extractRGB(id)
    expect(result.b + result.g + result.r).toBeCloseTo(255, -1)  // sums close to 255
    expect(result.b).toBe(0)
  })
})
