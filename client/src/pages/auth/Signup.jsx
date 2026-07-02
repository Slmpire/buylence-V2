import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { useIsMobile } from '../../hooks/useWindowSize'



function GoogleLoginButton() {
  const { loginWithGoogle } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGoogle() {
    setLoading(true)
    try {
      const user = await loginWithGoogle()
      if (user?.role === 'VENDOR') navigate('/vendor/dashboard')
      else if (user?.role === 'RIDER') navigate('/rider/dashboard')
      else navigate('/')
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/popup-closed-by-user') {
        setError('')
      } else {
        setError('Google sign-in failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        style={{
          width: '100%', padding: '12px',
          backgroundColor: 'white',
          border: '1.5px solid #E4DDD3',
          borderRadius: 10, fontWeight: 700,
          fontSize: 13, cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'Inter, sans-serif',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 10,
          color: '#1A1A1A', transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#BE6B1A'}
        onMouseLeave={e => e.currentTarget.style.borderColor = '#E4DDD3'}
      >
        {/* Google SVG icon */}
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          <path fill="none" d="M0 0h48v48H0z"/>
        </svg>
        {loading ? 'Signing in...' : 'Continue with Google'}
      </button>
      {error && (
        <p style={{ fontSize: 12, color: '#DC2626', textAlign: 'center', marginTop: 8 }}>{error}</p>
      )}
    </div>
  )
}

export default function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuthStore()
  const isMobile = useIsMobile()

  const [tab, setTab] = useState('student')
  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(k, v) {
    setForm(p => ({ ...p, [k]: v }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.fullName) return setError('Please enter your full name.')
    if (!form.email) return setError('Please enter your email.')
    if (!form.phone) return setError('Please enter your phone number.')
    if (!form.password) return setError('Please enter a password.')
    if (form.password.length < 6) return setError('Password must be at least 6 characters.')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')

    setLoading(true)
    try {
      await signup({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: tab === 'vendor' ? 'VENDOR' : 'BUYER',
      })

      // After signup, update phone number in profile
      // (Firebase doesn't store phone in the same call)
      if (form.phone) {
        const { updateProfile } = useAuthStore.getState()
        await updateProfile({ fullName: form.fullName, phone: form.phone })
      }

      if (tab === 'vendor') {
        navigate('/vendor-onboarding')
      } else {
        navigate('/')
      }
    } catch (err) {
      console.error(err)
      const code = err.code
      if (code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.')
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.')
      } else {
        setError(err.response?.data?.error || 'Signup failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const inp = {
    width: '100%', padding: '12px 14px',
    border: '1px solid #E4DDD3', borderRadius: 8,
    fontSize: isMobile ? 15 : 13, outline: 'none',
    backgroundColor: 'white', boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif', color: '#2B2B2B',
    transition: 'border-color 0.15s',
  }

  const lbl = {
    fontSize: 11, fontWeight: 700,
    letterSpacing: '0.07em', color: '#39332E',
    marginBottom: 6, display: 'block',
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F7F4EF',
      display: 'flex', alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      padding: '24px 16px',
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: 20,
        padding: isMobile ? '32px 24px' : '48px 44px',
        width: '100%', maxWidth: 440,
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
      }}>

        {/* Logo */}
        <Link to="/" style={{
          fontWeight: 900, fontSize: 18,
          color: '#1A1A1A', textDecoration: 'none',
          letterSpacing: '-0.5px', display: 'block',
          marginBottom: 28,
        }}>
          BUYLENCE
        </Link>

        {/* Heading */}
        <h1 style={{
          fontSize: isMobile ? 24 : 28,
          fontWeight: 900, letterSpacing: '-0.5px',
          margin: '0 0 6px', color: '#1A1A1A',
        }}>
          Create account
        </h1>
        <p style={{ fontSize: 14, color: '#7F766B', margin: '0 0 28px' }}>
          Join the OAU campus marketplace
        </p>

        {/* Tab switcher */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          backgroundColor: '#F7F4EF',
          borderRadius: 10, padding: 4,
          marginBottom: 24,
        }}>
          {[
            { key: 'student', label: 'Student' },
            { key: 'vendor', label: 'Vendor' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '9px',
                borderRadius: 8, border: 'none',
                backgroundColor: tab === t.key ? 'white' : 'transparent',
                color: tab === t.key ? '#1A1A1A' : '#9C9488',
                fontWeight: tab === t.key ? 700 : 500,
                fontSize: 13, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Full name */}
            <div>
              <label style={lbl}>FULL NAME</label>
              <input
                type="text"
                value={form.fullName}
                onChange={e => handleChange('fullName', e.target.value)}
                placeholder="Your full name"
                style={inp}
                onFocus={e => e.target.style.borderColor = '#BE6B1A'}
                onBlur={e => e.target.style.borderColor = '#E4DDD3'}
              />
            </div>

            {/* Email */}
            <div>
              <label style={lbl}>EMAIL ADDRESS</label>
              <input
                type="email"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                placeholder="your@email.com"
                style={inp}
                onFocus={e => e.target.style.borderColor = '#BE6B1A'}
                onBlur={e => e.target.style.borderColor = '#E4DDD3'}
              />
            </div>

            {/* Phone */}
            <div>
              <label style={lbl}>PHONE NUMBER</label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12,
                  top: '50%', transform: 'translateY(-50%)',
                  fontSize: 13, color: '#9C9488', fontWeight: 600,
                }}>
                  +234
                </span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  placeholder="800 000 0000"
                  style={{ ...inp, paddingLeft: 52 }}
                  onFocus={e => e.target.style.borderColor = '#BE6B1A'}
                  onBlur={e => e.target.style.borderColor = '#E4DDD3'}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={lbl}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  placeholder="At least 6 characters"
                  style={{ ...inp, paddingRight: 44 }}
                  onFocus={e => e.target.style.borderColor = '#BE6B1A'}
                  onBlur={e => e.target.style.borderColor = '#E4DDD3'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{
                    position: 'absolute', right: 12,
                    top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', color: '#9C9488',
                    display: 'flex', padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label style={lbl}>CONFIRM PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={e => handleChange('confirmPassword', e.target.value)}
                  placeholder="Repeat your password"
                  style={{ ...inp, paddingRight: 44 }}
                  onFocus={e => e.target.style.borderColor = '#BE6B1A'}
                  onBlur={e => e.target.style.borderColor = '#E4DDD3'}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(s => !s)}
                  style={{
                    position: 'absolute', right: 12,
                    top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', color: '#9C9488',
                    display: 'flex', padding: 0,
                  }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Vendor notice */}
            {tab === 'vendor' && (
              <div style={{
                padding: '12px 14px',
                backgroundColor: '#FFF8F2',
                border: '1px solid #F0D9C0',
                borderRadius: 8,
                fontSize: 12, color: '#7F766B', lineHeight: 1.6,
              }}>
                🏪 You'll be taken to the vendor onboarding after signup to set up your store.
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                padding: '10px 14px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 8,
                fontSize: 13, color: '#DC2626', fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                backgroundColor: loading ? '#E4DDD3' : '#1A1A1A',
                color: 'white', border: 'none',
                borderRadius: 10, fontWeight: 700,
                fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Inter, sans-serif',
                marginTop: 4,
                transition: 'background 0.15s',
              }}
            >
              {loading
                ? 'Creating account...'
                : tab === 'vendor'
                  ? 'Create Vendor Account'
                  : 'Create Account'
              }
            </button>
          </div>
          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0',
          }}>
            <div style={{ flex: 1, height: 1, backgroundColor: '#E4DDD3' }} />
            <span style={{ fontSize: 11, color: '#9C9488', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, backgroundColor: '#E4DDD3' }} />
          </div>

          {/* Google button */}
          <GoogleLoginButton />
        </form>

        {/* Footer */}
        <p style={{
          fontSize: 13, color: '#7F766B',
          textAlign: 'center', marginTop: 24,
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{
            color: '#BE6B1A', fontWeight: 700,
            textDecoration: 'none',
          }}>
            Sign in
          </Link>
        </p>

        <p style={{
          fontSize: 11, color: '#9C9488',
          textAlign: 'center', marginTop: 16, lineHeight: 1.6,
        }}>
          By creating an account you agree to our{' '}
          <Link to="/" style={{ color: '#BE6B1A', textDecoration: 'none' }}>Terms</Link>
          {' '}and{' '}
          <Link to="/" style={{ color: '#BE6B1A', textDecoration: 'none' }}>Privacy Policy</Link>
        </p>
      </div>
    </div>
  )
}