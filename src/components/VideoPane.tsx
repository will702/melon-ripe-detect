import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { detectMelon } from '../detection/detector'
import type { DetectionResult } from '../detection/types'

export interface VideoPaneProps {
  onResult: (result: DetectionResult) => void
  detecting: boolean
  setDetecting: (v: boolean) => void
}

function VideoIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      style={{ display: 'block', margin: '0 auto 0.75rem' }}
    >
      <rect x="1" y="1" width="38" height="38" rx="8" stroke="#C4BDB0" strokeWidth="1.5" strokeDasharray="4 3" />
      <rect x="10" y="13" width="18" height="14" rx="2" stroke="#A09890" strokeWidth="1.75" />
      <path
        d="M28 17l5-3v12l-5-3"
        stroke="#A09890"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

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

export function VideoPane({ onResult, detecting, setDetecting }: VideoPaneProps) {
  const reduce = useReducedMotion()
  const inputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Clean up object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file.')
      return
    }
    setError(null)
    if (objectUrl) URL.revokeObjectURL(objectUrl)
    setObjectUrl(URL.createObjectURL(file))
  }, [objectUrl])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) loadFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = () => {
    setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) loadFile(file)
  }

  const handleSnapshot = async () => {
    const video = videoRef.current
    if (!video) return
    setError(null)
    setDetecting(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 480
      canvas.height = 360
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(video, 0, 0, 480, 360)
      const result = await detectMelon(canvas)
      onResult(result)
    } catch (err) {
      console.error('Detection failed:', err)
      const detail = err instanceof Error ? ` (${err.message})` : ''
      setError(`Detection failed. Try pausing the video on a frame with a clear melon view.${detail}`)
    } finally {
      setDetecting(false)
    }
  }

  const handleClear = () => {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
      setObjectUrl(null)
    }
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <>
      {/* Keyframe for spinner */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {!objectUrl ? (
        /* Empty state: drop zone */
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 240,
            border: `2px dashed ${dragActive ? 'var(--color-green-sage)' : '#C4BDB0'}`,
            borderRadius: 'var(--radius-card)',
            padding: '2.5rem 1.5rem',
            cursor: 'pointer',
            background: dragActive ? 'rgba(77,139,98,0.04)' : 'rgba(255,255,255,0.5)',
            transition: reduce ? 'none' : 'border-color 0.18s, background 0.18s',
            textAlign: 'center',
            userSelect: 'none',
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
          <VideoIcon />
          <p style={{
            margin: '0 0 0.5rem',
            fontFamily: 'var(--font-body)',
            fontSize: '0.95rem',
            color: '#6B6560',
            fontWeight: 500,
          }}>
            Drop a video file here
          </p>
          <p style={{
            margin: '0 0 1rem',
            fontFamily: 'var(--font-body)',
            fontSize: '0.8rem',
            color: '#A09890',
          }}>
            or click to browse
          </p>
          <span
            style={{
              display: 'inline-block',
              padding: '0.4rem 1.1rem',
              borderRadius: '0.5rem',
              border: '1.5px solid var(--color-green-deep)',
              color: 'var(--color-green-deep)',
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              fontWeight: 600,
              pointerEvents: 'none',
            }}
          >
            Browse
          </span>
        </label>
      ) : (
        /* Loaded state: video player + controls */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            borderRadius: 'var(--radius-card)',
            overflow: 'hidden',
            border: '1px solid rgba(42,42,36,0.1)',
            background: '#000',
            lineHeight: 0,
          }}>
            <video
              ref={videoRef}
              src={objectUrl}
              controls
              muted
              playsInline
              style={{ width: '100%', borderRadius: 'var(--radius-card)', background: '#000', display: 'block' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <motion.button
              onClick={handleSnapshot}
              disabled={detecting}
              whileHover={reduce || detecting ? {} : { scale: 1.02 }}
              whileTap={reduce || detecting ? {} : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              style={{
                flex: 1,
                minWidth: 140,
                padding: '0.65rem 1.5rem',
                background: detecting ? '#5a9e74' : 'var(--color-green-deep)',
                color: '#fff',
                border: 'none',
                borderRadius: '0.5rem',
                fontFamily: 'var(--font-body)',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: detecting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: reduce ? 'none' : 'background 0.15s',
              }}
            >
              {detecting && <Spinner />}
              {detecting ? 'Detecting...' : 'Snapshot Frame'}
            </motion.button>

            <button
              onClick={handleClear}
              disabled={detecting}
              style={{
                padding: '0.65rem 1.1rem',
                background: 'none',
                color: '#888',
                border: '1.5px solid #D4CFC4',
                borderRadius: '0.5rem',
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: detecting ? 'not-allowed' : 'pointer',
              }}
            >
              Clear
            </button>
          </div>

          {error && (
            <p style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: '0.85rem',
              color: '#c0392b',
              background: 'rgba(192,57,43,0.07)',
              border: '1px solid rgba(192,57,43,0.2)',
              borderRadius: '0.5rem',
              padding: '0.6rem 0.9rem',
            }}>
              {error}
            </p>
          )}
        </div>
      )}

      {/* Error on empty state */}
      {!objectUrl && error && (
        <p style={{
          marginTop: '0.75rem',
          fontFamily: 'var(--font-body)',
          fontSize: '0.85rem',
          color: '#c0392b',
        }}>
          {error}
        </p>
      )}
    </>
  )
}
