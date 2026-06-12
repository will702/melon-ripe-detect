import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Landing from './routes/Landing'
import Detect from './routes/Detect'

export default function App() {
  return (
    <BrowserRouter>
      <header
        style={{
          background: 'var(--color-ground)',
          borderBottom: '1px solid rgba(42,42,36,0.08)',
          padding: '0.75rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        <Link
          to="/"
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1.25rem',
            color: 'var(--color-ink)',
            textDecoration: 'none',
          }}
        >
          MelonSense
        </Link>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <Link
            to="/detect"
            style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--color-green-deep)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Detect
          </Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/detect" element={<Detect />} />
      </Routes>
    </BrowserRouter>
  )
}
