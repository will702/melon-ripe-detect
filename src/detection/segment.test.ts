import { describe, it, expect, vi } from 'vitest'

// Hoist the mock so it intercepts the cv import before any module code runs.
// This prevents @techstark/opencv-js from loading its WASM runtime in jsdom.
// Mat must be explicitly undefined: vitest's mock proxy throws on access to
// exports the factory doesn't define, which broke the not-ready guard check.
vi.mock('@techstark/opencv-js', () => ({ default: undefined, Mat: undefined }))

describe('segment module structure', () => {
  it('exports findSample function', async () => {
    const mod = await import('./segment')
    expect(typeof mod.findSample).toBe('function')
  })

  it('throws when cv is not ready', async () => {
    const { findSample } = await import('./segment')
    const fakeInput = new ImageData(new Uint8ClampedArray(640 * 480 * 4), 640, 480)
    expect(() => findSample(fakeInput)).toThrow('OpenCV.js is not ready')
  })
})
