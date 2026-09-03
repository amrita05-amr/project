import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../store/AuthContext'
import { Eye, EyeOff, Lock, Mail, Clock } from 'lucide-react'

export default function LoginPage() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return }
    const res = await login(form.email, form.password)
    if (res.ok) {
      if (res.user?.role === 'HR_ADMIN' || form.email.includes('hr') || form.email.includes('admin')) {
        navigate('/hr/dashboard')
      } else {
        navigate('/dashboard')
      }
    } else {
      setError(res.error || 'Invalid credentials. Please try again.')
    }
  }

  const fillDemo = (email, password) => {
    setForm({ email, password })
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in-up">
        <div className="auth-header">
          <div className="auth-logo">
            <Clock size={26} color="white" />
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your AttendTrack account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Email address</label>
            <div className="input-icon">
              <Mail size={15} className="icon-left" />
              <input
                type="email"
                className="input"
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-icon">
              <Lock size={15} className="icon-left" />
              <input
                type={showPw ? 'text' : 'password'}
                className="input"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ paddingRight: 40 }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', border: '1px solid var(--color-danger-ring)' }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop: 4, width: '100%' }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Signing in…
              </span>
            ) : 'Sign in'}
          </button>
        </form>

        <div className="auth-divider">or</div>

        <div style={{ textAlign: 'center' }}>
          <span className="text-sm text-muted">Don't have an account? </span>
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.875rem' }}>Register</Link>
        </div>

        {/* Demo hint */}
        <div style={{ marginTop: 20, background: 'var(--indigo-50)', border: '1px solid var(--indigo-100)', borderRadius: 'var(--radius-md)', padding: '12px 14px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: 6 }}>🎯 Quick Demo Login (Click to fill)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              type="button"
              onClick={() => fillDemo('aarav@company.com', 'Employee@1234')}
              className="btn btn-sm"
              style={{ background: '#fff', border: '1px solid var(--indigo-200)', justifyContent: 'flex-start', textAlign: 'left', fontSize: '0.75rem', padding: '6px 10px' }}
            >
              👤 <b>Employee:</b> aarav@company.com
            </button>
            <button
              type="button"
              onClick={() => fillDemo('hr@company.com', 'Admin@1234')}
              className="btn btn-sm"
              style={{ background: '#fff', border: '1px solid var(--indigo-200)', justifyContent: 'flex-start', textAlign: 'left', fontSize: '0.75rem', padding: '6px 10px' }}
            >
              👑 <b>HR Admin:</b> hr@company.com
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
