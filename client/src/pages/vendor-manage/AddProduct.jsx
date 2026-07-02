import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, ArrowLeft, X } from 'lucide-react'
import VendorLayout from '../../components/vendor/VendorLayout'
import { useIsMobile } from '../../hooks/useWindowSize'
import api from '../../lib/axios'

const CATEGORIES = ['Grains', 'Snacks', 'Beverages', 'Essentials', 'Proteins', 'Tubers', 'Vegetables', 'Oils & Spices']
const UNITS = ['Per kg', 'Per piece', 'Per pack', 'Per litre', 'Per bundle', 'Per crate']
const HALLS = ['Awo Hall', 'Moremi Hall', 'Fajuyi Hall', 'Mozambique Hall', 'Angola Hall', 'ETF Hall']

export default function AddProduct() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [images, setImages] = useState([])
  const [form, setForm] = useState({
    name: '', category: '', price: '',
    comparePrice: '', stock: '', unit: '',
    description: '', sku: '',
    availableHalls: [], flashDeal: false,
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

  function handleChange(k, v) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function toggleHall(hall) {
    const next = form.availableHalls.includes(hall)
      ? form.availableHalls.filter(h => h !== hall)
      : [...form.availableHalls, hall]
    handleChange('availableHalls', next)
  }

  function handleImageUpload(e) {
    const files = Array.from(e.target.files)
    setImages(prev => [...prev, ...files].slice(0, 4))
  }

 async function handleSave() {
  if (!form.name) return alert('Please enter a product name.')
  if (!form.category) return alert('Please select a category.')
  if (!form.price) return alert('Please enter a price.')

  setSaving(true)
  try {
    await api.post('/products', {
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
      images: [],
    })
    navigate('/vendor/products')
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.error || 'Failed to save product.')
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
                  placeholder="e.g. Brown Rice (1kg)"
                  style={inp}
                  onFocus={e => e.target.style.borderColor = '#BE864B'}
                  onBlur={e => e.target.style.borderColor = '#E4DDD3'}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={lbl}>CATEGORY</label>
                  <select
                    value={form.category}
                    onChange={e => handleChange('category', e.target.value)}
                    style={{ ...inp, cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = '#BE864B'}
                    onBlur={e => e.target.style.borderColor = '#E4DDD3'}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>UNIT</label>
                  <select
                    value={form.unit}
                    onChange={e => handleChange('unit', e.target.value)}
                    style={{ ...inp, cursor: 'pointer' }}
                    onFocus={e => e.target.style.borderColor = '#BE864B'}
                    onBlur={e => e.target.style.borderColor = '#E4DDD3'}
                  >
                    <option value="">Select unit</option>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={lbl}>DESCRIPTION</label>
                <textarea
                  value={form.description}
                  onChange={e => handleChange('description', e.target.value)}
                  placeholder="Describe your product — freshness, origin, weight, usage..."
                  rows={3}
                  style={{ ...inp, resize: 'none', lineHeight: 1.6 }}
                  onFocus={e => e.target.style.borderColor = '#BE864B'}
                  onBlur={e => e.target.style.borderColor = '#E4DDD3'}
                />
              </div>

              <div>
                <label style={lbl}>SKU (OPTIONAL)</label>
                <input
                  type="text" value={form.sku}
                  onChange={e => handleChange('sku', e.target.value)}
                  placeholder="e.g. BL-GR-001"
                  style={inp}
                  onFocus={e => e.target.style.borderColor = '#BE864B'}
                  onBlur={e => e.target.style.borderColor = '#E4DDD3'}
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 12, padding: isMobile ? '16px' : '20px 22px',
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 14px', color: '#1D1D1D' }}>
              Pricing & Stock
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr',
              gap: 14,
            }}>
              <div>
                <label style={lbl}>PRICE (₦)</label>
                <input
                  type="number" value={form.price}
                  onChange={e => handleChange('price', e.target.value)}
                  placeholder="0.00"
                  style={inp}
                  onFocus={e => e.target.style.borderColor = '#BE864B'}
                  onBlur={e => e.target.style.borderColor = '#E4DDD3'}
                />
              </div>
              <div>
                <label style={lbl}>{isMobile ? 'COMPARE (₦)' : 'COMPARE PRICE (₦)'}</label>
                <input
                  type="number" value={form.comparePrice}
                  onChange={e => handleChange('comparePrice', e.target.value)}
                  placeholder="Original"
                  style={inp}
                  onFocus={e => e.target.style.borderColor = '#BE864B'}
                  onBlur={e => e.target.style.borderColor = '#E4DDD3'}
                />
              </div>
              <div style={{ gridColumn: isMobile ? 'span 2' : 'auto' }}>
                <label style={lbl}>STOCK QTY</label>
                <input
                  type="number" value={form.stock}
                  onChange={e => handleChange('stock', e.target.value)}
                  placeholder="0"
                  style={inp}
                  onFocus={e => e.target.style.borderColor = '#BE864B'}
                  onBlur={e => e.target.style.borderColor = '#E4DDD3'}
                />
              </div>
            </div>

            {/* Flash deal toggle */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginTop: 16,
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

          {/* Hall availability */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 12, padding: isMobile ? '16px' : '20px 22px',
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 4px', color: '#1D1D1D' }}>
              Hall Availability
            </p>
            <p style={{ fontSize: 12, color: '#7F766B', margin: '0 0 14px' }}>
              Select which halls you can deliver this product to
            </p>
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
                      backgroundColor: selected ? '#FFF8F2' : 'white',
                      color: selected ? '#BE864B' : '#7F766B',
                      fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {hall}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mobile: save card moves here, after all fields */}
          {isMobile && (
            <SaveCard
              form={form} saving={saving}
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
            <p style={{ fontSize: 11, color: '#7F766B', margin: '0 0 14px' }}>
              Upload up to 4 images. First image is the cover.
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
                  Tap to upload
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
              Products with at least 2 images get <strong style={{ color: '#1D1D1D' }}>3x more clicks</strong> than those without.
            </p>
          </div>

          {/* Desktop: save card here */}
          {!isMobile && (
            <SaveCard
              form={form} saving={saving}
              onSave={handleSave} onCancel={() => navigate('/vendor/products')}
            />
          )}
        </div>
      </div>
    </VendorLayout>
  )
}

function SaveCard({ form, saving, onSave, onCancel }) {
  const disabled = saving || !form.name || !form.category || !form.price
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
        }}
      >
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