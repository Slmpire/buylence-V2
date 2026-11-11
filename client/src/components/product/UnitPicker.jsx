// Chips for choosing how to buy a product (Sachet / Pack / Carton ...).
// Renders nothing when there is only one option.
export default function UnitPicker({ units, selectedId, onSelect }) {
  if (!units || units.length < 2) return null

  return (
    <div style={{ marginBottom: 16 }}>
      <span style={{
        fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
        color: '#1D1D1D', display: 'block', marginBottom: 8,
      }}>
        CHOOSE HOW YOU WANT TO BUY
      </span>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {units.map(u => {
          const soldOut = u.stock <= 0
          const active = u.id === selectedId

          return (
            <button
              key={u.id}
              type="button"
              disabled={soldOut}
              onClick={() => onSelect(u.id)}
              aria-pressed={active}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                gap: 2, padding: '9px 14px', borderRadius: 10,
                border: `2px solid ${active ? '#BE864B' : u.onDeal ? '#FDBA74' : '#E5DFD5'}`,
                backgroundColor: active ? '#FFF8F2' : 'white',
                opacity: soldOut ? 0.5 : 1,
                cursor: soldOut ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif', textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1D' }}>
                {u.onDeal && '🔥 '}{u.label}
              </span>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#BE864B' }}>
                  ₦{u.price.toLocaleString()}
                </span>
                {u.onDeal && u.comparePrice && (
                  <span style={{ fontSize: 10, color: '#9C9488', textDecoration: 'line-through' }}>
                    ₦{u.comparePrice.toLocaleString()}
                  </span>
                )}
              </span>
              {soldOut && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#DC2626' }}>Sold out</span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}