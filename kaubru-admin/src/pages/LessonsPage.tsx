import { useEffect, useState } from 'react'
import { adminApi } from '../api'
import Modal from '../components/Modal'
import Confirm from '../components/Confirm'

interface Lesson {
  id: number; title: string; description?: string; category: string
  progress: number; is_premium: boolean; created_at: string
}

const CATEGORIES = ['general','greetings','family','numbers','phrases','culture','pronunciation']
const EMPTY = { title: '', description: '', category: 'general', progress: 0, is_premium: false }

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editLesson, setEditLesson] = useState<Lesson | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const load = async () => {
    setLoading(true)
    try { const res = await adminApi.lessons(); setLessons(res.data) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const openAdd = () => { setForm(EMPTY); setEditLesson(null); setModal('add') }
  const openEdit = (l: Lesson) => {
    setEditLesson(l)
    setForm({ title: l.title, description: l.description || '', category: l.category, progress: l.progress, is_premium: l.is_premium })
    setModal('edit')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, description: form.description || null }
      if (modal === 'add') await adminApi.createLesson(payload)
      else if (editLesson) await adminApi.updateLesson(editLesson.id, payload)
      setModal(null)
      load()
      showToast(modal === 'add' ? 'Lesson added ✓' : 'Lesson updated ✓')
    } catch (e: any) {
      showToast(e?.response?.data?.detail || 'Error')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await adminApi.deleteLesson(deleteId)
    setDeleteId(null)
    load()
    showToast('Lesson deleted')
  }

  const f = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.type === 'number' ? +e.target.value : e.target.value })

  return (
    <div className="p-6 space-y-5">
      {toast && <div className="fixed top-4 right-4 z-50 bg-green-500/20 border border-green-500/40 text-green-400 px-4 py-2 rounded-xl text-sm font-semibold">{toast}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>Lessons</h1>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>{lessons.length} lessons</p>
        </div>
        <button className="btn-primary" onClick={openAdd}>+ Add Lesson</button>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons.map((l) => (
            <div key={l.id} className="glass p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold" style={{ color: "var(--text-1)" }}>{l.title}</h3>
                  <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>{l.description || 'No description'}</p>
                </div>
                {l.is_premium && <span className="badge badge-premium shrink-0">⭐ Premium</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-user">{l.category}</span>
              </div>
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(l.progress * 100)}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${l.progress * 100}%`, background: 'linear-gradient(90deg, #00E5FF, #7C3AED)' }} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button className="btn-ghost text-xs py-1 px-3 flex-1" onClick={() => openEdit(l)}>Edit</button>
                <button className="btn-danger text-xs py-1 px-3" onClick={() => setDeleteId(l.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'add' ? 'Add New Lesson' : `Edit — ${editLesson?.title}`}>
        <div className="space-y-4">
          <div>
            <label className="label">Title *</label>
            <input className="input" value={form.title} onChange={f('title')} placeholder="e.g. Common Greetings" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of this lesson..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="input" value={form.category} onChange={f('category')}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Progress (0–1)</label>
              <input className="input" type="number" min={0} max={1} step={0.1} value={form.progress} onChange={f('progress')} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="lp" checked={form.is_premium}
              onChange={(e) => setForm({ ...form, is_premium: e.target.checked })}
              className="w-4 h-4 accent-cyan-400" />
            <label htmlFor="lp" className="text-sm text-gray-300 cursor-pointer">Premium Lesson</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-ghost flex-1" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleSave} disabled={saving || !form.title}>
              {saving ? 'Saving...' : modal === 'add' ? 'Add Lesson' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      <Confirm open={!!deleteId} message="This will permanently delete this lesson."
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  )
}



