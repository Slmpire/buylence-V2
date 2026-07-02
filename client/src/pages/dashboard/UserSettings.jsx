import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, Trash2, ChevronRight } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import useAuthStore from '../../store/authStore'
import { useIsMobile } from '../../hooks/useWindowSize'
import { auth } from '../../lib/firebase'
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth'

function Toggle({ value, onChange }) {
  return (
    <div onClick={onChange} style={{
      width: 42, height: 24, borderRadius: 12,
      backgroundColor: value ? '#BE864B' : '#E4DDD3',
      position: 'relative', cursor: 'pointer',
      transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', backgroundColor: 'white',
        position: 'absolute', top: 3, left: value ? 21 : 3,
        transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
      }} />
    </div>
  )
}

export default function UserSettings() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)
  const [pwError, setPwError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [notifications, setNotifications] = useState({
    orderUpdates: true, flashDeals: true, vendorMessages: false,
    weeklyDigest: true, marketingEmails: false,
  })
  const [privacy, setPrivacy] = useState({
    showOrderHistory: false, allowVendorContact: true,
  })

  const inp = {
    width: '100%', padding: '11px 14px',
    border: '1px solid #E4DDD3', borderRadius: 8,
    fontSize: isMobile ? 15 : 13, outline: 'none',
    backgroundColor: 'white', transition: 'border-color 0.15s',
    boxSizing: 'border-box', fontFamily: 'Inter, sans-serif', color: '#2B2B2B',
  }

  function toggleNotif(key) { setNotifications(p => ({ ...p, [key]: !p[key] })) }
  function togglePrivacy(key) { setPrivacy(p => ({ ...p, [key]: !p[key] })) }

  async function handlePasswordSave() {
    if (!passwords.current) return setPwError('Enter your current password.')
    if (passwords.newPass.length < 6) return setPwError('New password must be at least 6 characters.')
    if (passwords.newPass !== passwords.confirm) return setPwError('Passwords do not match.')

    setPwError('')
    setPwSaving(true)
    try {
      const firebaseUser = auth.currentUser
      if (!firebaseUser) throw new Error('Not signed in.')

      // Re-authenticate first
      const credential = EmailAuthProvider.credential(firebaseUser.email, passwords.current)
      await reauthenticateWithCredential(firebaseUser, credential)

      // Update password
      await updatePassword(firebaseUser, passwords.newPass)

      setPasswords({ current: '', newPass: '', confirm: '' })
      setPwSaved(true)
      setTimeout(() => setPwSaved(false), 3000)
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPwError('Current password is incorrect.')
      } else if (err.code === 'auth/too-many-requests') {
        setPwError('Too many attempts. Try again later.')
      } else if (err.code === 'auth/requires-recent-login') {
        setPwError('Please sign out and sign back in before changing your password.')
      } else {
        setPwError(err.message || 'Failed to update password.')
      }
    } finally {
      setPwSaving(false)
    }
  }

  function Section({ title, subtitle, children }) {
    return (
      <div style={{
        backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 14, padding: isMobile ? '18px 16px' : '24px 26px',
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

        <button
          onClick={() => navigate('/profile')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: '#7F766B',
            cursor: 'pointer', fontSize: 12, fontWeight: 600,
            letterSpacing: '0.08em', marginBottom: 20, padding: 0,
          }}
        >
          <ArrowLeft size={14} /> BACK TO PROFILE
        </button>

        <div style={{ marginBottom: 20 }}>
          <h1 style={{
            fontSize: isMobile ? 22 : 26, fontWeight: 900,
            letterSpacing: '-0.4px', margin: '0 0 4px', color: '#1D1D1D',
          }}>
            Account Settings
          </h1>
          <p style={{ fontSize: 13, color: '#9C9488', margin: 0 }}>
            Security, notifications and privacy preferences
          </p>
        </div>

        {/* Password */}
        <Section title="Change Password" subtitle="Keep your account secure with a strong password">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'current', label: 'CURRENT PASSWORD', show: showCurrent, setShow: setShowCurrent, placeholder: 'Your current password' },
              { key: 'newPass', label: 'NEW PASSWORD', show: showNew, setShow: setShowNew, placeholder: 'At least 6 characters' },
              { key: 'confirm', label: 'CONFIRM NEW PASSWORD', show: showConfirm, setShow: setShowConfirm, placeholder: 'Repeat new password' },
            ].map(field => (
              <div key={field.key}>
                <label style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
                  color: '#39332E', marginBottom: 6, display: 'block',
                }}>
                  {field.label}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={field.show ? 'text' : 'password'}
                    value={passwords[field.key]}
                    onChange={e => setPasswords(p => ({ ...p, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{ ...inp, paddingRight: 44 }}
                    onFocus={e => e.target.style.borderColor = '#BE864B'}
                    onBlur={e => e.target.style.borderColor = '#E4DDD3'}
                  />
                  <button
                    type="button" onClick={() => field.setShow(s => !s)}
                    style={{
                      position: 'absolute', right: 12, top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none',
                      cursor: 'pointer', color: '#9C9488', display: 'flex', padding: 0,
                    }}
                  >
                    {field.show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            ))}

            {pwError && (
              <p style={{
                fontSize: 12, color: '#DC2626',
                backgroundColor: '#FEF2F2', padding: '9px 12px',
                borderRadius: 6, fontWeight: 500, margin: 0,
              }}>
                {pwError}
              </p>
            )}

            {pwSaved && (
              <p style={{
                fontSize: 12, color: '#16A34A',
                backgroundColor: '#F0FDF4', padding: '9px 12px',
                borderRadius: 6, fontWeight: 600, margin: 0,
              }}>
                ✓ Password updated successfully.
              </p>
            )}

            <button
              onClick={handlePasswordSave} disabled={pwSaving}
              style={{
                padding: '12px',
                background: pwSaving ? '#E4DDD3' : 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
                color: 'white', border: 'none', borderRadius: 8,
                fontWeight: 700, fontSize: isMobile ? 14 : 13,
                cursor: pwSaving ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                width: isMobile ? '100%' : 'fit-content',
                minWidth: isMobile ? 'auto' : 160,
              }}
            >
              {pwSaving ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notification Preferences" subtitle="Choose what you want to be notified about">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { key: 'orderUpdates', label: 'Order Updates', desc: 'Status changes, deliveries, escrow releases' },
              { key: 'flashDeals', label: 'Flash Deals', desc: 'Saturday morning deals from vendors' },
              { key: 'vendorMessages', label: 'Vendor Messages', desc: 'Direct messages about your orders' },
              { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Summary of orders & savings every Sunday' },
              { key: 'marketingEmails', label: 'Marketing Emails', desc: 'Promotions & platform updates' },
            ].map(item => (
              <div key={item.key} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px', backgroundColor: '#F7F4EF', borderRadius: 8,
              }}>
                <div style={{ flex: 1, marginRight: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px', color: '#1D1D1D' }}>{item.label}</p>
                  <p style={{ fontSize: 11, color: '#7F766B', margin: 0 }}>{item.desc}</p>
                </div>
                <Toggle value={notifications[item.key]} onChange={() => toggleNotif(item.key)} />
              </div>
            ))}
          </div>
        </Section>

        {/* Privacy */}
        <Section title="Privacy" subtitle="Control how your information is shared">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { key: 'showOrderHistory', label: 'Show Order History to Vendors', desc: 'Vendors can suggest relevant products' },
              { key: 'allowVendorContact', label: 'Allow Vendor Contact', desc: 'Vendors can message you via WhatsApp' },
            ].map(item => (
              <div key={item.key} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px', backgroundColor: '#F7F4EF', borderRadius: 8,
              }}>
                <div style={{ flex: 1, marginRight: 14 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px', color: '#1D1D1D' }}>{item.label}</p>
                  <p style={{ fontSize: 11, color: '#7F766B', margin: 0 }}>{item.desc}</p>
                </div>
                <Toggle value={privacy[item.key]} onChange={() => togglePrivacy(item.key)} />
              </div>
            ))}
          </div>
        </Section>

        {/* Quick links */}
        <Section title="More Options">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              { label: 'My Orders', sub: 'View your full order history', to: '/orders', icon: '📦' },
              { label: 'Become a Vendor', sub: 'Start selling on Buylence', to: '/vendor-onboarding', icon: '🏪', hide: user?.role === 'VENDOR' },
              { label: 'Vendor Dashboard', sub: 'Go to your vendor dashboard', to: '/vendor/dashboard', icon: '📊', hide: user?.role !== 'VENDOR' },
              { label: 'Terms & Privacy', sub: 'Read our terms of service', to: '/', icon: '📄' },
              { label: 'Contact Support', sub: 'Get help from our team', to: '/', icon: '💬' },
            ].filter(i => !i.hide).map((item, idx, arr) => (
              <div
                key={item.label}
                onClick={() => navigate(item.to)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 0',
                  borderBottom: idx < arr.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 18 }}>{item.icon}</span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px', color: '#1D1D1D' }}>{item.label}</p>
                    <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>{item.sub}</p>
                  </div>
                </div>
                <ChevronRight size={15} color="#9C9488" />
              </div>
            ))}
          </div>
        </Section>

        {/* Danger zone */}
        <div style={{
          backgroundColor: 'white', border: '1px solid #FECACA',
          borderRadius: 14, padding: isMobile ? '18px 16px' : '20px 26px',
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 4px', color: '#DC2626' }}>Danger Zone</h2>
          <p style={{ fontSize: 12, color: '#9C9488', margin: '0 0 16px' }}>
            These actions are permanent and cannot be undone.
          </p>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '11px 18px', backgroundColor: '#FEF2F2', color: '#DC2626',
                border: '1px solid #FECACA', borderRadius: 8,
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', width: isMobile ? '100%' : 'auto',
              }}
            >
              <Trash2 size={13} /> Delete Account
            </button>
          ) : (
            <div style={{
              backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 10, padding: '16px',
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', margin: '0 0 6px' }}>Are you sure?</p>
              <p style={{ fontSize: 12, color: '#7F766B', margin: '0 0 14px', lineHeight: 1.6 }}>
                Deleting your account will permanently remove all your orders, data, and wallet balance. This cannot be reversed.
              </p>
              <div style={{ display: 'flex', gap: 10, flexDirection: isMobile ? 'column' : 'row' }}>
                <button
                  onClick={() => { logout(); navigate('/') }}
                  style={{
                    padding: '10px 18px', backgroundColor: '#DC2626', color: 'white',
                    border: 'none', borderRadius: 7, fontWeight: 700, fontSize: 12,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Yes, delete my account
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: '10px 18px', backgroundColor: 'white', color: '#1D1D1D',
                    border: '1px solid #E4DDD3', borderRadius: 7, fontWeight: 700, fontSize: 12,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}