import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import VendorLayout from '../../components/vendor/VendorLayout'
import { useIsMobile } from '../../hooks/useWindowSize'
import api from '../../lib/axios'

const CATEGORIES = ['Grains & Cereals', 'Proteins & Meat', 'Tubers & Roots', 'Snacks & Beverages', 'Oils & Spices', 'Bread & Bakery', 'Beverages & Drinks']
const UNITS = ['Per kg', 'Per piece', 'Per pack', 'Per litre', 'Per bundle', 'Per crate']
const HALLS = ['Awo Hall', 'Moremi Hall', 'Fajuyi Hall', 'Mozambique Hall', 'Angola Hall', 'ETF Hall']

export default function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [form, setForm] = useState({
    name: '', category: '', price: '',
    comparePrice: '', stock: '', unit: '',
    description: '', sku: '',
    availableHalls: [], flashDeal: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/products/${id}`)
      .then(res => {
        const p = res.data.product
        setForm({
          name: p.name || '',
          category: p.category || '',
          price: p.price || '',
          comparePrice: p.comparePrice || '',
          stock: p.stock || '',
          unit: p.unit || '',
          description: p.description || '',
          sku: p.sku || '',
          availableHalls: p.availableHalls || [],
          flashDeal: p.flashDeal || false,
        })
      })
      .catch(() => setError('Failed to load product.'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleSave() {
    if (!form.name) return setError('Please enter a product name.')
    if (!form.category) return setError('Please select a category.')
    if (!form.price) return setError('Please enter a price.')

    setSaving(true)
    setError('')
    try {
      await api.patch(`/products/${id}`, {
        name: form.name,
        category: form.category,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
        stock: Number(form.stock) || 0,
        unit: form.unit || 'Per piece',
        description: form.description || '',
        sku: form.sku || null,
        availableHalls: form.availableHalls,
        flashDeal: form.flashDeal,
      })
      navigate('/vendor/products')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update product.')
    } finally {
      setSaving(false)
    }
  }

  function toggleHall(hall) {
    setForm(p => ({
      ...p,
      availableHalls: p.availableHalls.includes(hall)
        ? p.availableHalls.filter(h => h !== hall)
        : [...p.availableHalls, hall],
    }))
  }

  const inp = {
    width: '100%', padding: '10px 14px',
    border: '1px solid #E4DDD3', borderRadius: 8,
    fontSize: isMobile ? 15 : 13, outline: 'none',
    backgroundColor: 'white', transition: 'border-color 0.15s',
    boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', color: '#2B2B2B',
  }

  const lbl = {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
    color: '#39332E', marginBottom: 5, display: 'block',
  }

  if (loading) {
    return (
      <VendorLayout>
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid #BE864B', borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ fontSize: 13, color: '#9C9488' }}>Loading product...</p>
        </div>
      </VendorLayout>
    )
  }

  return (
    <VendorLayout searchPlaceholder="Search inventory...">
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <button
          onClick={() => navigate('/vendor/products')}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'none', border: 'none',
            color: '#7F766B', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, padding: 0,
          }}
        >
          <ArrowLeft size={14} /> Back to Products
        </button>
      </div>

      <div style={{ maxWidth: 600 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 24px', color: '#1D1D1D', letterSpacing: '-0.3px' }}>
          Edit Product
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Name */}
          <div>
            <label style={lbl}>PRODUCT NAME</label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Ofada Rice (1kg)"
              style={inp}
              onFocus={e => e.target.style.borderColor = '#BE864B'}
              onBlur={e => e.target.style.borderColor = '#E4DDD3'}
            />
          </div>

          {/* Category */}
          <div>
            <label style={lbl}>CATEGORY</label>
            <select
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              style={{ ...inp, cursor: 'pointer' }}
            >
              <option value="">Select category...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Price + Compare Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>PRICE (₦)</label>
              <input
                type="number" value={form.price}
                onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                placeholder="e.g. 3200"
                style={inp}
                onFocus={e => e.target.style.borderColor = '#BE864B'}
                onBlur={e => e.target.style.borderColor = '#E4DDD3'}
              />
            </div>
            <div>
              <label style={lbl}>COMPARE PRICE (₦) — OPTIONAL</label>
              <input
                type="number" value={form.comparePrice}
                onChange={e => setForm(p => ({ ...p, comparePrice: e.target.value }))}
                placeholder="e.g. 3800"
                style={inp}
                onFocus={e => e.target.style.borderColor = '#BE864B'}
                onBlur={e => e.target.style.borderColor = '#E4DDD3'}
              />
            </div>
          </div>

          {/* Stock + Unit */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>STOCK QUANTITY</label>
              <input
                type="number" value={form.stock}
                onChange={e => setForm(p => ({ ...p, stock: e.target.value }))}
                placeholder="e.g. 50"
                style={inp}
                onFocus={e => e.target.style.borderColor = '#BE864B'}
                onBlur={e => e.target.style.borderColor = '#E4DDD3'}
              />
            </div>
            <div>
              <label style={lbl}>UNIT</label>
              <select
                value={form.unit}
                onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                style={{ ...inp, cursor: 'pointer' }}
              >
                <option value="">Select unit...</option>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={lbl}>DESCRIPTION</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Describe your product..."
              rows={3}
              style={{
                ...inp, resize: 'vertical', minHeight: 80,
                fontFamily: 'Inter, sans-serif',
              }}
              onFocus={e => e.target.style.borderColor = '#BE864B'}
              onBlur={e => e.target.style.borderColor = '#E4DDD3'}
            />
          </div>

          {/* SKU */}
          <div>
            <label style={lbl}>SKU — OPTIONAL</label>
            <input
              value={form.sku}
              onChange={e => setForm(p => ({ ...p, sku: e.target.value }))}
              placeholder="e.g. BL-GR-001"
              style={inp}
              onFocus={e => e.target.style.borderColor = '#BE864B'}
              onBlur={e => e.target.style.borderColor = '#E4DDD3'}
            />
          </div>

          {/* Available Halls */}
          <div>
            <label style={lbl}>AVAILABLE HALLS</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {HALLS.map(hall => {
                const selected = form.availableHalls.includes(hall)
                return (
                  <button
                    key={hall} type="button"
                    onClick={() => toggleHall(hall)}
                    style={{
                      padding: '7px 14px', borderRadius: 20,
                      border: '1.5px solid',
                      borderColor: selected ? '#BE864B' : '#E4DDD3',
                      backgroundColor: selected ? '#BE864B' : 'white',
                      color: selected ? 'white' : '#7F766B',
                      fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      transition: 'all 0.15s',
                    }}
                  >
                    {hall}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Flash Deal toggle */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', padding: '14px',
            backgroundColor: '#F7F4EF', borderRadius: 8,
          }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px', color: '#1D1D1D' }}>
                Flash Deal
              </p>
              <p style={{ fontSize: 11, color: '#7F766B', margin: 0 }}>
                Mark as a limited-time deal
              </p>
            </div>
            <div
              onClick={() => setForm(p => ({ ...p, flashDeal: !p.flashDeal }))}
              style={{
                width: 42, height: 24, borderRadius: 12,
                backgroundColor: form.flashDeal ? '#BE864B' : '#E4DDD3',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: '50%', backgroundColor: 'white',
                position: 'absolute', top: 3, left: form.flashDeal ? 21 : 3,
                transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '10px 14px', backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA', borderRadius: 8,
              fontSize: 13, color: '#DC2626', fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1, padding: '13px',
                background: saving ? '#E4DDD3' : 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
                color: 'white', border: 'none', borderRadius: 8,
                fontWeight: 700, fontSize: 13,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => navigate('/vendor/products')}
              style={{
                padding: '13px 20px', backgroundColor: 'white',
                color: '#7F766B', border: '1px solid #E4DDD3',
                borderRadius: 8, fontWeight: 600, fontSize: 13,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </VendorLayout>
  )
}