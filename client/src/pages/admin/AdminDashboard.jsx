import { useEffect, useState } from 'react'
import axios from '../../api/axios'
import { Users, GraduationCap, BookOpen, FileText, BarChart3 } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStaff: 0,
    totalStudents: 0,
    totalMaterials: 0,
    totalTests: 0,
    totalResults: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/admin/dashboard')
      .then(res => setStats(res.data.data))
      .finally(() => setLoading(false))
  }, [])

  const cards = [
    { label: 'Total Staff',    value: stats.totalStaff,     icon: Users,        color: 'text-lime-400' },
    { label: 'Total Students', value: stats.totalStudents,  icon: GraduationCap,color: 'text-sky-400'  },
    { label: 'Materials',      value: stats.totalMaterials, icon: BookOpen,     color: 'text-violet-400'},
    { label: 'Tests',          value: stats.totalTests,     icon: FileText,     color: 'text-amber-400'},
    { label: 'Results',        value: stats.totalResults,   icon: BarChart3,    color: 'text-rose-400' },
  ]

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-ink-100 mb-6">Dashboard</h1>

      {loading ? (
        <p className="text-ink-500 text-sm">Loading...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {cards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-ink-900 border border-ink-800 rounded-xl p-4">
              <Icon size={18} className={`${color} mb-3`} />
              <p className="text-ink-500 text-xs mb-1">{label}</p>
              <p className={`text-2xl font-semibold ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}