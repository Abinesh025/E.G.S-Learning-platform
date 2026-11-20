import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import {
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  BarChart3,
  Building2,
  Search,
  RefreshCw,
  ArrowRight,
  ArrowUpDown,
  Layers,
  School,
  CheckCircle,
  ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'
import MetaData from '../../components/layout/MetaData'
import LoadingSpinner from '../../components/common/LoadingSpinner'

// Vibrant Department Color Accents
const DEPT_THEMES = {
  CSE: { border: 'border-emerald-500/30', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', bar: 'bg-emerald-500' },
  CSBS: { border: 'border-cyan-500/30', badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30', bar: 'bg-cyan-500' },
  AIDS: { border: 'border-purple-500/30', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30', bar: 'bg-purple-500' },
  IT: { border: 'border-blue-500/30', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30', bar: 'bg-blue-500' },
  BME: { border: 'border-rose-500/30', badge: 'bg-rose-500/10 text-rose-400 border-rose-500/30', bar: 'bg-rose-500' },
  CIVIL: { border: 'border-amber-500/30', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30', bar: 'bg-amber-500' },
  ECE: { border: 'border-indigo-500/30', badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30', bar: 'bg-indigo-500' },
  EEE: { border: 'border-yellow-500/30', badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', bar: 'bg-yellow-500' },
  MECH: { border: 'border-orange-500/30', badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30', bar: 'bg-orange-500' },
  MBA: { border: 'border-pink-500/30', badge: 'bg-pink-500/10 text-pink-400 border-pink-500/30', bar: 'bg-pink-500' },
  MCA: { border: 'border-teal-500/30', badge: 'bg-teal-500/10 text-teal-400 border-teal-500/30', bar: 'bg-teal-500' },
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStaff: 0,
    totalStudents: 0,
    totalMaterials: 0,
    totalTests: 0,
    totalResults: 0,
    departments: [],
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Department Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('')
  const [viewFilter, setViewFilter] = useState('all') // 'all' | 'staff' | 'students'
  const [sortBy, setSortBy] = useState('id') // 'id' | 'total' | 'students' | 'staff' | 'name'

  const fetchStats = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    api.get('/api/admin/dashboard')
      .then(r => {
        setStats(r.data?.data || {})
      })
      .catch(err => toast.error(err.response?.data?.message || 'Failed to fetch dashboard stats'))
      .finally(() => {
        setLoading(false)
        setRefreshing(false)
      })
  }

  useEffect(() => {
    fetchStats()
  }, [])

  // Top platform summary cards
  const summaryCards = [
    { label: 'Total Staff', value: stats.totalStaff || 0, icon: Users, color: 'text-lime-400', link: '/admin/staff' },
    { label: 'Total Students', value: stats.totalStudents || 0, icon: GraduationCap, color: 'text-sky-400', link: '/admin/students' },
    { label: 'Materials', value: stats.totalMaterials || 0, icon: BookOpen, color: 'text-violet-400', link: '/admin/materials' },
    { label: 'Tests', value: stats.totalTests || 0, icon: FileText, color: 'text-amber-400', link: '/admin/tests' },
    { label: 'Results', value: stats.totalResults || 0, icon: BarChart3, color: 'text-cyan-400', link: '/admin/results' },
  ]

  // Filtered and sorted department KPI list
  const filteredDepartments = useMemo(() => {
    let list = Array.isArray(stats.departments) ? [...stats.departments] : []

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(d =>
        (d.departmentName && d.departmentName.toLowerCase().includes(q)) ||
        (d.departmentCode && d.departmentCode.toLowerCase().includes(q)) ||
        (d.prefixCode && d.prefixCode.toLowerCase().includes(q))
      )
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'total') return (b.totalMembers || 0) - (a.totalMembers || 0)
      if (sortBy === 'students') return (b.studentCount || 0) - (a.studentCount || 0)
      if (sortBy === 'staff') return (b.staffCount || 0) - (a.staffCount || 0)
      if (sortBy === 'name') return (a.departmentName || '').localeCompare(b.departmentName || '')
      return Number(a.departmentId || 0) - Number(b.departmentId || 0)
    })

    return list
  }, [stats.departments, searchQuery, sortBy])

  return (
    <div className="p-6 space-y-8">
      <MetaData title="Admin Dashboard | Academic Hub" />

      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-ink-800">
        <div>
          <h1 className="text-2xl font-bold text-ink-100 flex items-center gap-2.5">
            <School className="w-7 h-7 text-lime-400" />
            Institutional Dashboard
          </h1>
          <p className="text-sm text-ink-400 mt-1">
            Real-time analytics, resource tracking, and department-wise Details for faculty and students.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchStats(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-ink-800 text-ink-200 hover:bg-ink-700 hover:text-white border border-ink-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-lime-400' : ''}`} />
            Refresh Metrics
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center">
          <LoadingSpinner />
          <p className="text-xs text-ink-400 mt-3">Aggregating departmental metrics...</p>
        </div>
      ) : (
        <>
          {/* ── Overall Platform Metrics ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-400 flex items-center gap-2">
                <Layers className="w-4 h-4 text-lime-400" /> Platform Overview
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {summaryCards.map(({ label, value, icon: Icon, color, link }) => (
                <Link
                  key={label}
                  to={link}
                  className="bg-ink-900 border border-ink-800 rounded-xl p-4 hover:border-ink-700 hover:shadow-lg hover:shadow-ink-900/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer group block"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Icon size={18} className={`${color} group-hover:scale-110 transition-transform duration-300`} />
                    <ArrowRight size={14} className="text-ink-600 group-hover:text-ink-300 transition-colors" />
                  </div>
                  <p className="text-ink-500 text-xs mb-1 font-medium">{label}</p>
                  <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Department-Wise KPI Tiles Section ── */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-ink-800/80">
              <div>
                <h2 className="text-lg font-bold text-ink-100 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-sky-400" />
                  Department-Wise Details  (Staff & Students)
                </h2>
                <p className="text-xs text-ink-400 mt-0.5">
                  Detailed distribution of faculty and student strength across departments.
                </p>
              </div>

              {/* Filtering & Sorting Controls */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Search */}
                <div className="relative min-w-[190px]">
                  <Search className="w-3.5 h-3.5 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search department..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-ink-900 border border-ink-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-ink-200 placeholder-ink-500 focus:outline-none focus:border-sky-400 transition"
                  />
                </div>

                {/* View Focus Selector */}
                <div className="flex items-center bg-ink-900 border border-ink-800 rounded-lg p-0.5">
                  {[
                    { id: 'all', label: 'All View' },
                    { id: 'staff', label: 'Staff Focus' },
                    { id: 'students', label: 'Students Focus' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setViewFilter(tab.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                        viewFilter === tab.id
                          ? 'bg-ink-800 text-white shadow-sm'
                          : 'text-ink-400 hover:text-ink-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Sort Option */}
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-ink-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-ink-900 border border-ink-700 rounded-lg px-2.5 py-1.5 text-xs text-ink-200 focus:outline-none focus:border-sky-400"
                  >
                    <option value="id">Department Order</option>
                    <option value="total">Most Members</option>
                    <option value="students">Most Students</option>
                    <option value="staff">Most Staff</option>
                    <option value="name">Alphabetical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── KPI Tiles Grid ── */}
            {filteredDepartments.length === 0 ? (
              <div className="p-12 text-center bg-ink-900/40 rounded-xl border border-ink-800">
                <Building2 className="w-10 h-10 mx-auto text-ink-600 mb-2" />
                <p className="text-sm font-medium text-ink-300">No departments match your filter</p>
                <p className="text-xs text-ink-500 mt-1">Try clearing your search query or sorting options.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredDepartments.map((dept) => {
                  const theme = DEPT_THEMES[dept.departmentCode] || {
                    border: 'border-ink-800',
                    badge: 'bg-ink-800 text-ink-300 border-ink-700',
                    bar: 'bg-lime-500',
                  }

                  const studentPercent = dept.totalMembers > 0
                    ? Math.round((dept.studentCount / dept.totalMembers) * 100)
                    : 0
                  const staffPercent = dept.totalMembers > 0
                    ? 100 - studentPercent
                    : 0

                  return (
                    <div
                      key={dept.departmentId}
                      className={`bg-ink-900/90 rounded-2xl border ${theme.border} p-5 hover:border-ink-700 hover:shadow-xl hover:shadow-ink-950/60 transition-all duration-300 flex flex-col justify-between group`}
                    >
                      {/* Tile Header */}
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md border font-mono ${theme.badge}`}>
                              {dept.departmentCode || `DEPT-${dept.departmentId}`}
                            </span>
                            {dept.prefixCode && (
                              <span className="text-[11px] font-mono text-ink-400 bg-ink-800/80 px-2 py-0.5 rounded border border-ink-700/60">
                                {dept.prefixCode}
                              </span>
                            )}
                          </div>

                          <span className="text-[11px] font-semibold text-ink-400 bg-ink-950/60 px-2.5 py-0.5 rounded-full border border-ink-800">
                            {dept.totalMembers} Members
                          </span>
                        </div>

                        <h3 className="text-sm font-semibold text-ink-100 group-hover:text-white transition-colors line-clamp-1 mb-4" title={dept.departmentName}>
                          {dept.departmentName}
                        </h3>

                        {/* KPI Metric Blocks (Staff & Students) */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          {/* Staff KPI Tile */}
                          <Link
                            to={`/admin/staff?dept=${encodeURIComponent(dept.departmentName)}`}
                            className={`p-3 rounded-xl border transition-all duration-200 block cursor-pointer ${
                              viewFilter === 'students'
                                ? 'bg-ink-950/40 border-ink-800/60 opacity-70'
                                : 'bg-lime-950/20 border-lime-500/20 hover:border-lime-500/50 hover:bg-lime-950/30'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs text-lime-400 mb-1.5 font-medium">
                              <span className="flex items-center gap-1.5">
                                <Users size={14} /> Staff
                              </span>
                              <ExternalLink size={12} className="opacity-60 group-hover:opacity-100" />
                            </div>
                            <p className="text-2xl font-bold text-ink-100">
                              {dept.staffCount}
                            </p>
                            <p className="text-[10px] text-ink-400 mt-1 flex items-center justify-between">
                              <span>Faculty count</span>
                              <span className="text-lime-400/80 font-mono font-medium">
                                {dept.totalMembers > 0 ? `${staffPercent}%` : '0%'}
                              </span>
                            </p>
                          </Link>

                          {/* Student KPI Tile */}
                          <Link
                            to={`/admin/students?dept=${encodeURIComponent(dept.departmentName)}`}
                            className={`p-3 rounded-xl border transition-all duration-200 block cursor-pointer ${
                              viewFilter === 'staff'
                                ? 'bg-ink-950/40 border-ink-800/60 opacity-70'
                                : 'bg-sky-950/20 border-sky-500/20 hover:border-sky-500/50 hover:bg-sky-950/30'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs text-sky-400 mb-1.5 font-medium">
                              <span className="flex items-center gap-1.5">
                                <GraduationCap size={14} /> Students
                              </span>
                              <ExternalLink size={12} className="opacity-60 group-hover:opacity-100" />
                            </div>
                            <p className="text-2xl font-bold text-ink-100">
                              {dept.studentCount}
                            </p>
                            <p className="text-[10px] text-ink-400 mt-1 flex items-center justify-between">
                              <span>Enrolled cohort</span>
                              <span className="text-sky-400/80 font-mono font-medium">
                                {dept.totalMembers > 0 ? `${studentPercent}%` : '0%'}
                              </span>
                            </p>
                          </Link>
                        </div>

                        {/* Ratio / Distribution Progress Bar */}
                        <div className="space-y-1.5 bg-ink-950/50 p-2.5 rounded-lg border border-ink-800/60 mb-3">
                          <div className="flex items-center justify-between text-[11px] text-ink-400">
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-lime-400" /> {dept.staffCount} Staff
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-sky-400" /> {dept.studentCount} Students
                            </span>
                          </div>

                          <div className="w-full h-1.5 rounded-full bg-ink-800 flex overflow-hidden">
                            <div
                              style={{ width: `${staffPercent}%` }}
                              className="h-full bg-lime-400 transition-all duration-500"
                              title={`Staff: ${staffPercent}%`}
                            />
                            <div
                              style={{ width: `${studentPercent}%` }}
                              className="h-full bg-sky-400 transition-all duration-500"
                              title={`Students: ${studentPercent}%`}
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-ink-500">
                            <span>Ratio (Staff : Student)</span>
                            <span className="font-mono text-ink-300 font-medium">
                              {dept.staffCount > 0
                                ? `1 : ${(dept.studentCount / dept.staffCount).toFixed(1)}`
                                : dept.studentCount > 0 ? '0 : All' : '0 : 0'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tile Footer: Academic Resources */}
                      <div className="pt-3 border-t border-ink-800/80 flex items-center justify-between text-xs text-ink-400">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[11px] text-ink-400" title="Department Materials">
                            <BookOpen size={13} className="text-violet-400" /> {dept.materialCount || 0}
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-ink-400" title="Department Tests">
                            <FileText size={13} className="text-amber-400" /> {dept.testCount || 0}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/staff?dept=${encodeURIComponent(dept.departmentName)}`}
                            className="text-[11px] text-lime-400 hover:text-lime-300 transition font-medium"
                          >
                            Staff →
                          </Link>
                          <span className="text-ink-600">•</span>
                          <Link
                            to={`/admin/students?dept=${encodeURIComponent(dept.departmentName)}`}
                            className="text-[11px] text-sky-400 hover:text-sky-300 transition font-medium"
                          >
                            Students →
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── Institutional Department Distribution Summary Table ── */}
          {filteredDepartments.length > 0 && (
            <div className="bg-ink-900 border border-ink-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-ink-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-ink-100 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-sky-400" />
                    Department Comparative Summary
                  </h3>
                  <p className="text-xs text-ink-500">
                    Comprehensive breakdown of staff, student enrollment, and academic resources per department.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-ink-950/60 text-ink-400 uppercase tracking-wider text-[10px] border-b border-ink-800">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Department</th>
                      <th className="px-5 py-3 font-semibold text-right">Faculty / Staff</th>
                      <th className="px-5 py-3 font-semibold text-right">% of Staff</th>
                      <th className="px-5 py-3 font-semibold text-right">Enrolled Students</th>
                      <th className="px-5 py-3 font-semibold text-right">% of Students</th>
                      <th className="px-5 py-3 font-semibold text-right">Total Members</th>
                      <th className="px-5 py-3 font-semibold text-center">Student:Staff Ratio</th>
                      <th className="px-5 py-3 font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-800/60">
                    {filteredDepartments.map((dept) => {
                      const staffShare = stats.totalStaff > 0
                        ? ((dept.staffCount / stats.totalStaff) * 100).toFixed(1)
                        : '0.0'
                      const studentShare = stats.totalStudents > 0
                        ? ((dept.studentCount / stats.totalStudents) * 100).toFixed(1)
                        : '0.0'

                      return (
                        <tr key={dept.departmentId} className="hover:bg-ink-800/40 transition">
                          <td className="px-5 py-3 font-medium text-ink-100 flex items-center gap-2">
                            <span className="font-mono px-1.5 py-0.5 rounded text-[10px] font-bold bg-ink-800 text-ink-300 border border-ink-700">
                              {dept.departmentCode}
                            </span>
                            <span>{dept.departmentName}</span>
                          </td>
                          <td className="px-5 py-3 text-right font-mono font-semibold text-lime-400">
                            {dept.staffCount}
                          </td>
                          <td className="px-5 py-3 text-right text-ink-400 font-mono text-[11px]">
                            {staffShare}%
                          </td>
                          <td className="px-5 py-3 text-right font-mono font-semibold text-sky-400">
                            {dept.studentCount}
                          </td>
                          <td className="px-5 py-3 text-right text-ink-400 font-mono text-[11px]">
                            {studentShare}%
                          </td>
                          <td className="px-5 py-3 text-right font-mono font-bold text-ink-100">
                            {dept.totalMembers}
                          </td>
                          <td className="px-5 py-3 text-center text-ink-300 font-mono text-[11px]">
                            {dept.staffCount > 0
                              ? `${(dept.studentCount / dept.staffCount).toFixed(1)} : 1`
                              : '—'}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                to={`/admin/staff?dept=${encodeURIComponent(dept.departmentName)}`}
                                className="px-2 py-0.5 rounded bg-lime-500/10 text-lime-400 hover:bg-lime-500/20 text-[11px] font-medium transition"
                              >
                                Staff
                              </Link>
                              <Link
                                to={`/admin/students?dept=${encodeURIComponent(dept.departmentName)}`}
                                className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-[11px] font-medium transition"
                              >
                                Students
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
