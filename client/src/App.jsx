import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout  from './components/layout/Layout'
import LandingPage from './pages/LandingPage'
import { LoginPage, RegisterPage } from './pages/auth/AuthPages'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentMaterials from './pages/student/StudentMaterials'
import StudentTests from './pages/student/StudentTests'
import StudentResults from './pages/student/StudentResults'
import ChatPage from './pages/student/ChatPage'
import StaffDashboard from './pages/staff/StaffDashboard'
import StaffMaterials from './pages/staff/StaffMaterials'
import StaffTests from './pages/staff/StaffTests'
import StaffResults from './pages/staff/StaffResults'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminStaff from './pages/admin/AdminStaff'
import AdminStudents from './pages/admin/AdminStudents'
import AdminMaterials from './pages/admin/AdminMaterials'
import AdminTests from './pages/admin/AdminTests'
import AdminResults from './pages/admin/AdminResults'
import AdminLogin from './pages/admin/AdminLogin'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Ai from './pages/Ai/Ai'

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />

  // Admin Security - Requires JWT token from session storage
  if (role === 'admin') {
    const hasAdminToken = !!sessionStorage.getItem('adminToken')
    if (hasAdminToken) {
      return children
    }
    return <Navigate to="/admin-login" replace />
  }

  if (!user) return <Navigate to="/login" replace />

  // Normal role checks
  if (role && user.role !== role) {
    const redirect = user.role === 'staff' ? '/staff' : user.role === 'admin' ? '/admin' : '/student'
    return <Navigate to={redirect} replace />
  }
  return children
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-ink-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-lime-300 border-t-transparent rounded-full animate-spin" />
        <p className="text-ink-500 text-sm">Loading…</p>
      </div>
    </div>
  )
}



import { Helmet } from 'react-helmet-async'

const routeTitles = {
  '/': 'Home',
  '/login': 'Login',
  '/register': 'Register',
  '/admin-login': 'Admin Login',
  '/student': 'Student Dashboard',
  '/student/materials': 'Materials',
  '/student/tests': 'Tests',
  '/student/results': 'Results',
  '/student/chat': 'Chat',
  '/staff': 'Staff Dashboard',
  '/staff/materials': 'Materials',
  '/staff/tests': 'Tests',
  '/staff/results': 'Results',
  '/staff/chat': 'Chat',
  '/admin': 'Admin Dashboard',
  '/admin/staff': 'Staff Management',
  '/admin/students': 'Student Management',
  '/admin/materials': 'Materials Management',
  '/admin/tests': 'Tests Management',
  '/admin/results': 'Results Management',
}

function DynamicTitle() {
  const location = useLocation()
  const currentTitle = routeTitles[location.pathname] || ''
  const pageTitle = currentTitle ? `${currentTitle} | Academic Hub` : 'Academic Hub'

  return (
    <Helmet>
      <title>{pageTitle}</title>
    </Helmet>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()
  const hasAdminToken = !!sessionStorage.getItem('adminToken')
  const navigate = useNavigate()
  
  useEffect(() => {
    let timeoutId

    const resetTimer = () => {
      clearTimeout(timeoutId)
      // Only set timer if admin is logged in
      if (sessionStorage.getItem('adminToken')) {
        timeoutId = setTimeout(() => {
          sessionStorage.removeItem('adminToken')
          toast.error('Admin session expired due to inactivity')
          window.location.href = '/admin-login'
        }, 15 * 60 * 1000) // 15 mins
      }
    }

    // List of events to listen to
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']
    events.forEach(event => document.addEventListener(event, resetTimer))
    resetTimer()

    return () => {
      clearTimeout(timeoutId)
      events.forEach(event => document.removeEventListener(event, resetTimer))
    }
  }, [])

  if (loading) return <LoadingScreen />

  const homeRedirect = user?.role === 'staff' ? '/staff' : user?.role === 'admin' ? '/admin' : '/student'

  // If admin mode is active, lock all public/unrelated routes back to /admin
  const adminGuard = (element) => hasAdminToken ? <Navigate to="/admin" replace /> : element

  return (
    <>
      <DynamicTitle />
      <Routes>
        {/* Public — blocked when admin mode is active */}
        <Route path="/" element={adminGuard(user ? <Navigate to={homeRedirect} replace /> : <LandingPage />)} />
        <Route path="/login" element={adminGuard(user ? <Navigate to={homeRedirect} replace /> : <LoginPage />)} />
        <Route path="/register" element={adminGuard(user ? <Navigate to={homeRedirect} replace /> : <RegisterPage />)} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Student routes */}
        <Route path="/student" element={<ProtectedRoute role="student"><Layout><StudentDashboard /></Layout></ProtectedRoute>} />
        <Route path="/student/materials" element={<ProtectedRoute role="student"><Layout><StudentMaterials /></Layout></ProtectedRoute>} />
        <Route path="/student/tests" element={<ProtectedRoute role="student"><Layout><StudentTests /></Layout></ProtectedRoute>} />
        <Route path="/student/results" element={<ProtectedRoute role="student"><Layout><StudentResults /></Layout></ProtectedRoute>} />
        <Route path="/student/chat" element={<ProtectedRoute role="student"><Layout><ChatPage /></Layout></ProtectedRoute>} />
        <Route path="/student/ai" element={<ProtectedRoute role="student"><Layout><Ai /></Layout></ProtectedRoute>} />

        {/* Staff routes */}
        <Route path="/staff" element={<ProtectedRoute role="staff"><Layout><StaffDashboard /></Layout></ProtectedRoute>} />
        <Route path="/staff/materials" element={<ProtectedRoute role="staff"><Layout><StaffMaterials /></Layout></ProtectedRoute>} />
        <Route path="/staff/tests" element={<ProtectedRoute role="staff"><Layout><StaffTests /></Layout></ProtectedRoute>} />
        <Route path="/staff/results" element={<ProtectedRoute role="staff"><Layout><StaffResults /></Layout></ProtectedRoute>} />
        <Route path="/staff/chat" element={<ProtectedRoute role="staff"><Layout><ChatPage /></Layout></ProtectedRoute>} />

        {/* Admin routes */}
        <Route path="/admin" element={<ProtectedRoute role="admin"><Layout><AdminDashboard /></Layout></ProtectedRoute>} />
        <Route path="/admin/staff" element={<ProtectedRoute role="admin"><Layout><AdminStaff /></Layout></ProtectedRoute>} />
        <Route path="/admin/students" element={<ProtectedRoute role="admin"><Layout><AdminStudents /></Layout></ProtectedRoute>} />
        <Route path="/admin/materials" element={<ProtectedRoute role="admin"><Layout><AdminMaterials /></Layout></ProtectedRoute>} />
        <Route path="/admin/tests" element={<ProtectedRoute role="admin"><Layout><AdminTests /></Layout></ProtectedRoute>} />
        <Route path="/admin/results" element={<ProtectedRoute role="admin"><Layout><AdminResults /></Layout></ProtectedRoute>} />

        {/* Catch-all — also redirects to /admin if admin mode is on */}
        <Route path="*" element={hasAdminToken ? <Navigate to="/admin" replace /> : <Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'default-toaster',
              style: {
                background: 'rgb(var(--ink-800))',
                color: 'rgb(var(--ink-100))',
                border: '1px solid rgb(var(--ink-700))',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: 'rgb(var(--lime-300))', secondary: 'rgb(var(--ink-950))' } },
              error: { iconTheme: { primary: 'rgb(var(--red-400))', secondary: 'rgb(var(--ink-950))' } },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}