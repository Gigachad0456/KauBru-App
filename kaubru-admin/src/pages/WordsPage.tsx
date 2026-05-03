import { useEffect, useState, useRef } from 'react'
import { adminApi } from '../api'
import Modal from '../components/Modal'
import Confirm from '../components/Confirm'
import api, { API_BASE } from '../api'

interface Word {
  id: number; english: string; kaubru: string; category: string
  example_english?: string; example_kaubru?: string; audio_url?: string; created_at: string
}

const CATEGORIES = ['general','greetings','family','nature','food','numbers','phrases','adjectives','places','culture','pronunciation']
const EMPTY = { english: '', kaubru: '', category: 'general', example_english: '', example_kaubru: '', audio_url: '' }
const PAGE_SIZE = 100

export default function WordsPage() {
  const [words, setWords] = useState<Word[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [page, setPage] = useState(0)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editWord, setEditWord] = useState<Word | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [uploadingAudioId, setUploadingAudioId] = useState<number | null>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const csvImportRef = useRef<HTMLInputElement>(null)
  const [pendingAudioWordId, setPendingAudioWordId] = useState<number | null>(null)
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)

  const load = async (p = page, q = search, cat = catFilter) => {
    setLoading(true)
    try {
      const [dataRes, countRes] = await Promise.all([
        adminApi.words({ skip: p * PAGE_SIZE, limit: PAGE_SIZE, search: q || undefined, category: cat || undefined }),
        adminApi.wordsCount({ search: q || undefined, category: cat || undefined }),
      ])
      setWords(dataRes.data)
      setTotal(countRes.data.total)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const handleSearch = () => { setPage(0); setSearch(searchInput); load(0, searchInput, catFilter) }
  const handleClear = () => { setSearchInput(''); setSearch(''); setCatFilter(''); setPage(0); load(0, '', '') }

  const openAdd = () => { setForm(EMPTY); setEditWord(null); setModal('add') }
  const openEdit = (w: Word) => {
    setEditWord(w)
    setForm({ english: w.english, kaubru: w.kaubru, category: w.category, example_english: w.example_english || '', example_kaubru: w.example_kaubru || '', audio_url: w.audio_url || '' })
    setModal('edit')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, example_english: form.example_english || null, example_kaubru: form.example_kaubru || null, audio_url: form.audio_url || null }
      if (modal === 'add') await adminApi.createWord(payload)
      else if (editWord) await adminApi.updateWord(editWord.id, payload)
      setModal(null)
      load()
      showToast(modal === 'add' ? 'Word added ✓' : 'Word updated ✓')
    } catch (e: any) {
      showToast(e?.response?.data?.detail || 'Error')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await adminApi.deleteWord(deleteId)
    setDeleteId(null)
    load()
    showToast('Word deleted')
  }

  // ── Audio upload ────────────────────────────────────────────────────────────
  const triggerAudioUpload = (wordId: number) => {
    setPendingAudioWordId(wordId)
    audioInputRef.current?.click()
  }

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !pendingAudioWordId) return
    setUploadingAudioId(pendingAudioWordId)
    try {
      const formData = new FormData()
      formData.append('file', file)
      await api.post(`/dictionary/words/${pendingAudioWordId}/audio`, formData)
      load()
      showToast('Audio uploaded ✓')
    } catch (e: any) {
      showToast(e?.response?.data?.detail || 'Upload failed')
    } finally {
      setUploadingAudioId(null)
      setPendingAudioWordId(null)
      if (audioInputRef.current) audioInputRef.current.value = ''
    }
  }

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value })

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-6 space-y-5">
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-500/20 border border-green-500/40 text-green-400 px-4 py-2 rounded-xl text-sm font-semibold">{toast}</div>}

      {/* Hidden audio file input */}
      <input ref={audioInputRef} type="file" accept="audio/*" className="hidden" onChange={handleAudioFileChange} />

      {/* Hidden CSV import input */}
      <input ref={csvImportRef} type="file" accept=".csv" className="hidden" onChange={async (e) => {
        const file = e.target.files?.[0]; if (!file) return
        setImporting(true); setImportResult(null)
        try {
          const res = await adminApi.importWords(file)
          setImportResult(res.data)
          showToast(`Imported ${res.data.imported} words ✓`)
          load()
        } catch (err: any) { showToast(err?.response?.data?.detail || 'Import failed') }
        finally { setImporting(false); if (csvImportRef.current) csvImportRef.current.value = '' }
      }} />

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>Dictionary</h1>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>{total.toLocaleString()} words</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn-ghost text-xs" disabled={exporting} onClick={async () => {
            setExporting(true)
            try {
              const res = await adminApi.exportWords()
              const url = URL.createObjectURL(res.data)
              const a = document.createElement('a'); a.href = url; a.download = 'kaubru_words.csv'; a.click()
              URL.revokeObjectURL(url)
            } finally { setExporting(false) }
          }}>
            {exporting ? 'Exporting...' : '⬇ Export CSV'}
          </button>
          <button className="btn-ghost text-xs" disabled={importing} onClick={() => csvImportRef.current?.click()}>
            {importing ? 'Importing...' : '⬆ Import CSV'}
          </button>
          <button className="btn-primary" onClick={openAdd}>+ Add Word</button>
        </div>
      </div>

      {/* Import result */}
      {importResult && (
        <div className="glass p-4 text-sm space-y-1">
          <div className="text-green-400 font-semibold">Import complete: {importResult.imported} added, {importResult.skipped} skipped</div>
          {importResult.errors.length > 0 && (
            <div className="text-yellow-400 text-xs">{importResult.errors.slice(0, 5).join(' · ')}</div>
          )}
          <button className="text-gray-500 text-xs underline" onClick={() => setImportResult(null)}>Dismiss</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search english or kaubru..." value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
        <select className="input w-40" value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(0); load(0, search, e.target.value) }}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="btn-primary" onClick={handleSearch}>Search</button>
        {(search || catFilter) && <button className="btn-ghost" onClick={handleClear}>Clear</button>}
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => { const next = c === catFilter ? '' : c; setCatFilter(next); setPage(0); load(0, search, next) }}
            className={`text-xs px-3 py-1 rounded-full border font-semibold transition-all ${catFilter === c ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400' : 'border-white/10 text-gray-500 hover:text-gray-900 hover:border-white/20'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr><th>ID</th><th>English</th><th>KauBru</th><th>Category</th><th>Example EN</th><th>Example KB</th><th>Audio</th><th>Added</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : words.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-gray-500">No words found</td></tr>
              ) : words.map((w) => (
                <tr key={w.id}>
                  <td className="text-xs" style={{ color: "var(--text-3)" }}>{w.id}</td>
                  <td className="font-semibold" style={{ color: "var(--text-1)" }}>{w.english}</td>
                  <td className="font-semibold" style={{ color: "var(--primary)" }}>{w.kaubru}</td>
                  <td><span className="badge badge-user">{w.category}</span></td>
                  <td className="text-gray-500 text-xs max-w-xs truncate">{w.example_english || '—'}</td>
                  <td className="text-gray-500 text-xs max-w-xs truncate">{w.example_kaubru || '—'}</td>
                  <td>
                    {w.audio_url ? (
                      <div className="flex items-center gap-1">
                        <audio src={w.audio_url.startsWith('/') ? `${API_BASE}${w.audio_url}` : w.audio_url}
                          controls className="h-6 w-28" />
                        <button className="btn-ghost text-xs py-0.5 px-2" onClick={() => triggerAudioUpload(w.id)}
                          disabled={uploadingAudioId === w.id}>
                          {uploadingAudioId === w.id ? '...' : '↑'}
                        </button>
                      </div>
                    ) : (
                      <button className="btn-ghost text-xs py-1 px-2" onClick={() => triggerAudioUpload(w.id)}
                        disabled={uploadingAudioId === w.id}>
                        {uploadingAudioId === w.id ? 'Uploading...' : '+ Audio'}
                      </button>
                    )}
                  </td>
                  <td className="text-xs" style={{ color: "var(--text-3)" }}>{new Date(w.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn-ghost text-xs py-1 px-3" onClick={() => openEdit(w)}>Edit</button>
                      <button className="btn-danger text-xs py-1 px-3" onClick={() => setDeleteId(w.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center gap-3">
        <button className="btn-ghost" onClick={() => { const p = Math.max(0, page - 1); setPage(p); load(p) }} disabled={page === 0 || loading}>← Prev</button>
        <span className="text-sm" style={{ color: "var(--text-3)" }}>Page {page + 1} of {Math.max(1, totalPages)} · {total.toLocaleString()} total</span>
        <button className="btn-ghost" onClick={() => { const p = page + 1; setPage(p); load(p) }} disabled={page >= totalPages - 1 || loading}>Next →</button>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Add New Word' : `Edit — ${editWord?.english}`}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">English *</label>
              <input className="input" value={form.english} onChange={f('english')} placeholder="e.g. water" />
            </div>
            <div>
              <label className="label">KauBru *</label>
              <input className="input" value={form.kaubru} onChange={f('kaubru')} placeholder="e.g. tui" />
            </div>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={f('category')}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Example Sentence (English)</label>
            <input className="input" value={form.example_english} onChange={f('example_english')} placeholder="e.g. I need water." />
          </div>
          <div>
            <label className="label">Example Sentence (KauBru)</label>
            <input className="input" value={form.example_kaubru} onChange={f('example_kaubru')} placeholder="e.g. Ang tui bai." />
          </div>
          <div>
            <label className="label">Audio URL (optional — or upload after saving)</label>
            <input className="input" value={form.audio_url} onChange={f('audio_url')} placeholder="https://..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-ghost flex-1" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleSave} disabled={saving || !form.english || !form.kaubru}>
              {saving ? 'Saving...' : modal === 'add' ? 'Add Word' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      <Confirm open={!!deleteId} message="This will permanently delete this word from the dictionary."
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  )
}



