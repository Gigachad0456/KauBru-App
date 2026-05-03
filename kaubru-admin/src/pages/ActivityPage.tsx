import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '../api'

interface Log {
  id: number; admin_id: number; admin_name: string
  action: string; target_type?: string; target_id?: number
  detail?: string; created_at: string
}

const ACTION_ICON: Record<string, string> = {
  approved_contribution: '✅',
  rejected_contribution: '❌',
  pending_contribution: '⏳',
  bulk_approved_contributions: '✅',
  bulk_rejected_contributions: '❌',
  deleted_contribution: '🗑',
  deleted_word: '🗑',
  updated_user: '✏️',
  deleted_user: '🗑',
  exported_users: '⬇',
  exported_words: '⬇',
  exported_translations: '⬇',
  imported_words: '⬆',
}

const PAGE_SIZE = 50

export default function ActivityPage() {
  const [logs, setLogs]   = useState<Log[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage]   = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const load = useCallback(async (p: number, q: string) => {
    setLoading(true)
    try {
      const [dataRes, countRes] = await Promise.all([
        adminApi.activity({ skip: p * PAGE_SIZE, limit: PAGE_SIZE, action: q || undefined }),
        adminApi.activityCount({ action: q || undefined }),
      ])
      setLogs(dataRes.data)
      setTotal(countRes.data.total)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load(page, search) }, [page, search])

  const handleSearch = () => { setPage(0); setSearch(searchInput) }
  const handleClear  = () => { setSearchInput(''); setSearch(''); setPage(0) }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>Activity Log</h1>
        <p className="text-sm" style={{ color: "var(--text-3)" }}>Every admin action, in order</p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input className="input max-w-xs" placeholder="Filter by action..." value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        <button className="btn-primary" onClick={handleSearch}>Filter</button>
        {search && <button className="btn-ghost" onClick={handleClear}>Clear</button>}
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr><th>Time</th><th>Admin</th><th>Action</th><th>Target</th><th>Detail</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">No activity yet</td></tr>
              ) : logs.map(log => (
                <tr key={log.id}>
                  <td className="text-gray-500 text-xs whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>{log.admin_name}</td>
                  <td>
                    <span className="flex items-center gap-1.5 text-sm">
                      <span>{ACTION_ICON[log.action] || '•'}</span>
                      <span className="text-gray-300 font-mono text-xs">{log.action}</span>
                    </span>
                  </td>
                  <td className="text-xs" style={{ color: "var(--text-3)" }}>
                    {log.target_type && (
                      <span className="badge badge-user">{log.target_type} #{log.target_id}</span>
                    )}
                  </td>
                  <td className="text-gray-400 text-sm max-w-sm truncate">{log.detail || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-3">
        <button className="btn-ghost" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0 || loading}>← Prev</button>
        <span className="text-sm" style={{ color: "var(--text-3)" }}>Page {page + 1} of {Math.max(1, totalPages)} · {total.toLocaleString()} total</span>
        <button className="btn-ghost" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1 || loading}>Next →</button>
      </div>
    </div>
  )
}



