/**
 * Tiny spring engine for gesture-driven UI (Apple "Designing Fluid Interfaces").
 *
 * - Parameters are Apple's: `damping` (ratio, 1 = no overshoot) and `response`
 *   (seconds for the spring to reach its target, NOT a fixed duration).
 * - Interruptible: calling `to()` while running re-targets from the CURRENT
 *   on-screen value and CARRIES the current velocity, so there is never a jump
 *   or a velocity "brick wall".
 * - Animates a plain number; the caller maps it to `transform`/`opacity`
 *   (compositor-only properties).
 */

export type SpringConfig = { damping: number; response: number }

/** Critically damped: graceful, no bounce. Default for anything that did not carry momentum. */
export const SPRING_DEFAULT: SpringConfig = { damping: 1, response: 0.4 }
/** Slightly under-damped: ONLY after a flick/throw that carried momentum (sheet/drawer values). */
export const SPRING_FLICK: SpringConfig = { damping: 0.8, response: 0.3 }

const REST_DISTANCE = 0.4 // px
const REST_VELOCITY = 8 // px/s
const STEP = 1 / 240

/** Where a throw would come to rest (exponential decay, Apple's sample code). */
export function project(velocityPxPerSec: number, decelerationRate = 0.998): number {
  return ((velocityPxPerSec / 1000) * decelerationRate) / (1 - decelerationRate)
}

/** Progressive resistance past a boundary (constant 0.55). Returns the displayed offset (>= 0). */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  const o = Math.abs(overshoot)
  return (o * dimension * constant) / (dimension + constant * o)
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export type Spring = {
  readonly value: number
  readonly velocity: number
  readonly running: boolean
  /** Jump to a value and stop (used while a finger is driving the element 1:1). */
  set: (v: number, velocity?: number) => void
  /** Animate to `target`, starting from the live value and carrying the live velocity unless one is given. */
  to: (target: number, opts?: { velocity?: number; config?: SpringConfig; onComplete?: () => void }) => void
  stop: () => void
}

export function createSpring(initial: number, onUpdate: (value: number) => void): Spring {
  let value = initial
  let velocity = 0
  let raf = 0
  let last = 0
  let target = initial
  let config = SPRING_DEFAULT
  let done: (() => void) | undefined
  let running = false

  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05)
    last = now
    const w = (2 * Math.PI) / config.response
    const c = 2 * config.damping * w
    let t = dt
    while (t > 0) {
      const h = Math.min(STEP, t)
      // semi-implicit Euler: stable for stiff springs
      velocity += (-w * w * (value - target) - c * velocity) * h
      value += velocity * h
      t -= h
    }
    if (Math.abs(value - target) < REST_DISTANCE && Math.abs(velocity) < REST_VELOCITY) {
      value = target
      velocity = 0
      running = false
      onUpdate(value)
      const cb = done
      done = undefined
      cb?.()
      return
    }
    onUpdate(value)
    raf = requestAnimationFrame(tick)
  }

  return {
    get value() {
      return value
    },
    get velocity() {
      return velocity
    },
    get running() {
      return running
    },
    set(v, vel = 0) {
      cancelAnimationFrame(raf)
      running = false
      done = undefined
      value = v
      velocity = vel
      onUpdate(value)
    },
    to(next, opts = {}) {
      cancelAnimationFrame(raf)
      target = next
      config = opts.config ?? SPRING_DEFAULT
      if (opts.velocity !== undefined) velocity = opts.velocity
      done = opts.onComplete
      running = true
      last = performance.now()
      raf = requestAnimationFrame(tick)
    },
    stop() {
      cancelAnimationFrame(raf)
      running = false
      done = undefined
    },
  }
}

/** Keeps a short history of pointer samples to estimate release velocity (px/s). */
export class VelocityTracker {
  private samples: { t: number; p: number }[] = []
  reset(p: number) {
    this.samples = [{ t: performance.now(), p }]
  }
  push(p: number) {
    const t = performance.now()
    this.samples.push({ t, p })
    while (this.samples.length > 2 && t - this.samples[0].t > 100) this.samples.shift()
  }
  /** px per second over the last ~100ms. */
  velocity(): number {
    const s = this.samples
    if (s.length < 2) return 0
    const a = s[0]
    const b = s[s.length - 1]
    const dt = (b.t - a.t) / 1000
    return dt > 0 ? (b.p - a.p) / dt : 0
  }
}
