import { useEffect, useState, useRef } from 'react'
import api, { API_BASE, adminApi } from '../api'
import Modal from '../components/Modal'
import Confirm from '../components/Confirm'

interface Story {
  id: number; title: string; title_kaubru?: string; summary?: string
  content_english?: string; content_kaubru?: string
  cover_image_url?: string; audio_url?: string
  category: string; is_premium: boolean; read_time_minutes: number; created_at: string
}

const CATEGORIES = ['folktale', 'legend', 'proverb', 'poem']
const EMPTY = {
  title: '', title_kaubru: '', summary: '', content_english: '',
  content_kaubru: '', category: 'folktale', is_premium: false, read_time_minutes: 5,
}

function fullUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_BASE}${path}`
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editStory, setEditStory] = useState<Story | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [uploadingCover, setUploadingCover] = useState<number | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [pendingCoverStoryId, setPendingCoverStoryId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi.stories()
      setStories(res.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500) }

  const openAdd = () => { setForm(EMPTY); setEditStory(null); setModal('add') }
  const openEdit = (s: Story) => {
    setEditStory(s)
    setForm({
      title: s.title, title_kaubru: s.title_kaubru || '',
      summary: s.summary || '', content_english: s.content_english || '',
      content_kaubru: s.content_kaubru || '', category: s.category,
      is_premium: s.is_premium, read_time_minutes: s.read_time_minutes,
    })
    setModal('edit')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, title_kaubru: form.title_kaubru || null, summary: form.summary || null, content_english: form.content_english || null, content_kaubru: form.content_kaubru || null }
      if (modal === 'add') await adminApi.createStory(payload)
      else if (editStory) await adminApi.updateStory(editStory.id, payload)
      setModal(null); load()
      showToast(modal === 'add' ? 'Story added ✓' : 'Story updated ✓')
    } catch (e: any) { showToast(e?.response?.data?.detail || 'Error') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await adminApi.deleteStory(deleteId)
    setDeleteId(null); load(); showToast('Story deleted')
  }

  const triggerCoverUpload = (storyId: number) => {
    setPendingCoverStoryId(storyId)
    coverInputRef.current?.click()
  }

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !pendingCoverStoryId) return
    setUploadingCover(pendingCoverStoryId)
    try {
      const res = await adminApi.uploadStoryImage(pendingCoverStoryId, file)
      load(); showToast('Cover uploaded ✓')
      // Update local editStory if this is the one being edited
      if (editStory && editStory.id === pendingCoverStoryId) {
        setEditStory({ ...editStory, cover_image_url: res.data.cover_image_url })
      }
    } catch (e: any) { showToast(e?.response?.data?.detail || 'Upload failed') }
    finally { setUploadingCover(null); setPendingCoverStoryId(null); if (coverInputRef.current) coverInputRef.current.value = '' }
  }

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.type === 'number' ? +e.target.value : e.target.value })

  const CATEGORY_COLORS: Record<string, string> = {
    folktale: '#C9A84C', legend: '#4A7C59', proverb: '#7C4A3A', poem: '#3A4A7C',
  }

  return (
    <div className="p-6 space-y-5">
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-500/20 border border-green-500/40 text-green-400 px-4 py-2 rounded-xl text-sm font-semibold">{toast}</div>}
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>Folktales & Stories</h1>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>{stories.length} stories</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Add Story</button>
      </div>

      {/* Story cards grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stories.map(s => {
            const cover = fullUrl(s.cover_image_url)
            const catColor = CATEGORY_COLORS[s.category] || '#4A7C59'
            return (
              <div key={s.id} className="glass overflow-hidden">
                {/* Cover image */}
                <div className="relative h-40 bg-gray-800 overflow-hidden">
                  {cover ? (
                    <img src={cover} alt={s.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">📖</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: catColor, color: '#fff' }}>
                      {s.category.toUpperCase()}
                    </span>
                    {s.is_premium && <span className="ml-2 text-xs font-bold text-yellow-400">⭐ PREMIUM</span>}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  {s.title_kaubru && <p className="text-yellow-400 text-xs font-semibold">{s.title_kaubru}</p>}
                  <h3 className="font-bold" style={{ color: "var(--text-1)" }}>{s.title}</h3>
                  {s.summary && <p className="text-gray-400 text-sm line-clamp-2">{s.summary}</p>}
                  <p className="text-gray-600 text-xs">{s.read_time_minutes} min read</p>

                  <div className="flex gap-2 pt-2 flex-wrap">
                    <button className="btn-ghost text-xs py-1 px-3" onClick={() => triggerCoverUpload(s.id)} disabled={uploadingCover === s.id}>
                      {uploadingCover === s.id ? 'Uploading...' : '🖼 Cover'}
                    </button>
                    <button className="btn-ghost text-xs py-1 px-3" onClick={() => openEdit(s)}>Edit</button>
                    <button className="btn-danger text-xs py-1 px-3" onClick={() => setDeleteId(s.id)}>Delete</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {stories.length === 0 && !loading && (
        <div className="glass p-12 text-center">
          <div className="text-4xl mb-3">📖</div>
          <p className="font-semibold" style={{ color: "var(--text-1)" }}>No stories yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Add your first KauBru folktale</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Add New Story' : `Edit — ${editStory?.title}`}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Image Upload for Edit */}
          {modal === 'edit' && editStory && (
            <div className="flex gap-4 items-center p-3 bg-white/5 rounded-lg border border-white/10 mb-4">
              <div className="w-20 h-20 bg-gray-800 rounded-lg overflow-hidden shrink-0">
                {editStory.cover_image_url ? (
                  <img src={fullUrl(editStory.cover_image_url)!} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📖</div>
                )}
              </div>
              <div>
                <label className="label">Cover Image</label>
                <button 
                  className="btn-ghost text-xs py-1.5 px-3" 
                  onClick={() => triggerCoverUpload(editStory.id)}
                  disabled={uploadingCover === editStory.id}
                >
                  {uploadingCover === editStory.id ? 'Uploading...' : 'Change Cover Image'}
                </button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Title (English) *</label>
              <input className="input" value={form.title} onChange={f('title')} placeholder="Story title" />
            </div>
            <div>
              <label className="label">Title (KauBru)</label>
              <input className="input" value={form.title_kaubru} onChange={f('title_kaubru')} placeholder="KauBru title" />
            </div>
          </div>
          <div>
            <label className="label">Summary / Teaser</label>
            <textarea className="input" rows={2} value={form.summary} onChange={f('summary')} placeholder="Short description shown on the card..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={f('category')}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Read Time (minutes)</label>
              <input className="input" type="number" min={1} max={60} value={form.read_time_minutes} onChange={f('read_time_minutes')} />
            </div>
          </div>
          <div>
            <label className="label">Story Content (English)</label>
            <textarea className="input" rows={6} value={form.content_english} onChange={f('content_english')} placeholder="Full story in English..." />
          </div>
          <div>
            <label className="label">Story Content (KauBru)</label>
            <textarea className="input" rows={6} value={form.content_kaubru} onChange={f('content_kaubru')} placeholder="Full story in KauBru..." />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="sp" checked={form.is_premium} onChange={e => setForm({ ...form, is_premium: e.target.checked })} className="w-4 h-4 accent-cyan-400" />
            <label htmlFor="sp" className="text-sm text-gray-300 cursor-pointer">Premium Story</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-ghost flex-1" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleSave} disabled={saving || !form.title}>
              {saving ? 'Saving...' : modal === 'add' ? 'Add Story' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      <Confirm open={!!deleteId} message="This will permanently delete this story."
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  )
}



