import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { authService } from '../../services/api'
import toast from 'react-hot-toast'
import Navbar from './Navbar'
import Footer from './Footer'
import {
  LayoutDashboard, BookOpen, FileText, MessageSquare,
  Users, BarChart3, Upload, LogOut, Menu, X,
  GraduationCap, Bell, ChevronDown, Settings, ShieldCheck,
  Sun, Moon
} from 'lucide-react'
import clsx from 'clsx'

const studentNav = [
  { to: '/student', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/student/materials', label: 'Materials', icon: BookOpen },
  { to: '/student/tests', label: 'Tests', icon: FileText },
  { to: '/student/results', label: 'My Results', icon: BarChart3 },
  { to: '/student/chat', label: 'Chat', icon: MessageSquare },
]

const staffNav = [
  { to: '/staff', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/staff/students', label: 'Students', icon: Users },
  { to: '/staff/materials', label: 'Materials', icon: BookOpen },
  { to: '/staff/tests', label: 'Tests', icon: FileText },
  { to: '/staff/results', label: 'Results', icon: BarChart3 },
  { to: '/staff/chat', label: 'Chat', icon: MessageSquare },
]

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/staff', label: 'Staff', icon: Users },
  { to: '/admin/students', label: 'Students', icon: GraduationCap },
  { to: '/admin/materials', label: 'Materials', icon: BookOpen },
  { to: '/admin/tests', label: 'Tests', icon: FileText },
  { to: '/admin/results', label: 'Results', icon: BarChart3 },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { isLight, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  
  // Navigation verification state
  const [showNavModal, setShowNavModal] = useState(false)
  const [pendingNav, setPendingNav] = useState(null)

  // Profile Edit State
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileData, setProfileData] = useState({ name: '', password: '', file: null })
  const [isUpdating, setIsUpdating] = useState(false)

  const navItems =
    user?.role === 'staff' ? staffNav :
    user?.role === 'admin' ? adminNav :
    studentNav

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setIsUpdating(true)
    try {
      const formData = new FormData()
      if (profileData.name) formData.append('name', profileData.name)
      if (profileData.password) formData.append('password', profileData.password)
      if (profileData.file) formData.append('avatar', profileData.file)

      const res = await authService.updateProfile(formData)
      window.location.reload() // Fast & unified way to refresh auth state everywhere
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setIsUpdating(false)
    }
  }

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  const roleBadgeClass =
    user?.role === 'staff' ? 'tag-lime' :
    user?.role === 'admin' ? 'tag-red' :
    'tag-sky'

  const roleLabel =
    user?.role === 'staff' ? '★ Staff' :
    user?.role === 'admin' ? '⬡ Admin' :
    '◆ Student'

  const Sidebar = () => (
    <aside className="flex flex-col h-full w-64 bg-ink-900 border-r border-ink-800">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-ink-800">
        <div className="w-8 h-8 bg-lime-300 rounded-lg flex items-center justify-center">
          <GraduationCap size={16} className="text-ink-950" />
        </div>
        <span className="font-display font-700 text-ink-50 text-lg tracking-tight">
          EduPortal
        </span>
      </div>

      {/* Role badge */}
      <div className="px-5 py-3">
        <span className={clsx('badge text-xs', roleBadgeClass)}>
          {roleLabel}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const { to, label, icon: Icon, end } = item
          // Helper to determine if active manually:
          const isActive = end ? window.location.pathname === to : window.location.pathname.startsWith(to)
          return (
            <button
              key={to}
              onClick={() => {
                setOpen(false)
                if (isActive) return // Do nothing if already there
                
                const isStaffInAdmin = user?.role === 'staff' && localStorage.getItem('adminSecret') && window.location.pathname.startsWith('/admin')
                
                if (isStaffInAdmin && to.startsWith('/staff')) {
                  setPendingNav(item)
                  setShowNavModal(true)
                } else {
                  navigate(to)
                }
              }}
              className={clsx('nav-link w-full text-left', isActive && 'active')}
            >
              <Icon size={16} />
              {label}
            </button>
          )
        })}
      </nav>

      {/* User area */}
      <div className="border-t border-ink-800 p-4 space-y-2">
        <button
          onClick={() => {
            setProfileData({ name: user?.name || '', password: '', file: null })
            setShowProfileModal(true)
          }}
          className="w-full flex items-center gap-3 mb-3 p-2 rounded-xl hover:bg-ink-800 transition-colors text-left"
        >
          {user?.avatar ? (
            <img 
              src={`${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : ''}${user.avatar}`} 
              alt="Avatar" 
              className="w-9 h-9 rounded-xl object-cover border border-ink-700" 
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-lime-300/10 border border-lime-300/20 flex items-center justify-center">
              <span className="text-lime-300 font-display font-600 text-xs">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-ink-100 text-sm font-500 truncate">{user?.name}</p>
            <p className="text-ink-500 text-xs truncate">Edit Profile</p>
          </div>
        </button>

        {user?.role === 'staff' && localStorage.getItem('adminSecret') && (
          <button
            onClick={() => setShowExitModal(true)}
            className="btn-ghost w-full justify-start text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
          >
            <ShieldCheck size={14} />
            Exit Admin Mode
          </button>
        )}

        <button 
          onClick={() => {
            if (user?.role === 'staff' && localStorage.getItem('adminSecret')) {
              toast.error('Please exit Admin Mode before signing out')
              return
            }
            setShowLogoutModal(true)
          }} 
          className="btn-ghost w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-ink-950">
      
      {/* Profile Edit Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-ink-900 border border-ink-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in-up">
            <form onSubmit={handleProfileUpdate} className="p-6">
              <h3 className="text-lg font-600 text-ink-100 mb-4 font-display">
                Edit Profile
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-ink-400 mb-1">Avatar Image (Optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProfileData({ ...profileData, file: e.target.files[0] })}
                    className="w-full text-sm text-ink-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-sky-400/10 file:text-sky-400 hover:file:bg-sky-400/20 transition-colors cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs text-ink-400 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full bg-ink-950 border border-ink-800 rounded-xl px-4 py-2 text-ink-100 text-sm focus:outline-none focus:border-sky-500"
                    placeholder="Enter your name"
                  />
                </div>

                <div>
                  <label className="block text-xs text-ink-400 mb-1">New Password (Optional)</label>
                  <input
                    type="password"
                    value={profileData.password}
                    onChange={(e) => setProfileData({ ...profileData, password: e.target.value })}
                    className="w-full bg-ink-950 border border-ink-800 rounded-xl px-4 py-2 text-ink-100 text-sm focus:outline-none focus:border-sky-500"
                    placeholder="Leave blank to keep unchanged"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="flex-1 px-4 py-2 border border-ink-700 bg-ink-800/50 hover:bg-ink-800 
                           text-ink-300 rounded-xl text-sm font-500 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50
                           text-ink-950 rounded-xl text-sm font-600 transition shadow-lg shadow-sky-500/20"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Navigation Modal */}
      {showNavModal && pendingNav && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-ink-900 border border-ink-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="p-6">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                <ShieldCheck size={24} className="text-amber-500" />
              </div>
              <h3 className="text-lg font-600 text-ink-100 mb-2 font-display">
                Exit Admin Mode?
              </h3>
              <p className="text-sm text-ink-400 leading-relaxed mb-6">
                Are you sure you want to lock the admin controls, exit Admin Mode, and go to {pendingNav.label}?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNavModal(false)
                    setPendingNav(null)
                  }}
                  className="flex-1 px-4 py-2 border border-ink-700 bg-ink-800/50 hover:bg-ink-800 
                           text-ink-300 rounded-xl text-sm font-500 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('adminSecret')
                    navigate(pendingNav.to)
                    setShowNavModal(false)
                    setPendingNav(null)
                  }}
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 
                           text-ink-950 rounded-xl text-sm font-600 transition shadow-lg shadow-amber-500/20"
                >
                  Yes, Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-ink-900 border border-ink-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="p-6">
              <div className="w-12 h-12 rounded-xl bg-red-400/10 flex items-center justify-center mb-4">
                <LogOut size={24} className="text-red-400" />
              </div>
              <h3 className="text-lg font-600 text-ink-100 mb-2 font-display">
                Sign Out?
              </h3>
              <p className="text-sm text-ink-400 leading-relaxed mb-6">
                Are you sure you want to sign out of your account? You will need to log back in to access your dashboard.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-2 border border-ink-700 bg-ink-800/50 hover:bg-ink-800 
                           text-ink-300 rounded-xl text-sm font-500 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(false)
                    handleLogout()
                  }}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-400 
                           text-ink-950 rounded-xl text-sm font-600 transition shadow-lg shadow-red-500/20"
                >
                  Yes, Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exit Admin Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-ink-900 border border-ink-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-fade-in-up">
            <div className="p-6">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                <ShieldCheck size={24} className="text-amber-500" />
              </div>
              <h3 className="text-lg font-600 text-ink-100 mb-2 font-display">
                Exit Admin Mode?
              </h3>
              <p className="text-sm text-ink-400 leading-relaxed mb-6">
                Are you sure you want to lock the admin controls and return to your standard Staff Dashboard?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExitModal(false)}
                  className="flex-1 px-4 py-2 border border-ink-700 bg-ink-800/50 hover:bg-ink-800 
                           text-ink-300 rounded-xl text-sm font-500 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('adminSecret')
                    setShowExitModal(false)
                    navigate('/staff')
                  }}
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 
                           text-ink-950 rounded-xl text-sm font-600 transition shadow-lg shadow-amber-500/20"
                >
                  Yes, Exit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="flex-shrink-0">
            <Sidebar />
          </div>
          <div className="flex-1 bg-ink-950/80 backdrop-blur-sm" onClick={() => setOpen(false)} />
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setOpen(true)} />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
          <Footer />
        </main>
      </div>
    </div>
  )
}