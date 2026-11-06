import { Plus, Trash2, ArrowUp } from 'lucide-react'
import { UNIT_SUGGESTIONS } from '../../constants/productOptions'

export const emptyUnit = () => ({ label: '', price: '', comparePrice: '', stock: '' })

// units: [{ id?, label, price, comparePrice, stock }]
export default function UnitsEditor({ units, onChange, inputStyle, labelStyle, isMobile }) {
  const used = new Set(units.map(u => u.label.trim().toLowerCase()))

  function update(index, key, value) {
    onChange(units.map((u, i) => (i === index ? { ...u, [key]: value } : u)))
  }

  function remove(index) {
    if (units.length === 1) return
    onChange(units.filter((_, i) => i !== index))
  }

  function makeDefault(index) {
    const next = [...units]
    const [picked] = next.splice(index, 1)
    next.unshift(picked)
    onChange(next)
  }

  function addSuggestion(label) {
    // If the only row is still blank, fill it instead of adding another
    const first = units[0]
    if (units.length === 1 && !first.label.trim() && !String(first.price).trim()) {
      update(0, 'label', label)
      return
    }
    if (units.length >= 8) return
    onChange([...units, { ...emptyUnit(), label }])
  }

  const small = { ...inputStyle, padding: '9px 12px' }

  return (
    <div>
      <p style={{ fontSize: 12, color: '#7F766B', margin: '0 0 12px', lineHeight: 1.6 }}>
        Add every way customers buy this product. Each option has its own price and stock.
        Example: <strong style={{ color: '#1D1D1D' }}>Sachet ₦250 · Pack ₦1,050 · Carton ₦9,500</strong>.
      </p>

      {/* Quick picks */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {UNIT_SUGGESTIONS.filter(s => !used.has(s.toLowerCase())).map(s => (
          <button
            key={s}
            type="button"
            onClick={() => addSuggestion(s)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 999,
              border: '1px dashed #C8B89A', backgroundColor: 'white',
              color: '#7F766B', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}
          >
            <Plus size={11} /> {s}
          </button>
        ))}
      </div>

      <datalist id="unit-suggestions">
        {UNIT_SUGGESTIONS.map(s => <option key={s} value={s} />)}
      </datalist>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {units.map((u, i) => (
          <div
            key={u.id || `new-${i}`}
            style={{
              border: `1px solid ${i === 0 ? '#F0D9C0' : '#E4DDD3'}`,
              backgroundColor: i === 0 ? '#FFF8F2' : '#FBFAF8',
              borderRadius: 10, padding: '12px',
            }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 10, gap: 8,
            }}>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
                color: i === 0 ? '#BE864B' : '#9C9488',
              }}>
                {i === 0 ? 'DEFAULT OPTION (SHOWN FIRST)' : `OPTION ${i + 1}`}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {i > 0 && (
                  <button
                    type="button" onClick={() => makeDefault(i)}
                    style={miniBtn}
                  >
                    <ArrowUp size={12} /> Make default
                  </button>
                )}
                {units.length > 1 && (
                  <button
                    type="button" onClick={() => remove(i)}
                    aria-label="Remove this option"
                    style={{ ...miniBtn, color: '#DC2626' }}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : '1.3fr 1fr 1fr 1fr',
              gap: 10,
            }}>
              <div style={{ gridColumn: isMobile ? 'span 2' : 'auto' }}>
                <label style={labelStyle}>SOLD AS</label>
                <input
                  list="unit-suggestions"
                  type="text" value={u.label}
                  onChange={e => update(i, 'label', e.target.value)}
                  placeholder="e.g. Carton"
                  maxLength={30}
                  style={small}
                />
              </div>
              <div>
                <label style={labelStyle}>PRICE (₦)</label>
                <input
                  type="number" min="0" inputMode="numeric"
                  value={u.price}
                  onChange={e => update(i, 'price', e.target.value)}
                  placeholder="0"
                  style={small}
                />
              </div>
              <div>
                <label style={labelStyle}>WAS (₦)</label>
                <input
                  type="number" min="0" inputMode="numeric"
                  value={u.comparePrice}
                  onChange={e => update(i, 'comparePrice', e.target.value)}
                  placeholder="optional"
                  style={small}
                />
              </div>
              <div>
                <label style={labelStyle}>IN STOCK</label>
                <input
                  type="number" min="0" inputMode="numeric"
                  value={u.stock}
                  onChange={e => update(i, 'stock', e.target.value)}
                  placeholder="0"
                  style={small}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {units.length < 8 && (
        <button
          type="button"
          onClick={() => onChange([...units, emptyUnit()])}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginTop: 12, padding: '9px 14px', borderRadius: 8,
            border: '1.5px dashed #BE864B', backgroundColor: 'transparent',
            color: '#BE864B', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}
        >
          <Plus size={14} /> Add another way to buy
        </button>
      )}
    </div>
  )
}

const miniBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '4px 8px', borderRadius: 6,
  border: '1px solid #E4DDD3', backgroundColor: 'white',
  color: '#7F766B', fontSize: 11, fontWeight: 700,
  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
}