import { useEffect, useState, useCallback } from 'react'
import { adminApi } from '../api'

interface Translation {
  id: number; user_id: number; user_name: string
  source_text: string; translated_text: string; direction: string; created_at: string
}

const PAGE_SIZE = 50

export default function TranslationsPage() {
  const [items, setItems] = useState<Translation[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [dirFilter, setDirFilter] = useState('')

  const load = useCallback(async (p: number, q: string, dir: string) => {
    setLoading(true)
    try {
      const [dataRes, countRes] = await Promise.all([
        adminApi.translations({ skip: p * PAGE_SIZE, limit: PAGE_SIZE, search: q || undefined, direction: dir || undefined }),
        adminApi.translationsCount({ search: q || undefined, direction: dir || undefined }),
      ])
      setItems(dataRes.data)
      setTotal(countRes.data.total)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load(page, search, dirFilter) }, [page, search, dirFilter])

  const handleSearch = () => {
    setPage(0)
    setSearch(searchInput)
  }

  const handleClear = () => {
    setSearchInput('')
    setSearch('')
    setPage(0)
  }

  const dirLabel = (d: string) => d === 'en_to_kb' ? 'EN → KB' : 'KB → EN'
  const dirColor = (d: string) => d === 'en_to_kb' ? 'var(--primary)' : '#7C3AED'

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>Translation History</h1>
        <p className="text-sm" style={{ color: "var(--text-3)" }}>All user translations — read only</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          className="input max-w-xs"
          placeholder="Search source or translation..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <select className="input w-40" value={dirFilter} onChange={(e) => { setDirFilter(e.target.value); setPage(0) }}>
          <option value="">All directions</option>
          <option value="en_to_kb">EN → KB</option>
          <option value="kb_to_en">KB → EN</option>
        </select>
        <button className="btn-primary" onClick={handleSearch}>Search</button>
        {(search || dirFilter) && (
          <button className="btn-ghost" onClick={handleClear}>Clear</button>
        )}
      </div>

      {/* Stats row */}
      <div className="flex gap-4 flex-wrap">
        <div className="glass px-5 py-3 flex items-center gap-3">
          <span className="text-gray-900 font-bold text-xl">{total.toLocaleString()}</span>
          <span className="text-sm" style={{ color: "var(--text-3)" }}>Total{search || dirFilter ? ' (filtered)' : ''}</span>
        </div>
        <div className="glass px-5 py-3 flex items-center gap-3">
          <span className="font-semibold" style={{ color: "var(--primary)" }}>{items.filter(i => i.direction === 'en_to_kb').length}</span>
          <span className="text-sm" style={{ color: "var(--text-3)" }}>EN → KB (this page)</span>
        </div>
        <div className="glass px-5 py-3 flex items-center gap-3">
          <span className="font-semibold" style={{ color: "var(--primary)" }}>{items.filter(i => i.direction === 'kb_to_en').length}</span>
          <span className="text-sm" style={{ color: "var(--text-3)" }}>KB → EN (this page)</span>
        </div>
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr><th>ID</th><th>User</th><th>Direction</th><th>Source</th><th>Translation</th><th>Date</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">No translations found</td></tr>
              ) : items.map((t) => (
                <tr key={t.id}>
                  <td className="text-xs" style={{ color: "var(--text-3)" }}>{t.id}</td>
                  <td>
                    <div className="font-semibold text-sm" style={{ color: "var(--text-1)" }}>{t.user_name || `User #${t.user_id}`}</div>
                  </td>
                  <td><span className="font-bold text-xs" style={{ color: dirColor(t.direction) }}>{dirLabel(t.direction)}</span></td>
                  <td className="text-gray-300 max-w-xs truncate">{t.source_text}</td>
                  <td className="font-semibold" style={{ color: "var(--primary)" }}>{t.translated_text}</td>
                  <td className="text-xs" style={{ color: "var(--text-3)" }}>{new Date(t.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-3">
        <button className="btn-ghost" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0 || loading}>
          ← Prev
        </button>
        <span className="text-sm" style={{ color: "var(--text-3)" }}>
          Page {page + 1} of {Math.max(1, totalPages)} &nbsp;·&nbsp; {total.toLocaleString()} total
        </span>
        <button className="btn-ghost" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1 || loading}>
          Next →
        </button>
      </div>
    </div>
  )
}



