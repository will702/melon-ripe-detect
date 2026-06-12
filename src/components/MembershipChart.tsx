import type { MFCurve } from '../detection/types'

interface ChartProps {
  curve: MFCurve
  inputValue?: number  // the actual B/G/R/Index value, for the vertical marker
}

const TERM_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']

function MFChart({ curve, inputValue }: ChartProps) {
  const W = 200, H = 80
  const PAD = { top: 8, right: 8, bottom: 20, left: 24 }
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const [uMin, uMax] = curve.universe
  const toX = (v: number) => PAD.left + ((v - uMin) / (uMax - uMin)) * plotW
  const toY = (v: number) => PAD.top + (1 - v) * plotH

  // Build SVG path per term
  const paths = curve.terms.map((term, ti) => {
    if (term.points.length < 2) return null
    const step = (uMax - uMin) / (term.points.length - 1)
    const pts = term.points.map((y, i) => {
      const x = toX(uMin + i * step)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${toY(y).toFixed(1)}`
    })
    const color = TERM_COLORS[ti % TERM_COLORS.length]
    const alpha = Math.max(0.3, term.firingStrength)
    return (
      <g key={term.label}>
        <path
          d={pts.join(' ')}
          fill="none"
          stroke={color}
          strokeWidth={term.firingStrength > 0.05 ? 2 : 1}
          strokeOpacity={alpha}
        />
        {/* Filled area */}
        <path
          d={[...pts, `L ${toX(uMax).toFixed(1)} ${toY(0).toFixed(1)}`, `L ${toX(uMin).toFixed(1)} ${toY(0).toFixed(1)}`, 'Z'].join(' ')}
          fill={color}
          fillOpacity={term.firingStrength * 0.15}
        />
      </g>
    )
  })

  // Input marker line
  const markerX = inputValue !== undefined ? toX(Math.max(uMin, Math.min(uMax, inputValue))) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <p style={{ margin: 0, fontSize: '0.7rem', fontFamily: 'var(--font-body)', fontWeight: 600, color: '#444', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {curve.name}
        {inputValue !== undefined && (
          <span style={{ fontWeight: 400, marginLeft: '0.4rem', color: '#888' }}>
            = {inputValue.toFixed(0)}
          </span>
        )}
      </p>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} stroke="#ccc" strokeWidth={1} />
        <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} stroke="#ccc" strokeWidth={1} />
        {/* MF curves */}
        {paths}
        {/* Marker */}
        {markerX !== null && (
          <line x1={markerX} y1={PAD.top} x2={markerX} y2={H - PAD.bottom}
            stroke="#2A2A24" strokeWidth={1.5} strokeDasharray="3 2" />
        )}
        {/* Axis labels */}
        <text x={PAD.left} y={H - 4} fontSize="8" fill="#aaa">{uMin}</text>
        <text x={W - PAD.right} y={H - 4} fontSize="8" fill="#aaa" textAnchor="end">{uMax}</text>
      </svg>
    </div>
  )
}

interface Props {
  curves: MFCurve[]
  rgb?: { b: number; g: number; r: number }
}

export function MembershipChart({ curves, rgb }: Props) {
  const inputs: Record<string, number | undefined> = {
    'Blue': rgb?.b,
    'Green': rgb?.g,
    'Red': rgb?.r,
    'Index': undefined,
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
      {curves.map(curve => (
        <MFChart key={curve.name} curve={curve} inputValue={inputs[curve.name]} />
      ))}
    </div>
  )
}
