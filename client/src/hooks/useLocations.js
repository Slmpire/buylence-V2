import { useState, useEffect, useCallback } from 'react'
import api from '../lib/axios'

const FALLBACK_NAMES = [
  'Awo Hall', 'Moremi Hall', 'Fajuyi Hall',
  'Mozambique Hall', 'Angola Hall', 'ETF Hall', 'Awolowo Hall',
]

const FALLBACK = FALLBACK_NAMES.map(name => ({
  id: name, name, area: 'OAU Campus', type: 'HALL', latitude: null, longitude: null,
}))

// Shared between every component that uses the hook
let cache = null
let inflight = null

function load() {
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = api.get('/locations', { silent: true })
      .then(res => {
        cache = res.data.locations?.length ? res.data.locations : FALLBACK
        return cache
      })
      .catch(() => FALLBACK)
      .finally(() => { inflight = null })
  }
  return inflight
}

export default function useLocations() {
  const [locations, setLocations] = useState(cache || FALLBACK)
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    let alive = true
    load().then(list => {
      if (alive) {
        setLocations(list)
        setLoading(false)
      }
    })
    return () => { alive = false }
  }, [])

  // Forget the cache and fetch again (used by the admin screen after changes)
  const refresh = useCallback(async () => {
    cache = null
    setLoading(true)
    const list = await load()
    setLocations(list)
    setLoading(false)
  }, [])

  return { locations, loading, refresh }
}