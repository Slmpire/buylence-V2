import { useState, useMemo, useEffect } from 'react'
import { MapPin, Crosshair, Check, X } from 'lucide-react'
import useLocations from '../../hooks/useLocations'

const CUSTOM = '__custom__'

// onChange receives: { name, latitude, longitude, custom }
export default function LocationPicker({
  value,
  onChange,
  label = 'DELIVERY LOCATION',
  placeholder = 'Choose a location...',
  allowCustom = true,
  inputStyle = {},
  labelStyle = {},
}) {
  const { locations } = useLocations()
  const [mode, setMode] = useState('list') // 'list' | 'custom'
  const [coords, setCoords] = useState(null) // { latitude, longitude, accuracy }
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState('')

  const inList = useMemo(() => locations.some(l => l.name === value), [locations, value])

  // A saved value that is not in the list (e.g. an old address) opens in custom mode
  useEffect(() => {
    if (mode === 'list' && value && !inList && allowCustom) setMode('custom')
  }, [value, inList, mode, allowCustom])

  // Group the list by area (OAU Campus, Ile-Ife, ...)
  const groups = useMemo(() => {
    const map = {}
    locations.forEach(l => {
      const key = l.area || 'Other'
      if (!map[key]) map[key] = []
      map[key].push(l)
    })
    return Object.entries(map)
  }, [locations])

  function handleSelect(e) {
    const v = e.target.value
    setGpsError('')

    if (v === CUSTOM) {
      setMode('custom')
      setCoords(null)
      onChange({ name: '', latitude: null, longitude: null, custom: true })
      return
    }

    const loc = locations.find(l => l.name === v)
    onChange({
      name: v,
      latitude: loc?.latitude ?? null,
      longitude: loc?.longitude ?? null,
      custom: false,
    })
  }

  function handleText(e) {
    onChange({
      name: e.target.value,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      custom: true,
    })
  }

  function backToList() {
    setMode('list')
    setCoords(null)
    setGpsError('')
    onChange({ name: '', latitude: null, longitude: null, custom: false })
  }

  function clearGps() {
    setCoords(null)
    onChange({ name: value, latitude: null, longitude: null, custom: true })
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGpsError('Your browser does not support location sharing.')
      return
    }
    setGpsLoading(true)
    setGpsError('')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        }
        setCoords(c)
        setGpsLoading(false)
        onChange({ name: value || '', latitude: c.latitude, longitude: c.longitude, custom: true })
      },
      (err) => {
        setGpsLoading(false)
        setGpsError(
          err.code === 1
            ? 'Location permission was denied. You can still type your address.'
            : 'Could not get your location. Please type your address instead.'
        )
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && <label style={labelStyle}>{label}</label>}

      {mode === 'list' ? (
        <select
          value={inList ? value : ''}
          onChange={handleSelect}
          style={{ ...inputStyle, cursor: 'pointer' }}
          onFocus={e => { e.target.style.borderColor = '#BE864B' }}
          onBlur={e => { e.target.style.borderColor = '#E4DDD3' }}
        >
          <option value="">{placeholder}</option>
          {groups.map(([area, list]) => (
            <optgroup key={area} label={area}>
              {list.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
            </optgroup>
          ))}
          {allowCustom && <option value={CUSTOM}>➕ Somewhere else (type address)…</option>}
        </select>
      ) : (
        <>
          <input
            type="text"
            value={value}
            onChange={handleText}
            placeholder="Type the address or landmark"
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = '#BE864B' }}
            onBlur={e => { e.target.style.borderColor = '#E4DDD3' }}
          />

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {coords ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0',
                borderRadius: 8, padding: '7px 10px',
                fontSize: 12, color: '#166534', fontWeight: 600,
              }}>
                <Check size={13} /> Location shared (about {coords.accuracy}m accuracy)
                <button
                  type="button"
                  onClick={clearGps}
                  aria-label="Remove shared location"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, color: '#166534' }}
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={useMyLocation}
                disabled={gpsLoading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 12px', borderRadius: 8,
                  border: '1px solid #E4DDD3', backgroundColor: 'white',
                  fontSize: 12, fontWeight: 700, color: '#7F766B',
                  cursor: gpsLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <Crosshair size={13} /> {gpsLoading ? 'Getting location…' : 'Use my current location'}
              </button>
            )}

            <button
              type="button"
              onClick={backToList}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, color: '#BE864B',
                fontFamily: 'Inter, sans-serif', padding: 0,
              }}
            >
              <MapPin size={12} /> Choose from the list instead
            </button>
          </div>

          {gpsError && (
            <p style={{ fontSize: 11, color: '#B53B2F', margin: 0 }}>{gpsError}</p>
          )}
        </>
      )}
    </div>
  )
}