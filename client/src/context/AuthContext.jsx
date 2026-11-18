import { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import { STORAGE_KEYS, AUTH_ENDPOINTS } from '../common'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEYS?.TOKEN || 'token'))
  const [loading, setLoading] = useState(true)

  // Listen for automatic token refreshes from the Axios response interceptor
  useEffect(() => {
    const handleTokenRefreshed = (e) => {
      if (e.detail?.token) {
        setToken(e.detail.token)
      }
    }
    window.addEventListener('token-refreshed', handleTokenRefreshed)
    return () => window.removeEventListener('token-refreshed', handleTokenRefreshed)
  }, [])

  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      api.get(AUTH_ENDPOINTS?.PROFILE || '/api/auth/profile')
        .then(res => {
          if (res.data?.user) {
            setUser(res.data.user)
          }
        })
        .catch(err => {
          if (err.response?.status === 401) {
            logout()
          }
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = async (email, password) => {
    try {
      const res = await api.post(AUTH_ENDPOINTS?.LOGIN || '/api/auth/login', { email, password })

      if (res.data.requiresOtp) {
        return res.data
      }

      const { token: t, accessToken, refreshToken: rt, user: u } = res.data
      const tokenToStore = accessToken || t

      localStorage.setItem(STORAGE_KEYS?.TOKEN || 'token', tokenToStore)
      if (rt) {
        localStorage.setItem(STORAGE_KEYS?.REFRESH_TOKEN || 'refreshToken', rt)
      }
      if (u && u.role !== 'admin') {
        sessionStorage.removeItem(STORAGE_KEYS?.ADMIN_TOKEN || 'adminToken')
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenToStore}`
      setToken(tokenToStore)
      setUser(u)

      return res.data
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Login failed"

      throw new Error(message)
    }
  }

  const verifyStaffOtp = async (email, otp) => {
    try {
      const res = await api.post(AUTH_ENDPOINTS?.VERIFY_STAFF_LOGIN_OTP || '/api/auth/verify-staff-login-otp', { email, otp })
      const { token: t, accessToken, refreshToken: rt, user: u } = res.data
      const tokenToStore = accessToken || t

      localStorage.setItem(STORAGE_KEYS?.TOKEN || 'token', tokenToStore)
      if (rt) {
        localStorage.setItem(STORAGE_KEYS?.REFRESH_TOKEN || 'refreshToken', rt)
      }
      sessionStorage.removeItem(STORAGE_KEYS?.ADMIN_TOKEN || 'adminToken')
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenToStore}`
      setToken(tokenToStore)
      setUser(u)

      return u
    } catch (err) {
      throw new Error(err.response?.data?.message || "OTP verification failed")
    }
  }

  const register = async (data) => {
    const res = await api.post(AUTH_ENDPOINTS?.REGISTER || '/api/auth/register', data)
    const { token: t, accessToken, refreshToken: rt, user: u } = res.data
    const tokenToStore = accessToken || t

    localStorage.setItem(STORAGE_KEYS?.TOKEN || 'token', tokenToStore)
    if (rt) {
      localStorage.setItem(STORAGE_KEYS?.REFRESH_TOKEN || 'refreshToken', rt)
    }
    sessionStorage.removeItem(STORAGE_KEYS?.ADMIN_TOKEN || 'adminToken')
    api.defaults.headers.common['Authorization'] = `Bearer ${tokenToStore}`
    setToken(tokenToStore)
    setUser(u)
    return u
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS?.TOKEN || 'token')
    localStorage.removeItem(STORAGE_KEYS?.REFRESH_TOKEN || 'refreshToken')
    sessionStorage.removeItem(STORAGE_KEYS?.ADMIN_TOKEN || 'adminToken')
    delete api.defaults.headers.common['Authorization']
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, token, loading, login, register, logout, verifyStaffOtp }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
