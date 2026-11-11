import { useState, useEffect, useMemo } from 'react'
import { X, ShieldCheck, Star } from 'lucide-react'
import api from '../../lib/axios'
import useDeliveryLocation from '../../store/deliveryLocationStore'
import LocationPicker from '../common/LocationPicker'
import { Spinner } from '../common/GlobalLoader'
import { distanceKm, formatDistance } from '../../lib/geo'
import { useIsMobile } from '../../hooks/useWindowSize'
import ProductModal from './ProductModal'

const key = (label) => String(label || '').trim().toLowerCase()

// true = delivers there, false = does not, null = we can't tell
function deliversTo(offer, placeName) {
  if (!placeName) return null
  const list = offer.availableHalls?.length
    ? offer.availableHalls
    : (offer.vendor?.deliveryAreas || [])
  if (list.length === 0) return null
  return list.some(a => key(a) === key(placeName))
}

const SORTS = [
  { id: 'best', label: 'Best match' },
  { id: 'price', label: 'Lowest price' },
  { id: 'distance', label: 'Nearest' },
  { id: 'popular', label: 'Most ordered' },
]

const chip = (active) => ({
  padding: '6px 12px', borderRadius: 999,
  border: `1.5px solid ${active ? '#BE864B' : '#E5DFD5'}`,
  backgroundColor: active ? '#BE864B' : 'white',
  color: active ? 'white' : '#7F766B',
  fontSize: 12, fontWeight: 700, cursor: 'pointer',
  fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
})

export default function ProductExplorer({ product, isOpen, onClose }) {
  const isMobile = useIsMobile()
  const deliveryLoc = useDeliveryLocation(s => s.location)
  const setDeliveryLoc = useDeliveryLocation(s => s.setLocation)

  const [offers, setOffers] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | ready
  const [view, setView] = useState('offers')   // offers | detail
  const [chosen, setChosen] = useState(null)
  const [sortBy, setSortBy] = useState('best')
  const [compareKey, setCompareKey] = useState('')
  const [editingLocation, setEditingLocation] = useState(false)

  // Load every seller of this product whenever the screen opens
  useEffect(() => {
    if (!isOpen || !product) return

    setSortBy('best')
    setEditingLocation(false)
    setChosen(null)

    // Demo products (no real store behind them) go straight to the details
    if (!product.vendorId || product.sellers) {
      setOffers([])
      setChosen(product)
      setView('detail')
      setStatus('ready')
      return
    }

    let alive = true
    setStatus('loading')
    setView('offers')
    setOffers(null)

    api.get('/products/offers', { params: { name: product.name }, silent: true })
      .then(res => {
        if (!alive) return
        const list = res.data.offers || []
        setOffers(list)

        // Compare by the size shown on the card, to start with
        const first = (product.units || []).find(u => u.stock > 0) || product.units?.[0]
        setCompareKey(first ? key(first.label) : '')

        if (list.length <= 1) {
          setChosen(list[0] || product)
          setView('detail')
        } else {
          setView('offers')
        }
        setStatus('ready')
      })
      .catch(() => {
        if (!alive) return
        setOffers([])
        setChosen(product)
        setView('detail')
        setStatus('ready')
      })

    return () => { alive = false }
  }, [isOpen, product])

  // Stop the page behind from scrolling while the sellers list is open
  useEffect(() => {
    if (isOpen && view === 'offers') {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen, view])

  // Close with Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && isOpen && view === 'offers') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, view, onClose])

  // Sizes that exist across sellers, most common first (for "Compare by")
  const labels = useMemo(() => {
    const map = new Map()
      ; (offers || []).forEach(o => {
        o.units.forEach(u => {
          const k = key(u.label)
          const entry = map.get(k) || { key: k, label: u.label, count: 0 }
          entry.count += 1
          map.set(k, entry)
        })
      })
    return [...map.values()].sort((a, b) => b.count - a.count)
  }, [offers])

  const activeKey = labels.some(l => l.key === compareKey) ? compareKey : (labels[0]?.key || '')
  const activeLabel = labels.find(l => l.key === activeKey)?.label || ''

  // Build one comparable row per seller, then rank them
  const rows = useMemo(() => {
    if (!offers) return []

    const built = offers.map(offer => {
      const unit = offer.units.find(u => key(u.label) === activeKey) || null
      const fallback = offer.units.find(u => u.stock > 0) || offer.units[0]
      const distance = distanceKm(deliveryLoc, {
        latitude: offer.vendor.latitude,
        longitude: offer.vendor.longitude,
      })
      return {
        offer,
        unit,
        fallback,
        price: unit ? unit.price : null,
        inStock: unit ? unit.stock > 0 : false,
        distance,
        delivers: deliversTo(offer, deliveryLoc?.name),
        score: 0,
      }
    })

    // Best match = price 40%, distance 35%, how often it is ordered 25%
    const buyable = built.filter(r => r.price !== null && r.inStock)
    const minPrice = buyable.length ? Math.min(...buyable.map(r => r.price)) : 0
    const maxOrders = Math.max(0, ...built.map(r => r.offer.orderCount))
    const maxDist = Math.max(0, ...built.map(r => r.distance ?? 0))

    built.forEach(r => {
      const priceScore = r.price !== null && r.inStock ? minPrice / r.price : 0
      const popScore = maxOrders ? r.offer.orderCount / maxOrders : 0
      const distScore = r.distance === null ? 0.3 : (maxDist ? 1 - Math.min(r.distance / maxDist, 1) : 1)
      r.score = 0.4 * priceScore + 0.35 * distScore + 0.25 * popScore
    })

    // Sellers who can't sell it, or don't deliver to you, always go last
    const tier = r => (r.price === null || !r.inStock ? 2 : r.delivers === false ? 1 : 0)

    return built.sort((a, b) => {
      if (tier(a) !== tier(b)) return tier(a) - tier(b)
      if (sortBy === 'price') return (a.price ?? Infinity) - (b.price ?? Infinity) || b.score - a.score
      if (sortBy === 'distance') return (a.distance ?? Infinity) - (b.distance ?? Infinity) || b.score - a.score
      if (sortBy === 'popular') return b.offer.orderCount - a.offer.orderCount || b.score - a.score
      return b.score - a.score
    })
  }, [offers, activeKey, deliveryLoc, sortBy])

  function noteFor(offer) {
    const parts = []
    const km = distanceKm(deliveryLoc, {
      latitude: offer.vendor?.latitude,
      longitude: offer.vendor?.longitude,
    })
    const dist = formatDistance(km)
    if (dist && deliveryLoc) parts.push(`📍 ${dist} from ${deliveryLoc.name}`)
    if (offer.vendor?.deliveryFee != null) parts.push(`🚚 Delivery ₦${offer.vendor.deliveryFee.toLocaleString()}`)
    const d = deliversTo(offer, deliveryLoc?.name)
    if (d === false) parts.push(`⚠️ May not deliver to ${deliveryLoc.name}`)
    return parts.join('  ·  ')
  }

  function choose(offer) {
    setChosen(offer)
    setView('detail')
  }

  if (!isOpen || !product) return null

  // Details of one seller's product
  if (status === 'ready' && view === 'detail' && chosen) {
    return (
      <ProductModal
        product={chosen}
        isOpen
        onClose={onClose}
        onBack={offers && offers.length > 1 ? () => setView('offers') : undefined}
        deliveryNote={noteFor(chosen)}
        initialUnitKey={activeKey}
      />
    )
  }

  const overlay = {
    position: 'fixed', inset: 0, zIndex: 1000,
    display: 'flex',
    alignItems: isMobile ? 'flex-end' : 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    padding: isMobile ? 0 : 24,
  }

  // Still loading the sellers
  if (status !== 'ready') {
    return (
      <div style={overlay} onClick={onClose}>
        <div
          onClick={e => e.stopPropagation()}
          style={{
            backgroundColor: '#FAF8F5', borderRadius: isMobile ? '24px 24px 0 0' : 20,
            padding: '36px 28px', width: '100%', maxWidth: isMobile ? '100%' : 420,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <Spinner size={26} color="#BE864B" />
          <p style={{ fontSize: 13, color: '#7F766B', margin: 0 }}>Finding sellers…</p>
        </div>
      </div>
    )
  }

  // The sellers list
  return (
    <div style={overlay} onClick={onClose}>
      <style>{`
        @keyframes xSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes xPopIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#FAF8F5',
          width: '100%',
          maxWidth: isMobile ? '100%' : 640,
          maxHeight: isMobile ? '90vh' : '88vh',
          borderRadius: isMobile ? '24px 24px 0 0' : 20,
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          border: '1px solid rgba(0,0,0,0.08)',
          fontFamily: 'Inter, sans-serif',
          animation: isMobile ? 'xSlideUp 0.25s ease-out' : 'xPopIn 0.2s ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          padding: isMobile ? '16px 16px 12px' : '20px 24px 14px',
          borderBottom: '1px solid #E5DFD5', backgroundColor: 'white',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
          flexShrink: 0,
        }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: '#BE864B', margin: '0 0 4px' }}>
              {rows.length} SELLERS
            </p>
            <h2 style={{
              fontSize: isMobile ? 17 : 20, fontWeight: 900, color: '#1D1D1D',
              letterSpacing: '-0.3px', margin: 0, lineHeight: 1.25,
            }}>
              {product.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              border: '1px solid #E5DFD5', backgroundColor: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#1D1D1D',
            }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Controls + list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: isMobile ? '14px 16px 24px' : '16px 24px 28px' }}>

          {/* Delivery location */}
          <div style={{
            backgroundColor: 'white', border: '1px solid #E5DFD5', borderRadius: 12,
            padding: '12px 14px', marginBottom: 14,
          }}>
            {!editingLocation ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <p style={{ fontSize: 12, color: '#5A5550', margin: 0, lineHeight: 1.5 }}>
                  {deliveryLoc ? (
                    <>📍 Delivering to <strong style={{ color: '#1D1D1D' }}>{deliveryLoc.name}</strong></>
                  ) : (
                    <>📍 Set where you want it delivered to see distances</>
                  )}
                </p>
                <button
                  onClick={() => setEditingLocation(true)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 12, fontWeight: 800, color: '#BE864B',
                    fontFamily: 'Inter, sans-serif', padding: 0, whiteSpace: 'nowrap',
                  }}
                >
                  {deliveryLoc ? 'Change' : 'Set location'}
                </button>
              </div>
            ) : (
              <div>
                <LocationPicker
                  value={deliveryLoc?.name || ''}
                  onChange={loc => setDeliveryLoc(loc)}
                  label=""
                  placeholder="Choose where we should deliver..."
                  inputStyle={{
                    width: '100%', padding: '10px 12px', border: '1px solid #E4DDD3',
                    borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box',
                    backgroundColor: 'white', fontFamily: 'Inter, sans-serif',
                  }}
                  labelStyle={{}}
                />
                <button
                  onClick={() => setEditingLocation(false)}
                  style={{
                    marginTop: 10, padding: '8px 16px', borderRadius: 8, border: 'none',
                    backgroundColor: '#1D1D1D', color: 'white', fontWeight: 700,
                    fontSize: 12, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {/* Compare by size */}
          {labels.length > 1 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: '#9C9488', margin: '0 0 6px' }}>
                COMPARE PRICE BY
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {labels.map(l => (
                  <button key={l.key} onClick={() => setCompareKey(l.key)} style={chip(l.key === activeKey)}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sort */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: '#9C9488', margin: '0 0 6px' }}>
              SORT BY
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SORTS.map(s => (
                <button key={s.id} onClick={() => setSortBy(s.id)} style={chip(sortBy === s.id)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sellers */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map((r, idx) => {
              const v = r.offer.vendor
              const distLabel = formatDistance(r.distance)
              const isBest = idx === 0 && sortBy === 'best' && r.price !== null && r.inStock && r.delivers !== false
              const lowStock = r.unit && r.unit.stock > 0 && r.unit.stock <= 5

              return (
                <button
                  key={r.offer.id}
                  onClick={() => choose(r.offer)}
                  style={{
                    textAlign: 'left', width: '100%',
                    backgroundColor: 'white',
                    border: `1.5px solid ${isBest ? '#BE864B' : '#E5DFD5'}`,
                    borderRadius: 14, padding: '14px',
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    display: 'flex', justifyContent: 'space-between', gap: 12,
                    opacity: r.price === null || !r.inStock ? 0.7 : 1,
                  }}
                >
                  {/* Seller side */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#1D1D1D' }}>{v.storeName}</span>
                      {v.verified && <ShieldCheck size={13} color="#16A34A" />}
                      {isBest && (
                        <span style={{
                          fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
                          color: 'white', backgroundColor: '#BE864B',
                          padding: '2px 7px', borderRadius: 4,
                        }}>
                          BEST MATCH
                        </span>
                      )}
                    </div>

                    <p style={{
                      fontSize: 11, color: '#7F766B', margin: '0 0 8px',
                      display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                    }}>
                      {v.rating > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Star size={11} color="#BE864B" fill="#BE864B" /> {v.rating}
                          {v.totalReviews ? ` (${v.totalReviews})` : ''}
                        </span>
                      )}
                      <span>{r.offer.orderCount} order{r.offer.orderCount === 1 ? '' : 's'}</span>
                      <span>• {v.hall}</span>
                    </p>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={tagStyle('#F7F4EF', '#5A5550')}>
                        {distLabel
                          ? `📍 ${distLabel} away`
                          : deliveryLoc ? '📍 Distance unknown' : '📍 Set location'}
                      </span>
                      <span style={tagStyle('#F7F4EF', '#5A5550')}>
                        🚚 ₦{(v.deliveryFee ?? 0).toLocaleString()}
                      </span>
                      {r.delivers === true && (
                        <span style={tagStyle('#DCFCE7', '#166534')}>✓ Delivers to you</span>
                      )}
                      {r.delivers === false && (
                        <span style={tagStyle('#FEE2E2', '#B91C1C')}>Doesn't deliver to {deliveryLoc.name}</span>
                      )}
                    </div>
                  </div>

                  {/* Price side */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    {r.price !== null ? (
                      <>
                        {r.unit?.onDeal && (
                          <p style={{ fontSize: 10, fontWeight: 800, color: '#C2410C', margin: '0 0 2px' }}>
                            🔥 DEAL
                          </p>
                        )}
                        <p style={{
                          fontSize: 18, fontWeight: 900, margin: 0,
                          color: r.unit?.onDeal ? '#C2410C' : '#BE864B',
                        }}>
                          ₦{r.price.toLocaleString()}
                        </p>
                        {r.unit?.onDeal && r.unit.comparePrice && (
                          <p style={{ fontSize: 11, color: '#9C9488', textDecoration: 'line-through', margin: 0 }}>
                            ₦{r.unit.comparePrice.toLocaleString()}
                          </p>
                        )}
                        <p style={{ fontSize: 11, color: '#9C9488', margin: '0 0 4px' }}>
                          per {activeLabel.toLowerCase()}
                        </p>
                        {!r.inStock ? (
                          <span style={tagStyle('#FEE2E2', '#B91C1C')}>Sold out</span>
                        ) : lowStock ? (
                          <span style={tagStyle('#FEF3C7', '#92400E')}>Only {r.unit.stock} left</span>
                        ) : (
                          <span style={tagStyle('#DCFCE7', '#166534')}>In stock</span>
                        )}
                      </>
                    ) : (
                      <>
                        <p style={{ fontSize: 11, color: '#9C9488', margin: '0 0 4px', maxWidth: 110 }}>
                          Not sold per {activeLabel.toLowerCase()}
                        </p>
                        {r.fallback && (
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#5A5550', margin: 0 }}>
                            ₦{r.fallback.price.toLocaleString()} / {r.fallback.label.toLowerCase()}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          <p style={{ fontSize: 11, color: '#9C9488', margin: '16px 0 0', lineHeight: 1.6 }}>
            Distances are straight-line and shown only when both the store and your delivery location have coordinates.
            "Best match" weighs price, distance and how often a seller's product is ordered.
          </p>
        </div>
      </div>
    </div>
  )
}

function tagStyle(bg, color) {
  return {
    fontSize: 10, fontWeight: 700, color, backgroundColor: bg,
    padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap',
  }
}