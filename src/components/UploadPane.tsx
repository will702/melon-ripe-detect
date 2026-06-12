import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { detectMelon } from '../detection/detector'
import type { DetectionResult } from '../detection/types'

export interface UploadPaneProps {
  onResult: (result: DetectionResult) => void
  detecting: boolean
  setDetecting: (v: boolean) => void
}

function UploadIcon() {
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
      <path
        d="M20 26V16M20 16l-4 4M20 16l4 4"
        stroke="#A09890"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 29h14"
        stroke="#C4BDB0"
        strokeWidth="1.5"
        strokeLinecap="round"
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

export function UploadPane({ onResult, detecting, setDetecting }: UploadPaneProps) {
  const reduce = useReducedMotion()
  const inputRef = useRef<HTMLInputElement>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  const loadFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
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

  const handleDetect = async () => {
    if (!objectUrl) return
    setError(null)
    setDetecting(true)
    try {
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = objectUrl
      })
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      const result = await detectMelon(canvas)
      onResult(result)
    } catch (err) {
      console.error('Detection failed:', err)
      const detail = err instanceof Error ? ` (${err.message})` : ''
      setError(`Detection failed. Try a clear, well-lit image.${detail}`)
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
            accept="image/*"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
          <UploadIcon />
          <p style={{
            margin: '0 0 0.5rem',
            fontFamily: 'var(--font-body)',
            fontSize: '0.95rem',
            color: '#6B6560',
            fontWeight: 500,
          }}>
            Drop a melon image here
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
        /* Preview state */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            borderRadius: 'var(--radius-card)',
            overflow: 'hidden',
            border: '1px solid rgba(42,42,36,0.1)',
            background: '#f0ebe0',
            lineHeight: 0,
          }}>
            <img
              src={objectUrl}
              alt="Selected melon"
              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: 400, objectFit: 'contain' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <motion.button
              onClick={handleDetect}
              disabled={detecting}
              whileHover={reduce || detecting ? {} : { scale: 1.02 }}
              whileTap={reduce || detecting ? {} : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              style={{
                flex: 1,
                minWidth: 120,
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
              {detecting ? 'Detecting...' : 'Detect'}
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
