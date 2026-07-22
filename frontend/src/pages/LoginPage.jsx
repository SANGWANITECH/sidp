import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(email, password)
      if (user.is_admin) {
        navigate('/rbm')
      } else if (email.includes('nbm@') || email.includes('airtel@')) {
        navigate('/bank')
      } else {
        navigate('/customer')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (demoEmail) => {
    setEmail(demoEmail)
    setPassword('demo1234')
  }

  return (
    <div style={{
        minHeight: '100vh',
        background: '#F4F6F9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Arial, sans-serif',
        padding: '40px 0',
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 20px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52,
            background: '#0D2137',
            borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
          }}>
            <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 20 }}>S</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 'bold', color: '#0D2137', margin: 0 }}>
            SIDP Banking Platform
          </h1>
          <p style={{ color: '#5A6E82', fontSize: 13, marginTop: 6 }}>
            Secure Interoperable Digital Banking
          </p>
        </div>

        {/* Login card */}
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: 32,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 'bold', color: '#0D2137', marginBottom: 20, marginTop: 0 }}>
            Sign in to your account
          </h2>

          {error && (
            <div style={{
              background: '#FDF0EE', border: '1px solid #E8C4C0',
              borderRadius: 8, padding: '10px 14px',
              color: '#B03030', fontSize: 13, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: '600', color: '#1C2B3A', marginBottom: 6 }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px solid #C8D8E8', borderRadius: 8,
                  fontSize: 14, color: '#1C2B3A',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: '600', color: '#1C2B3A', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                style={{
                  width: '100%', padding: '10px 12px',
                  border: '1px solid #C8D8E8', borderRadius: 8,
                  fontSize: 14, color: '#1C2B3A',
                  outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px',
                background: loading ? '#5A6E82' : '#0D2137',
                color: '#fff', border: 'none',
                borderRadius: 8, fontSize: 14,
                fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div style={{
          background: '#fff', borderRadius: 12,
          padding: 20, marginTop: 16,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}>
          <p style={{ fontSize: 12, fontWeight: 'bold', color: '#5A6E82', marginBottom: 12, marginTop: 0, textTransform: 'uppercase', letterSpacing: 1 }}>
            Demo Accounts
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Customer', email: 'john@sidp.demo', color: '#1A7A4A', bg: '#EAF7EF' },
              { label: 'NBM Operator', email: 'nbm@sidp.demo', color: '#1A6FA8', bg: '#EBF4FB' },
              { label: 'RBM Admin', email: 'rbm@sidp.demo', color: '#0D2137', bg: '#EEF4F9' },
            ].map((acc) => (
              <button
                key={acc.email}
                onClick={() => quickLogin(acc.email)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: acc.bg,
                  border: 'none', borderRadius: 8,
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <div>
                  <span style={{ fontSize: 13, fontWeight: 'bold', color: acc.color }}>
                    {acc.label}
                  </span>
                  <span style={{ fontSize: 12, color: '#5A6E82', marginLeft: 8 }}>
                    {acc.email}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: acc.color }}>Click to fill</span>
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#5A6E82', marginTop: 10, marginBottom: 0 }}>
            All demo accounts use password: <strong>demo1234</strong>
          </p>
        </div>

      </div>
    </div>
  )
}