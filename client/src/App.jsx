import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/layout/Layout'
import LandingPage from './pages/LandingPage'
import { LoginPage, RegisterPage } from './pages/auth/AuthPages'
import StudentDashboard from './pages/student/StudentDashboard'
import StudentMaterials from './pages/student/StudentMaterials'
import StudentTests from './pages/student/StudentTests'
import StudentResults from './pages/student/StudentResults'
import ChatPage from './pages/student/ChatPage'
import StaffDashboard from './pages/staff/StaffDashboard'
import StaffStudents from './pages/staff/StaffStudents'
import StaffMaterials from './pages/staff/StaffMaterials'
import StaffTests from './pages/staff/StaffTests'
import StaffResults from './pages/staff/StaffResults'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminStaff from './pages/admin/AdminStaff'
import AdminStudents from './pages/admin/AdminStudents'
import AdminMaterials from './pages/admin/AdminMaterials'
import AdminTests from './pages/admin/AdminTests'
import AdminResults from './pages/admin/AdminResults'

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />

  // Admin Override
  const hasAdminSecret = !!localStorage.getItem('adminSecret')
  if (role === 'admin' && user.role === 'staff' && hasAdminSecret) {
    return children
  }

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

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />

  const homeRedirect = user?.role === 'staff' ? '/staff' : user?.role === 'admin' ? '/admin' : '/student'

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={user ? <Navigate to={homeRedirect} replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to={homeRedirect} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={homeRedirect} replace /> : <RegisterPage />} />

      {/* Student routes */}
      <Route path="/student" element={<ProtectedRoute role="student"><Layout><StudentDashboard /></Layout></ProtectedRoute>} />
      <Route path="/student/materials" element={<ProtectedRoute role="student"><Layout><StudentMaterials /></Layout></ProtectedRoute>} />
      <Route path="/student/tests" element={<ProtectedRoute role="student"><Layout><StudentTests /></Layout></ProtectedRoute>} />
      <Route path="/student/results" element={<ProtectedRoute role="student"><Layout><StudentResults /></Layout></ProtectedRoute>} />
      <Route path="/student/chat" element={<ProtectedRoute role="student"><Layout><ChatPage /></Layout></ProtectedRoute>} />

      {/* Staff routes */}
      <Route path="/staff" element={<ProtectedRoute role="staff"><Layout><StaffDashboard /></Layout></ProtectedRoute>} />
      <Route path="/staff/students" element={<ProtectedRoute role="staff"><Layout><StaffStudents /></Layout></ProtectedRoute>} />
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

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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