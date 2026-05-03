import { useEffect, useState } from 'react'
import { adminApi } from '../api'
import Confirm from '../components/Confirm'

interface Contribution {
  id: number; user_id: number; user_name: string; user_email: string
  english: string; kaubru: string; meaning?: string; category: string
  status: string; created_at: string
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = filename
  a.click(); URL.revokeObjectURL(url)
}

export default function ContributionsPage() {
  const [items, setItems]           = useState<Contribution[]>([])
  const [loading, setLoading]       = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [selected, setSelected]     = useState<Set<number>>(new Set())
  const [deleteId, setDeleteId]     = useState<number | null>(null)
  const [toast, setToast]           = useState('')
  const [bulkLoading, setBulkLoading] = useState(false)
  const [exporting, setExporting]   = useState(false)

  const load = async (s = statusFilter) => {
    setLoading(true); setSelected(new Set())
    try {
      const res = await adminApi.contributions({ status: s || undefined, limit: 200 })
      setItems(res.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const updateStatus = async (id: number, status: string) => {
    try {
      await adminApi.updateContributionStatus(id, status)
      load(statusFilter)
      showToast(status === 'approved' ? '✅ Approved & added to dictionary!' : `Status → ${status}`)
    } catch (e: any) { showToast(e?.response?.data?.detail || 'Error') }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await adminApi.deleteContribution(deleteId)
    setDeleteId(null); load(statusFilter); showToast('Deleted')
  }

  // ── Selection ──────────────────────────────────────────────────────────────
  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const toggleAll = () => {
    if (selected.size === items.length) setSelected(new Set())
    else setSelected(new Set(items.map(i => i.id)))
  }

  // ── Bulk action ────────────────────────────────────────────────────────────
  const bulkAction = async (status: string) => {
    if (selected.size === 0) return
    setBulkLoading(true)
    try {
      const res = await adminApi.bulkUpdateContributions(Array.from(selected), status)
      showToast(res.data.message)
      load(statusFilter)
    } catch (e: any) { showToast(e?.response?.data?.detail || 'Error') }
    finally { setBulkLoading(false) }
  }

  // ── CSV export ─────────────────────────────────────────────────────────────
  // Contributions don't have a dedicated export endpoint, so we build CSV client-side
  const exportCSV = () => {
    const rows = items.map(c => ({
      id: c.id, user_name: c.user_name, user_email: c.user_email,
      english: c.english, kaubru: c.kaubru, meaning: c.meaning || '',
      category: c.category, status: c.status, created_at: c.created_at,
    }))
    const headers = Object.keys(rows[0]).join(',')
    const body = rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([headers + '\n' + body], { type: 'text/csv' })
    downloadBlob(blob, `contributions_${statusFilter || 'all'}.csv`)
  }

  return (
    <div className="p-6 space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500/20 border border-green-500/40 text-green-400 px-4 py-2 rounded-xl text-sm font-semibold">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>Contributions</h1>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>Review and moderate community word submissions</p>
        </div>
        <button className="btn-ghost text-xs" onClick={exportCSV} disabled={items.length === 0}>
          ⬇ Export CSV
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {['', 'pending', 'approved', 'rejected'].map((s) => (
          <button key={s}
            onClick={() => { setStatusFilter(s); load(s) }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              statusFilter === s
                ? s === 'pending' ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400'
                  : s === 'approved' ? 'bg-green-500/15 border-green-500/40 text-green-400'
                  : s === 'rejected' ? 'bg-red-500/15 border-red-500/40 text-red-400'
                  : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                : 'border-white/10 text-gray-500 hover:text-gray-900 hover:border-white/20'
            }`}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Bulk action bar — shown when items are selected */}
      {selected.size > 0 && (
        <div className="glass px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="font-semibold" style={{ color: "var(--primary)" }}>{selected.size} selected</span>
          <button className="btn-success text-xs py-1.5 px-3" onClick={() => bulkAction('approved')} disabled={bulkLoading}>
            ✓ Approve All
          </button>
          <button className="btn-danger text-xs py-1.5 px-3" onClick={() => bulkAction('rejected')} disabled={bulkLoading}>
            ✗ Reject All
          </button>
          <button className="btn-ghost text-xs py-1.5 px-3" onClick={() => bulkAction('pending')} disabled={bulkLoading}>
            ↺ Set Pending
          </button>
          <button className="btn-ghost text-xs py-1.5 px-3 ml-auto" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>
                  <input type="checkbox"
                    checked={items.length > 0 && selected.size === items.length}
                    onChange={toggleAll}
                    className="w-4 h-4 accent-cyan-400" />
                </th>
                <th>ID</th><th>Contributor</th><th>English</th><th>KauBru</th>
                <th>Meaning</th><th>Category</th><th>Status</th><th>Date</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-8 text-gray-500">No contributions found</td></tr>
              ) : items.map((c) => (
                <tr key={c.id} className={selected.has(c.id) ? 'bg-cyan-500/5' : ''}>
                  <td>
                    <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleSelect(c.id)}
                      className="w-4 h-4 accent-cyan-400" />
                  </td>
                  <td className="text-xs" style={{ color: "var(--text-3)" }}>{c.id}</td>
                  <td>
                    <div className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>{c.user_name}</div>
                    <div className="text-xs" style={{ color: "var(--text-3)" }}>{c.user_email}</div>
                  </td>
                  <td className="font-semibold" style={{ color: "var(--text-1)" }}>{c.english}</td>
                  <td className="font-semibold" style={{ color: "var(--primary)" }}>{c.kaubru}</td>
                  <td className="text-gray-400 text-sm max-w-xs truncate">{c.meaning || '—'}</td>
                  <td><span className="badge badge-user">{c.category}</span></td>
                  <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
                  <td className="text-xs" style={{ color: "var(--text-3)" }}>{new Date(c.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {c.status !== 'approved' && (
                        <button className="btn-success text-xs py-1 px-2" onClick={() => updateStatus(c.id, 'approved')}>✓</button>
                      )}
                      {c.status !== 'rejected' && (
                        <button className="btn-danger text-xs py-1 px-2" onClick={() => updateStatus(c.id, 'rejected')}>✗</button>
                      )}
                      {c.status !== 'pending' && (
                        <button className="btn-ghost text-xs py-1 px-2" onClick={() => updateStatus(c.id, 'pending')}>↺</button>
                      )}
                      <button className="btn-danger text-xs py-1 px-2" onClick={() => setDeleteId(c.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass p-4 flex items-start gap-3">
        <span className="text-xl">💡</span>
        <p className="text-sm" style={{ color: "var(--text-3)" }}>
          Approving a contribution adds it to the dictionary and awards the contributor <strong className="" style={{ color: "var(--text-1)" }}>10 points</strong>.
          Use the checkboxes to bulk-approve or bulk-reject multiple submissions at once.
        </p>
      </div>

      <Confirm open={!!deleteId} message="This will permanently delete this contribution."
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  )
}



