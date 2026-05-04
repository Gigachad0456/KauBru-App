import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'

const NAV = [
  { to: '/dashboard',     icon: '▦',  label: 'Dashboard' },
  { to: '/users',         icon: '◎',  label: 'Users' },
  { to: '/words',         icon: '⊞',  label: 'Dictionary' },
  { to: '/contributions', icon: '✦',  label: 'Contributions' },
  { to: '/lessons',       icon: '◈',  label: 'Lessons' },
  { to: '/stories',       icon: '◉',  label: 'Stories' },
  { to: '/picture-words', icon: '🖼',  label: 'Picture Words' },
  { to: '/translations',  icon: '⇄',  label: 'Translations' },
  { to: '/activity',      icon: '◷',  label: 'Activity' },
]

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  // Current page title
  const current = NAV.find(n => location.pathname.startsWith(n.to))

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className="flex flex-col shrink-0 transition-all duration-200"
        style={{
          width: collapsed ? 68 : 240,
          background: 'var(--primary)',
          boxShadow: '2px 0 12px rgba(0,0,0,0.12)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg shrink-0"
            style={{ background: 'rgba(201,168,76,0.25)', border: '1px solid rgba(201,168,76,0.4)' }}>
            🌿
          </div>
          {!collapsed && (
            <div>
              <div className="font-bold text-sm text-white leading-tight">KauBru</div>
              <div className="text-xs font-semibold" style={{ color: 'rgba(201,168,76,0.9)' }}>Admin Panel</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto space-y-0.5 px-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`
              }
              style={({ isActive }) => isActive ? {
                background: 'rgba(255,255,255,0.15)',
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)',
              } : {}}
            >
              <span className="text-base w-5 text-center shrink-0 opacity-80">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-2 space-y-1" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 text-sm transition-all"
          >
            <span className="text-base w-5 text-center">{collapsed ? '→' : '←'}</span>
            {!collapsed && <span>Collapse</span>}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ color: 'rgba(255,100,100,0.8)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,100,100,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="text-base w-5 text-center">↪</span>
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-3 shrink-0"
          style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow)' }}>
          <div>
            <h1 className="font-bold text-base" style={{ color: 'var(--text-1)' }}>
              {current?.label || 'KauBru Admin'}
            </h1>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>KauBru AI Translator</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'var(--primary)' }}>
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
