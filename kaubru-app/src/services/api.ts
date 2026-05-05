import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from '../config/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s — allows Render free tier cold start (~30s)
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authAPI = {
  signup: (name: string, email: string, password: string) =>
    api.post('/auth/signup', { name, email, password }),

  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  me: () => api.get('/auth/me'),

  updateProfile: (data: { name?: string; current_password?: string; new_password?: string }) =>
    api.put('/auth/me', data),

  uploadAvatar: (formData: FormData) =>
    api.post('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  socialLogin: (payload: {
    token: string;
    provider: string;
    email: string;
    name: string;
    social_id: string;
    avatar_url?: string;
  }) => api.post('/auth/social-login', payload),
};

// ─── Translation ──────────────────────────────────────────────────────────────

export const translationAPI = {
  translate: (text: string, direction: string) =>
    api.post('/translate', { text, direction }),

  history: () => api.get('/translations/history'),
};

// ─── Dictionary ───────────────────────────────────────────────────────────────

export const dictionaryAPI = {
  getAll: (skip = 0, limit = 50) =>
    api.get(`/dictionary?skip=${skip}&limit=${limit}`),

  search: (q: string) =>
    api.get(`/dictionary/search?q=${encodeURIComponent(q)}`),

  categories: () => api.get('/dictionary/categories'),

  saveWord: (wordId: number) => api.post(`/dictionary/save/${wordId}`),

  saved: () => api.get('/dictionary/saved'),

  unsaveWord: (wordId: number) => api.delete(`/dictionary/saved/${wordId}`),
};

// ─── Contributions ────────────────────────────────────────────────────────────

export const contributionsAPI = {
  submit: (data: {
    english: string;
    kaubru: string;
    meaning?: string;
    category: string;
  }) => api.post('/contributions', data),

  my: () => api.get('/contributions/my'),
};

// ─── Lessons ──────────────────────────────────────────────────────────────────

export const lessonsAPI = {
  getAll: () => api.get('/lessons'),

  getById: (id: number) => api.get(`/lessons/${id}`),

  updateProgress: (id: number, progress: number, score: number) =>
    api.put(`/lessons/${id}/progress`, { progress, score }),
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationsAPI = {
  register: (token: string) => api.post('/notifications/register', { token }),
  get: () => api.get('/notifications/'),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
};

// ─── Stories ──────────────────────────────────────────────────────────────────

export const storiesAPI = {
  getAll: (params?: { category?: string; skip?: number; limit?: number }) =>
    api.get('/stories', { params }),

  getById: (id: number) => api.get(`/stories/${id}`),
};

// ─── Picture Words ────────────────────────────────────────────────────────────

export const pictureWordsAPI = {
  getAll: (category?: string) =>
    api.get('/picture-words', { params: category ? { category } : undefined }),
  categories: () => api.get('/picture-words/categories'),
};

// ─── Premium ──────────────────────────────────────────────────────────────────

export const premiumAPI = {
  plans: () => api.get('/premium/plans'),
};

// ─── TTS ──────────────────────────────────────────────────────────────────────

export const ttsAPI = {
  pronounce: (text: string) => api.get(`/api/tts/pronounce?text=${encodeURIComponent(text)}`),
  uploadAudio: (formData: FormData) => api.post('/api/tts/upload-audio', formData),
};

// ─── Chat ─────────────────────────────────────────────────────────────────────

export const chatAPI = {
  sendMessage: (messages: { role: string; content: string }[]) =>
    api.post('/chat', { messages }, { timeout: 120000 }), // 2 min timeout for local LLM
};

export default api;
