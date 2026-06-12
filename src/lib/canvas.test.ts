import { describe, it, expect } from 'vitest'
import { throttle } from './throttle'

describe('throttle', () => {
  it('calls function on first invocation', () => {
    let count = 0
    const t = throttle(() => count++, 100)
    t()
    expect(count).toBe(1)
  })
  it('suppresses calls within the limit', () => {
    let count = 0
    const t = throttle(() => count++, 1000)
    t(); t(); t()
    expect(count).toBe(1)
  })
})
