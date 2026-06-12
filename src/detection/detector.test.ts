import { describe, it, expect, vi } from 'vitest'

vi.mock('onnxruntime-web', () => ({
  InferenceSession: { create: vi.fn() },
  Tensor: vi.fn(),
  env: { wasm: {} },
}))

vi.mock('@techstark/opencv-js', () => ({ default: undefined }))

describe('detector module', () => {
  it('exports detectMelon function', async () => {
    const mod = await import('./detector')
    expect(typeof mod.detectMelon).toBe('function')
  })
})
