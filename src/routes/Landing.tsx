import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'

/* ---- Melon cross-section SVG visual ---- */
function MelonVisual() {
  return (
    <svg
      viewBox="0 0 240 240"
      width="240"
      height="240"
      aria-hidden="true"
      style={{ display: 'block', overflow: 'visible' }}
    >
      <defs>
        <radialGradient id="flesh" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE0B2" />
          <stop offset="55%" stopColor="#FF7A4D" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#E86A3A" stopOpacity="0.7" />
        </radialGradient>
        <radialGradient id="rind" cx="50%" cy="50%" r="50%">
          <stop offset="82%" stopColor="transparent" />
          <stop offset="83%" stopColor="#4D8B62" />
          <stop offset="100%" stopColor="#1F6B3B" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Flesh */}
      <ellipse cx="120" cy="120" rx="96" ry="96" fill="url(#flesh)" />
      {/* Rind ring */}
      <ellipse cx="120" cy="120" rx="96" ry="96" fill="url(#rind)" />
      {/* Seeds */}
      {[
        [120, 80],
        [152, 100],
        [160, 134],
        [140, 162],
        [104, 165],
        [82, 140],
        [80, 106],
        [96, 82],
      ].map(([cx, cy], i) => (
        <ellipse
          key={i}
          cx={cx}
          cy={cy}
          rx="5"
          ry="7.5"
          fill="#2A2A24"
          fillOpacity="0.35"
          transform={`rotate(${i * 45} ${cx} ${cy})`}
        />
      ))}
      {/* Center core highlight */}
      <ellipse cx="120" cy="120" rx="12" ry="12" fill="#FFF5E0" fillOpacity="0.45" />
    </svg>
  )
}

/* ---- Step data ---- */
const STEPS = [
  {
    num: '01',
    title: 'Provide an image',
    desc: 'Upload a photo, capture from your camera, or pick a frame from a video clip.',
  },
  {
    num: '02',
    title: 'Detect and sample',
    desc: 'The on-device model locates the melon and reads color data from the detected region.',
  },
  {
    num: '03',
    title: 'Get a verdict',
    desc: 'Fuzzy logic maps the color channels to a ripeness index — no server involved.',
  },
]

/* ---- Ripeness pills ---- */
const RIPENESS = [
  { label: 'Under Ripe', color: '#1F6B3B', bg: 'rgba(31,107,59,0.08)' },
  { label: 'About to Ripe', color: '#F2B23E', bg: 'rgba(242,178,62,0.12)' },
  { label: 'Ripe', color: '#FF7A4D', bg: 'rgba(255,122,77,0.1)' },
]

/* ---- Shared button style ---- */
const ctaStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '0.75rem 1.75rem',
  background: 'var(--color-green-deep)',
  color: '#fff',
  borderRadius: 'var(--radius-button, 0.5rem)',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: '1rem',
  textDecoration: 'none',
  boxShadow: '0 4px 16px rgba(31,107,59,0.25)',
  transition: 'background 200ms, box-shadow 200ms',
}

export default function Landing() {
  const reduce = useReducedMotion()

  const heroTextVariants = {
    hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 90, damping: 18 },
    },
  }

  const heroVisualVariants = {
    hidden: { opacity: reduce ? 1 : 0, scale: reduce ? 1 : 0.88 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 80, damping: 20, delay: 0.15 },
    },
  }

  const stepVariants = (i: number) => ({
    hidden: { opacity: reduce ? 1 : 0, y: reduce ? 0 : 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 90,
        damping: 18,
        delay: i * 0.1,
      },
    },
  })

  return (
    <main
      style={{
        background: 'var(--color-ground)',
        color: 'var(--color-ink)',
        fontFamily: 'var(--font-body)',
        minHeight: 'calc(100vh - 56px)',
      }}
    >
      {/* ===================== HERO ===================== */}
      <section
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: 'clamp(3rem, 8vw, 6rem) 1.5rem clamp(2rem, 5vw, 4rem)',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)',
          gap: '3rem',
          alignItems: 'center',
        }}
      >
        {/* Left: text */}
        <motion.div
          variants={heroTextVariants}
          initial="hidden"
          animate="visible"
          style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
        >
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.2rem, 5.5vw, 3.75rem)',
              fontWeight: 700,
              lineHeight: 1.1,
              color: 'var(--color-ink)',
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            Know when your<br />melon is ready.
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(1rem, 2vw, 1.15rem)',
              color: '#6B6560',
              margin: 0,
              lineHeight: 1.65,
              maxWidth: 440,
            }}
          >
            Browser-based ripeness assessment for canary melons. No server, no upload limits.
          </p>
          <div style={{ paddingTop: '0.25rem' }}>
            <Link to="/detect" style={ctaStyle}>
              Check a Melon
            </Link>
          </div>
        </motion.div>

        {/* Right: visual */}
        <motion.div
          variants={heroVisualVariants}
          initial="hidden"
          animate="visible"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              borderRadius: '50%',
              boxShadow: '0 12px 48px rgba(255,122,77,0.18), 0 4px 16px rgba(31,107,59,0.12)',
              background: 'radial-gradient(circle, rgba(255,224,178,0.4) 0%, rgba(251,247,239,0) 70%)',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MelonVisual />
          </div>
        </motion.div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section
        id="how-it-works"
        style={{
          background: '#fff',
          borderTop: '1px solid rgba(42,42,36,0.06)',
          borderBottom: '1px solid rgba(42,42,36,0.06)',
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: 'clamp(2.5rem, 6vw, 4rem) 1.5rem',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(1.4rem, 3vw, 1.9rem)',
              fontWeight: 600,
              color: 'var(--color-ink)',
              margin: '0 0 2.5rem',
              letterSpacing: '-0.01em',
            }}
          >
            How it works
          </h2>

          {/* Asymmetric numbered list */}
          <ol
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'row',
              gap: '0',
              flexWrap: 'wrap',
            }}
          >
            {STEPS.map((step, i) => (
              <motion.li
                key={step.num}
                variants={stepVariants(i)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-60px' }}
                style={{
                  flex: i === 1 ? '0 0 38%' : '0 0 28%',
                  padding: i === 1
                    ? '2rem 2.5rem 2rem 2rem'
                    : i === 2
                    ? '2rem 0 2rem 2rem'
                    : '2rem 2rem 2rem 0',
                  borderLeft: i > 0 ? '1px solid rgba(42,42,36,0.08)' : 'none',
                  boxSizing: 'border-box',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
                    fontWeight: 700,
                    color: 'var(--color-green-sage)',
                    opacity: 0.35,
                    lineHeight: 1,
                    display: 'block',
                    marginBottom: '0.6rem',
                    letterSpacing: '-0.03em',
                  }}
                >
                  {step.num}
                </span>
                <h3
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: '1.05rem',
                    color: 'var(--color-ink)',
                    margin: '0 0 0.5rem',
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '0.9rem',
                    color: '#6B6560',
                    margin: 0,
                    lineHeight: 1.65,
                    fontWeight: 400,
                  }}
                >
                  {step.desc}
                </p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* ===================== RIPENESS KEY ===================== */}
      <section
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: 'clamp(2rem, 5vw, 3rem) 1.5rem',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)',
            fontWeight: 600,
            color: 'var(--color-ink)',
            margin: '0 0 1.25rem',
            letterSpacing: '-0.01em',
          }}
        >
          Ripeness key
        </h2>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.625rem',
          }}
        >
          {RIPENESS.map((r) => (
            <span
              key={r.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.875rem',
                borderRadius: 999,
                background: r.bg,
                border: `1px solid ${r.color}30`,
                fontFamily: 'var(--font-body)',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--color-ink)',
                whiteSpace: 'nowrap',
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: r.color,
                  flexShrink: 0,
                  boxShadow: `0 0 0 2px ${r.color}22`,
                }}
              />
              {r.label}
            </span>
          ))}
        </div>
      </section>

      {/* ===================== FOOTER CTA ===================== */}
      <section
        style={{
          borderTop: '1px solid rgba(42,42,36,0.07)',
          padding: 'clamp(3rem, 7vw, 5rem) 1.5rem',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.5rem, 3.5vw, 2.25rem)',
            fontWeight: 700,
            color: 'var(--color-ink)',
            margin: '0 0 0.875rem',
            letterSpacing: '-0.02em',
          }}
        >
          Ready to check your harvest?
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '1rem',
            color: '#6B6560',
            margin: '0 0 2rem',
            lineHeight: 1.6,
          }}
        >
          Runs entirely in your browser. Works offline after first load.
        </p>
        <Link to="/detect" style={ctaStyle}>
          Check a Melon
        </Link>
      </section>

      {/* ===================== RESPONSIVE OVERRIDES ===================== */}
      <style>{`
        @media (max-width: 700px) {
          section:first-of-type > div {
            grid-template-columns: 1fr !important;
          }
          #how-it-works ol {
            flex-direction: column !important;
          }
          #how-it-works li {
            flex: none !important;
            border-left: none !important;
            border-top: 1px solid rgba(42,42,36,0.08) !important;
            padding: 1.5rem 0 !important;
          }
          #how-it-works li:first-child {
            border-top: none !important;
          }
        }
      `}</style>
    </main>
  )
}
