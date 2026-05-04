import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: API_BASE, timeout: 10000 })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    if (err.response?.status === 403) {
      localStorage.removeItem('token')
      window.location.href = '/login?error=not_admin'
    }
    return Promise.reject(err)
  }
)

export default api

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
}

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  translationsPerDay: (days = 30) => api.get('/admin/dashboard/translations-per-day', { params: { days } }),
  signupsPerDay: (days = 30) => api.get('/admin/dashboard/signups-per-day', { params: { days } }),

  // Users
  users: (params?: { skip?: number; limit?: number; search?: string; role?: string; is_premium?: boolean }) =>
    api.get('/admin/users', { params }),
  getUser: (id: string) => api.get(`/admin/users/${id}`),
  updateUser: (id: string, data: any) => api.patch(`/admin/users/${id}`, data),
}

// ... rest of the API functions