import axios from 'axios'

// ✅ Create Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
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
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (formData) => api.put('/auth/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}

// Staff
export const staffService = {
  getAll: () => api.get('/staff'),
  getById: (id) => api.get(`/staff/${id}`),
  update: (id, data) => api.put(`/staff/${id}`, data),
  delete: (id) => api.delete(`/staff/delete/${id}`),
  getStudents: () => api.get('/staff/students'),
}

// Student
export const studentService = {
  getProfile: () => api.get('/student/profile'),
  updateProfile: (data) => api.put('/student/profile', data),
  getMaterials: (params) => api.get('/student/materials', { params }),
  getTests: (params) => api.get('/student/tests', { params }),
  getTest: (id) => api.get(`/student/tests/${id}`),
  getResults: () => api.get('/student/results'),
}

// Materials
export const materialService = {
  getAll: (params) => api.get('/materials', { params }),
  getById: (id) => api.get(`/materials/${id}`),
  upload: (formData, config = {}) => api.post('/materials/upload', formData, config), // ✅ corrected path
  update: (id, data) => api.put(`/materials/${id}`, data),
  delete: (id) => api.delete(`/materials/${id}`),
}

// Tests
export const testService = {
  getAll: () => api.get('/tests/all'),
  getById: (id) => api.get(`/tests/${id}`),
  create: (data) => api.post('/tests', data),
  update: (id, data) => api.put(`/tests/${id}`, data),
  delete: (id) => api.delete(`/staff/tests/${id}`),
  submit: (id, answers) => api.post(`/tests/${id}/submit`, { answers }),
  getResults: (id) => api.get(`/staff/results/${id}`),
}

// Chat
export const chatService = {
  getMessages: (roomId) => api.get(`/chat/room/${roomId}`),
  getRooms: () => api.get('/chat/rooms'),
  uploadVoice: (formData) => api.post('/chat/upload-voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
}