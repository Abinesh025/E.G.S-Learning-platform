import axios from 'axios'
import { STORAGE_KEYS, AUTH_ENDPOINTS } from '../common'

// ✅ Create Axios instance
// In production: VITE_API_URL is '' (empty) → all /api/... paths are relative to same domain
// In dev: VITE_API_URL is not set → baseURL is '' → Vite dev proxy handles /api → localhost:5000
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '',
  timeout: 0, // No timeout — needed for large video/file uploads
})

api.interceptors.request.use(
  config => {
    const token = localStorage.getItem(STORAGE_KEYS?.TOKEN || 'token')
    const adminToken = sessionStorage.getItem(STORAGE_KEYS?.ADMIN_TOKEN || 'adminToken')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    if (adminToken) {
      config.headers['x-admin-token'] = adminToken
    }

    return config
  },
  error => Promise.reject(error)
)

// Concurrency handling for refresh token requests
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// 🔁 Response interceptor to handle 401 & Auto-Refresh Access Token
api.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config

    // If there is no response or error is not 401, reject immediately
    if (!err.response || err.response.status !== 401) {
      return Promise.reject(err)
    }

    // Do NOT intercept auth endpoints that return 401 naturally
    const requestUrl = originalRequest?.url || ''
    const bypassUrls = [
      AUTH_ENDPOINTS?.LOGIN || '/api/auth/login',
      AUTH_ENDPOINTS?.REFRESH_TOKEN || '/api/auth/refresh-token',
      AUTH_ENDPOINTS?.VERIFY_PASSWORD || '/api/auth/verify-password',
      AUTH_ENDPOINTS?.VERIFY_STAFF_LOGIN_OTP || '/api/auth/verify-staff-login-otp',
      AUTH_ENDPOINTS?.FORGOT_PASSWORD || '/api/auth/forgot-password',
      AUTH_ENDPOINTS?.VERIFY_RESET_OTP || '/api/auth/verify-reset-otp',
      AUTH_ENDPOINTS?.RESET_PASSWORD || '/api/auth/reset-password',
    ]
    if (bypassUrls.some(url => requestUrl.includes(url))) {
      return Promise.reject(err)
    }

    // If request already attempted retry, stop to prevent infinite loop
    if (originalRequest?._retry) {
      return Promise.reject(err)
    }

    // Check if refresh token exists
    const refreshToken = localStorage.getItem(STORAGE_KEYS?.REFRESH_TOKEN || 'refreshToken')
    if (!refreshToken) {
      if (window.location.pathname.startsWith('/admin')) {
        sessionStorage.removeItem(STORAGE_KEYS?.ADMIN_TOKEN || 'adminToken')
        window.location.href = '/admin-login'
      } else if (window.location.pathname !== '/login') {
        localStorage.removeItem(STORAGE_KEYS?.TOKEN || 'token')
        window.location.href = '/login'
      }
      return Promise.reject(err)
    }

    // If a refresh is already in flight, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then(newToken => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        })
        .catch(queueErr => Promise.reject(queueErr))
    }

    if (originalRequest) {
      originalRequest._retry = true
    }
    isRefreshing = true

    try {
      // Use raw axios to prevent interceptor recursion
      const baseURL = import.meta.env.VITE_API_URL ?? ''
      const refreshEndpoint = `${baseURL}${AUTH_ENDPOINTS?.REFRESH_TOKEN || '/api/auth/refresh-token'}`
      const response = await axios.post(refreshEndpoint, { refreshToken })

      const newAccessToken = response.data?.accessToken || response.data?.token
      const newRefreshToken = response.data?.refreshToken

      if (!newAccessToken) {
        throw new Error('No access token returned from refresh endpoint')
      }

      // Update storage and default auth header
      localStorage.setItem(STORAGE_KEYS?.TOKEN || 'token', newAccessToken)
      if (newRefreshToken) {
        localStorage.setItem(STORAGE_KEYS?.REFRESH_TOKEN || 'refreshToken', newRefreshToken)
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`
      if (originalRequest?.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      }

      // Inform application components / AuthContext of token update
      window.dispatchEvent(new CustomEvent('token-refreshed', { detail: { token: newAccessToken } }))

      processQueue(null, newAccessToken)
      return api(originalRequest)
    } catch (refreshErr) {
      processQueue(refreshErr, null)
      localStorage.removeItem(STORAGE_KEYS?.TOKEN || 'token')
      localStorage.removeItem(STORAGE_KEYS?.REFRESH_TOKEN || 'refreshToken')
      delete api.defaults.headers.common['Authorization']

      if (window.location.pathname.startsWith('/admin')) {
        sessionStorage.removeItem(STORAGE_KEYS?.ADMIN_TOKEN || 'adminToken')
        window.location.href = '/admin-login'
      } else if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }

      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  }
)

export default api

// ------------------- SERVICES -------------------

// Auth
export const authService = {
  login: (data) => api.post(AUTH_ENDPOINTS?.LOGIN || '/api/auth/login', data),
  register: (data) => api.post(AUTH_ENDPOINTS?.REGISTER || '/api/auth/register', data),
  refreshToken: (refreshToken) => api.post(AUTH_ENDPOINTS?.REFRESH_TOKEN || '/api/auth/refresh-token', { refreshToken }),
  me: () => api.get(AUTH_ENDPOINTS?.PROFILE || '/api/auth/profile'),
  updateProfile: (formData) => api.put(AUTH_ENDPOINTS?.PROFILE || '/api/auth/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}

// Staff
export const staffService = {
  getAll: () => api.get('/api/staff'),
  getById: (id) => api.get(`/api/staff/${id}`),
  update: (id, data) => api.put(`/api/staff/${id}`, data),
  delete: (id) => api.delete(`/api/staff/delete/${id}`),
  getStudents: () => api.get('/api/staff/students'),
}

// Student
export const studentService = {
  getProfile: () => api.get('/api/student/profile'),
  updateProfile: (data) => api.put('/api/student/profile', data),
  getMaterials: (params) => api.get('/api/student/materials', { params }),
  getTests: (params) => api.get('/api/student/tests', { params }),
  getTest: (id) => api.get(`/api/student/tests/${id}`),
  getResults: () => api.get('/api/student/results'),
}

// Materials
export const materialService = {
  getAll: (params) => api.get('/api/materials', { params }),
  getById: (id) => api.get(`/api/materials/${id}`),
  upload: (formData, config = {}) => api.post('/api/materials/upload', formData, config),
  update: (id, data) => api.put(`/api/materials/${id}`, data),
  delete: (id) => api.delete(`/api/materials/${id}`),
}

// Tests
export const testService = {
  getAll: () => api.get('/api/tests/all'),
  getById: (id) => api.get(`/api/tests/${id}`),
  create: (data) => api.post('/api/tests', data),
  update: (id, data) => api.put(`/api/tests/${id}`, data),
  delete: (id) => api.delete(`/api/staff/tests/${id}`),
  submit: (id, answers) => api.post(`/api/tests/${id}/submit`, { answers }),
  getResults: (id) => api.get(`/api/staff/results/${id}`),
}

// Chat
export const chatService = {
  getMessages: (roomId) => api.get(`/api/chat/room/${roomId}`),
  getRooms: () => api.get('/api/chat/rooms'),
  uploadVoice: (formData) => api.post('/api/chat/upload-voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}
