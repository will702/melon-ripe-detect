import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

interface Props { visible: boolean }

export function SickBadge({ visible }: Props) {
  const reduce = useReducedMotion()
  return (
    <AnimatePresence>
      {visible && (
        <motion.span
          initial={reduce ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            padding: '0.3rem 0.75rem',
            borderRadius: '999px',
            background: 'color-mix(in srgb, var(--color-sick) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-sick) 40%, transparent)',
            color: 'var(--color-sick)',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
          }}
        >
          {/* simple warning dot */}
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-sick)', display: 'inline-block' }} />
          Sick Melon
        </motion.span>
      )}
    </AnimatePresence>
  )
}
