import axios from 'axios'

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: API_BASE, timeout: 15000 })

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
  // Dashboard
  dashboard: () => api.get('/admin/dashboard'),
  translationsPerDay: (days = 30) => api.get('/admin/dashboard/translations-per-day', { params: { days } }),
  signupsPerDay: (days = 30) => api.get('/admin/dashboard/signups-per-day', { params: { days } }),

  // Users
  users: (params?: { skip?: number; limit?: number; search?: string; role?: string; is_premium?: boolean }) =>
    api.get('/admin/users', { params }),
  usersCount: (params?: { search?: string; role?: string; is_premium?: boolean }) =>
    api.get('/admin/users/count', { params }),
  getUser: (id: string | number) => api.get(`/admin/users/${id}`),
  updateUser: (id: string | number, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string | number) => api.delete(`/admin/users/${id}`),
  activity: (id: string | number) => api.get(`/admin/users/${id}/activity`),

  // Dictionary / Words
  words: (params?: { skip?: number; limit?: number; search?: string; category?: string }) =>
    api.get('/admin/words', { params }),
  wordsCount: (params?: { search?: string; category?: string }) =>
    api.get('/admin/words/count', { params }),
  createWord: (data: any) => api.post('/admin/words', data),
  updateWord: (id: number, data: any) => api.put(`/admin/words/${id}`, data),
  deleteWord: (id: number) => api.delete(`/admin/words/${id}`),
  importWords: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/admin/words/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // Contributions
  contributions: (params?: { status?: string; skip?: number; limit?: number }) =>
    api.get('/admin/contributions', { params }),
  updateContributionStatus: (id: number, status: string) =>
    api.put(`/admin/contributions/${id}/status`, { status }),
  bulkUpdateContributions: (ids: number[], status: string) =>
    api.post('/admin/contributions/bulk-status', { ids, status }),
  deleteContribution: (id: number) => api.delete(`/admin/contributions/${id}`),

  // Lessons
  lessons: () => api.get('/admin/lessons'),
  createLesson: (data: any) => api.post('/admin/lessons', data),
  updateLesson: (id: number, data: any) => api.put(`/admin/lessons/${id}`, data),
  deleteLesson: (id: number) => api.delete(`/admin/lessons/${id}`),

  // Stories
  stories: () => api.get('/admin/stories'),
  createStory: (data: any) => api.post('/admin/stories', data),
  updateStory: (id: number, data: any) => api.put(`/admin/stories/${id}`, data),
  deleteStory: (id: number) => api.delete(`/admin/stories/${id}`),

  // Translations History
  translations: (params?: { skip?: number; limit?: number; search?: string; direction?: string; user_id?: number }) =>
    api.get('/admin/translations', { params }),
  translationsCount: (params?: { search?: string; direction?: string; user_id?: number }) =>
    api.get('/admin/translations/count', { params }),
}