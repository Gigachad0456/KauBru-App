import { useState, FormEvent, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@kaubru.app')
  const [password, setPassword] = useState('admin1234')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'not_admin') {
      setError('Access denied. This account does not have admin privileges.')
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      localStorage.setItem('token', res.data.access_token)
      const me = await authApi.me()
      if (me.data.role !== 'admin') {
        localStorage.removeItem('token')
        setError('Access denied. Admin account required.')
        return
      }
      navigate('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-12"
        style={{ background: 'var(--primary)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
            style={{ background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.4)' }}>
            🌿
          </div>
          <div>
            <div className="font-bold text-gray-900 text-lg leading-tight">KauBru</div>
            <div className="text-xs font-semibold" style={{ color: 'rgba(201,168,76,0.9)' }}>Admin Panel</div>
          </div>
        </div>

        <div>
          <h2 className="text-4xl font-bold text-gray-900 leading-tight mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Preserve.<br />Translate.<br />Learn.
          </h2>
          <p className="text-gray-900/60 text-sm leading-relaxed">
            Manage the KauBru AI Translator platform — dictionary, lessons, contributions, and cultural stories.
          </p>
        </div>

        <div className="flex gap-6">
          {[['📖', 'Dictionary'], ['🎓', 'Lessons'], ['✍️', 'Contributions']].map(([icon, label]) => (
            <div key={label} className="text-center">
              <div className="text-2xl mb-1">{icon}</div>
              <div className="text-gray-900/50 text-xs">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <span className="text-2xl">🌿</span>
            <span className="font-bold text-lg" style={{ color: 'var(--primary)' }}>KauBru Admin</span>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-1)', fontFamily: 'Georgia, serif' }}>
            Welcome back
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-3)' }}>
            Sign in to your admin account
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@kaubru.app"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg text-sm"
                style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: 'var(--error)' }}>
                <span className="shrink-0 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: 'var(--text-3)' }}>
            Default: admin@kaubru.app / admin1234
          </p>
        </div>
      </div>
    </div>
  )
}



