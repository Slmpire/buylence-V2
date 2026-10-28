import { useState, useMemo } from 'react'
import { Search, X, Plus } from 'lucide-react'
import useLocations from '../../hooks/useLocations'

// value: array of location names. onChange receives the new array.
export default function LocationMultiSelect({ value = [], onChange, allowCustom = true }) {
  const { locations } = useLocations()
  const [query, setQuery] = useState('')
  const [custom, setCustom] = useState('')

  const selected = useMemo(() => new Set(value), [value])
  const q = query.trim().toLowerCase()

  const groups = useMemo(() => {
    const map = {}
    locations
      .filter(l => !q || l.name.toLowerCase().includes(q) || (l.area || '').toLowerCase().includes(q))
      .forEach(l => {
        const key = l.area || 'Other'
        if (!map[key]) map[key] = []
        map[key].push(l)
      })
    return Object.entries(map)
  }, [locations, q])

  function toggle(name) {
    onChange(selected.has(name) ? value.filter(v => v !== name) : [...value, name])
  }

  function toggleArea(list) {
    const names = list.map(l => l.name)
    const allOn = names.every(n => selected.has(n))
    onChange(allOn
      ? value.filter(v => !names.includes(v))
      : [...new Set([...value, ...names])])
  }

  function addCustom() {
    const name = custom.trim()
    if (!name) return
    if (!selected.has(name)) onChange([...value, name])
    setCustom('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: 'Inter, sans-serif' }}>

      {/* Selected chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 28 }}>
        {value.length === 0 && (
          <span style={{ fontSize: 12, color: '#9C9488' }}>Nothing selected yet.</span>
        )}
        {value.map(name => (
          <span key={name} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 8px 5px 10px', borderRadius: 999,
            backgroundColor: '#FFF8F2', border: '1px solid #F0D9C0',
            fontSize: 12, fontWeight: 600, color: '#1D1D1D',
          }}>
            {name}
            <button
              type="button"
              onClick={() => toggle(name)}
              aria-label={`Remove ${name}`}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, color: '#9C9488' }}
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        border: '1px solid #E4DDD3', borderRadius: 8,
        padding: '8px 12px', backgroundColor: 'white',
      }}>
        <Search size={14} color="#9C9488" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search locations..."
          style={{
            border: 'none', outline: 'none', width: '100%',
            fontSize: 13, backgroundColor: 'transparent',
            fontFamily: 'Inter, sans-serif',
          }}
        />
      </div>

      {/* List */}
      <div style={{
        maxHeight: 260, overflowY: 'auto',
        border: '1px solid #E4DDD3', borderRadius: 8, backgroundColor: 'white',
      }}>
        {groups.length === 0 && (
          <p style={{ fontSize: 12, color: '#9C9488', padding: 14, margin: 0 }}>No locations match your search.</p>
        )}

        {groups.map(([area, list]) => {
          const allOn = list.every(l => selected.has(l.name))
          return (
            <div key={area}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 12px', backgroundColor: '#F7F4EF',
                position: 'sticky', top: 0,
              }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: '#7F766B' }}>
                  {area.toUpperCase()}
                </span>
                <button
                  type="button"
                  onClick={() => toggleArea(list)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, color: '#BE864B',
                    fontFamily: 'Inter, sans-serif', padding: 0,
                  }}
                >
                  {allOn ? 'Clear all' : 'Select all'}
                </button>
              </div>

              {list.map(l => (
                <label key={l.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', cursor: 'pointer',
                  borderTop: '1px solid rgba(0,0,0,0.04)',
                  backgroundColor: selected.has(l.name) ? '#FFF8F2' : 'white',
                }}>
                  <span style={{ fontSize: 13, color: '#1D1D1D' }}>{l.name}</span>
                  <input
                    type="checkbox"
                    checked={selected.has(l.name)}
                    onChange={() => toggle(l.name)}
                    style={{ accentColor: '#BE864B', width: 16, height: 16, cursor: 'pointer' }}
                  />
                </label>
              ))}
            </div>
          )
        })}
      </div>

      {/* Add a place that is not in the list */}
      {allowCustom && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={custom}
            onChange={e => setCustom(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
            placeholder="Add another place (e.g. Ajebandele Junction)"
            style={{
              flex: 1, border: '1px solid #E4DDD3', borderRadius: 8,
              padding: '9px 12px', fontSize: 13, outline: 'none',
              backgroundColor: 'white', fontFamily: 'Inter, sans-serif',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="button"
            onClick={addCustom}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '9px 14px', borderRadius: 8, border: 'none',
              backgroundColor: '#1D1D1D', color: 'white',
              fontWeight: 700, fontSize: 12, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            <Plus size={13} /> Add
          </button>
        </div>
      )}
    </div>
  )
}