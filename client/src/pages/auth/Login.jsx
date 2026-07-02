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

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const isMobile = useIsMobile()

  const [tab, setTab] = useState('student')
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(k, v) {
    setForm(p => ({ ...p, [k]: v }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email) return setError('Please enter your email.')
    if (!form.password) return setError('Please enter your password.')

    setLoading(true)
    try {
      const user = await login({ email: form.email, password: form.password })

      // Redirect based on role returned from our backend
      if (user?.role === 'VENDOR') {
        navigate('/vendor/dashboard')
      } else if (user?.role === 'RIDER') {
        navigate('/rider/dashboard')
      } else if (user?.role === 'ADMIN') {
        navigate('/admin/dashboard')
      } else {
        navigate('/')
      }
    } catch (err) {
      console.error(err)
      // Map Firebase error codes to friendly messages
      const code = err.code
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Incorrect email or password.')
      } else if (code === 'auth/too-many-requests') {
        setError('Too many attempts. Please try again later.')
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else {
        setError(err.response?.data?.error || 'Login failed. Please try again.')
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
          Welcome back
        </h1>
        <p style={{ fontSize: 14, color: '#7F766B', margin: '0 0 28px' }}>
          Sign in to your Buylence account
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
                borderRadius: 8,
                border: 'none',
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

            {/* Email */}
            <div>
              <label style={{
                fontSize: 11, fontWeight: 700,
                letterSpacing: '0.07em', color: '#39332E',
                marginBottom: 6, display: 'block',
              }}>
                EMAIL ADDRESS
              </label>
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

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.07em', color: '#39332E',
                }}>
                  PASSWORD
                </label>
                <Link to="/forgot-password" style={{
                  fontSize: 11, color: '#BE6B1A',
                  textDecoration: 'none', fontWeight: 600,
                }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => handleChange('password', e.target.value)}
                  placeholder="Your password"
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
              {loading ? 'Signing in...' : 'Sign In'}
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
          Don't have an account?{' '}
          <Link to="/signup" style={{
            color: '#BE6B1A', fontWeight: 700,
            textDecoration: 'none',
          }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}