import { useState, useEffect } from 'react'
import api from '../../services/api'
import { getSocket } from '../../services/socket'
import { useAuth } from '../../context/AuthContext'
import { Users, Search, Trash2, Plus, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'

const empty = { name: '', email: '', phone: '', course: '', batch: '', password: '' }

export default function StaffStudents() {
  const { token } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/staff/students')
      .then(res => setStudents(res.data?.data || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load students'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const socket = getSocket(token)
    const handleDataChanged = (type) => {
      if (type === 'student') load()
    }
    socket.on('data_changed', handleDataChanged)
    return () => socket.off('data_changed', handleDataChanged)
  }, [token])

  const openAdd  = () => { setEditing(null); setForm(empty); setShowModal(true) }
  const openEdit = (s) => { 
    setEditing(s._id); 
    setForm({ name: s.name, email: s.email, phone: s.phone || '', course: s.course || '', batch: s.batch || '', password: '' }); 
    setShowModal(true) 
  }

  const handleSave = async () => {
    setSubmitting(true)
    try {
      if (editing) {
        await api.put(`/staff/students/${editing}`, form)
        toast.success('Student updated')
      } else {
        await api.post('/staff/students', form)
        toast.success('Student created')
      }
      setShowModal(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this student?')) return
    try {
      await api.delete(`/staff/delete/${id}`)
      toast.success('Student removed')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove student')
    }
  }

  const filtered = (students || []).filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Students</h1>
        <div className="flex gap-4">
          <span className="tag-sky badge flex items-center">{students.length} total</span>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={15} /> Add Student
          </button>
        </div>
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
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm whitespace-nowrap">
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
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-3 text-right flex gap-2 justify-end">
                      <button onClick={() => openEdit(s)} className="btn-ghost p-1.5"><Pencil size={14} /></button>
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="btn-ghost p-1.5 text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6 w-96">
            <h2 className="text-ink-100 font-semibold mb-4">{editing ? 'Edit Student' : 'Add Student'}</h2>
            <div className="space-y-3">
              {[['name','Name'],['email','Email'],['phone','Phone'],['course','Course'],['batch','Batch']].map(([field, label]) => (
                <div key={field}>
                  <label className="text-ink-500 text-xs mb-1 block">{label}</label>
                  <input className="input w-full text-sm" value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} />
                </div>
              ))}
              {!editing && (
                <div>
                  <label className="text-ink-500 text-xs mb-1 block">Password</label>
                  <input type="password" className="input w-full text-sm" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setShowModal(false)} className="btn-ghost text-sm">Cancel</button>
              <button onClick={handleSave} disabled={submitting} className="btn-primary text-sm">{submitting ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}