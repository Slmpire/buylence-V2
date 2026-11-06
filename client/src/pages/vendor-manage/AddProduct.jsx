import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, ArrowLeft, X } from 'lucide-react'
import VendorLayout from '../../components/vendor/VendorLayout'
import UnitsEditor, { emptyUnit } from '../../components/vendor/UnitsEditor'
import LocationMultiSelect from '../../components/common/LocationMultiSelect'
import { Spinner } from '../../components/common/GlobalLoader'
import { PRODUCT_CATEGORIES } from '../../constants/productOptions'
import useAuthStore from '../../store/authStore'
import { useIsMobile } from '../../hooks/useWindowSize'
import api from '../../lib/axios'
import { toast } from '../../store/toastStore'

export default function AddProduct() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const user = useAuthStore(s => s.user)

  const [images, setImages] = useState([])
  const [units, setUnits] = useState([emptyUnit()])
  const [form, setForm] = useState({
    name: '', category: '', description: '', sku: '',
    // Start with everywhere this store delivers; the seller can narrow it down
    availableHalls: Array.isArray(user?.vendor?.deliveryAreas) ? user.vendor.deliveryAreas : [],
    flashDeal: false,
  })
  const [saving, setSaving] = useState(false)

  const inp = {
    width: '100%', padding: '10px 14px',
    border: '1px solid #E4DDD3', borderRadius: 8,
    fontSize: isMobile ? 15 : 13, outline: 'none',
    backgroundColor: 'white',
    transition: 'border-color 0.15s',
    boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif',
    color: '#2B2B2B',
  }

  const lbl = {
    fontSize: 11, fontWeight: 700,
    letterSpacing: '0.07em', color: '#39332E',
    marginBottom: 6, display: 'block',
  }

  const focusOn = e => { e.target.style.borderColor = '#BE864B' }
  const focusOff = e => { e.target.style.borderColor = '#E4DDD3' }

  function handleChange(k, v) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function handleImageUpload(e) {
    const files = Array.from(e.target.files)
    setImages(prev => [...prev, ...files].slice(0, 4))
  }

  const ready =
    form.name.trim() && form.category && units[0]?.label.trim() && String(units[0]?.price).trim()

  async function handleSave() {
    if (!form.name.trim()) return toast.error('Please enter a product name.')
    if (!form.category) return toast.error('Please select a category.')

    const filled = units.filter(u => u.label.trim() || String(u.price).trim() || String(u.stock).trim())
    if (filled.length === 0) return toast.error('Add at least one way to buy, with a name and price.')
    if (filled.some(u => !u.label.trim())) return toast.error('Every option needs a name, like Pack or Carton.')
    if (filled.some(u => !String(u.price).trim())) return toast.error('Every option needs a price.')

    setSaving(true)
    try {
      await api.post('/products', {
        name: form.name.trim(),
        category: form.category,
        description: form.description || '',
        sku: form.sku || null,
        availableHalls: form.availableHalls,
        flashDeal: form.flashDeal,
        images: [],
        units: filled.map(u => ({
          label: u.label.trim(),
          price: Number(u.price),
          comparePrice: u.comparePrice ? Number(u.comparePrice) : null,
          stock: Number(u.stock) || 0,
        })),
      })
      toast.success('Product published. Students can order it now.')
      navigate('/vendor/products')
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Failed to save product.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <VendorLayout searchPlaceholder="Search inventory...">

      {/* Header */}
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
        <div>
          <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, margin: 0, color: '#1D1D1D', letterSpacing: '-0.3px' }}>
            Add New Product
          </h1>
          {!isMobile && (
            <p style={{ fontSize: 12, color: '#7F766B', margin: 0 }}>
              List a new product on your campus store
            </p>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 280px',
        gap: 16,
      }}>

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Basic info */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 12, padding: isMobile ? '16px' : '20px 22px',
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 14px', color: '#1D1D1D' }}>
              Product Information
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <div>
                <label style={lbl}>PRODUCT NAME</label>
                <input
                  type="text" value={form.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder="e.g. Indomie Instant Noodles"
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
                  {PRODUCT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label style={lbl}>DESCRIPTION</label>
                <textarea
                  value={form.description}
                  onChange={e => handleChange('description', e.target.value)}
                  placeholder="Describe your product: freshness, brand, size, usage..."
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
                  placeholder="e.g. BL-GR-001"
                  style={inp} onFocus={focusOn} onBlur={focusOff}
                />
              </div>
            </div>
          </div>

          {/* Ways to buy + pricing */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 12, padding: isMobile ? '16px' : '20px 22px',
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 4px', color: '#1D1D1D' }}>
              Ways to Buy, Pricing & Stock
            </p>
            <UnitsEditor
              units={units}
              onChange={setUnits}
              inputStyle={inp}
              labelStyle={lbl}
              isMobile={isMobile}
            />

            {/* Flash deal toggle */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginTop: 18,
              padding: '12px 14px',
              backgroundColor: '#F7F4EF', borderRadius: 8,
              gap: 12,
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px', color: '#1D1D1D' }}>
                  Flash Deal
                </p>
                <p style={{ fontSize: 11, color: '#7F766B', margin: 0 }}>
                  Mark as a limited time offer
                </p>
              </div>
              <div
                onClick={() => handleChange('flashDeal', !form.flashDeal)}
                role="switch"
                aria-checked={form.flashDeal}
                style={{
                  width: 42, height: 24, borderRadius: 12,
                  backgroundColor: form.flashDeal ? '#BE864B' : '#E4DDD3',
                  position: 'relative', cursor: 'pointer',
                  transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  backgroundColor: 'white',
                  position: 'absolute', top: 3,
                  left: form.flashDeal ? 21 : 3,
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                }} />
              </div>
            </div>
          </div>

          {/* Delivery coverage */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 12, padding: isMobile ? '16px' : '20px 22px',
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 4px', color: '#1D1D1D' }}>
              Where can you deliver this?
            </p>
            <p style={{ fontSize: 12, color: '#7F766B', margin: '0 0 14px' }}>
              Starts with all your store's delivery areas. Remove any you can't deliver this product to.
            </p>
            <LocationMultiSelect
              value={form.availableHalls}
              onChange={areas => handleChange('availableHalls', areas)}
            />
          </div>

          {/* Mobile: save card moves here, after all fields */}
          {isMobile && (
            <SaveCard
              ready={ready} saving={saving}
              onSave={handleSave} onCancel={() => navigate('/vendor/products')}
            />
          )}
        </div>

        {/* Right — desktop only sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Image upload */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 12, padding: isMobile ? '16px' : '20px',
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 4px', color: '#1D1D1D' }}>
              Product Images
            </p>
            <p style={{ fontSize: 11, color: '#B45309', margin: '0 0 14px', lineHeight: 1.5 }}>
              Photo upload isn't connected yet, so new products show a placeholder image for now.
            </p>

            <label htmlFor="img-upload" style={{ cursor: 'pointer' }}>
              <div style={{
                border: '2px dashed #E4DDD3',
                borderRadius: 10, padding: '24px 16px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 8,
                backgroundColor: '#F7F4EF',
              }}>
                <Upload size={22} color="#9C9488" />
                <p style={{ fontSize: 12, color: '#7F766B', margin: 0, textAlign: 'center' }}>
                  Tap to preview photos
                </p>
                <p style={{ fontSize: 10, color: '#9C9488', margin: 0 }}>
                  PNG, JPG up to 5MB each
                </p>
              </div>
            </label>
            <input
              id="img-upload" type="file"
              accept="image/*" multiple
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />

            {images.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : '1fr 1fr', gap: 8, marginTop: 12 }}>
                {images.map((img, i) => (
                  <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
                    <img
                      src={URL.createObjectURL(img)}
                      alt={`upload ${i}`}
                      style={{ width: '100%', height: isMobile ? 60 : 80, objectFit: 'cover', display: 'block' }}
                    />
                    {i === 0 && (
                      <span style={{
                        position: 'absolute', top: 4, left: 4,
                        backgroundColor: '#BE864B', color: 'white',
                        fontSize: 8, fontWeight: 800, padding: '2px 6px',
                        borderRadius: 3, letterSpacing: '0.06em',
                      }}>
                        COVER
                      </span>
                    )}
                    <button
                      onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                      aria-label="Remove photo"
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 18, height: 18, borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        border: 'none', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tip */}
          <div style={{
            backgroundColor: '#FFF8F2',
            border: '1px solid #F0D9C0',
            borderRadius: 10, padding: '14px',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#BE864B', margin: '0 0 4px' }}>
              💡 Listing Tip
            </p>
            <p style={{ fontSize: 11, color: '#7F766B', margin: 0, lineHeight: 1.6 }}>
              Sell the way your customers buy. If students usually grab single sachets <strong style={{ color: '#1D1D1D' }}>and</strong> whole cartons, add both as separate options.
            </p>
          </div>

          {/* Desktop: save card here */}
          {!isMobile && (
            <SaveCard
              ready={ready} saving={saving}
              onSave={handleSave} onCancel={() => navigate('/vendor/products')}
            />
          )}
        </div>
      </div>
    </VendorLayout>
  )
}

function SaveCard({ ready, saving, onSave, onCancel }) {
  const disabled = saving || !ready
  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 12, padding: '20px',
    }}>
      <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 4px', color: '#1D1D1D' }}>
        Publish Product
      </p>
      <p style={{ fontSize: 11, color: '#7F766B', margin: '0 0 14px', lineHeight: 1.5 }}>
        Once published, students can immediately find and order this product.
      </p>
      <button
        onClick={onSave}
        disabled={disabled}
        style={{
          width: '100%', padding: '12px',
          background: disabled ? '#E4DDD3' : 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
          color: 'white', border: 'none', borderRadius: 8,
          fontWeight: 700, fontSize: 13,
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'Inter, sans-serif',
          marginBottom: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {saving && <Spinner size={14} color="white" />}
        {saving ? 'Publishing...' : 'Publish Product'}
      </button>
      <button
        onClick={onCancel}
        style={{
          width: '100%', padding: '10px',
          backgroundColor: 'transparent', color: '#7F766B',
          border: 'none', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        }}
      >
        Cancel
      </button>
    </div>
  )
}