import { motion, useReducedMotion } from 'motion/react'

export type Mode = 'upload' | 'camera' | 'video'

interface Props {
  mode: Mode
  onChange: (mode: Mode) => void
}

const TABS: { key: Mode; label: string }[] = [
  { key: 'upload', label: 'Upload' },
  { key: 'camera', label: 'Camera' },
  { key: 'video', label: 'Video' },
]

export function ModeSwitcher({ mode, onChange }: Props) {
  const reduce = useReducedMotion()

  return (
    <div
      role="tablist"
      aria-label="Detection mode"
      style={{
        display: 'inline-flex',
        background: 'rgba(42,42,36,0.06)',
        borderRadius: '2rem',
        padding: '0.25rem',
        gap: '0.25rem',
      }}
    >
      {TABS.map((tab) => {
        const isActive = mode === tab.key
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.key)}
            style={{
              position: 'relative',
              padding: '0.45rem 1.1rem',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: isActive ? '#fff' : 'var(--color-ink)',
              borderRadius: '2rem',
              transition: reduce ? 'none' : 'color 0.15s',
              zIndex: 1,
            }}
          >
            {isActive && (
              <motion.span
                layoutId={reduce ? undefined : 'active-tab'}
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'var(--color-green-deep)',
                  borderRadius: '2rem',
                  zIndex: -1,
                }}
                transition={{ type: 'spring', stiffness: 120, damping: 20 }}
              />
            )}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
