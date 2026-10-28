import { useState } from 'react'
import VendorLayout from '../../components/vendor/VendorLayout'
import LocationPicker from '../../components/common/LocationPicker'
import LocationMultiSelect from '../../components/common/LocationMultiSelect'
import { Spinner } from '../../components/common/GlobalLoader'
import useAuthStore from '../../store/authStore'
import { useIsMobile } from '../../hooks/useWindowSize'
import api from '../../lib/axios'
import { toast } from '../../store/toastStore'

// Build the form from the signed-in vendor's real data
function initialState(user) {
  const v = user?.vendor || {}
  return {
    storeName: v.storeName || '',
    description: v.description || '',
    phone: user?.phone || '',
    deliveryFee: v.deliveryFee ?? 200,
    location: {
      name: v.hall || '',
      latitude: v.latitude ?? null,
      longitude: v.longitude ?? null,
    },
    deliveryAreas: Array.isArray(v.deliveryAreas) ? v.deliveryAreas : [],
  }
}

function Toggle({ value, onChange }) {
  return (
    <div
      onClick={onChange}
      role="switch"
      aria-checked={value}
      style={{
        width: 42, height: 24, borderRadius: 12,
        backgroundColor: value ? '#BE864B' : '#E4DDD3',
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%',
        backgroundColor: 'white',
        position: 'absolute', top: 3,
        left: value ? 21 : 3,
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </div>
  )
}

function Card({ title, subtitle, isMobile, children }) {
  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 12, padding: isMobile ? '18px 16px' : '22px 24px',
    }}>
      <h2 style={{ fontSize: isMobile ? 15 : 16, fontWeight: 800, margin: subtitle ? '0 0 4px' : '0 0 16px', color: '#1D1D1D' }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 12, color: '#7F766B', margin: '0 0 16px', lineHeight: 1.6 }}>{subtitle}</p>
      )}
      {children}
    </div>
  )
}

function FinalizeCard({ saving, onSave, onDiscard }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #BE864B 0%, #9A662F 100%)',
      borderRadius: 12, padding: '18px 16px',
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 800, color: 'white', margin: '0 0 4px' }}>
        Finalize Changes
      </h3>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', margin: '0 0 14px', lineHeight: 1.5 }}>
        Make sure your store details are up to date before saving.
      </p>
      <button
        onClick={onSave}
        disabled={saving}
        style={{
          width: '100%', padding: '12px',
          backgroundColor: 'white', color: '#1D1D1D',
          border: 'none', borderRadius: 8,
          fontWeight: 800, fontSize: 13,
          cursor: saving ? 'not-allowed' : 'pointer',
          fontFamily: 'Inter, sans-serif', marginBottom: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {saving && <Spinner size={14} color="#1D1D1D" />}
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
      <button
        onClick={onDiscard}
        disabled={saving}
        style={{
          width: '100%', padding: '8px',
          backgroundColor: 'transparent', color: 'rgba(255,255,255,0.85)',
          border: 'none', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        }}
      >
        Discard Edits
      </button>
    </div>
  )
}

export default function Settings() {
  const { user, login, updateProfile } = useAuthStore()
  const isMobile = useIsMobile()

  const [form, setForm] = useState(() => initialState(user))
  const [notifications, setNotifications] = useState({
    newOrderAlerts: true, dailyEarningsReport: false,
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
    fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
    color: '#39332E', marginBottom: 5, display: 'block',
  }

  const focusOn = e => { e.target.style.borderColor = '#BE864B' }
  const focusOff = e => { e.target.style.borderColor = '#E4DDD3' }

  function handleChange(k, v) { setForm(p => ({ ...p, [k]: v })) }
  function toggleNotif(key) { setNotifications(p => ({ ...p, [key]: !p[key] })) }

  function discard() {
    setForm(initialState(user))
    toast.info('Your edits were discarded.')
  }

  async function handleSave() {
    if (!form.storeName.trim()) return toast.error('Please enter your store name.')
    if (!form.location.name.trim()) return toast.error('Please choose your store location.')
    const fee = Number(form.deliveryFee)
    if (!Number.isFinite(fee) || fee < 0) return toast.error('Delivery fee must be a number, 0 or more.')

    setSaving(true)
    try {
      const res = await api.patch('/vendors/me', {
        storeName: form.storeName.trim(),
        description: form.description,
        hall: form.location.name.trim(),
        latitude: form.location.latitude,
        longitude: form.location.longitude,
        deliveryAreas: form.deliveryAreas,
        deliveryFee: fee,
      })

      if (form.phone && form.phone !== user?.phone) {
        await updateProfile({ phone: form.phone })
      }

      // Keep the signed-in user's copy of the store in step with the server
      login({ vendor: res.data.vendor })

      toast.success('Store settings saved.')
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.error || 'Could not save your settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <VendorLayout searchPlaceholder="Search orders or IDs...">

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, margin: '0 0 4px', color: '#1D1D1D', letterSpacing: '-0.3px' }}>
          Settings
        </h1>
        <p style={{ fontSize: 13, color: '#7F766B', margin: 0 }}>
          Manage your storefront, location and delivery preferences.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 240px',
        gap: 16, alignItems: 'start',
      }}>

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Store profile */}
          <Card title="Store Profile" isMobile={isMobile}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={lbl}>Store Name</label>
                <input
                  type="text" value={form.storeName}
                  onChange={e => handleChange('storeName', e.target.value)}
                  style={inp} onFocus={focusOn} onBlur={focusOff}
                />
              </div>
              <div>
                <label style={lbl}>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => handleChange('description', e.target.value)}
                  rows={3}
                  placeholder="Tell buyers what makes your store special"
                  style={{ ...inp, resize: 'none', lineHeight: 1.6 }}
                  onFocus={focusOn} onBlur={focusOff}
                />
              </div>
            </div>
          </Card>

          {/* Location + delivery */}
          <Card
            title="Location & Delivery"
            subtitle="Buyers see how far you are from them, so set your store's exact spot and the places you deliver to."
            isMobile={isMobile}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <LocationPicker
                value={form.location.name}
                onChange={loc => handleChange('location', {
                  name: loc.name,
                  latitude: loc.latitude ?? null,
                  longitude: loc.longitude ?? null,
                })}
                label="STORE LOCATION"
                placeholder="Choose where your store is..."
                inputStyle={inp}
                labelStyle={lbl}
              />

              <div>
                <label style={lbl}>DELIVERY AREAS</label>
                <LocationMultiSelect
                  value={form.deliveryAreas}
                  onChange={areas => handleChange('deliveryAreas', areas)}
                />
              </div>

              <div style={{ maxWidth: 220 }}>
                <label style={lbl}>DELIVERY FEE (₦)</label>
                <input
                  type="number" min="0" inputMode="numeric"
                  value={form.deliveryFee}
                  onChange={e => handleChange('deliveryFee', e.target.value)}
                  style={inp} onFocus={focusOn} onBlur={focusOff}
                />
                <p style={{ fontSize: 11, color: '#9C9488', margin: '5px 0 0' }}>
                  Added to each order from your store.
                </p>
              </div>
            </div>
          </Card>

          {/* Personal info */}
          <Card title="Personal Info" isMobile={isMobile}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
              <div>
                <label style={lbl}>Email Address</label>
                <input
                  type="email" value={user?.email || ''} disabled
                  style={{ ...inp, backgroundColor: '#F7F4EF', color: '#9C9488' }}
                />
                <p style={{ fontSize: 11, color: '#9C9488', margin: '5px 0 0' }}>
                  Your sign-in email can't be changed here.
                </p>
              </div>
              <div>
                <label style={lbl}>Phone Number</label>
                <input
                  type="tel" value={form.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  style={inp} onFocus={focusOn} onBlur={focusOff}
                />
              </div>
            </div>
          </Card>

          {/* Notification preferences */}
          <Card title="Notification Preferences" isMobile={isMobile}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { key: 'newOrderAlerts', label: 'New Order Alerts', desc: 'Get notified instantly when a student places an order.' },
                { key: 'dailyEarningsReport', label: 'Daily Earnings Report', desc: 'A summary of your daily performance sent every midnight.' },
              ].map(notif => (
                <div
                  key={notif.key}
                  style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '12px 14px',
                    backgroundColor: '#F7F4EF', borderRadius: 8, gap: 12,
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px', color: '#1D1D1D' }}>
                      {notif.label}
                    </p>
                    <p style={{ fontSize: 11, color: '#7F766B', margin: 0 }}>{notif.desc}</p>
                  </div>
                  <Toggle value={notifications[notif.key]} onChange={() => toggleNotif(notif.key)} />
                </div>
              ))}
            </div>
          </Card>

          {isMobile && (
            <FinalizeCard saving={saving} onSave={handleSave} onDiscard={discard} />
          )}
        </div>

        {/* Right — desktop only */}
        {!isMobile && (
          <div style={{ position: 'sticky', top: 68 }}>
            <FinalizeCard saving={saving} onSave={handleSave} onDiscard={discard} />
          </div>
        )}
      </div>
    </VendorLayout>
  )
}