import useLoadingStore from '../../store/loadingStore'

// Thin animated bar at the top of the screen while any API request is running.
export default function GlobalLoader() {
  const active = useLoadingStore((s) => s.pending > 0)
  if (!active) return null
  return <div className="global-loader" role="progressbar" aria-label="Loading" />
}

// Small inline spinner, for buttons or next to text.
export function Spinner({ size = 16, color = 'currentColor' }) {
  return (
    <span
      className="bl-spinner"
      style={{ width: size, height: size, borderColor: color, borderRightColor: 'transparent' }}
      aria-hidden="true"
    />
  )
}

// Centered spinner for whole pages or sections.
export function PageLoader({ label = 'Loading…', minHeight = '40vh' }) {
  return (
    <div className="bl-page-loader" style={{ minHeight }} role="status">
      <Spinner size={28} color="#BE6B1A" />
      <span>{label}</span>
    </div>
  )
}