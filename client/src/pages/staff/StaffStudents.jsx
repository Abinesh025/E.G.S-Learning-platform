import { useState, useEffect } from 'react'
import { staffService } from '../../services/api'
import { Users, Search, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StaffStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Load students from API
  const load = () => {
    setLoading(true)
    staffService.getStudents()
      .then(res => {
        // Access the actual array of students
        setStudents(res.data?.data || [])
      })
      .catch(() => toast.error('Failed to load students'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  // Handle delete student
  const handleDelete = async (id) => {
    if (!confirm('Remove this student?')) return
    try {
      await staffService.delete(id)
      toast.success('Student removed')
      // Remove student from state
      setStudents(prev => prev.filter(u => u._id !== id))
    } catch {
      toast.error('Failed to remove student')
    }
  }

  // Filter students based on search term
  const filtered = (students || []).filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Students</h1>
        <span className="tag-sky badge">{students.length} total</span>
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
        <input
          className="input pl-9"
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-ink-500 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={32} className="text-ink-700 mx-auto mb-3" />
            <p className="text-ink-500 text-sm">
              {search ? 'No matching students' : 'No students yet'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-800">
                <th className="text-left px-5 py-3 text-ink-500 font-500 text-xs uppercase tracking-wider">Name</th>
                <th className="text-left px-5 py-3 text-ink-500 font-500 text-xs uppercase tracking-wider">Email</th>
                <th className="text-left px-5 py-3 text-ink-500 font-500 text-xs uppercase tracking-wider">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const initials = s.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
                return (
                  <tr key={s._id || i} className="table-row">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-sky-400/10 border border-sky-400/20 flex items-center justify-center">
                          <span className="text-sky-400 font-display font-600 text-xs">{initials}</span>
                        </div>
                        <span className="text-ink-200 font-500">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-500">{s.email}</td>
                    <td className="px-5 py-3 text-ink-500 text-xs">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="btn-ghost py-1 px-2 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}