import { useState } from 'react'
import VendorLayout from '../../components/vendor/VendorLayout'
import useAuthStore from '../../store/authStore'
import { useIsMobile } from '../../hooks/useWindowSize'
import api from '../../lib/axios'


const ALL_HALLS = ['Awo Hall', 'Moremi Residence', 'ETF Hall', 'Akintola Hall', 'Off-Campus']

export default function Settings() {
  const { user, login } = useAuthStore()
  const isMobile = useIsMobile()

  const [form, setForm] = useState({
    storeName: user?.storeName || 'Mama Bisi Store',
    description: 'Artisanal campus-made provisions for the modern scholar. Sourcing only the finest local ingredients for your late-night study sessions.',
    email: user?.email || 'workrate@gmail.com',
    phone: user?.phone || '+234-5678-674-6544',
  })

  const [halls, setHalls] = useState({
    'Awo Hall': true, 'Moremi Residence': true,
    'ETF Hall': false, 'Akintola Hall': true, 'Off-Campus': false,
  })

  const [notifications, setNotifications] = useState({
    newOrderAlerts: true, dailyEarningsReport: false,
  })

  const [saved, setSaved] = useState(false)
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

  function handleChange(k, v) { setForm(p => ({ ...p, [k]: v })) }
  function toggleHall(hall) { setHalls(p => ({ ...p, [hall]: !p[hall] })) }
  function toggleNotif(key) { setNotifications(p => ({ ...p, [key]: !p[key] })) }

  async function handleSave() {
  setSaving(true)
  try {
    // Update user profile
    await api.patch('/auth/profile', {
      fullName: user?.fullName,
      phone: form.phone,
    })

    // Update vendor store details
    await api.patch('/vendors/me', {
      storeName: form.storeName,
      description: form.description,
      deliveryHalls: Object.entries(halls)
        .filter(([, enabled]) => enabled)
        .map(([hall]) => hall),
    })

    // Update local auth store
    useAuthStore.getState().updateProfile({
      phone: form.phone,
      storeName: form.storeName,
    })

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.error || 'Failed to save settings.')
  } finally {
    setSaving(false)
  }
}

  function Toggle({ value, onChange }) {
    return (
      <div
        onClick={onChange}
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

  return (
    <VendorLayout searchPlaceholder="Search orders, halls, or IDs...">

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, margin: '0 0 4px', color: '#1D1D1D', letterSpacing: '-0.3px' }}>
          Settings
        </h1>
        <p style={{ fontSize: 13, color: '#7F766B', margin: 0 }}>
          Manage your campus storefront and delivery preferences.
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
          <div style={{
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 12, padding: isMobile ? '18px 16px' : '22px 24px',
          }}>
            <h2 style={{ fontSize: isMobile ? 15 : 16, fontWeight: 800, margin: '0 0 16px', color: '#1D1D1D' }}>
              Store Profile
            </h2>

            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'flex-start' : 'flex-start',
              gap: 16, marginBottom: 18,
            }}>
              {/* Logo */}
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 10,
                  backgroundColor: '#1D1D1D',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', overflow: 'hidden',
                  border: '2px solid rgba(0,0,0,0.06)', flexShrink: 0,
                }}>
                  <span style={{ fontSize: 26 }}>🌿</span>
                </div>
                <div>
                  <label htmlFor="logo-upload" style={{
                    fontSize: 11, color: '#BE864B', fontWeight: 700,
                    cursor: 'pointer', letterSpacing: '0.04em',
                    display: 'block',
                  }}>
                    Change Logo
                  </label>
                  <p style={{ fontSize: 10, color: '#9C9488', margin: '2px 0 0' }}>
                    PNG/JPG, square
                  </p>
                </div>
                <input id="logo-upload" type="file" accept="image/*" style={{ display: 'none' }} />
              </div>

              {/* Store name + description */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                <div>
                  <label style={lbl}>Store Name</label>
                  <input
                    type="text" value={form.storeName}
                    onChange={e => handleChange('storeName', e.target.value)}
                    style={inp}
                    onFocus={e => e.target.style.borderColor = '#BE864B'}
                    onBlur={e => e.target.style.borderColor = '#E4DDD3'}
                  />
                </div>
                <div>
                  <label style={lbl}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => handleChange('description', e.target.value)}
                    rows={3}
                    style={{ ...inp, resize: 'none', lineHeight: 1.6 }}
                    onFocus={e => e.target.style.borderColor = '#BE864B'}
                    onBlur={e => e.target.style.borderColor = '#E4DDD3'}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Personal info */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 12, padding: isMobile ? '18px 16px' : '22px 24px',
          }}>
            <h2 style={{ fontSize: isMobile ? 15 : 16, fontWeight: 800, margin: '0 0 16px', color: '#1D1D1D' }}>
              Personal Info
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
              <div>
                <label style={lbl}>Email Address</label>
                <input
                  type="email" value={form.email}
                  onChange={e => handleChange('email', e.target.value)}
                  style={inp}
                  onFocus={e => e.target.style.borderColor = '#BE864B'}
                  onBlur={e => e.target.style.borderColor = '#E4DDD3'}
                />
              </div>
              <div>
                <label style={lbl}>Phone Number</label>
                <input
                  type="tel" value={form.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  style={inp}
                  onFocus={e => e.target.style.borderColor = '#BE864B'}
                  onBlur={e => e.target.style.borderColor = '#E4DDD3'}
                />
              </div>
            </div>
          </div>

          {/* Notification preferences */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 12, padding: isMobile ? '18px 16px' : '22px 24px',
          }}>
            <h2 style={{ fontSize: isMobile ? 15 : 16, fontWeight: 800, margin: '0 0 16px', color: '#1D1D1D' }}>
              Notification Preferences
            </h2>
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
                    backgroundColor: '#F7F4EF', borderRadius: 8,
                    gap: 12,
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px', color: '#1D1D1D' }}>
                      {notif.label}
                    </p>
                    <p style={{ fontSize: 11, color: '#7F766B', margin: 0 }}>
                      {notif.desc}
                    </p>
                  </div>
                  <Toggle value={notifications[notif.key]} onChange={() => toggleNotif(notif.key)} />
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: hall settings + finalize move here */}
          {isMobile && (
            <>
              <HallSettings halls={halls} toggleHall={toggleHall} isMobile={isMobile} />
              <FinalizeCard saving={saving} saved={saved} onSave={handleSave} />
            </>
          )}
        </div>

        {/* Right — desktop only */}
        {!isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <HallSettings halls={halls} toggleHall={toggleHall} isMobile={isMobile} />
            <FinalizeCard saving={saving} saved={saved} onSave={handleSave} />
          </div>
        )}
      </div>
    </VendorLayout>
  )
}

function HallSettings({ halls, toggleHall, isMobile }) {
  const ALL_HALLS = ['Awo Hall', 'Moremi Residence', 'ETF Hall', 'Akintola Hall', 'Off-Campus']
  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 12, padding: isMobile ? '18px 16px' : '18px 16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: '#1D1D1D', maxWidth: isMobile ? '100%' : 140, lineHeight: 1.3 }}>
          Delivery Hall Settings
        </h3>
        <span style={{ fontSize: 20 }}>🚚</span>
      </div>
      <p style={{ fontSize: 11, color: '#7F766B', margin: '0 0 14px', lineHeight: 1.6 }}>
        Toggle the university residence halls where you currently offer delivery services.
      </p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr',
        gap: 8,
      }}>
        {ALL_HALLS.map(hall => (
          <div
            key={hall}
            style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', padding: '8px 12px',
              border: '1px solid #E4DDD3', borderRadius: 7,
              backgroundColor: halls[hall] ? '#FFF8F2' : 'white',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 500, color: '#1D1D1D' }}>
              {hall}
            </span>
            <input
              type="checkbox"
              checked={halls[hall] || false}
              onChange={() => toggleHall(hall)}
              style={{ accentColor: '#BE864B', width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }}
            />
          </div>
        ))}
      </div>
      <p style={{ fontSize: 10, color: '#BE864B', margin: '10px 0 0', fontWeight: 600 }}>
        ⓘ More halls will be unlocked as you grow.
      </p>
    </div>
  )
}

function FinalizeCard({ saving, saved, onSave }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #BE864B 0%, #9A662F 100%)',
      borderRadius: 12, padding: '18px 16px',
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 800, color: 'white', margin: '0 0 4px' }}>
        Finalize Changes
      </h3>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', margin: '0 0 14px', lineHeight: 1.5 }}>
        Ensure all your shop details are up to date before saving.
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
          fontFamily: 'Inter, sans-serif',
          marginBottom: 8,
        }}
      >
        {saving ? 'Saving...' : saved ? '✓ Changes Saved!' : 'Save Changes'}
      </button>
      <button
        style={{
          width: '100%', padding: '8px',
          backgroundColor: 'transparent', color: 'rgba(255,255,255,0.8)',
          border: 'none', fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        }}
      >
        Discard Edits
      </button>
    </div>
  )
}