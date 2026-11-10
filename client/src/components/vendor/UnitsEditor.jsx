import { Plus, Trash2, ArrowUp } from 'lucide-react'
import { UNIT_SUGGESTIONS } from '../../constants/productOptions'

const DURATION_HOURS = { '6h': 6, '24h': 24, '3d': 72, '7d': 168 }

export const emptyUnit = () => ({
  label: '', price: '', comparePrice: '', stock: '',
  dealOn: false, dealPrice: '', dealDuration: '24h', dealEndsAt: '',
})

// Turn an option from the server into what the form edits
export function unitFromServer(u) {
  return {
    id: u.id,
    label: u.label,
    price: u.price,
    comparePrice: u.comparePrice ?? '',
    stock: u.stock,
    dealOn: u.dealPrice != null,
    dealPrice: u.dealPrice ?? '',
    dealEndsAt: u.dealEndsAt || '',
    dealDuration: u.dealEndsAt ? 'keep' : 'none',
  }
}

// Turn the form's options into what the server expects
export function unitsToPayload(units) {
  return units.map(u => {
    const base = {
      id: u.id,
      label: u.label.trim(),
      price: Number(u.price),
      comparePrice: u.comparePrice ? Number(u.comparePrice) : null,
      stock: Number(u.stock) || 0,
    }

    if (!u.dealOn || !String(u.dealPrice).trim()) {
      return { ...base, dealPrice: null, dealEndsAt: null }
    }

    let dealEndsAt = null
    if (DURATION_HOURS[u.dealDuration]) {
      dealEndsAt = new Date(Date.now() + DURATION_HOURS[u.dealDuration] * 3600 * 1000).toISOString()
    } else if (u.dealDuration === 'keep') {
      dealEndsAt = u.dealEndsAt || null
    }

    return { ...base, dealPrice: Number(u.dealPrice), dealEndsAt }
  })
}

function formatEnd(iso) {
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  })
}

// units: [{ id?, label, price, comparePrice, stock, dealOn, dealPrice, dealDuration, dealEndsAt }]
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
        {units.map((u, i) => {
          const price = Number(u.price)
          const deal = Number(u.dealPrice)
          const dealValid = u.dealPrice !== '' && price > 0 && deal > 0 && deal < price
          const dealTooHigh = u.dealPrice !== '' && price > 0 && deal >= price
          const ended = u.dealEndsAt && new Date(u.dealEndsAt) < new Date()

          return (
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
                    <button type="button" onClick={() => makeDefault(i)} style={miniBtn}>
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

              {/* Special deal */}
              <div style={{ marginTop: 12 }}>
                <label style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  cursor: 'pointer', fontSize: 12, fontWeight: 800, color: '#9A3412',
                }}>
                  <input
                    type="checkbox"
                    checked={u.dealOn}
                    onChange={e => update(i, 'dealOn', e.target.checked)}
                    style={{ accentColor: '#BE864B', width: 16, height: 16, cursor: 'pointer' }}
                  />
                  🔥 Run a special deal on this option
                </label>

                {u.dealOn && (
                  <div style={{
                    marginTop: 10, padding: '12px', borderRadius: 8,
                    backgroundColor: '#FFF3E6', border: '1px solid #FED7AA',
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1.4fr',
                      gap: 10,
                    }}>
                      <div>
                        <label style={labelStyle}>DEAL PRICE (₦)</label>
                        <input
                          type="number" min="0" inputMode="numeric"
                          value={u.dealPrice}
                          onChange={e => update(i, 'dealPrice', e.target.value)}
                          placeholder="Lower than the price"
                          style={small}
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>DEAL LASTS</label>
                        <select
                          value={u.dealDuration}
                          onChange={e => update(i, 'dealDuration', e.target.value)}
                          style={{ ...small, cursor: 'pointer' }}
                        >
                          {u.dealEndsAt && (
                            <option value="keep">
                              {ended ? 'Keep (this deal has ended)' : `Keep current end (${formatEnd(u.dealEndsAt)})`}
                            </option>
                          )}
                          <option value="none">Until I turn it off</option>
                          <option value="6h">6 hours from now</option>
                          <option value="24h">24 hours from now</option>
                          <option value="3d">3 days from now</option>
                          <option value="7d">7 days from now</option>
                        </select>
                      </div>
                    </div>

                    {dealValid && (
                      <p style={{ fontSize: 11, color: '#9A3412', fontWeight: 700, margin: '10px 0 0' }}>
                        Customers pay ₦{deal.toLocaleString()} instead of ₦{price.toLocaleString()}
                        {' '}({Math.round((1 - deal / price) * 100)}% off).
                      </p>
                    )}
                    {dealTooHigh && (
                      <p style={{ fontSize: 11, color: '#B91C1C', fontWeight: 700, margin: '10px 0 0' }}>
                        The deal price must be lower than the normal price.
                      </p>
                    )}
                    <p style={{ fontSize: 10, color: '#9C9488', margin: '8px 0 0', lineHeight: 1.5 }}>
                      When the deal ends the price goes back to normal on its own. Turn the switch off
                      and save to end it early.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
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