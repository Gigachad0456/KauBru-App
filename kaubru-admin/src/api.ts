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
  usersCount: (params?: { search?: string; role?: string; is_premium?: boolean }) =>
    api.get('/admin/users/count', { params }),
  getUser: (id: number) => api.get(`/admin/users/${id}`),
  getUserActivity: (id: number) => api.get(`/admin/users/${id}/activity`),
  updateUser: (id: number, data: object) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),

  // Words
  words: (params?: { skip?: number; limit?: number; search?: string; category?: string }) =>
    api.get('/admin/words', { params }),
  wordsCount: (params?: { search?: string; category?: string }) =>
    api.get('/admin/words/count', { params }),
  createWord: (data: object) => api.post('/admin/words', data),
  updateWord: (id: number, data: object) => api.put(`/admin/words/${id}`, data),
  deleteWord: (id: number) => api.delete(`/admin/words/${id}`),

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
  createLesson: (data: object) => api.post('/admin/lessons', data),
  updateLesson: (id: number, data: object) => api.put(`/admin/lessons/${id}`, data),
  deleteLesson: (id: number) => api.delete(`/admin/lessons/${id}`),

  // Translations
  translations: (params?: { skip?: number; limit?: number; search?: string; direction?: string; user_id?: number }) =>
    api.get('/admin/translations', { params }),
  translationsCount: (params?: { search?: string; direction?: string; user_id?: number }) =>
    api.get('/admin/translations/count', { params }),

  // Export
  exportUsers: () => api.get('/admin/export/users', { responseType: 'blob' }),
  exportWords: () => api.get('/admin/export/words', { responseType: 'blob' }),
  exportTranslations: () => api.get('/admin/export/translations', { responseType: 'blob' }),

  // Import
  importWords: (file: File) => {
    const fd = new FormData(); fd.append('file', file)
    return api.post('/admin/import/words', fd)
  },

  // Activity log
  activity: (params?: { skip?: number; limit?: number; admin_id?: number; action?: string }) =>
    api.get('/admin/activity', { params }),
  activityCount: (params?: { admin_id?: number; action?: string }) =>
    api.get('/admin/activity/count', { params }),

  // Stories
  stories: () => api.get('/admin/stories'),
  createStory: (data: object) => api.post('/admin/stories', data),
  updateStory: (id: number, data: object) => api.put(`/admin/stories/${id}`, data),
  deleteStory: (id: number) => api.delete(`/admin/stories/${id}`),
  uploadStoryImage: (id: number, file: File) => {
    const fd = new FormData(); fd.append('file', file)
    return api.post(`/stories/${id}/cover`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },

  // Picture Words
  pictureWords: () => api.get('/picture-words/admin/all'),
  createPictureWord: (data: object) => api.post('/picture-words/admin', data),
  updatePictureWord: (id: number, data: object) => api.put(`/picture-words/admin/${id}`, data),
  deletePictureWord: (id: number) => api.delete(`/picture-words/admin/${id}`),
  uploadPictureWordImage: (id: number, file: File) => {
    const fd = new FormData(); fd.append('file', file);
    return api.post(`/picture-words/admin/${id}/image`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
}