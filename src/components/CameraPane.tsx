import { useRef, useState, useEffect, useCallback } from 'react'
import type { CSSProperties } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { detectMelon } from '../detection/detector'
import { createLiveLoop } from '../lib/throttle'
import type { DetectionResult } from '../detection/types'

export interface CameraPaneProps {
  onResult: (result: DetectionResult) => void
  detecting: boolean
  setDetecting: (v: boolean) => void
}

type CameraState = 'requesting' | 'denied' | 'active'
type LiveMode = 'snapshot' | 'live'

function Spinner() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: '1em',
        height: '1em',
        border: '2px solid rgba(255,255,255,0.35)',
        borderTopColor: '#fff',
        borderRadius: '50%',
        animation: 'spin 0.65s linear infinite',
        verticalAlign: 'middle',
        marginRight: '0.45rem',
      }}
    />
  )
}

const buttonBase: CSSProperties = {
  padding: '0.65rem 1.5rem',
  color: '#fff',
  border: 'none',
  borderRadius: '0.5rem',
  fontFamily: 'var(--font-body)',
  fontSize: '0.95rem',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export function CameraPane({ onResult, detecting, setDetecting }: CameraPaneProps) {
  const reduce = useReducedMotion()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const loopRef = useRef<{ start: () => void; stop: () => void } | null>(null)

  const [cameraState, setCameraState] = useState<CameraState>('requesting')
  const [liveMode, setLiveMode] = useState<LiveMode>('snapshot')

  const startCamera = useCallback(async () => {
    setCameraState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraState('active')
    } catch (err) {
      // Show denied state for any camera failure; DOMException covers permission/hardware errors
      if (err instanceof DOMException) {
        console.warn(`Camera error [${err.name}]: ${err.message}`)
      }
      setCameraState('denied')
    }
  }, [])

  // Assign stream when video element mounts and stream is ready
  useEffect(() => {
    if (cameraState === 'active' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
    }
  }, [cameraState])

  // Start camera on mount
  useEffect(() => {
    startCamera()
    return () => {
      // Stop all tracks on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      }
      // Stop live loop on unmount
      if (loopRef.current) {
        loopRef.current.stop()
        loopRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const captureFrame = useCallback((): HTMLCanvasElement | null => {
    const video = videoRef.current
    if (!video || video.readyState < 2) return null
    const canvas = document.createElement('canvas')
    canvas.width = 480
    canvas.height = 360
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, 480, 360)
    return canvas
  }, [])

  const handleSnapshot = useCallback(async () => {
    const canvas = captureFrame()
    if (!canvas) return
    setDetecting(true)
    try {
      const result = await detectMelon(canvas)
      onResult(result)
    } catch (err) {
      console.error('Detection failed:', err)
    } finally {
      setDetecting(false)
    }
  }, [captureFrame, setDetecting, onResult])

  const startLive = useCallback(() => {
    if (loopRef.current) {
      loopRef.current.stop()
      loopRef.current = null
    }
    const loop = createLiveLoop(async () => {
      const canvas = captureFrame()
      if (!canvas) return
      const result = await detectMelon(canvas)
      onResult(result)
    }, 480)
    loopRef.current = loop
    loop.start()
    setLiveMode('live')
  }, [captureFrame, onResult])

  const stopLive = useCallback(() => {
    if (loopRef.current) {
      loopRef.current.stop()
      loopRef.current = null
    }
    setLiveMode('snapshot')
  }, [])


  /* ---- Requesting state ---- */
  if (cameraState === 'requesting') {
    return (
      <>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }
@keyframes livePulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.7; } }`}</style>
        <div
          style={{
            minHeight: 240,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed #C4BDB0',
            borderRadius: 'var(--radius-card)',
            background: 'rgba(255,255,255,0.5)',
          }}
        >
          <span
            aria-label="Requesting camera access"
            style={{
              display: 'inline-block',
              width: '2rem',
              height: '2rem',
              border: '3px solid rgba(42,42,36,0.12)',
              borderTopColor: 'var(--color-green-deep)',
              borderRadius: '50%',
              animation: reduce ? 'none' : 'spin 0.8s linear infinite',
              opacity: reduce ? 0.5 : 1,
            }}
          />
        </div>
      </>
    )
  }

  /* ---- Denied state ---- */
  if (cameraState === 'denied') {
    return (
      <div
        style={{
          minHeight: 240,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px dashed #C4BDB0',
          borderRadius: 'var(--radius-card)',
          padding: '2.5rem 1.5rem',
          background: 'rgba(255,255,255,0.5)',
          textAlign: 'center',
          gap: '1rem',
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            color: 'var(--color-ink)',
            fontWeight: 600,
          }}
        >
          Camera access denied.
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            color: '#6B6560',
          }}
        >
          Please allow camera access in your browser settings and try again.
        </p>
        <motion.button
          onClick={startCamera}
          whileHover={reduce ? {} : { scale: 1.03 }}
          whileTap={reduce ? {} : { scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          style={{
            ...buttonBase,
            background: 'var(--color-green-deep)',
          }}
        >
          Try again
        </motion.button>
      </div>
    )
  }

  /* ---- Active state ---- */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Video element */}
        <div
          style={{
            borderRadius: 'var(--radius-card)',
            overflow: 'hidden',
            background: '#000',
            lineHeight: 0,
            position: 'relative',
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            aria-label="Live camera feed"
            style={{
              width: '100%',
              display: 'block',
              borderRadius: 'var(--radius-card)',
              background: '#000',
            }}
          />

          {/* Live badge overlay */}
          {liveMode === 'live' && (
            <div
              style={{
                position: 'absolute',
                top: '0.75rem',
                left: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(4px)',
                borderRadius: '999px',
                padding: '0.3rem 0.65rem',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: 'var(--color-coral)',
                  display: 'inline-block',
                  animation: reduce ? 'none' : 'livePulse 1.5s ease-in-out infinite',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#fff',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Live
              </span>
            </div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {liveMode === 'snapshot' ? (
            <>
              {/* Snapshot button */}
              <motion.button
                onClick={handleSnapshot}
                disabled={detecting}
                whileHover={reduce || detecting ? {} : { scale: 1.02 }}
                whileTap={reduce || detecting ? {} : { scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                style={{
                  ...buttonBase,
                  flex: 1,
                  minWidth: 120,
                  background: detecting ? '#5a9e74' : 'var(--color-green-deep)',
                  cursor: detecting ? 'not-allowed' : 'pointer',
                  transition: reduce ? 'none' : 'background 0.15s',
                }}
              >
                {detecting && <Spinner />}
                {detecting ? 'Detecting...' : 'Snapshot'}
              </motion.button>

              {/* Switch to live mode */}
              <motion.button
                onClick={startLive}
                disabled={detecting}
                whileHover={reduce || detecting ? {} : { scale: 1.02 }}
                whileTap={reduce || detecting ? {} : { scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                style={{
                  ...buttonBase,
                  background: detecting ? '#5a9e74' : 'var(--color-green-sage)',
                  cursor: detecting ? 'not-allowed' : 'pointer',
                  transition: reduce ? 'none' : 'background 0.15s',
                }}
              >
                Live
              </motion.button>
            </>
          ) : (
            /* Stop Live button */
            <motion.button
              onClick={stopLive}
              whileHover={reduce ? {} : { scale: 1.02 }}
              whileTap={reduce ? {} : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              style={{
                ...buttonBase,
                flex: 1,
                minWidth: 120,
                background: 'var(--color-coral)',
                transition: reduce ? 'none' : 'background 0.15s',
              }}
            >
              Stop Live
            </motion.button>
          )}
        </div>
      </div>
  )
}
