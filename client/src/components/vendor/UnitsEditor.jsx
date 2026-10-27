import { Plus, X } from 'lucide-react'

const SUGGESTIONS = [
  'Piece', 'Sachet', 'Pack', 'Dozen', 'Carton', 'Bag', 'Crate',
  'Tray', 'Bottle', 'Tin', 'Bundle', 'Derica (cup)', 'Kg', 'Litre',
]
const MAX_UNITS = 8
const EMPTY = { label: '', price: '', comparePrice: '', stock: '' }

export default function UnitsEditor({ units, onChange, isMobile, inp, lbl }) {
  const used = units.map(u => u.label.trim().toLowerCase())

  function update(i, key, value) {
    onChange(units.map((u, idx) => (idx === i ? { ...u, [key]: value } : u)))
  }
  function remove(i) {
    onChange(units.filter((_, idx) => idx !== i))
  }
  function add(label = '') {
    if (units.length >= MAX_UNITS) return
    onChange([...units, { ...EMPTY, label }])
  }
  function addSuggestion(label) {
    const emptyIdx = units.findIndex(u => !u.label.trim())
    if (emptyIdx >= 0) update(emptyIdx, 'label', label)
    else add(label)
  }

  const focus = e => (e.target.style.borderColor = '#BE864B')
  const blur = e => (e.target.style.borderColor = '#E4DDD3')

  return (
    <div>
      <p style={{ fontSize: 12, color: '#7F766B', margin: '0 0 12px', lineHeight: 1.6 }}>
        Type it the way your buyers ask for it, like <strong>Sachet</strong>, <strong>Pack</strong>,{' '}
        <strong>Dozen</strong> or <strong>Carton</strong>. Give each one its own price. The first
        option is the one shown by default.
      </p>

      <datalist id="unit-suggestions">
        {SUGGESTIONS.map(s => <option key={s} value={s} />)}
      </datalist>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {units.map((u, i) => (
          <div key={i} style={{
            border: '1px solid #E4DDD3', borderRadius: 10,
            padding: 12, backgroundColor: '#FDFCFA',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 10,
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', color: '#9C9488' }}>
                OPTION {i + 1}
                {i === 0 && (
                  <span style={{
                    marginLeft: 8, fontSize: 9, padding: '2px 6px', borderRadius: 4,
                    backgroundColor: '#F0FDF4', color: '#16A34A', letterSpacing: '0.06em',
                  }}>
                    DEFAULT
                  </span>
                )}
              </span>
              {units.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  aria-label={`Remove option ${i + 1}`}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#9C9488', display: 'flex', padding: 2,
                  }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : '1.4fr 1fr 1fr 1fr',
              gap: 10,
            }}>
              <div style={{ gridColumn: isMobile ? 'span 2' : 'auto' }}>
                <label style={lbl}>SOLD AS</label>
                <input
                  list="unit-suggestions"
                  value={u.label}
                  onChange={e => update(i, 'label', e.target.value)}
                  placeholder="e.g. Carton"
                  maxLength={30}
                  style={inp}
                  onFocus={focus}
                  onBlur={blur}
                />
              </div>
              <div>
                <label style={lbl}>PRICE (₦)</label>
                <input
                  type="number" min="0" inputMode="decimal"
                  value={u.price}
                  onChange={e => update(i, 'price', e.target.value)}
                  placeholder="0"
                  style={inp}
                  onFocus={focus}
                  onBlur={blur}
                />
              </div>
              <div>
                <label style={lbl}>STOCK</label>
                <input
                  type="number" min="0" inputMode="numeric"
                  value={u.stock}
                  onChange={e => update(i, 'stock', e.target.value)}
                  placeholder="0"
                  style={inp}
                  onFocus={focus}
                  onBlur={blur}
                />
              </div>
              <div style={{ gridColumn: isMobile ? 'span 2' : 'auto' }}>
                <label style={lbl}>WAS PRICE (OPTIONAL)</label>
                <input
                  type="number" min="0" inputMode="decimal"
                  value={u.comparePrice}
                  onChange={e => update(i, 'comparePrice', e.target.value)}
                  placeholder="Old price"
                  style={inp}
                  onFocus={focus}
                  onBlur={blur}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {units.length < MAX_UNITS && (
        <>
          <button
            type="button"
            onClick={() => add()}
            style={{
              marginTop: 12, display: 'flex', alignItems: 'center', gap: 6,
              padding: '9px 14px', borderRadius: 8,
              border: '1px dashed #BE864B', backgroundColor: 'transparent',
              color: '#BE864B', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            <Plus size={14} /> Add another way to sell this
          </button>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {SUGGESTIONS.filter(s => !used.includes(s.toLowerCase())).slice(0, 10).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => addSuggestion(s)}
                style={{
                  padding: '4px 10px', borderRadius: 999,
                  border: '1px solid #E4DDD3', backgroundColor: 'white',
                  fontSize: 11, color: '#7F766B', cursor: 'pointer', fontWeight: 600,
                }}
              >
                + {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}