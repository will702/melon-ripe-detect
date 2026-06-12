import { describe, it, expect, vi } from 'vitest'

vi.mock('@techstark/opencv-js', () => ({
  default: undefined,
}))

describe('sick module structure', () => {
  it('exports findBlob function', async () => {
    const mod = await import('./sick')
    expect(typeof mod.findBlob).toBe('function')
  })
})
