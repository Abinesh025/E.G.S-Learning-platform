import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import { getSocket } from '../../services/socket'
import { Users, BookOpen, FileText, BarChart3, ArrowRight, TrendingUp, ShieldAlert, Key } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StaffDashboard() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ students: 0, materials: 0, tests: 0, results: 0 })
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminPassword, setAdminPassword] = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/staff/stats').catch(() => ({ data: { stats: {} } })),
      api.get('/staff/students').catch(() => ({ data: { data: [] } }))
    ]).then(([st, s]) => {
      setStats(st.data?.stats || { students: 0, materials: 0, tests: 0, results: 0 })
      setStudents((s.data?.data || []).slice(0, 5))
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const socket = getSocket(token)
    const handleDataChanged = (type) => {
      if (['student', 'material', 'test', 'result'].includes(type)) {
        load()
      }
    }
    socket.on('data_changed', handleDataChanged)
    return () => socket.off('data_changed', handleDataChanged)
  }, [token])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const statCards = [
    { icon: Users,      color: 'sky',    label: 'Students',  value: stats.students  },
    { icon: BookOpen,   color: 'lime',   label: 'Materials', value: stats.materials },
    { icon: FileText,   color: 'amber',  label: 'Tests',     value: stats.tests     },
    { icon: TrendingUp, color: 'purple', label: 'Results',   value: stats.results   },
  ]

  const colorMap = {
    sky:    'bg-sky-400/10 text-sky-400',
    lime:   'bg-lime-300/10 text-lime-300',
    amber:  'bg-amber-400/10 text-amber-400',
    purple: 'bg-purple-400/10 text-purple-400',
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="animate-fade-up flex items-center justify-between">
        <div>
          <p className="text-ink-500 text-sm mb-1">{greeting} 👋</p>
          <h1 className="page-title">{user?.name ?? 'Staff'}</h1>
        </div>
        <button
          onClick={() => setShowAdminModal(true)}
          className="btn-outline border-amber-500/30 text-amber-500 hover:border-amber-500 hover:bg-amber-500/10 flex items-center gap-2 text-sm"
        >
          <ShieldAlert size={16} /> Unlock Admin Mode
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up animate-delay-100">
        {statCards.map(({ icon: Icon, color, label, value }) => {
          const c = colorMap[color] || colorMap.lime
          return (
            <div key={label} className="bg-ink-900 border border-ink-800 rounded-xl p-4 hover:-translate-y-1 hover:shadow-lg hover:shadow-ink-900/50 hover:border-ink-700 transition-all duration-300 group cursor-default">
              <div className={`w-9 h-9 ${c} rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={16} />
              </div>
              <p className="text-ink-500 text-xs mb-1">{label}</p>
              <p className="font-display font-700 text-2xl text-ink-50">{value}</p>
            </div>
          )
        })}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-up animate-delay-200">
        {[
          { to: '/staff/materials', label: 'Upload Material',  desc: 'Add notes, videos, files', icon: BookOpen },
          { to: '/staff/tests',     label: 'Create Test',      desc: 'Build assessments',        icon: FileText },
          { to: '/staff/students',  label: 'Manage Students',  desc: 'View & manage students',   icon: Users    },
        ].map(({ to, label, desc, icon: Icon }) => (
          <Link key={to} to={to}
            className="card p-5 hover:border-lime-300/30 transition-all group flex items-center gap-4">
            <div className="w-10 h-10 bg-ink-800 rounded-xl flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-ink-400 group-hover:text-lime-300 transition-colors" />
            </div>
            <div className="flex-1">
              <p className="text-ink-100 text-sm font-500">{label}</p>
              <p className="text-ink-500 text-xs">{desc}</p>
            </div>
            <ArrowRight size={15} className="text-ink-700 group-hover:text-lime-300 transition-colors" />
          </Link>
        ))}
      </div>

      {/* Recent students */}
      <div className="animate-fade-up animate-delay-300">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">Recent Students</h2>
          <Link to="/staff/students"
            className="text-lime-300 text-sm hover:text-lime-400 flex items-center gap-1">
            View all <ArrowRight size={13} />
          </Link>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 bg-ink-800 rounded animate-pulse" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="p-8 text-center text-ink-500 text-sm">No students yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-800">
                  {['Student', 'Email', 'Joined'].map(h => (
                    <th key={h}
                      className="text-left px-5 py-3 text-ink-500 font-500 text-xs uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students?.map((s, i) => {
                  const initials = s.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
                  return (
                    <tr key={s._id || i} className="table-row">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-ink-800 flex items-center justify-center">
                            <span className="text-ink-400 font-display font-600 text-xs">{initials}</span>
                          </div>
                          <span className="text-ink-200">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-ink-500">{s.email}</td>
                      <td className="px-5 py-3 text-ink-500 text-xs">
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAdminModal && (
        <div className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6 w-80 animate-fade-up space-y-4">
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                <ShieldAlert size={24} className="text-amber-500" />
              </div>
            </div>
            <h2 className="text-ink-100 font-600 text-center">Admin Access</h2>
            <p className="text-ink-500 text-xs text-center">
              Requires an admin override password to temporarily elevate your privileges.
            </p>
            
            <div className="relative">
              <Key size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
              <input
                type="password"
                className="input pl-9 w-full"
                placeholder="Enter admin password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdminUnlock()
                }}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowAdminModal(false)
                  setAdminPassword('')
                }}
                className="btn-ghost flex-1"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!adminPassword) return toast.error('Enter password')
                  try {
                    const res = await api.post('/auth/verify-password', { password: adminPassword })
                    localStorage.setItem('adminSecret', res.data.adminToken)
                    toast.success('Admin Mode Unlocked!')
                    navigate('/admin')
                  } catch (err) {
                    toast.error(err.response?.data?.message || 'Verification failed')
                  }
                }}
                className="btn-primary flex-1 bg-amber-500 hover:bg-amber-400 text-ink-950"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}