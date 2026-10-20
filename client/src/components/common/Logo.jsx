import { Link } from 'react-router-dom'

const SIZES = { sm: 28, md: 34, lg: 42 }

export default function Logo({ size = 'md', light = false, showText = true, to = '/' }) {
  const px = SIZES[size] || SIZES.md

  return (
    <Link
      to={to}
      aria-label="Buylence home"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 9,
        textDecoration: 'none', flexShrink: 0,
      }}
    >
      <svg width={px} height={px} viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#BE6B1A" />
        <path d="M9 12h14l-1 11a2 2 0 0 1-2 1.8h-8A2 2 0 0 1 10 23L9 12z" fill="white" />
        <path
          d="M12.5 12v-1.5a3.5 3.5 0 0 1 7 0V12"
          fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"
        />
      </svg>
      {showText && (
        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 900, fontSize: size === 'sm' ? 15 : 17,
          letterSpacing: '-0.5px',
          color: light ? 'white' : '#1A1A1A',
        }}>
          BUYLENCE
        </span>
      )}
    </Link>
  )
}