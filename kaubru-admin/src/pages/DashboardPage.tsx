import { useEffect, useState } from 'react'
import { adminApi } from '../api'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, CartesianGrid,
} from 'recharts'

interface Stats {
  total_users: number; total_words: number; total_translations: number
  total_contributions: number; pending_contributions: number
  total_lessons: number; premium_users: number; recent_signups: number
}
interface Point { date: string; value: number }
type Range = 7 | 14 | 30 | 60

const STAT_CARDS = (s: Stats) => [
  { label: 'Total Users',      value: s.total_users,           change: `+${s.recent_signups} this week`, up: true,  color: 'var(--primary)', bg: '#EBF2EC' },
  { label: 'Dictionary Words', value: s.total_words,           change: 'verified entries',               up: null,  color: '#2563EB',        bg: '#EFF6FF' },
  { label: 'Translations',     value: s.total_translations,    change: 'all time',                       up: null,  color: 'var(--primary)',        bg: '#F5F3FF' },
  { label: 'Contributions',    value: s.total_contributions,   change: `${s.pending_contributions} pending`, up: s.pending_contributions > 0, color: '#C9A84C', bg: '#FFFBEB' },
]

const TT = {
  contentStyle: { background: '#fff', border: '1px solid #E4E0D8', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 },
  labelStyle: { color: '#1A1A1A', fontWeight: 600 },
  itemStyle: { color: '#4A4A4A' },
}

export default function DashboardPage() {
  const [stats, setStats]       = useState<Stats | null>(null)
  const [txSeries, setTxSeries] = useState<Point[]>([])
  const [suSeries, setSuSeries] = useState<Point[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [range, setRange]       = useState<Range>(30)

  const load = (days: Range) => {
    setLoading(true); setError('')
    Promise.all([adminApi.dashboard(), adminApi.translationsPerDay(days), adminApi.signupsPerDay(days)])
      .then(([s, tx, su]) => { setStats(s.data); setTxSeries(tx.data); setSuSeries(su.data) })
      .catch(e => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(range) }, [range])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
        <span className="text-sm" style={{ color: 'var(--text-3)' }}>Loading dashboard...</span>
      </div>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
      <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl" style={{ background: '#FEF2F2' }}>⚠</div>
      <div className="font-semibold" style={{ color: 'var(--text-1)' }}>Dashboard failed to load</div>
      <div className="text-sm text-center max-w-xs" style={{ color: 'var(--text-3)' }}>{error}</div>
      <div className="text-xs" style={{ color: 'var(--text-3)' }}>
        Backend: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>http://localhost:8000</span>
      </div>
      <button className="btn-primary" onClick={() => load(range)}>Retry</button>
    </div>
  )

  if (!stats) return null

  // Merge series
  const allDates = Array.from(new Set([...txSeries.map(p => p.date), ...suSeries.map(p => p.date)])).sort()
  const txMap = Object.fromEntries(txSeries.map(p => [p.date, p.value]))
  const suMap = Object.fromEntries(suSeries.map(p => [p.date, p.value]))
  const combined = allDates.map(d => ({ date: d.slice(5), translations: txMap[d] ?? 0, signups: suMap[d] ?? 0 }))

  const barData = [
    { name: 'Users',         value: stats.total_users,         fill: 'var(--primary)' },
    { name: 'Words',         value: stats.total_words,         fill: '#2563EB' },
    { name: 'Translations',  value: stats.total_translations,  fill: '#7C3AED' },
    { name: 'Contributions', value: stats.total_contributions, fill: 'var(--gold)' },
    { name: 'Lessons',       value: stats.total_lessons,       fill: '#0891B2' },
  ]

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>Overview</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
          {([7, 14, 30, 60] as Range[]).map(d => (
            <button key={d} onClick={() => setRange(d)}
              className="text-xs px-3 py-1.5 rounded-md font-semibold transition-all"
              style={range === d
                ? { background: 'var(--bg-card)', color: 'var(--primary)', boxShadow: 'var(--shadow)' }
                : { color: 'var(--text-3)' }}>
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS(stats).map(card => (
          <div key={card.label} className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{ background: card.bg, color: card.color }}>
                {card.value > 999 ? '∞' : card.value.toString()[0]}
              </div>
              {card.up !== null && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={card.up
                    ? { background: '#F0FDF4', color: '#166534' }
                    : { background: '#FFFBEB', color: '#92400E' }}>
                  {card.up ? '↑' : '!'} {card.up ? 'Active' : 'Review'}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-1)' }}>
              {card.value.toLocaleString()}
            </div>
            <div className="text-xs font-semibold mb-0.5" style={{ color: 'var(--text-1)' }}>{card.label}</div>
            <div className="text-xs" style={{ color: 'var(--text-3)' }}>{card.change}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Area chart — activity */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Activity</h3>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>Translations & signups — last {range} days</p>
            </div>
            <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-3)' }}>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'var(--primary)' }} />
                Translations
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: 'var(--gold)' }} />
                Signups
              </span>
            </div>
          </div>
          {combined.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'var(--text-3)' }}>
              No activity data for this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={combined}>
                <defs>
                  <linearGradient id="gTx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="var(--gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...TT} />
                <Area type="monotone" dataKey="translations" stroke="var(--primary)" strokeWidth={2} fill="url(#gTx)" dot={false} />
                <Area type="monotone" dataKey="signups" stroke="var(--gold)" strokeWidth={2} fill="url(#gSu)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar chart — totals */}
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>Totals</h3>
            <p className="text-xs" style={{ color: 'var(--text-3)' }}>All-time counts</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} barSize={28} layout="vertical">
              <XAxis type="number" tick={{ fill: 'var(--text-3)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-2)', fontSize: 11 }} axisLine={false} tickLine={false} width={80} />
              <Tooltip {...TT} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {barData.map((entry, i) => <Cell key={i} fill={entry.fill} fillOpacity={0.85} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick actions + secondary stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Quick actions */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-1)' }}>Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/contributions', label: 'Review Contributions', sub: `${stats.pending_contributions} pending`, icon: '✦', urgent: stats.pending_contributions > 0 },
              { href: '/words', label: 'Manage Dictionary', sub: `${stats.total_words} words`, icon: '⊞', urgent: false },
              { href: '/users', label: 'Manage Users', sub: `${stats.total_users} total`, icon: '◎', urgent: false },
              { href: '/stories', label: 'Manage Stories', sub: 'Folktales & legends', icon: '◉', urgent: false },
            ].map(item => (
              <a key={item.href} href={item.href}
                className="flex items-start gap-3 p-4 rounded-xl transition-all group"
                style={{ background: item.urgent ? '#FFFBEB' : 'var(--bg-alt)', border: `1px solid ${item.urgent ? '#FDE68A' : 'var(--border)'}` }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                  style={{ background: item.urgent ? '#FEF3C7' : 'var(--bg-card)', color: item.urgent ? '#92400E' : 'var(--primary)', border: '1px solid var(--border)' }}>
                  {item.icon}
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-1)' }}>{item.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: item.urgent ? '#92400E' : 'var(--text-3)' }}>{item.sub}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Secondary stats */}
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text-1)' }}>Platform Health</h3>
          <div className="space-y-4">
            {[
              { label: 'Premium Users', value: stats.premium_users, total: stats.total_users, color: 'var(--gold)' },
              { label: 'Approved Contributions', value: stats.total_contributions - stats.pending_contributions, total: stats.total_contributions, color: 'var(--success)' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>{item.label}</span>
                  <span style={{ color: 'var(--text-3)' }}>{item.value} / {item.total}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-alt)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${item.total > 0 ? Math.round((item.value / item.total) * 100) : 0}%`, background: item.color }} />
                </div>
              </div>
            ))}
            <div className="pt-2 space-y-2">
              {[
                { label: 'New signups (7d)', value: stats.recent_signups },
                { label: 'Total lessons', value: stats.total_lessons },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-2"
                  style={{ borderTop: '1px solid var(--border)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-2)' }}>{item.label}</span>
                  <span className="text-sm font-bold" style={{ color: 'var(--text-1)' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}



