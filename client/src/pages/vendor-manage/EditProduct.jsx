import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import VendorLayout from '../../components/vendor/VendorLayout'
import UnitsEditor, { emptyUnit, unitFromServer, unitsToPayload } from '../../components/vendor/UnitsEditor'
import LocationMultiSelect from '../../components/common/LocationMultiSelect'
import { Spinner, PageLoader } from '../../components/common/GlobalLoader'
import { PRODUCT_CATEGORIES } from '../../constants/productOptions'
import { useIsMobile } from '../../hooks/useWindowSize'
import api from '../../lib/axios'
import { toast } from '../../store/toastStore'

export default function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [form, setForm] = useState({
    name: '', category: '', description: '', sku: '',
    availableHalls: [],
  })
  const [units, setUnits] = useState([emptyUnit()])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // The edit route returns the REAL prices, with any running deal left out
    api.get(`/products/${id}/edit`)
      .then(res => {
        const p = res.data.product
        setForm({
          name: p.name || '',
          category: p.category || '',
          description: p.description || '',
          sku: p.sku || '',
          availableHalls: p.availableHalls || [],
        })

        if (p.units?.length) {
          setUnits(p.units.map(unitFromServer))
        } else {
          // Product from before options existed: show its single price and stock
          setUnits([{
            ...emptyUnit(),
            label: String(p.unit || 'Piece').replace(/^per\s+/i, ''),
            price: p.price,
            comparePrice: p.comparePrice ?? '',
            stock: p.stock,
          }])
        }
      })
      .catch(() => setError('Failed to load product.'))
      .finally(() => setLoading(false))
  }, [id])

  function handleChange(k, v) {
    setForm(p => ({ ...p, [k]: v }))
    setError('')
  }

  async function handleSave() {
    if (!form.name.trim()) return setError('Please enter a product name.')
    if (!form.category) return setError('Please select a category.')
    if (units.some(u => !u.label.trim())) return setError('Every option needs a name, like Pack or Carton.')
    if (units.some(u => !String(u.price).trim())) return setError('Every option needs a price.')
    if (units.some(u => u.dealOn && !String(u.dealPrice).trim())) {
      return setError('Enter a deal price, or turn the special deal off.')
    }

    setSaving(true)
    setError('')
    try {
      await api.patch(`/products/${id}`, {
        name: form.name.trim(),
        category: form.category,
        description: form.description || '',
        sku: form.sku || null,
        availableHalls: form.availableHalls,
        units: unitsToPayload(units),
      })
      toast.success('Product updated.')
      navigate('/vendor/products')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update product.')
    } finally {
      setSaving(false)
    }
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

  const focusOn = e => { e.target.style.borderColor = '#BE864B' }
  const focusOff = e => { e.target.style.borderColor = '#E4DDD3' }

  const card = {
    backgroundColor: 'white',
    border: '1px solid rgba(0,0,0,0.07)',
    borderRadius: 12, padding: isMobile ? '16px' : '20px 22px',
  }

  if (loading) {
    return (
      <VendorLayout>
        <PageLoader label="Loading product..." minHeight="50vh" />
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
            fontFamily: 'Inter, sans-serif', flexShrink: 0,
          }}
        >
          <ArrowLeft size={14} /> {!isMobile && 'Back'}
        </button>
        {!isMobile && <div style={{ width: 1, height: 16, backgroundColor: '#E4DDD3' }} />}
        <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, margin: 0, color: '#1D1D1D', letterSpacing: '-0.3px' }}>
          Edit Product
        </h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720 }}>

        {/* Basic info */}
        <div style={card}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 14px', color: '#1D1D1D' }}>
            Product Information
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>PRODUCT NAME</label>
              <input
                type="text" value={form.name}
                onChange={e => handleChange('name', e.target.value)}
                style={inp} onFocus={focusOn} onBlur={focusOff}
              />
            </div>

            <div>
              <label style={lbl}>CATEGORY</label>
              <select
                value={form.category}
                onChange={e => handleChange('category', e.target.value)}
                style={{ ...inp, cursor: 'pointer' }}
                onFocus={focusOn} onBlur={focusOff}
              >
                <option value="">Select category</option>
                {/* Keep an older category visible even if it is not in the current list */}
                {form.category && !PRODUCT_CATEGORIES.includes(form.category) && (
                  <option value={form.category}>{form.category}</option>
                )}
                {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={lbl}>DESCRIPTION</label>
              <textarea
                value={form.description}
                onChange={e => handleChange('description', e.target.value)}
                rows={3}
                style={{ ...inp, resize: 'none', lineHeight: 1.6 }}
                onFocus={focusOn} onBlur={focusOff}
              />
            </div>

            <div>
              <label style={lbl}>SKU (OPTIONAL)</label>
              <input
                type="text" value={form.sku}
                onChange={e => handleChange('sku', e.target.value)}
                style={inp} onFocus={focusOn} onBlur={focusOff}
              />
            </div>
          </div>
        </div>

        {/* Ways to buy + pricing + deals */}
        <div style={card}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 4px', color: '#1D1D1D' }}>
            Ways to Buy, Pricing, Stock & Deals
          </p>
          <UnitsEditor
            units={units}
            onChange={u => { setUnits(u); setError('') }}
            inputStyle={inp}
            labelStyle={lbl}
            isMobile={isMobile}
          />
          <p style={{ fontSize: 11, color: '#9C9488', margin: '14px 0 0', lineHeight: 1.5 }}>
            Removing an option hides it from buyers. Past orders keep showing it.
          </p>
        </div>

        {/* Delivery coverage */}
        <div style={card}>
          <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 4px', color: '#1D1D1D' }}>
            Where can you deliver this?
          </p>
          <p style={{ fontSize: 12, color: '#7F766B', margin: '0 0 14px' }}>
            Choose every place you can deliver this product to.
          </p>
          <LocationMultiSelect
            value={form.availableHalls}
            onChange={areas => handleChange('availableHalls', areas)}
          />
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
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {saving && <Spinner size={14} color="white" />}
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
    </VendorLayout>
  )
}