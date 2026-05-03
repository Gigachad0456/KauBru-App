import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '../api'
import Modal from '../components/Modal'
import Confirm from '../components/Confirm'

interface User {
  id: number; name: string; email: string; role: string
  points: number; is_premium: boolean; created_at: string
  translation_count: number; saved_count: number; contribution_count: number
}

const EMPTY_FORM = { name: '', email: '', role: 'user', points: 0, is_premium: false, password: '' }
const PAGE_SIZE = 50

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(0)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [exporting, setExporting] = useState(false)
  const navigate = useNavigate()

  const load = async (p = page, q = search, role = roleFilter) => {
    setLoading(true)
    try {
      const [dataRes, countRes] = await Promise.all([
        adminApi.users({ skip: p * PAGE_SIZE, limit: PAGE_SIZE, search: q || undefined, role: role || undefined }),
        adminApi.usersCount({ search: q || undefined, role: role || undefined }),
      ])
      setUsers(dataRes.data)
      setTotal(countRes.data.total)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSearch = () => {
    setPage(0)
    setSearch(searchInput)
    load(0, searchInput, roleFilter)
  }

  const handleClear = () => {
    setSearchInput(''); setSearch(''); setPage(0); setRoleFilter('')
    load(0, '', '')
  }

  const openEdit = (u: User) => {
    setEditUser(u)
    setForm({ name: u.name, email: u.email, role: u.role, points: u.points, is_premium: u.is_premium, password: '' })
  }

  const handleSave = async () => {
    if (!editUser) return
    setSaving(true)
    try {
      const payload: any = { name: form.name, email: form.email, role: form.role, points: form.points, is_premium: form.is_premium }
      if (form.password) payload.password = form.password
      await adminApi.updateUser(editUser.id, payload)
      setEditUser(null)
      load()
      showToast('User updated ✓')
    } catch (e: any) {
      showToast(e?.response?.data?.detail || 'Error saving')
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    await adminApi.deleteUser(deleteId)
    setDeleteId(null)
    load()
    showToast('User deleted')
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="p-6 space-y-5">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-500/20 border border-green-500/40 text-green-400 px-4 py-2 rounded-xl text-sm font-semibold">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-1)" }}>Users</h1>
          <p className="text-sm" style={{ color: "var(--text-3)" }}>{total.toLocaleString()} total</p>
        </div>
        <button className="btn-ghost text-xs" disabled={exporting} onClick={async () => {
          setExporting(true)
          try {
            const res = await adminApi.exportUsers()
            const url = URL.createObjectURL(res.data)
            const a = document.createElement('a'); a.href = url; a.download = 'kaubru_users.csv'; a.click()
            URL.revokeObjectURL(url)
          } finally { setExporting(false) }
        }}>
          {exporting ? 'Exporting...' : '⬇ Export CSV'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          className="input max-w-xs"
          placeholder="Search name or email..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <select className="input w-36" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(0); load(0, search, e.target.value) }}>
          <option value="">All roles</option>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
        <button className="btn-primary" onClick={handleSearch}>Search</button>
        {(search || roleFilter) && <button className="btn-ghost" onClick={handleClear}>Clear</button>}
      </div>

      {/* Table */}
      <div className="glass overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Email</th><th>Role</th>
                <th>Points</th><th>Premium</th><th>Verified</th><th>Translations</th>
                <th>Contributions</th><th>Joined</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} className="text-center py-8 text-gray-500">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-8 text-gray-500">No users found</td></tr>
              ) : users.map((u) => (
                <tr key={u.id}>
                  <td className="text-xs" style={{ color: "var(--text-3)" }}>{u.id}</td>
                  <td className="font-semibold" style={{ color: "var(--text-1)" }}>{u.name}</td>
                  <td className="" style={{ color: "var(--text-2)" }}>{u.email}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td className="font-semibold" style={{ color: "var(--primary)" }}>{u.points}</td>
                  <td>{u.is_premium ? <span className="badge badge-premium">⭐ Yes</span> : <span className="" style={{ color: "var(--text-3)" }}>—</span>}</td>
                  <td>{(u as any).is_verified ? <span className="text-green-400 text-xs font-semibold">✓</span> : <span className="text-gray-600 text-xs">—</span>}</td>
                  <td className="" style={{ color: "var(--text-2)" }}>{u.translation_count}</td>
                  <td className="" style={{ color: "var(--text-2)" }}>{u.contribution_count}</td>
                  <td className="text-xs" style={{ color: "var(--text-3)" }}>{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn-ghost text-xs py-1 px-3" onClick={() => navigate(`/users/${u.id}`)}>View</button>
                      <button className="btn-ghost text-xs py-1 px-3" onClick={() => openEdit(u)}>Edit</button>
                      <button className="btn-danger text-xs py-1 px-3" onClick={() => setDeleteId(u.id)}>Delete</button>
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

      {/* Edit Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title={`Edit User — ${editUser?.name}`}>
        <div className="space-y-4">
          {[
            { label: 'Name', key: 'name', type: 'text' },
            { label: 'Email', key: 'email', type: 'email' },
            { label: 'New Password (leave blank to keep)', key: 'password', type: 'password' },
            { label: 'Points', key: 'points', type: 'number' },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input
                className="input"
                type={type}
                value={(form as any)[key]}
                onChange={(e) => setForm({ ...form, [key]: type === 'number' ? +e.target.value : e.target.value })}
              />
            </div>
          ))}
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="premium" checked={form.is_premium}
              onChange={(e) => setForm({ ...form, is_premium: e.target.checked })}
              className="w-4 h-4 accent-cyan-400" />
            <label htmlFor="premium" className="text-sm text-gray-300 cursor-pointer">Premium Member</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn-ghost flex-1" onClick={() => setEditUser(null)}>Cancel</button>
            <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      <Confirm
        open={!!deleteId}
        message="This will permanently delete the user and all their data."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  )
}



