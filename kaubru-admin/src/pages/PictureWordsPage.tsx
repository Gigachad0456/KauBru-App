import { useEffect, useState, useRef } from 'react'
import api, { API_BASE } from '../api'
import Confirm from '../components/Confirm'

interface PictureWord {
  id: number
  english: string
  kaubru: string
  category: string
  image_url?: string
  sort_order: number
  is_active: boolean
  created_at: string
}

const CATEGORIES = ['Animals', 'Nature', 'Food', 'Objects', 'Body', 'Colors', 'Numbers', 'Family', 'Places']

function fullUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_BASE}${path}`
}

export default function PictureWordsPage() {
  const [words, setWords] = useState<PictureWord[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editWord, setEditWord] = useState<PictureWord | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [pendingImageId, setPendingImageId] = useState<number | null>(null)

  const [form, setForm] = useState({
    english: '', kaubru: '', category: 'Animals', sort_order: 0,
  })

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/picture-words/admin/all')
      setWords(res.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const openAdd = () => {
    setEditWord(null)
    setForm({ english: '', kaubru: '', category: 'Animals', sort_order: words.length })
    setShowForm(true)
  }

  const openEdit = (w: PictureWord) => {
    setEditWord(w)
    setForm({ english: w.english, kaubru: w.kaubru, category: w.category, sort_order: w.sort_order })
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.english.trim() || !form.kaubru.trim()) {
      showToast('English and KauBru fields are required')
      return
    }
    setSaving(true)
    try {
      const params = new URLSearchParams({
        english: form.english.trim(),
        kaubru: form.kaubru.trim(),
        category: form.category,
        sort_order: form.sort_order.toString(),
      })
      if (editWord) {
        await api.put(`/picture-words/admin/${editWord.id}?${params}`)
        showToast('Word updated ✓')
      } else {
        await api.post(`/picture-words/admin?${params}`)
        showToast('Word added ✓')
      }
      setShowForm(false)
      load()
    } catch (e: any) {
      showToast(e?.response?.data?.detail || 'Error saving')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await api.delete(`/picture-words/admin/${deleteId}`)
    setDeleteId(null)
    load()
    showToast('Deleted')
  }

  const toggleActive = async (w: PictureWord) => {
    await api.put(`/picture-words/admin/${w.id}?is_active=${!w.is_active}`)
    load()
  }

  const triggerImageUpload = (id: number) => {
    setPendingImageId(id)
    imageInputRef.current?.click()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !pendingImageId) return
    setUploadingId(pendingImageId)
    try {
      const fd = new FormData(); fd.append('file', file)
      await api.post(`/picture-words/admin/${pendingImageId}/image`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      load()
      showToast('Image uploaded ✓')
    } catch (e: any) {
      showToast(e?.response?.data?.detail || 'Upload failed')
    } finally {
      setUploadingId(null)
      setPendingImageId(null)
      if (imageInputRef.current) imageInputRef.current.value = ''
    }
  }

  // Group by category
  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = words.filter(w => w.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, PictureWord[]>)

  // Also include any custom categories not in the list
  words.forEach(w => {
    if (!CATEGORIES.includes(w.category) && !grouped[w.category]) {
      grouped[w.category] = words.filter(x => x.category === w.category)
    }
  })

  return (
    <div className="p-6 space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500/20 border border-green-500/40 text-green-400 px-4 py-2 rounded-xl text-sm font-semibold">
          {toast}
        </div>
      )}

      {/* Hidden image input */}
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Picture Words</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-3)' }}>
            {words.length} words · shown in "Learn with Pictures" on the mobile app
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Add Word</button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>
            {editWord ? `Edit — ${editWord.english}` : 'Add New Picture Word'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">English *</label>
              <input className="input" value={form.english} onChange={e => setForm({ ...form, english: e.target.value })} placeholder="e.g. Cat" />
            </div>
            <div>
              <label className="label">KauBru *</label>
              <input className="input" value={form.kaubru} onChange={e => setForm({ ...form, kaubru: e.target.value })} placeholder="e.g. Mao" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Sort Order</label>
              <input className="input" type="number" min={0} value={form.sort_order} onChange={e => setForm({ ...form, sort_order: +e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editWord ? 'Save Changes' : 'Add Word'}
            </button>
          </div>
        </div>
      )}

      {/* Words grouped by category */}
      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--text-3)' }}>Loading...</div>
      ) : words.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="flex justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <p className="font-semibold" style={{ color: 'var(--text-1)' }}>No picture words yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Add your first word and upload an image</p>
        </div>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{category}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-alt)', color: 'var(--text-3)' }}>
                {items.length}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {items.map(w => {
                const imgUrl = fullUrl(w.image_url)
                return (
                  <div key={w.id} className="card overflow-hidden" style={{ opacity: w.is_active ? 1 : 0.5 }}>
                    {/* Image area */}
                    <div
                      className="relative h-28 flex items-center justify-center cursor-pointer group"
                      style={{ background: 'var(--bg-alt)' }}
                      onClick={() => triggerImageUpload(w.id)}
                    >
                      {imgUrl ? (
                        <img src={imgUrl} alt={w.english} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      )}
                      {/* Upload overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-semibold">
                          {uploadingId === w.id ? 'Uploading...' : '📷 Upload'}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-2.5 space-y-1">
                      <div className="font-bold text-sm" style={{ color: 'var(--text-1)' }}>{w.english}</div>
                      <div className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>{w.kaubru}</div>
                    </div>

                    {/* Actions */}
                    <div className="px-2.5 pb-2.5 flex gap-1.5">
                      <button
                        className="btn-ghost text-xs py-1 px-2 flex-1"
                        onClick={() => openEdit(w)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-xs py-1 px-2 rounded-lg border font-semibold transition-all"
                        style={w.is_active
                          ? { background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }
                          : { background: 'var(--bg-alt)', color: 'var(--text-3)', border: '1px solid var(--border)' }
                        }
                        onClick={() => toggleActive(w)}
                        title={w.is_active ? 'Click to hide' : 'Click to show'}
                      >
                        {w.is_active ? '✓' : '○'}
                      </button>
                      <button
                        className="btn-danger text-xs py-1 px-2"
                        onClick={() => setDeleteId(w.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))
      )}

      <Confirm
        open={!!deleteId}
        message="This will permanently delete this picture word."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
