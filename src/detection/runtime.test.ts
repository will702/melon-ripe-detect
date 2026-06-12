import { describe, it, expect, vi } from 'vitest'

// runtime.ts statically imports @techstark/opencv-js; importing the real
// module through vitest's ESM transform hangs forever (the emscripten Module
// exports a `then` property — see the comment in runtime.ts). Mock it out.
vi.mock('@techstark/opencv-js', () => ({ default: undefined, Mat: undefined }))

describe('runtime module', () => {
  it('exports initRuntime, getOrtSession, getRuntimeStatus', async () => {
    const mod = await import('./runtime')
    expect(typeof mod.initRuntime).toBe('function')
    expect(typeof mod.getOrtSession).toBe('function')
    expect(typeof mod.getRuntimeStatus).toBe('function')
  })

  it('initial status is idle', async () => {
    const { getRuntimeStatus } = await import('./runtime')
    expect(getRuntimeStatus()).toBe('idle')
  })

  it('exports isCvReady function', async () => {
    const { isCvReady } = await import('./runtime')
    expect(typeof isCvReady).toBe('function')
  })

  it('isCvReady returns false before initialization', async () => {
    const { isCvReady } = await import('./runtime')
    expect(isCvReady()).toBe(false)
  })

  it('getOrtSession throws when not initialized', async () => {
    const { getOrtSession } = await import('./runtime')
    expect(() => getOrtSession()).toThrow('Runtime not initialized')
  })
})
