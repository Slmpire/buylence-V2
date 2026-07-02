import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, ShieldCheck, LogOut } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import useAuthStore from '../../store/authStore'
import { useIsMobile } from '../../hooks/useWindowSize'
import api from '../../lib/axios'

const HALLS = ['Awo Hall', 'Moremi Hall', 'Fajuyi Hall', 'Mozambique Hall', 'Angola Hall', 'ETF Hall', 'Awolowo Hall']

export default function Profile() {
  const { user, login, logout } = useAuthStore()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    hall: user?.hall || '',
    room: user?.room || '',
    matric: user?.matric || '',
    bio: user?.bio || '',
  })

  const [avatar, setAvatar] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const inp = {
    width: '100%', padding: '11px 14px',
    border: '1px solid #E4DDD3', borderRadius: 8,
    fontSize: isMobile ? 15 : 13, outline: 'none',
    backgroundColor: 'white', transition: 'border-color 0.15s',
    boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', color: '#2B2B2B',
  }

  const lbl = {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
    color: '#39332E', marginBottom: 6, display: 'block',
  }

  function handleChange(k, v) {
    setForm(p => ({ ...p, [k]: v }))
  }

  async function handleSave() {
  setSaving(true)
  try {
    await api.patch('/auth/profile', {
      fullName: form.fullName,
      phone: form.phone,
      hall: form.hall,
      room: form.room,
      matric: form.matric,
      bio: form.bio,
    })

    // Update local auth store
    useAuthStore.getState().updateProfile({
      fullName: form.fullName,
      phone: form.phone,
      hall: form.hall,
      room: form.room,
      matric: form.matric,
      bio: form.bio,
    })

    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.error || 'Failed to save profile.')
  } finally {
    setSaving(false)
  }
}

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function Section({ title, subtitle, children }) {
    return (
      <div style={{
        backgroundColor: 'white',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 14,
        padding: isMobile ? '18px 16px' : '24px 26px',
        marginBottom: 14,
      }}>
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: isMobile ? 14 : 15, fontWeight: 800, margin: '0 0 4px', color: '#1D1D1D' }}>
            {title}
          </h2>
          {subtitle && <p style={{ fontSize: 12, color: '#9C9488', margin: 0 }}>{subtitle}</p>}
        </div>
        {children}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F4EF', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />

      <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '20px 16px 48px' : '36px 24px 64px' }}>

        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none',
            color: '#7F766B', cursor: 'pointer',
            fontSize: 12, fontWeight: 600,
            letterSpacing: '0.08em', marginBottom: 20, padding: 0,
          }}
        >
          <ArrowLeft size={14} /> BACK TO DASHBOARD
        </button>

        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 900, letterSpacing: '-0.4px', margin: '0 0 4px', color: '#1D1D1D' }}>
            My Profile
          </h1>
          <p style={{ fontSize: 13, color: '#9C9488', margin: 0 }}>
            Manage your personal information and campus details
          </p>
        </div>

        {/* Avatar */}
        <Section title="Profile Photo" subtitle="This appears on your orders and reviews">
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: isMobile ? 14 : 20,
          }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: isMobile ? 64 : 80, height: isMobile ? 64 : 80,
                borderRadius: '50%', backgroundColor: '#BE864B',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', border: '3px solid white',
                boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
              }}>
                {avatar ? (
                  <img src={URL.createObjectURL(avatar)} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ color: 'white', fontSize: isMobile ? 22 : 28, fontWeight: 900 }}>
                    {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <label htmlFor="avatar-upload" style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 24, height: 24, borderRadius: '50%',
                backgroundColor: '#1D1D1D', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', border: '2px solid white',
              }}>
                <Camera size={11} color="white" />
              </label>
              <input id="avatar-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setAvatar(e.target.files[0])} />
            </div>
            <div>
              <p style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, margin: '0 0 3px', color: '#1D1D1D' }}>
                {user?.fullName || 'Your Name'}
              </p>
              <p style={{ fontSize: 12, color: '#9C9488', margin: '0 0 8px' }}>{user?.email}</p>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 4,
                backgroundColor: '#F0FDF4', color: '#16A34A',
                border: '1px solid #BBF7D0', letterSpacing: '0.06em',
              }}>
                {user?.role === 'vendor' ? 'VENDOR ACCOUNT' : 'STUDENT ACCOUNT'}
              </span>
            </div>
          </div>
        </Section>

        {/* Personal info */}
        <Section title="Personal Information" subtitle="Your basic account details">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>FULL NAME</label>
              <input type="text" value={form.fullName} onChange={e => handleChange('fullName', e.target.value)}
                placeholder="Your full name" style={inp}
                onFocus={e => e.target.style.borderColor = '#BE864B'} onBlur={e => e.target.style.borderColor = '#E4DDD3'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
              <div>
                <label style={lbl}>EMAIL ADDRESS</label>
                <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)}
                  placeholder="your@email.com" style={inp}
                  onFocus={e => e.target.style.borderColor = '#BE864B'} onBlur={e => e.target.style.borderColor = '#E4DDD3'} />
              </div>
              <div>
                <label style={lbl}>PHONE NUMBER</label>
                <input type="tel" value={form.phone} onChange={e => handleChange('phone', e.target.value)}
                  placeholder="080xxxxxxxx" style={inp}
                  onFocus={e => e.target.style.borderColor = '#BE864B'} onBlur={e => e.target.style.borderColor = '#E4DDD3'} />
              </div>
            </div>

            <div>
              <label style={lbl}>BIO (OPTIONAL)</label>
              <textarea
                value={form.bio} onChange={e => handleChange('bio', e.target.value)}
                placeholder="Tell vendors a little about yourself..."
                rows={2} style={{ ...inp, resize: 'none', lineHeight: 1.6 }}
                onFocus={e => e.target.style.borderColor = '#BE864B'} onBlur={e => e.target.style.borderColor = '#E4DDD3'} />
            </div>
          </div>
        </Section>

        {/* Campus info */}
        <Section title="Campus Details" subtitle="Used for delivery routing and verification">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14 }}>
              <div>
                <label style={lbl}>HALL OF RESIDENCE</label>
                <select value={form.hall} onChange={e => handleChange('hall', e.target.value)}
                  style={{ ...inp, cursor: 'pointer' }}
                  onFocus={e => e.target.style.borderColor = '#BE864B'} onBlur={e => e.target.style.borderColor = '#E4DDD3'}>
                  <option value="">Select hall</option>
                  {HALLS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>ROOM NUMBER</label>
                <input type="text" value={form.room} onChange={e => handleChange('room', e.target.value)}
                  placeholder="e.g. Block A, Room 12" style={inp}
                  onFocus={e => e.target.style.borderColor = '#BE864B'} onBlur={e => e.target.style.borderColor = '#E4DDD3'} />
              </div>
            </div>

            <div>
              <label style={lbl}>MATRIC NUMBER (OPTIONAL)</label>
              <input type="text" value={form.matric} onChange={e => handleChange('matric', e.target.value)}
                placeholder="e.g. ENG/2021/001" style={inp}
                onFocus={e => e.target.style.borderColor = '#BE864B'} onBlur={e => e.target.style.borderColor = '#E4DDD3'} />
            </div>

            <div style={{
              display: 'flex', gap: 10, alignItems: 'center',
              padding: '12px 14px', backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0', borderRadius: 8,
            }}>
              <ShieldCheck size={16} color="#16A34A" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: '#166534', margin: 0, fontWeight: 500, lineHeight: 1.5 }}>
                Your campus identity is <strong>verified</strong>. Hall deliveries are enabled.
              </p>
            </div>
          </div>
        </Section>

        {/* Save + actions */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <button
            onClick={handleSave} disabled={saving}
            style={{
              padding: '13px',
              background: saving ? '#E4DDD3' : 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
              color: 'white', border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: isMobile ? 14 : 13,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
          </button>
          <button
            onClick={() => navigate('/user-settings')}
            style={{
              padding: '13px',
              backgroundColor: 'white', color: '#1D1D1D',
              border: '1.5px solid #E4DDD3', borderRadius: 10,
              fontWeight: 700, fontSize: isMobile ? 14 : 13,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}
          >
            Account Settings →
          </button>
        </div>

        {/* Account actions */}
        <div style={{
          backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 14, padding: isMobile ? '18px 16px' : '20px 26px',
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 4px', color: '#1D1D1D' }}>
            Account Actions
          </h2>
          <p style={{ fontSize: 12, color: '#9C9488', margin: '0 0 16px' }}>
            Manage your session and account status
          </p>
          <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '11px 18px',
                backgroundColor: '#FEF2F2', color: '#DC2626',
                border: '1px solid #FECACA', borderRadius: 8,
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <LogOut size={13} /> Sign Out
            </button>

            {user?.role !== 'vendor' && (
              <button
                onClick={() => navigate('/vendor-onboarding')}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '11px 18px',
                  backgroundColor: '#FFF8F2', color: '#BE864B',
                  border: '1px solid #F0D9C0', borderRadius: 8,
                  fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                🏪 Become a Vendor
              </button>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}