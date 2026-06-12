import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { RipenessGauge } from './RipenessGauge'
import { SickBadge } from './SickBadge'
import type { DetectionResult } from '../detection/types'

const VERDICT_COPY = {
  'Under Ripe': 'This melon needs more time on the vine. Sugars are still developing.',
  'About to Ripe': 'Nearly there. Harvest within the next few days for peak sweetness.',
  'Ripe': 'Peak ripeness. Ready to harvest now for best flavour.',
  'False positive': 'Melon detected but ripeness could not be assessed. Try a clearer image.',
} as const

const VERDICT_COLORS = {
  'Under Ripe': '#1F6B3B',
  'About to Ripe': '#F2B23E',
  'Ripe': '#FF7A4D',
  'False positive': '#888',
} as const

interface Props {
  result: DetectionResult
}

export function ResultCard({ result }: Props) {
  const reduce = useReducedMotion()
  const hasResult = result.melonFound && result.verdict && result.ripeness

  // When hasResult is true these are always defined; cast to avoid redundant non-null assertions below
  const verdict = result.verdict as string | undefined
  const ripeness = result.ripeness
  const sick = result.sick

  const color = verdict ? (VERDICT_COLORS[verdict as keyof typeof VERDICT_COLORS] ?? '#888') : '#888'

  return (
    <AnimatePresence mode="wait">
      {!hasResult ? (
        <motion.div
          key="no-melon"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            padding: '2rem',
            borderRadius: 'var(--radius-card)',
            background: '#F5F0E8',
            border: '1.5px dashed #D4CFC4',
            textAlign: 'center',
            color: '#888',
            fontFamily: 'var(--font-body)',
          }}
        >
          <p style={{ margin: 0 }}>No melon detected. Try a clear, well-lit image of a canary melon.</p>
        </motion.div>
      ) : (
      <motion.div
        key={(verdict ?? '') + (ripeness?.index ?? 0)}
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        style={{
          borderRadius: 'var(--radius-card)',
          background: 'var(--color-ground)',
          boxShadow: 'var(--shadow-card)',
          border: `1.5px solid ${color}33`,
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Gauge + verdict header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <RipenessGauge index={ripeness!.index} verdict={verdict!} animate={true} />
          <div style={{ flex: 1, minWidth: 140 }}>
            <p style={{
              margin: '0 0 0.25rem',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-body)',
              color: '#888',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontWeight: 600,
            }}>
              Ripeness Assessment
            </p>
            <h2 style={{
              margin: '0 0 0.25rem',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
              fontWeight: 700,
              color,
              lineHeight: 1.1,
            }}>
              {verdict}
            </h2>
            {ripeness!.index >= 0 && (
              <p style={{
                margin: 0,
                fontFamily: 'var(--font-body)',
                fontSize: '0.85rem',
                color: '#666',
              }}>
                Index: <strong style={{ color: 'var(--color-ink)' }}>{ripeness!.index.toFixed(1)}</strong> / 10
                {result.bbox && (
                  <span style={{ marginLeft: '0.75rem' }}>
                    Confidence: <strong style={{ color: 'var(--color-ink)' }}>{(result.bbox.score * 100).toFixed(0)}%</strong>
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        <p style={{
          margin: 0,
          fontFamily: 'var(--font-body)',
          fontSize: '0.9rem',
          color: '#555',
          lineHeight: 1.6,
          borderTop: '1px solid #EDE9E0',
          paddingTop: '1rem',
        }}>
          {VERDICT_COPY[verdict! as keyof typeof VERDICT_COPY] ?? ''}
        </p>

        {/* Sick badge */}
        {sick && <SickBadge visible={true} />}
      </motion.div>
      )}
    </AnimatePresence>
  )
}
