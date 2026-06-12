import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { initRuntime } from '../detection/runtime'
import { getRuntimeStatus } from '../detection/runtime'
import { ModeSwitcher } from '../components/ModeSwitcher'
import { UploadPane } from '../components/UploadPane'
import { CameraPane } from '../components/CameraPane'
import { VideoPane } from '../components/VideoPane'
import { ResultCard } from '../components/ResultCard'
import { Diagnostics } from '../components/Diagnostics'
import type { DetectionResult } from '../detection/types'
import type { Mode } from '../components/ModeSwitcher'

const MODEL_URL = '/model/melon_ssd.onnx'

export default function Detect() {
  const reduce = useReducedMotion()
  const [runtimeStatus, setRuntimeStatus] = useState(getRuntimeStatus())
  const [downloadPct, setDownloadPct] = useState<number | null>(null)
  const [activeMode, setActiveMode] = useState<Mode>('upload')
  const [result, setResult] = useState<DetectionResult | null>(null)
  const [detecting, setDetecting] = useState(false)

  useEffect(() => {
    if (runtimeStatus === 'ready' || runtimeStatus === 'loading') return
    setRuntimeStatus('loading')
    initRuntime(MODEL_URL, (fraction) => setDownloadPct(Math.round(fraction * 100)))
      .then(() => setRuntimeStatus('ready'))
      .catch(() => setRuntimeStatus('error'))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleResult = (r: DetectionResult) => {
    setResult(r)
  }

  /* ---- Loading bar ---- */
  if (runtimeStatus === 'loading' || runtimeStatus === 'idle') {
    return (
      <main style={{
        minHeight: 'calc(100vh - 56px)',
        background: 'var(--color-ground)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.5rem',
        padding: '2rem',
      }}>
        <div style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.1rem',
            color: 'var(--color-ink)',
            marginBottom: '0.5rem',
          }}>
            {downloadPct !== null && downloadPct < 100
              ? `Downloading model… ${downloadPct}%`
              : downloadPct === 100
              ? 'Initializing…'
              : 'Loading…'}
          </p>
          {downloadPct === null || downloadPct === 100 ? (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              color: '#9B9590',
              margin: '0 0 1rem',
            }}>
              {downloadPct === null ? 'Checking cache…' : 'Setting up inference engine'}
            </p>
          ) : (
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.8rem',
              color: '#9B9590',
              margin: '0 0 1rem',
            }}>
              ~21 MB · first visit only, cached after this
            </p>
          )}
          {/* Progress bar */}
          <div style={{
            height: 4,
            background: 'rgba(42,42,36,0.1)',
            borderRadius: 2,
            overflow: 'hidden',
          }}>
            {downloadPct !== null && downloadPct < 100 ? (
              /* Determinate bar during download */
              <motion.div
                animate={{ width: `${downloadPct}%` }}
                transition={{ duration: 0.15, ease: 'linear' }}
                style={{
                  height: '100%',
                  background: 'var(--color-green-deep)',
                  borderRadius: 2,
                  transformOrigin: 'left',
                }}
              />
            ) : (
              /* Indeterminate shimmer while ORT/OpenCV initialize */
              <motion.div
                animate={reduce ? {} : { x: ['-100%', '100%'] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  height: '100%',
                  width: reduce ? '100%' : '50%',
                  background: 'var(--color-green-deep)',
                  borderRadius: 2,
                  opacity: reduce ? 0.4 : 1,
                }}
              />
            )}
          </div>
        </div>
      </main>
    )
  }

  /* ---- Error state ---- */
  if (runtimeStatus === 'error') {
    return (
      <main style={{
        minHeight: 'calc(100vh - 56px)',
        background: 'var(--color-ground)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}>
        <div style={{
          maxWidth: 400,
          textAlign: 'center',
          borderRadius: 'var(--radius-card)',
          background: '#fff',
          boxShadow: 'var(--shadow-card)',
          padding: '2.5rem 2rem',
        }}>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            color: '#c0392b',
            marginBottom: '0.75rem',
          }}>
            Model failed to load
          </p>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.9rem',
            color: '#666',
            margin: '0 0 1.5rem',
            lineHeight: 1.6,
          }}>
            The detection model could not be initialized. Check your connection and try refreshing the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.55rem 1.25rem',
              background: 'var(--color-green-deep)',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            Reload
          </button>
        </div>
      </main>
    )
  }

  /* ---- Ready state ---- */
  return (
    <main style={{
      minHeight: 'calc(100vh - 56px)',
      background: 'var(--color-ground)',
      padding: '2rem 1.25rem',
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
      }}>
        {/* Page heading */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.6rem, 4vw, 2.25rem)',
            fontWeight: 700,
            color: 'var(--color-ink)',
            margin: '0 0 0.4rem',
          }}>
            Ripeness Detector
          </h1>
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: '0.95rem',
            color: '#6B6560',
            margin: 0,
          }}>
            Upload an image of a canary melon to assess its ripeness.
          </p>
        </div>

        {/* Mode switcher */}
        <div style={{ marginBottom: '1.75rem' }}>
          <ModeSwitcher mode={activeMode} onChange={setActiveMode} />
        </div>

        {/* Two-column layout on desktop; right column holds results */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 380px)',
          gap: '1.75rem',
          alignItems: 'start',
        }}>
          {/* Left: input pane */}
          <div>
            {activeMode === 'upload' && (
              <UploadPane
                onResult={handleResult}
                detecting={detecting}
                setDetecting={setDetecting}
              />
            )}
            {activeMode === 'camera' && (
              <CameraPane
                onResult={handleResult}
                detecting={detecting}
                setDetecting={setDetecting}
              />
            )}
            {activeMode === 'video' && (
              <VideoPane
                onResult={handleResult}
                detecting={detecting}
                setDetecting={setDetecting}
              />
            )}
          </div>

          {/* Right: results (only shown when result exists) */}
          <AnimatePresence>
            {result && (
              <motion.div
                key="results-panel"
                initial={reduce ? false : { opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                style={{
                  position: 'sticky',
                  top: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                }}
              >
                <ResultCard result={result} />
                <Diagnostics result={result} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  )
}
