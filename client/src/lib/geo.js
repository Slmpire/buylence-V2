// Straight-line distance in kilometres between two { latitude, longitude } points.
// Returns null if either point is missing coordinates.
export function distanceKm(a, b) {
  if (!a || !b) return null
  const values = [a.latitude, a.longitude, b.latitude, b.longitude]
  if (values.some(v => typeof v !== 'number' || Number.isNaN(v))) return null

  const R = 6371
  const toRad = d => (d * Math.PI) / 180
  const dLat = toRad(b.latitude - a.latitude)
  const dLon = toRad(b.longitude - a.longitude)

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2

  return 2 * R * Math.asin(Math.sqrt(h))
}

// 0.43 -> "430 m", 1.234 -> "1.2 km"
export function formatDistance(km) {
  if (km === null || km === undefined) return null
  if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`
  return `${km.toFixed(1)} km`
}