import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { staffService, materialService, testService } from '../../services/api'
import { Users, BookOpen, FileText, BarChart3, ArrowRight, TrendingUp } from 'lucide-react'

export default function StaffDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ students: 0, materials: 0, tests: 0, results: 0 })
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      staffService.getStudents().catch(() => ({ data: [] })),
      materialService.getAll().catch(() => ({ data: [] })),
      testService.getAll().catch(() => ({ data: [] })),
    ]).then(([s, m, t]) => {
      // Each service returns { data: [...] } from axios
      // but your backend returns the array directly (not wrapped in { data: [] })
      // so we check both shapes:
      const studs     = Array.isArray(s.data) ? s.data : []
      const mats      = Array.isArray(m.data) ? m.data : []
      const tests     = Array.isArray(t.data) ? t.data : []

      setStudents(studs.slice(0, 5))
      setStats({
        students:  studs.length,
        materials: mats.length,
        tests:     tests.length,
        results:   0,           // no results endpoint on staff yet
      })
    }).finally(() => setLoading(false))
  }, [])

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
      <div className="animate-fade-up">
        <p className="text-ink-500 text-sm mb-1">{greeting} 👋</p>
        <h1 className="page-title">{user?.name ?? 'Staff'}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up animate-delay-100">
        {statCards.map(({ icon: Icon, color, label, value }) => (
          <div key={label} className="stat-card">
            <div className={`w-9 h-9 ${colorMap[color]} rounded-xl flex items-center justify-center mb-2`}>
              <Icon size={16} />
            </div>
            <p className="text-ink-500 text-xs">{label}</p>
            <p className="font-display font-700 text-2xl text-ink-50 mt-0.5">
              {loading ? (
                <span className="inline-block w-8 h-6 bg-ink-800 rounded animate-pulse" />
              ) : value}
            </p>
          </div>
        ))}
      </div>

      {/* Quick links */}
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

    </div>
  )
}