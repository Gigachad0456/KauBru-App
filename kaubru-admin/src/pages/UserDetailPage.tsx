import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApi } from '../api'

interface UserDetail {
  id: number; name: string; email: string; role: string
  points: number; is_premium: boolean; is_verified: boolean; created_at: string
  translation_count: number; saved_count: number; contribution_count: number
}
interface Translation { id: number; source_text: string; translated_text: string; direction: string; created_at: string }
interface Contribution { id: number; english: string; kaubru: string; category: string; status: string; created_at: string }
interface SavedWord { id: number; english: string; kaubru: string; category: string }

type Tab = 'translations' | 'contributions' | 'saved'

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<{
    user: UserDetail
    translations: Translation[]
    contributions: Contribution[]
    saved_words: SavedWord[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('translations')

  useEffect(() => {
    if (!id) return
    adminApi.getUserActivity(Number(id))
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="font-semibold" style={{ color: "var(--primary)" }}>Loading user...</div>
    </div>
  )
  if (!data) return (
    <div className="p-6 text-red-400">User not found.</div>
  )

  const { user, translations, contributions, saved_words } = data

  const dirLabel = (d: string) => d === 'en_to_kb' ? 'EN→KB' : 'KB→EN'
  const dirColor = (d: string) => d === 'en_to_kb' ? 'var(--primary)' : '#7C3AED'

  return (
    <div className="p-6 space-y-6">
      {/* Back */}
      <button className="btn-ghost text-sm" onClick={() => navigate('/users')}>← Back to Users</button>

      {/* Profile card */}
      <div className="glass p-6 flex flex-wrap gap-6 items-start">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-gray-900 shrink-0"
          style={{ background: 'linear-gradient(135deg,#00E5FF,#7C3AED)' }}>
          {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold" style={{ color: "var(--text-1)" }}>{user.name}</h1>
            <span className={`badge badge-${user.role}`}>{user.role}</span>
            {user.is_premium && <span className="badge badge-premium">⭐ Premium</span>}
            {user.is_verified
              ? <span className="text-green-400 text-xs font-semibold">✓ Verified</span>
              : <span className="text-gray-600 text-xs">Unverified</span>}
          </div>
          <div className="text-sm mt-1" style={{ color: "var(--text-3)" }}>{user.email}</div>
          <div className="text-gray-600 text-xs mt-1">Joined {new Date(user.created_at).toLocaleDateString()}</div>
        </div>
        {/* Stats */}
        <div className="flex gap-4 flex-wrap">
          {[
            { label: 'Points', value: user.points, color: 'var(--primary)' },
            { label: 'Translations', value: user.translation_count, color: '#22c55e' },
            { label: 'Contributions', value: user.contribution_count, color: '#f59e0b' },
            { label: 'Saved Words', value: user.saved_count, color: 'var(--primary)' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color: "var(--text-3)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['translations', 'contributions', 'saved'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              tab === t
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                : 'border-white/10 text-gray-500 hover:text-gray-900 hover:border-white/20'
            }`}>
            {t === 'translations' ? `Translations (${translations.length})` :
             t === 'contributions' ? `Contributions (${contributions.length})` :
             `Saved Words (${saved_words.length})`}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'translations' && (
            <table>
              <thead><tr><th>ID</th><th>Direction</th><th>Source</th><th>Translation</th><th>Date</th></tr></thead>
              <tbody>
                {translations.length === 0
                  ? <tr><td colSpan={5} className="text-center py-8 text-gray-500">No translations yet</td></tr>
                  : translations.map(t => (
                    <tr key={t.id}>
                      <td className="text-xs" style={{ color: "var(--text-3)" }}>{t.id}</td>
                      <td><span className="font-bold text-xs" style={{ color: dirColor(t.direction) }}>{dirLabel(t.direction)}</span></td>
                      <td className="text-gray-300 max-w-xs truncate">{t.source_text}</td>
                      <td className="font-semibold" style={{ color: "var(--primary)" }}>{t.translated_text}</td>
                      <td className="text-xs" style={{ color: "var(--text-3)" }}>{new Date(t.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {tab === 'contributions' && (
            <table>
              <thead><tr><th>ID</th><th>English</th><th>KauBru</th><th>Category</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {contributions.length === 0
                  ? <tr><td colSpan={6} className="text-center py-8 text-gray-500">No contributions yet</td></tr>
                  : contributions.map(c => (
                    <tr key={c.id}>
                      <td className="text-xs" style={{ color: "var(--text-3)" }}>{c.id}</td>
                      <td className="font-semibold" style={{ color: "var(--text-1)" }}>{c.english}</td>
                      <td className="font-semibold" style={{ color: "var(--primary)" }}>{c.kaubru}</td>
                      <td><span className="badge badge-user">{c.category}</span></td>
                      <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                      <td className="text-xs" style={{ color: "var(--text-3)" }}>{new Date(c.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}

          {tab === 'saved' && (
            <table>
              <thead><tr><th>ID</th><th>English</th><th>KauBru</th><th>Category</th></tr></thead>
              <tbody>
                {saved_words.length === 0
                  ? <tr><td colSpan={4} className="text-center py-8 text-gray-500">No saved words</td></tr>
                  : saved_words.map(w => (
                    <tr key={w.id}>
                      <td className="text-xs" style={{ color: "var(--text-3)" }}>{w.id}</td>
                      <td className="font-semibold" style={{ color: "var(--text-1)" }}>{w.english}</td>
                      <td className="font-semibold" style={{ color: "var(--primary)" }}>{w.kaubru}</td>
                      <td><span className="badge badge-user">{w.category}</span></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}






