'use client' // not needed for Vite but defensive
import { motion, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useEffect } from 'react'

const VERDICTS = {
  'Under Ripe': '#1F6B3B',
  'About to Ripe': '#F2B23E',
  'Ripe': '#FF7A4D',
  'False positive': '#888888',
} as const

interface Props {
  index: number           // 0-10 (use -1 for false positive)
  verdict: string
  animate?: boolean       // trigger the animation
}

export function RipenessGauge({ index, verdict, animate = true }: Props) {
  const reduce = useReducedMotion()

  // SVG arc params
  const cx = 80, cy = 80, r = 64
  const circumference = Math.PI * r  // half arc (180deg)
  const normalised = Math.max(0, Math.min(1, index / 10))

  // Spring-animated progress (0 to normalised).
  // Start at 0; on mount the layout effect sets the target so the spring plays from first paint.
  const progress = useSpring(reduce ? normalised : 0, { stiffness: 60, damping: 18, restDelta: 0.001 })
  useEffect(() => {
    if (reduce) {
      progress.jump(normalised)
    } else if (animate) {
      progress.set(normalised)
    }
  }, [normalised, animate, reduce, progress])

  const dashOffset = useTransform(progress, p => circumference * (1 - p))
  const color = VERDICTS[verdict as keyof typeof VERDICTS] ?? '#888'

  // Arc path: left-to-right semicircle
  const d = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`

  return (
    <svg width={160} height={96} viewBox="0 0 160 96" aria-hidden>
      {/* Track */}
      <path d={d} fill="none" stroke="#E8E4DC" strokeWidth={10} strokeLinecap="round" />
      {/* Animated fill */}
      <motion.path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={circumference}
        style={{ strokeDashoffset: dashOffset }}
      />
    </svg>
  )
}
