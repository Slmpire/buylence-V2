import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Building2, Shield, ArrowRight, ArrowLeft, Upload, Rocket } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { useIsMobile } from '../../hooks/useWindowSize'
import api from '../../lib/axios'

const HALLS = ['Awo Hall', 'Moremi Hall', 'Fajuyi Hall', 'Mozambique Hall', 'Angola Hall', 'ETF Hall']
const STORE_TYPES = ['Physical Kiosk', 'Hostel Room', 'Online Only', 'Mobile Vendor']
const CATEGORIES = [
  'Grains & Cereals',
  'Snacks & Beverages',
  'Oils & Spices',
  'Packed Foodstuff & Staples',
  'Home Essentials',
  'Proteins & Meat',
  'Tubers & Roots',
  'Pepper & Vegetables',
  'Dairy & Eggs',
  'Frozen Foods',
  'Beverages & Drinks',
  'Bread & Bakery',
  'Condiments & Seasonings',
  'Noodles & Pasta',
  'Rice & Beans',
  'Fruits',
  'Toiletries',
  'Laundry & Cleaning',
  'Stationery & Books',
  'Kitchen Utensils',
]

const STEPS = [
  { id: 1, key: 'personal', label: 'Personal Info', icon: <User size={15} /> },
  { id: 2, key: 'business', label: 'Business Info', icon: <Building2 size={15} /> },
  { id: 3, key: 'security', label: 'Security', icon: <Shield size={15} /> },
]

const inp = {
  width: '100%', padding: '10px 14px',
  border: '1px solid #E4DDD3', borderRadius: 8,
  fontSize: 13, outline: 'none',
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

/* ── Sidebar (desktop) / Progress bar (mobile) ── */
function Sidebar({ step, isMobile }) {
  if (isMobile) {
    return (
      <div style={{
        backgroundColor: '#F7F4EF',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '14px 16px',
      }}>
        <Link to="/" style={{
          fontWeight: 900, fontSize: 14,
          color: '#1D1D1D', textDecoration: 'none',
          letterSpacing: '-0.3px', display: 'block', marginBottom: 12,
        }}>
          Shop Buylence
        </Link>
        <div style={{ display: 'flex', gap: 6 }}>
          {STEPS.map(s => (
            <div key={s.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: '100%', height: 3, borderRadius: 2,
                backgroundColor: step >= s.id ? '#BE864B' : '#E4DDD3',
              }} />
              <span style={{
                fontSize: 9, fontWeight: step === s.id ? 700 : 500,
                color: step === s.id ? '#1D1D1D' : '#9C9488',
              }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: 160, flexShrink: 0,
      backgroundColor: '#F7F4EF',
      borderRight: '1px solid rgba(0,0,0,0.06)',
      display: 'flex', flexDirection: 'column',
      minHeight: '100vh', position: 'sticky', top: 0,
    }}>
      {/* Brand */}
      <div style={{ padding: '20px 16px 16px' }}>
        <Link to="/" style={{
          fontWeight: 900, fontSize: 14,
          color: '#1D1D1D', textDecoration: 'none',
          letterSpacing: '-0.3px', display: 'block', marginBottom: 2,
        }}>
          Shop Buylence
        </Link>
        <p style={{ fontSize: 10, color: '#9C9488', letterSpacing: '0.06em', margin: 0, fontWeight: 600 }}>
          Shop Buylence Vendor
        </p>
      </div>

      {/* Steps */}
      <div style={{ flex: 1, paddingTop: 8 }}>
        {STEPS.map(s => {
          const isActive = step === s.id
          const isDone = step > s.id
          return (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 16px',
              borderLeft: `3px solid ${isActive ? '#BE864B' : 'transparent'}`,
              backgroundColor: isActive ? 'rgba(190,134,75,0.05)' : 'transparent',
            }}>
              <span style={{ color: isActive || isDone ? '#BE864B' : '#9C9488', display: 'flex' }}>
                {s.icon}
              </span>
              <span style={{
                fontSize: 12, fontWeight: isActive ? 700 : 400,
                color: isActive ? '#1D1D1D' : isDone ? '#7F766B' : '#9C9488',
              }}>
                {s.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Save progress */}
      <div style={{ padding: '16px' }}>
        <button style={{
          width: '100%', padding: '9px',
          backgroundColor: '#BE864B', color: 'white',
          border: 'none', borderRadius: 7,
          fontSize: 11, fontWeight: 700,
          letterSpacing: '0.04em', cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
        }}>
          Save Progress
        </button>
      </div>
    </div>
  )
}

/* ── Step 1: Personal Info ── */
function StepOne({ data, onChange, isMobile }) {
  return (
    <div style={{ maxWidth: isMobile ? '100%' : '75%' }}>
      {!isMobile && (
        <>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#9C9488', marginBottom: 8 }}>
            STEP 1 OF 3
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 28 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: 3, borderRadius: 2,
                backgroundColor: i <= 1 ? '#BE864B' : '#E4DDD3',
              }} />
            ))}
          </div>
        </>
      )}

      <h1 style={{
        fontSize: isMobile ? 24 : 28, fontWeight: 900, letterSpacing: '-0.5px',
        lineHeight: 1.15, margin: '0 0 6px', color: '#1D1D1D',
      }}>
        Start Selling on{' '}
        <span style={{ color: '#BE864B' }}>Buylence</span>
      </h1>
      <p style={{ fontSize: 13, color: '#7F766B', lineHeight: 1.6, margin: '0 0 24px' }}>
        Join campus vendors and start selling foodstuff across campus.
      </p>

      {/* Full name */}
      <div style={{ marginBottom: 16 }}>
        <label style={lbl}>Full Name</label>
        <input
          type="text" value={data.fullName}
          onChange={e => onChange('fullName', e.target.value)}
          placeholder="e.g. Jordan Smith"
          style={{ ...inp, fontSize: isMobile ? 15 : 13 }}
          onFocus={e => e.target.style.borderColor = '#BE864B'}
          onBlur={e => e.target.style.borderColor = '#E4DDD3'}
        />
      </div>

      {/* Email + Phone */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div>
          <label style={lbl}>Email Address</label>
          <input
            type="email" value={data.email}
            onChange={e => onChange('email', e.target.value)}
            placeholder="jordan@campus.edu"
            style={{ ...inp, fontSize: isMobile ? 15 : 13 }}
            onFocus={e => e.target.style.borderColor = '#BE864B'}
            onBlur={e => e.target.style.borderColor = '#E4DDD3'}
          />
        </div>
        <div>
          <label style={lbl}>Phone Number</label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 11, color: '#9C9488', fontWeight: 600,
            }}>
              +234
            </span>
            <input
              type="tel" value={data.phone}
              onChange={e => onChange('phone', e.target.value)}
              placeholder="800 000 0000"
              style={{ ...inp, paddingLeft: 46, fontSize: isMobile ? 15 : 13 }}
              onFocus={e => e.target.style.borderColor = '#BE864B'}
              onBlur={e => e.target.style.borderColor = '#E4DDD3'}
            />
          </div>
        </div>
      </div>

      {/* Campus verification */}
      <div style={{
        backgroundColor: '#F7F4EF',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: 10, padding: '14px 16px',
        display: 'flex', gap: 12, alignItems: 'flex-start',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          backgroundColor: 'white', border: '1px solid #E4DDD3',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}>
          <Shield size={14} color="#BE864B" />
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 3px', color: '#1D1D1D' }}>
            Campus Verification
          </p>
          <p style={{ fontSize: 12, color: '#7F766B', margin: 0, lineHeight: 1.6 }}>
            We'll use your personal details to verify your status. This keeps our campus marketplace safe and exclusive.
          </p>
        </div>
      </div>

      {/* Bottom images */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 14, marginTop: isMobile ? 32 : 48,
      }}>
        <div style={{ borderRadius: 10, overflow: 'hidden', position: 'relative', height: 100 }}>
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80"
            alt="campus market"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'flex-end', padding: '10px 12px',
          }}>
            <p style={{ color: 'white', fontSize: 12, fontWeight: 700, margin: 0 }}>
              Curating Campus Flavor
            </p>
          </div>
        </div>
        <div style={{
          backgroundColor: '#BE864B',
          borderRadius: 10, padding: '16px',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          textAlign: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 26 }}>🛍</span>
          <p style={{ color: 'white', fontSize: 11, fontWeight: 600, margin: 0, lineHeight: 1.4 }}>
            Join 200+ local student vendors today.
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Step 2: Business Info ── */
function StepTwo({ data, onChange, isMobile }) {
  return (
    <div>
      {!isMobile && (
        <>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#9C9488', marginBottom: 8 }}>
            STEP 2 OF 3
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 28 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: 3, borderRadius: 2,
                backgroundColor: i <= 2 ? '#BE864B' : '#E4DDD3',
              }} />
            ))}
          </div>
        </>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 200px',
        gap: 24,
      }}>

        {/* Left form */}
        <div>
          <h1 style={{
            fontSize: isMobile ? 22 : 26, fontWeight: 900, letterSpacing: '-0.5px',
            margin: '0 0 6px', color: '#1D1D1D',
          }}>
            Business Information
          </h1>
          <p style={{ fontSize: 13, color: '#7F766B', lineHeight: 1.6, margin: '0 0 22px', maxWidth: 420 }}>
            Tell us about your campus store. This information helps students find your products easily across OAU campus.
          </p>

          {/* Store name */}
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>Store Name</label>
            <input
              type="text" value={data.storeName}
              onChange={e => onChange('storeName', e.target.value)}
              placeholder="e.g. Tolu Food Mart"
              style={{ ...inp, fontSize: isMobile ? 15 : 13 }}
              onFocus={e => e.target.style.borderColor = '#BE864B'}
              onBlur={e => e.target.style.borderColor = '#E4DDD3'}
            />
          </div>

          {/* Hall + Type */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={lbl}>Location (OAU Halls)</label>
              <select
                value={data.hall}
                onChange={e => onChange('hall', e.target.value)}
                style={{ ...inp, cursor: 'pointer', fontSize: isMobile ? 15 : 13 }}
                onFocus={e => e.target.style.borderColor = '#BE864B'}
                onBlur={e => e.target.style.borderColor = '#E4DDD3'}
              >
                <option value="">Select Hall</option>
                {HALLS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Store Type</label>
              <select
                value={data.storeType}
                onChange={e => onChange('storeType', e.target.value)}
                style={{ ...inp, cursor: 'pointer', fontSize: isMobile ? 15 : 13 }}
                onFocus={e => e.target.style.borderColor = '#BE864B'}
                onBlur={e => e.target.style.borderColor = '#E4DDD3'}
              >
                <option value="">Physical Kiosk</option>
                {STORE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 20 }}>
            <label style={lbl}>
              Short Store Description{' '}
              <span style={{ color: '#9C9488', fontWeight: 400 }}>(Optional)</span>
            </label>
            <textarea
              value={data.description || ''}
              onChange={e => onChange('description', e.target.value)}
              placeholder="Briefly describe your store's vibe or specialty..."
              rows={3}
              style={{ ...inp, resize: 'none', lineHeight: 1.6, fontSize: isMobile ? 15 : 13 }}
              onFocus={e => e.target.style.borderColor = '#BE864B'}
              onBlur={e => e.target.style.borderColor = '#E4DDD3'}
            />
          </div>

          {/* Categories */}
          <div style={{
            border: '1px solid #E4DDD3',
            borderRadius: 10, padding: '16px',
            backgroundColor: 'white',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <span style={{ fontSize: 14 }}>🏪</span>
              <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: '#1D1D1D' }}>
                Product Categories
              </p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              {CATEGORIES.map(cat => {
                const selected = data.categories?.includes(cat)
                return (
                  <button
                    key={cat} type="button"
                    onClick={() => {
                      const next = selected
                        ? data.categories.filter(c => c !== cat)
                        : [...(data.categories || []), cat]
                      onChange('categories', next)
                    }}
                    style={{
                      padding: '7px 14px', borderRadius: 20,
                      border: '1.5px solid',
                      borderColor: selected ? '#BE864B' : '#E4DDD3',
                      backgroundColor: selected ? '#BE864B' : 'white',
                      color: selected ? 'white' : '#7F766B',
                      fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>
              Select all that apply to help buyers filter your store.
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 12,
          paddingTop: isMobile ? 0 : 60,
        }}>
          {/* Store identity */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid #E4DDD3',
            borderRadius: 10, padding: '16px',
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 10px', color: '#1D1D1D' }}>
              Store Identity
            </p>
            <div style={{
              border: '1.5px dashed #E4DDD3',
              borderRadius: 8, padding: '20px 12px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 8, cursor: 'pointer',
            }}>
              <div style={{
                width: 36, height: 36,
                border: '1.5px dashed #C8B89A',
                borderRadius: 8, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: '#9C9488',
              }}>
                <Upload size={16} />
              </div>
              <p style={{ fontSize: 11, color: '#9C9488', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                Upload a clear logo or profile picture. High-quality visuals increase trust by 40%.
              </p>
            </div>
          </div>

          {/* Vendor tip */}
          <div style={{
            backgroundColor: '#FFF8F2',
            border: '1px solid #F0D9C0',
            borderRadius: 10, padding: '12px',
          }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <span style={{ color: '#BE864B', display: 'flex', marginTop: 1, flexShrink: 0 }}>
                <Shield size={12} />
              </span>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#BE864B', margin: '0 0 4px' }}>
                  Vendor Tip
                </p>
                <p style={{ fontSize: 11, color: '#7F766B', margin: 0, lineHeight: 1.6 }}>
                  Buyers located in{' '}
                  <strong style={{ color: '#1D1D1D' }}>Angola</strong> or{' '}
                  <strong style={{ color: '#1D1D1D' }}>Mozambique</strong>{' '}
                  are currently in high demand for snacks and quick grains.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* OAU Campus Network banner */}
      <div style={{
        marginTop: isMobile ? 28 : 40,
        backgroundColor: '#1D1D1D',
        borderRadius: 12, padding: isMobile ? '20px' : '24px 28px',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
        gap: 20, alignItems: 'center',
        overflow: 'hidden', position: 'relative',
      }}>
        <div>
          <h3 style={{ fontSize: isMobile ? 15 : 16, fontWeight: 800, color: 'white', margin: '0 0 8px' }}>
            OAU Campus Network
          </h3>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: '0 0 16px', maxWidth: 340 }}>
            Shop Buylence connects buyers across all residential halls to vendors. Your location helps us optimize delivery routes and show your products to students nearby.
          </p>
          <div style={{ display: 'flex', gap: 28 }}>
            {[{ val: '12+', label: 'HALLS COVERED' }, { val: '2.5k+', label: 'ACTIVE STUDENTS' }].map(s => (
              <div key={s.label}>
                <p style={{ fontSize: 20, fontWeight: 900, color: '#BE864B', margin: '0 0 2px' }}>{s.val}</p>
                <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', margin: 0 }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
        {!isMobile && (
          <div style={{
            width: 160, height: 100,
            borderRadius: 8, overflow: 'hidden', flexShrink: 0,
          }}>
            <img
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&q=80"
              alt="OAU Campus"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Step 3: Security ── */
function StepThree({ data, onChange, isMobile }) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const checks = [
    { label: 'At least 8 characters', met: (data.password || '').length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(data.password || '') },
    { label: 'One special character', met: /[^A-Za-z0-9]/.test(data.password || '') },
    { label: 'One number', met: /\d/.test(data.password || '') },
  ]

  return (
    <div style={{ maxWidth: isMobile ? '100%' : '75%' }}>
      {!isMobile && (
        <>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#9C9488', marginBottom: 8 }}>
            STEP 3 OF 3
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 28 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 3, borderRadius: 2, backgroundColor: '#BE864B' }} />
            ))}
          </div>
        </>
      )}

      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 20,
      }}>
        <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 900, letterSpacing: '-0.5px', margin: 0, color: '#1D1D1D' }}>
          Account Security
        </h1>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          border: '1.5px solid #BE864B',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#BE864B',
          flexShrink: 0,
        }}>
          <Shield size={16} />
        </div>
      </div>

      {/* Credentials card */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 12, padding: isMobile ? '18px' : '22px',
        marginBottom: 20,
      }}>
        <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px', color: '#1D1D1D' }}>
          Create your credentials
        </p>
        <p style={{ fontSize: 12, color: '#7F766B', margin: '0 0 20px', lineHeight: 1.6 }}>
          Ensure your store remains secure by choosing a strong, unique password for your vendor dashboard.
        </p>

        {/* Password */}
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Password</label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)',
              color: '#BE864B', display: 'flex',
            }}>
              <Shield size={13} />
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={data.password || ''}
              onChange={e => onChange('password', e.target.value)}
              placeholder="••••••••••••"
              style={{ ...inp, paddingLeft: 34, paddingRight: 40, backgroundColor: '#F7F4EF', fontSize: isMobile ? 15 : 13 }}
              onFocus={e => e.target.style.borderColor = '#BE864B'}
              onBlur={e => e.target.style.borderColor = '#E4DDD3'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              style={{
                position: 'absolute', right: 12, top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none',
                cursor: 'pointer', color: '#9C9488',
                fontSize: 12, fontWeight: 700,
                fontFamily: 'Inter, sans-serif',
                padding: 0, lineHeight: 1,
              }}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Confirm password */}
        <div style={{ marginBottom: 18 }}>
          <label style={lbl}>Confirm Password</label>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)',
              color: '#BE864B', display: 'flex',
            }}>
              <Shield size={13} />
            </span>
            <input
              type={showConfirm ? 'text' : 'password'}
              value={data.confirmPassword || ''}
              onChange={e => onChange('confirmPassword', e.target.value)}
              placeholder="••••••••••••"
              style={{ ...inp, paddingLeft: 34, paddingRight: 40, backgroundColor: '#F7F4EF', fontSize: isMobile ? 15 : 13 }}
              onFocus={e => e.target.style.borderColor = '#BE864B'}
              onBlur={e => e.target.style.borderColor = '#E4DDD3'}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(s => !s)}
              style={{
                position: 'absolute', right: 12, top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none',
                cursor: 'pointer', color: '#9C9488',
                fontSize: 12, fontWeight: 700,
                fontFamily: 'Inter, sans-serif',
                padding: 0, lineHeight: 1,
              }}
            >
              {showConfirm ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {/* Password checks */}
        <div style={{
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 8, padding: '14px',
          backgroundColor: '#F7F4EF', borderRadius: 8,
        }}>
          {checks.map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 14, height: 14, borderRadius: '50%',
                border: `2px solid ${c.met ? '#BE864B' : '#D3D1C7'}`,
                backgroundColor: c.met ? '#BE864B' : 'white',
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {c.met && (
                  <span style={{ color: 'white', fontSize: 8, fontWeight: 900 }}>✓</span>
                )}
              </div>
              <span style={{ fontSize: 11, color: c.met ? '#BE864B' : '#9C9488' }}>
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* OAU watermark */}
      <div style={{ textAlign: 'center', marginBottom: 20, opacity: 0.15 }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          border: '2px solid #1D1D1D',
          margin: '0 auto',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
        }}>
          🎓
        </div>
      </div>
    </div>
  )
}

/* ── Main ── */
export default function VendorOnboarding() {
  const navigate = useNavigate()
  const { login, user, isLoggedIn } = useAuthStore()
  const isMobile = useIsMobile()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [personal, setPersonal] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [business, setBusiness] = useState({
    storeName: '', hall: '', storeType: 'Physical Kiosk',
    description: '', categories: [],
  })
  const [security, setSecurity] = useState({
    password: '', confirmPassword: '',
  })

  useEffect(() => {
    if (isLoggedIn && user?.role === 'vendor' && user?.onboarded) {
      navigate('/vendor/dashboard', { replace: true })
    }
  }, [isLoggedIn, user, navigate])

  function updatePersonal(k, v) { setPersonal(p => ({ ...p, [k]: v })) }
  function updateBusiness(k, v) { setBusiness(p => ({ ...p, [k]: v })) }
  function updateSecurity(k, v) { setSecurity(p => ({ ...p, [k]: v })) }

  function validate() {
    if (step === 1) {
      if (!personal.fullName) return 'Please enter your full name.'
      if (!personal.email) return 'Please enter your email address.'
      if (!personal.phone) return 'Please enter your phone number.'
    }
    if (step === 2) {
      if (!business.storeName) return 'Please enter your store name.'
      if (!business.hall) return 'Please select your hall.'
      if (!business.categories?.length) return 'Please select at least one category.'
    }
    if (step === 3) {
      if (!security.password || security.password.length < 8)
        return 'Password must be at least 8 characters.'
      if (security.password !== security.confirmPassword)
        return 'Passwords do not match.'
    }
    return null
  }

  function handleNext() {
    const err = validate()
    if (err) return setError(err)
    setError('')
    setStep(s => s + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleLaunch() {
  const err = validate()
  if (err) return setError(err)
  setLoading(true)
  try {
    // Update profile first
    await api.patch('/auth/profile', {
      fullName: personal.fullName,
      phone: personal.phone,
    })
    // Add this mapping before the api.post call
const storeTypeMap = {
  'Physical Kiosk': 'PHYSICAL_KIOSK',
  'Hostel Room': 'HOSTEL_ROOM',
  'Online Only': 'ONLINE_ONLY',
  'Mobile Vendor': 'MOBILE_VENDOR',
}

// Thenthe onboard call:
await api.post('/vendors/onboard', {
  storeName: business.storeName,
  hall: business.hall,
  storeType: storeTypeMap[business.storeType] || 'PHYSICAL_KIOSK',
  categories: business.categories,
  description: business.description || '',
})

    // Re-fetch user from backend to get updated role + vendor info
   const res = await api.get('/auth/me')
useAuthStore.setState({
  user: res.data.user,
  isLoggedIn: true,
})
setSubmitted(true)
  } catch (err) {
    console.error(err)
    setError(err.response?.data?.error || 'Failed to launch store. Please try again.')
  } finally {
    setLoading(false)
  }
}

  // Success screen
  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#F7F4EF',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 24,
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{
            width: 70, height: 70, borderRadius: '50%',
            backgroundColor: '#F0FDF4', border: '2px solid #BBF7D0',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <Rocket size={30} color="#16A34A" />
          </div>
          <h1 style={{ fontSize: isMobile ? 22 : 24, fontWeight: 900, marginBottom: 10, color: '#1D1D1D', letterSpacing: '-0.3px' }}>
            Your store is launching! 🎉
          </h1>
          <p style={{ fontSize: 13, color: '#7F766B', lineHeight: 1.7, marginBottom: 28 }}>
            <strong style={{ color: '#1D1D1D' }}>{business.storeName}</strong> is under review.
            We'll notify you within 24 hours on WhatsApp once approved.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexDirection: isMobile ? 'column' : 'row' }}>
            <button
              onClick={() => navigate('/vendor/dashboard')}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
                color: 'white', border: 'none', borderRadius: 8,
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              GO TO DASHBOARD
            </button>
            <button
              onClick={() => navigate('/')}
              style={{
                padding: '12px 24px',
                backgroundColor: 'white', color: '#1D1D1D',
                border: '1.5px solid #E4DDD3', borderRadius: 8,
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              BACK TO HOME
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F7F4EF',
      display: isMobile ? 'block' : 'flex',
      fontFamily: 'Inter, sans-serif',
    }}>
      <Sidebar step={step} isMobile={isMobile} />

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Top bar — desktop only */}
        {!isMobile && (
          <div style={{
            height: 48, padding: '0 32px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'flex-end',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            backgroundColor: '#F7F4EF',
          }}>
            <button style={{
              background: 'none', border: 'none',
              width: 28, height: 28, borderRadius: '50%',
              border: '1px solid #E4DDD3',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer',
              color: '#7F766B', fontSize: 13, fontWeight: 600,
            }}>
              ?
            </button>
          </div>
        )}

        {/* Content */}
        <div style={{
          flex: 1,
          padding: isMobile ? '20px 16px 48px' : '36px 40px 60px',
          overflowY: 'auto',
        }}>
          {step === 1 && <StepOne data={personal} onChange={updatePersonal} isMobile={isMobile} />}
          {step === 2 && <StepTwo data={business} onChange={updateBusiness} isMobile={isMobile} />}
          {step === 3 && <StepThree data={security} onChange={updateSecurity} isMobile={isMobile} />}

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 16, padding: '10px 14px',
              backgroundColor: '#FDECEC', borderRadius: 8,
              fontSize: 12, color: '#B53B2F', fontWeight: 500,
              maxWidth: isMobile ? '100%' : 480,
            }}>
              {error}
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{
            display: 'flex',
            flexDirection: isMobile ? 'column-reverse' : 'row',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'stretch' : 'center',
            gap: isMobile ? 12 : 0,
            marginTop: 32,
            maxWidth: step === 2 ? '100%' : (isMobile ? '100%' : 480),
          }}>
            <button
              onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: isMobile ? 'white' : 'none',
                border: isMobile ? '1.5px solid #E4DDD3' : 'none',
                borderRadius: isMobile ? 8 : 0,
                padding: isMobile ? '12px' : 0,
                color: '#7F766B', cursor: 'pointer',
                fontSize: 12, fontWeight: 600,
                letterSpacing: '0.06em',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <ArrowLeft size={13} />
              {step === 1
                ? 'CANCEL ONBOARDING'
                : step === 2
                  ? 'BACK TO PERSONAL INFO'
                  : 'BACK TO BUSINESS INFO'
              }
            </button>

            {step < 3 ? (
              <button
                onClick={handleNext}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: isMobile ? '13px 22px' : '11px 22px',
                  background: 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
                  color: 'white', border: 'none', borderRadius: 8,
                  fontWeight: 700, fontSize: isMobile ? 14 : 13,
                  letterSpacing: '0.04em', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                {step === 1 ? 'Continue to Business Info' : 'Continue to Security'}
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={handleLaunch}
                disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: isMobile ? '13px 22px' : '11px 22px',
                  background: loading ? '#E4DDD3' : 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
                  color: 'white', border: 'none', borderRadius: 8,
                  fontWeight: 700, fontSize: isMobile ? 14 : 13,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  width: isMobile ? '100%' : 'auto',
                }}
              >
                {loading ? 'Launching...' : <><Rocket size={14} /> Launch My Store</>}
              </button>
            )}
          </div>

          {/* Step 3 — terms notice */}
          {step === 3 && (
            <div style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              marginTop: 16, maxWidth: isMobile ? '100%' : 480,
              padding: '12px 14px',
              backgroundColor: '#F7F4EF',
              borderRadius: 8,
            }}>
              <span style={{ color: '#BE864B', display: 'flex', flexShrink: 0, marginTop: 1 }}>
                <Shield size={13} />
              </span>
              <p style={{ fontSize: 11, color: '#7F766B', margin: 0, lineHeight: 1.6 }}>
                By clicking launch, you agree to Shop Buylence's{' '}
                <Link to="/terms" style={{ color: '#BE864B', textDecoration: 'none', fontWeight: 600 }}>
                  Vendor Terms
                </Link>
                {' '}and{' '}
                <Link to="/terms" style={{ color: '#BE864B', textDecoration: 'none', fontWeight: 600 }}>
                  Privacy Policy
                </Link>.
              </p>
            </div>
          )}

          {/* Footer */}
          <p style={{ fontSize: 10, color: '#9C9488', marginTop: 40, letterSpacing: '0.04em' }}>
            © 2026 Buylence Marketplace
          </p>
        </div>
      </div>
    </div>
  )
}