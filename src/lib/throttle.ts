/**
 * Returns a throttled version of fn that fires at most once per `limit` ms.
 * The wrapped function always returns void — return values are intentionally discarded.
 * Use for fire-and-forget scenarios (e.g., live detection frames).
 */
export function throttle<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  limit: number
): (...args: TArgs) => void {
  let lastCall = 0
  return (...args: TArgs) => {
    const now = Date.now()
    if (now - lastCall >= limit) {
      lastCall = now
      fn(...args)
    }
  }
}

/**
 * Returns a function that schedules fn with a minimum interval of `interval` ms,
 * suitable for a live-detection loop. Returns a cancel function.
 * stop() sets a flag that prevents new ticks from being scheduled.
 * An in-flight async tick may still complete before the loop fully halts — this is intentional.
 */
export function createLiveLoop(
  fn: () => void | Promise<void>,
  interval = 480
): { start: () => void; stop: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let running = false

  function tick() {
    if (!running) return
    Promise.resolve(fn()).finally(() => {
      if (running) timeout = setTimeout(tick, interval)
    })
  }

  return {
    start() {
      if (running) return
      running = true
      tick()
    },
    stop() {
      running = false
      if (timeout) clearTimeout(timeout)
    },
  }
}
