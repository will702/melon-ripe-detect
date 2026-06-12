import { describe, it, expect, beforeAll, vi } from 'vitest'

// Regression test for the inRange Scalar-vs-Mat crash: cv.inRange must be
// called with Mat bounds; passing cv.Scalar throws 'Cannot pass ... as a Mat'
// and broke every detection.
//
// Real OpenCV.js cannot be imported through vitest's ESM transform — the
// emscripten module exports a `then` property, so awaited module resolution
// self-resolves forever (same hang documented in runtime.ts). Load the CJS
// build synchronously via require() and inject it as the module mock instead.
vi.mock('@techstark/opencv-js', async () => {
  const { createRequire } = await import('node:module')
  const cv = createRequire(import.meta.url)('@techstark/opencv-js')
  return { default: cv.default ?? cv }
})

import * as cvModule from '@techstark/opencv-js'
import { findSample } from './segment'
import { findBlob } from './sick'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cv = ((cvModule as any).default ?? cvModule) as any

function waitForCv(timeoutMs = 20000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const poll = setInterval(() => {
      if (cv?.Mat) {
        clearInterval(poll)
        resolve()
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(poll)
        reject(new Error('OpenCV.js did not initialize in time'))
      }
    }, 50)
  })
}

/** Solid-color BGRA ImageData (the layout findSample expects from detector.ts) */
function solidBGRA(w: number, h: number, b: number, g: number, r: number): ImageData {
  const data = new Uint8ClampedArray(w * h * 4)
  for (let i = 0; i < data.length; i += 4) {
    data[i] = b
    data[i + 1] = g
    data[i + 2] = r
    data[i + 3] = 255
  }
  return new ImageData(data, w, h)
}

describe('findSample with real OpenCV.js', () => {
  beforeAll(() => waitForCv(), 25000)

  it('segments a solid yellow-orange image without throwing', () => {
    // BGR (0, 200, 255) → HSV ≈ (23, 255, 255): inside the yellow/orange bounds
    const input = solidBGRA(64, 64, 0, 200, 255)
    const { maskedResult, roiSample } = findSample(input)

    expect(maskedResult.width).toBe(640)
    expect(maskedResult.height).toBe(480)
    expect(roiSample.width).toBe(200)
    expect(roiSample.height).toBe(200)

    // matToImageData outputs RGBA — for BGR (0,200,255) the ROI pixels
    // should read R=255, G=200, B=0
    expect(roiSample.data[0]).toBe(255) // R
    expect(roiSample.data[1]).toBe(200) // G
    expect(roiSample.data[2]).toBe(0)   // B
  })

  it('findBlob runs on the ROI output without throwing', () => {
    const input = solidBGRA(64, 64, 0, 200, 255)
    const { roiSample } = findSample(input)
    const count = findBlob(roiSample)
    expect(count).toBeGreaterThanOrEqual(0)
  })
})
