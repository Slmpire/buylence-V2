import { Link } from 'react-router-dom'

export function LogoMark({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <rect width="40" height="40" rx="11" fill="#BE6B1A" />
      {/* bag body */}
      <path
        d="M11.5 15.5h17l-1.4 14.2a2 2 0 0 1-2 1.8H14.9a2 2 0 0 1-2-1.8L11.5 15.5Z"
        fill="white"
      />
      {/* handle */}
      <path
        d="M15.5 15.5v-1.8a4.5 4.5 0 0 1 9 0v1.8"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* smile */}
      <path
        d="M17 22.2c.9 1.3 2.2 2 3.5 2s2.5-.7 3.5-2"
        stroke="#BE6B1A"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function Logo({
  size = 32,
  showText = true,
  dark = false,      // true on dark backgrounds (text turns white)
  textSize = 17,
  to = '/',
  onClick,
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      aria-label="Buylence home"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        textDecoration: 'none',
        flexShrink: 0,
      }}
    >
      <LogoMark size={size} />
      {showText && (
        <span
          style={{
            fontWeight: 900,
            fontSize: textSize,
            letterSpacing: '-0.5px',
            color: dark ? 'white' : '#1A1A1A',
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1,
          }}
        >
          BUY<span style={{ color: '#BE6B1A' }}>LENCE</span>
        </span>
      )}
    </Link>
  )
}