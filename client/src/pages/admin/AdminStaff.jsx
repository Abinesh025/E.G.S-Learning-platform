import api from '../../services/api'
import { getSocket } from '../../services/socket'
import { useAuth } from '../../context/AuthContext'
import { Pencil, Trash2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'

const empty = { name: '', email: '', phone: '', department: '', password: '' }

export default function AdminStaff() {
  const { token } = useAuth()
  const [staff, setStaff]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(empty)
  const [search, setSearch]     = useState('')

 
  const fetch = () => {
    setLoading(true)
    api.get('/admin/staff')
      .then(r => setStaff(r.data.data))
      .catch(err => toast.error(err.response?.data?.message || 'Failed to fetch staff'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { 
    fetch() 
    const socket = getSocket(token);
    const handleDataChanged = (type) => { if (type === 'staff') fetch() }
    socket.on('data_changed', handleDataChanged);
    return () => socket.off('data_changed', handleDataChanged);
  }, [token])

  const openAdd  = () => { setEditing(null); setForm(empty); setShowModal(true) }
  const openEdit = s  => { setEditing(s._id); setForm({ name: s.name, email: s.email, phone: s.phone || '', department: s.department || '', password: '' }); setShowModal(true) }

  const handleSave = async () => {
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password

      if (editing) await api.put(`/admin/staff/${editing}`, payload)
      else         await api.post('/admin/staff', payload)
      toast.success(editing ? 'Staff updated' : 'Staff created')
      setShowModal(false)
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this staff member?')) return
    try {
      await api.delete(`/admin/staff/${id}`)
      toast.success('Staff deleted')
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    }
  }

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-ink-100">Staff</h1>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> Add Staff
        </button>
      </div>

      <div className="bg-ink-900 border border-ink-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-ink-800">
          <input
            className="input w-64 text-sm"
            placeholder="Search staff..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="text-ink-500 text-sm p-4">Loading...</p>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm whitespace-nowrap">
              <thead className="text-ink-500 text-xs uppercase border-b border-ink-800">
              <tr>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Department</th>
                <th className="px-5 py-3 text-left">Phone</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left sticky right-0 bg-ink-900 border-l border-ink-800 z-10 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.5)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s._id} className="border-t border-ink-800 hover:bg-ink-800/40">
                  <td className="px-5 py-3">
                    <p className="text-ink-100 font-medium">{s.name}</p>
                    <p className="text-ink-500 text-xs">{s.email}</p>
                  </td>
                  <td className="px-5 py-3 text-ink-300">{s.department || '—'}</td>
                  <td className="px-5 py-3 text-ink-300">{s.phone || '—'}</td>
                  <td className="px-5 py-3">
                    <span className={`badge text-xs ${s.isActive !== false ? 'tag-lime' : 'tag-red'}`}>
                      {s.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3 sticky right-0 bg-ink-900 border-l border-ink-800 z-10 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.5)]">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(s)} className="btn-ghost p-1.5"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(s._id)} className="btn-ghost p-1.5 text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-ink-500">No staff found</td></tr>
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-ink-100 font-semibold mb-4">{editing ? 'Edit Staff' : 'Add Staff'}</h2>
            <div className="space-y-3">
              {[['name','Name'],['email','Email'],['phone','Phone'],['department','Department']].map(([field, label]) => (
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
              <button onClick={handleSave} className="btn-primary text-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}