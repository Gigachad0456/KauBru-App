import { useEffect, useState, useRef } from 'react'
import { API_BASE, adminApi } from '../api'
import Modal from '../components/Modal'
import Confirm from '../components/Confirm'

interface CultureArticle {
  id: number
  title: string
  category: string
  summary?: string
  content?: string
  cover_image_url?: string
  tags?: string
  read_time_minutes: number
  is_published: boolean
  created_at: string
}

const CATEGORIES = ['history', 'dance', 'music', 'traditions', 'language', 'festivals']

const EMPTY = {
  title: '',
  category: 'history',
  summary: '',
  content: '',
  tags: '',
  read_time_minutes: 5,
  is_published: true,
}

const CATEGORY_COLORS: Record<string, string> = {
  history: '#8B4513',
  dance: '#C9A84C',
  music: '#4A7C59',
  traditions: '#7C4A3A',
  language: '#3A4A7C',
  festivals: '#C0392B',
}

function fullUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${API_BASE}${path}`
}

export default function CultureArticlesPage() {
  const [articles, setArticles] = useState<CultureArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editArticle, setEditArticle] = useState<CultureArticle | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [uploadingCover, setUploadingCover] = useState<number | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const [pendingCoverArticleId, setPendingCoverArticleId] = useState<number | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi.cultureArticles()
      setArticles(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  const openAdd = () => {
    setForm(EMPTY)
    setEditArticle(null)
    setModal('add')
  }

  const openEdit = (a: CultureArticle) => {
    setEditArticle(a)
    setForm({
      title: a.title,
      category: a.category,
      summary: a.summary || '',
      content: a.content || '',
      tags: a.tags || '',
      read_time_minutes: a.read_time_minutes,
      is_published: a.is_published,
    })
    setModal('edit')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...form,
        summary: form.summary || null,
        content: form.content || null,
        tags: form.tags || null,
      }
      if (modal === 'add') await adminApi.createCultureArticle(payload)
      else if (editArticle) await adminApi.updateCultureArticle(editArticle.id, payload)
      setModal(null)
      load()
      showToast(modal === 'add' ? 'Article added ✓' : 'Article updated ✓')
    } catch (e: any) {
      showToast(e?.response?.data?.detail || 'Error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await adminApi.deleteCultureArticle(deleteId)
    setDeleteId(null)
    load()
    showToast('Article deleted')
  }

  const triggerCoverUpload = (articleId: number) => {
    setPendingCoverArticleId(articleId)
    coverInputRef.current?.click()
  }

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !pendingCoverArticleId) return
    setUploadingCover(pendingCoverArticleId)
    try {
      const res = await adminApi.uploadCultureArticleCover(pendingCoverArticleId, file)
      load()
      showToast('Cover uploaded ✓')
      if (editArticle && editArticle.id === pendingCoverArticleId) {
        setEditArticle({ ...editArticle, cover_image_url: res.data.cover_image_url })
      }
    } catch (e: any) {
      showToast(e?.response?.data?.detail || 'Upload failed')
    } finally {
      setUploadingCover(null)
      setPendingCoverArticleId(null)
      if (coverInputRef.current) coverInputRef.current.value = ''
    }
  }

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.type === 'number' ? +e.target.value : e.target.value })

  return (
    <div className="p-6 space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500/20 border border-green-500/40 text-green-400 px-4 py-2 rounded-xl text-sm font-semibold">
          {toast}
        </div>
      )}
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Culture & Heritage</h1>
          <p className="text-sm" style={{ color: 'var(--text-3)' }}>{articles.length} articles</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Add Article</button>
      </div>

      {/* Article cards grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map(a => {
            const cover = fullUrl(a.cover_image_url)
            const catColor = CATEGORY_COLORS[a.category] || '#4A7C59'
            return (
              <div key={a.id} className="glass overflow-hidden">
                {/* Cover image */}
                <div className="relative h-40 bg-gray-800 overflow-hidden">
                  {cover ? (
                    <img src={cover} alt={a.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-4xl">🏛</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: catColor, color: '#fff' }}
                    >
                      {a.category.toUpperCase()}
                    </span>
                    {!a.is_published && (
                      <span className="ml-2 text-xs font-bold text-gray-400">DRAFT</span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-bold" style={{ color: 'var(--text-1)' }}>{a.title}</h3>
                  {a.summary && (
                    <p className="text-gray-400 text-sm line-clamp-2">{a.summary}</p>
                  )}
                  <p className="text-gray-600 text-xs">{a.read_time_minutes} min read</p>

                  <div className="flex gap-2 pt-2 flex-wrap">
                    <button
                      className="btn-ghost text-xs py-1 px-3"
                      onClick={() => triggerCoverUpload(a.id)}
                      disabled={uploadingCover === a.id}
                    >
                      {uploadingCover === a.id ? 'Uploading...' : '🖼 Cover'}
                    </button>
                    <button className="btn-ghost text-xs py-1 px-3" onClick={() => openEdit(a)}>Edit</button>
                    <button className="btn-danger text-xs py-1 px-3" onClick={() => setDeleteId(a.id)}>Delete</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {articles.length === 0 && !loading && (
        <div className="glass p-12 text-center">
          <div className="text-4xl mb-3">🏛</div>
          <p className="font-semibold" style={{ color: 'var(--text-1)' }}>No articles yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>Add your first culture & heritage article</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={modal === 'add' ? 'Add New Article' : `Edit — ${editArticle?.title}`}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Cover image section for Edit */}
          {modal === 'edit' && editArticle && (
            <div className="flex gap-4 items-center p-3 bg-white/5 rounded-lg border border-white/10 mb-4">
              <div className="w-20 h-20 bg-gray-800 rounded-lg overflow-hidden shrink-0">
                {editArticle.cover_image_url ? (
                  <img
                    src={fullUrl(editArticle.cover_image_url)!}
                    className="w-full h-full object-cover"
                    alt="cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🏛</div>
                )}
              </div>
              <div>
                <label className="label">Cover Image</label>
                <button
                  className="btn-ghost text-xs py-1.5 px-3"
                  onClick={() => triggerCoverUpload(editArticle.id)}
                  disabled={uploadingCover === editArticle.id}
                >
                  {uploadingCover === editArticle.id ? 'Uploading...' : 'Change Cover Image'}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={f('title')} placeholder="Article title" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={f('category')}>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Read Time (minutes)</label>
              <input
                className="input"
                type="number"
                min={1}
                max={60}
                value={form.read_time_minutes}
                onChange={f('read_time_minutes')}
              />
            </div>
          </div>

          <div>
            <label className="label">Summary / Teaser</label>
            <textarea
              className="input"
              rows={2}
              value={form.summary}
              onChange={f('summary')}
              placeholder="Short description shown on the card..."
            />
          </div>

          <div>
            <label className="label">Content</label>
            <textarea
              className="input"
              rows={8}
              value={form.content}
              onChange={f('content')}
              placeholder="Full article content..."
            />
          </div>

          <div>
            <label className="label">Tags</label>
            <input
              className="input"
              value={form.tags}
              onChange={f('tags')}
              placeholder="Comma-separated tags, e.g. heritage, ritual, northeast"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="ca_published"
              checked={form.is_published}
              onChange={e => setForm({ ...form, is_published: e.target.checked })}
              className="w-4 h-4 accent-cyan-400"
            />
            <label htmlFor="ca_published" className="text-sm text-gray-300 cursor-pointer">
              Published
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button className="btn-ghost flex-1" onClick={() => setModal(null)}>Cancel</button>
            <button
              className="btn-primary flex-1"
              onClick={handleSave}
              disabled={saving || !form.title}
            >
              {saving ? 'Saving...' : modal === 'add' ? 'Add Article' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      <Confirm
        open={!!deleteId}
        message="This will permanently delete this article."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}
