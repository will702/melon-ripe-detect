import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { MembershipChart } from './MembershipChart'
import type { DetectionResult } from '../detection/types'

function DiagCanvas({ data, label }: { data: ImageData; label: string }) {
  const ref = (canvas: HTMLCanvasElement | null) => {
    if (canvas && data) {
      canvas.width = data.width
      canvas.height = data.height
      canvas.getContext('2d')?.putImageData(data, 0, 0)
    }
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <canvas ref={ref} style={{ width: '100%', height: 'auto', borderRadius: '0.5rem', border: '1px solid #EDE9E0' }} />
      <p style={{ margin: 0, fontSize: '0.65rem', color: '#888', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
    </div>
  )
}

interface Props { result: DetectionResult }

export function Diagnostics({ result }: Props) {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()

  if (!result.melonFound || !result.ripeness) return null

  return (
    <div style={{ borderTop: '1px solid #EDE9E0', paddingTop: '1rem' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          fontSize: '0.8rem',
          color: '#888',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}
        aria-expanded={open}
      >
        <span style={{
          display: 'inline-block',
          transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          transition: reduce ? 'none' : 'transform 0.2s var(--ease-organic)',
          fontSize: '0.7rem',
        }}>&#9658;</span>
        Diagnostics
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Diagnostic images */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                {result.bboxOverlay && <DiagCanvas data={result.bboxOverlay} label="Detection" />}
                {result.maskedResult && <DiagCanvas data={result.maskedResult} label="Segmentation" />}
                {result.roiSample && <DiagCanvas data={result.roiSample} label="ROI Sample" />}
                {result.rgb && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{
                      borderRadius: '0.5rem',
                      border: '1px solid #EDE9E0',
                      height: 80,
                      background: `rgb(${result.rgb.r}, ${result.rgb.g}, ${result.rgb.b})`,
                    }} />
                    <p style={{ margin: 0, fontSize: '0.65rem', color: '#888', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      RGB Swatch ({result.rgb.r}, {result.rgb.g}, {result.rgb.b})
                    </p>
                  </div>
                )}
              </div>

              {/* Membership charts */}
              {result.ripeness.curves.length > 0 && (
                <div>
                  <p style={{ margin: '0 0 0.5rem', fontSize: '0.7rem', color: '#888', fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Fuzzy Membership Functions
                  </p>
                  <MembershipChart curves={result.ripeness.curves} rgb={result.rgb} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
