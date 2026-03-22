import axios from 'axios'

// ✅ Create Axios instance
// baseURL must NOT include /api — all route paths include /api/ prefix
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  const adminToken = sessionStorage.getItem('adminToken')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (adminToken) {
    config.headers['x-admin-token'] = adminToken
  }

  return config
}, error => Promise.reject(error))

// ✅ Response interceptor to handle 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/verify-password')) {
      if (window.location.pathname.startsWith('/admin')) {
        sessionStorage.removeItem('adminToken')
        window.location.href = '/admin-login'
      } else {
        localStorage.removeItem('token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api

// ------------------- SERVICES -------------------

// Auth
export const authService = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  me: () => api.get('/api/auth/me'),
  updateProfile: (formData) => api.put('/api/auth/profile', formData, {
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