import { useState, useEffect } from 'react'

// "2d 4h left", "5h 12m left", "40m left", or "Ended"
export function timeLeft(endsAt, now = Date.now()) {
  if (!endsAt) return null
  const ms = new Date(endsAt).getTime() - now
  if (ms <= 0) return 'Ended'

  const totalMinutes = Math.floor(ms / 60000)
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60

  if (days >= 1) return `${days}d ${hours}h left`
  if (hours >= 1) return `${hours}h ${minutes}m left`
  return `${Math.max(1, minutes)}m left`
}

// Re-renders every half minute so countdowns stay fresh
export function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs])
  return now
}

// Small "⏱ 5h 12m left" label. Shows nothing for a deal with no end time.
export default function DealCountdown({ endsAt, style }) {
  const now = useNow()
  const text = timeLeft(endsAt, now)
  if (!text) return null

  const urgent = new Date(endsAt).getTime() - now < 60 * 60 * 1000

  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 10, fontWeight: 800, letterSpacing: '0.02em',
        color: urgent ? '#B91C1C' : '#9A3412',
        backgroundColor: urgent ? '#FEE2E2' : '#FFEDD5',
        padding: '2px 7px', borderRadius: 4, whiteSpace: 'nowrap',
        ...style,
      }}
    >
      ⏱ {text}
    </span>
  )
}