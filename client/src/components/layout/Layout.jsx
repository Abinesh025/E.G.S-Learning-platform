import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, BookOpen, FileText, MessageSquare,
  Users, BarChart3, Upload, LogOut, Menu, X,
  GraduationCap, Bell, ChevronDown, Settings, ShieldCheck
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
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const navItems =
    user?.role === 'staff' ? staffNav :
    user?.role === 'admin' ? adminNav :
    studentNav

  const handleLogout = () => {
    logout()
    navigate('/login')
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
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              clsx('nav-link', isActive && 'active')
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User area */}
      <div className="border-t border-ink-800 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-lime-300/10 border border-lime-300/20 flex items-center justify-center">
            <span className="text-lime-300 font-display font-600 text-xs">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-ink-100 text-sm font-500 truncate">{user?.name}</p>
            <p className="text-ink-500 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-ghost w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10">
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-ink-950">
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
        {/* Top bar */}
        <header className="h-14 border-b border-ink-800 bg-ink-950/80 backdrop-blur-sm flex items-center px-4 gap-3 flex-shrink-0">
          <button className="md:hidden btn-ghost p-2" onClick={() => setOpen(true)}>
            <Menu size={18} />
          </button>
          <div className="flex-1" />
          <button className="btn-ghost p-2 relative">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-lime-300 rounded-full" />
          </button>
          <button className="btn-ghost p-2">
            <Settings size={16} />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}