import api from '../../services/api'
import { getSocket } from '../../services/socket'
import { useAuth } from '../../context/AuthContext'
import { Pencil, Trash2, Plus, FileSpreadsheet } from 'lucide-react'
import toast from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { DEPART_CHECKER } from '../../utils/deptChecker'
import BulkStudentUploadModal from '../../components/admin/BulkStudentUploadModal'
import Pagination from '../../components/common/Pagination'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { ACADEMIC_YEARS_ARRAY, STATUS, MIGRATED_STATUS, PAGINATION } from '../../common'

const empty = { name: '', email: '', phone: '', regnum: '', batch: '', department: '', year: 'First Year', password: '', isActive: STATUS.ACTIVE }

export default function AdminStudents() {
  const { token } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(empty)
  const [search, setSearch]     = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize]       = useState(PAGINATION?.DEFAULT_LIMIT || 50)
    
  const fetch = () => {
    setLoading(true)
    api.get('/api/admin/students')
      .then(r => setStudents(r.data.data))
      .catch(err => toast.error(err.response?.data?.message || 'Failed to fetch students'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { 
    fetch(); 
    const socket = getSocket(token);
    const handleDataChanged = (type) => { if (type === 'student') fetch() }
    socket.on('data_changed', handleDataChanged);
    return () => socket.off('data_changed', handleDataChanged);
  }, [token])

  const openAdd  = () => { setEditing(null); setForm(empty); setShowModal(true) }
  const openEdit = s  => { setEditing(s._id); setForm({ name: s.name, email: s.email, regnum: s.regnum, phone: s.phone || '', batch: s.batch || '', department: s.department || '', year: s.yearName || 'First Year', password: '', isActive: Number(s.isActive) === 1 ? 1 : 0 }); setShowModal(true) }

  const handleSave = async () => {
    try {
      const payload = { ...form }

      // Name validation
      if (!payload.name || payload.name.trim().length < 3) {
        toast.error('Name must contain at least 3 characters');
        return;
      }
      if (!/^[A-Za-z\s]+$/.test(payload.name)) {
        toast.error('Name must contain only letters (A-Za-z)');
        return;
      }

      if (!payload.password) delete payload.password
      else {
        // Password validation if provided
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#\-_^()]).{8,}$/;
        if (!passwordRegex.test(payload.password)) {
          toast.error('Password must be at least 8 characters long and include uppercase, lowercase, number, and special character');
          return;
        }
      }

      if (editing) await api.put(`/api/admin/students/${editing}`, payload)
      else         await api.post('/api/admin/students', payload)
      toast.success(editing ? 'Student updated' : 'Student created')
      setShowModal(false)
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this student?')) return
    try {
      await api.delete(`/api/admin/students/${id}`)
      toast.success('Student deleted')
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    }
  }

  const filtered = students.filter(s =>
    (s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.regnum && s.regnum.toLowerCase().includes(search.toLowerCase())) ||
    ((s.studentId || s.studentRefId || s.studentUniqueId || s.uniqueId) && (s.studentId || s.studentRefId || s.studentUniqueId || s.uniqueId).toLowerCase().includes(search.toLowerCase()))) &&
    (departmentFilter === '' || s.department === departmentFilter) &&
    (yearFilter === '' || s.yearName === yearFilter || s.yearCode === yearFilter)
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginatedStudents = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const ACADEMIC_YEARS = ACADEMIC_YEARS_ARRAY.map(yr => yr.value)

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-ink-100">Students</h1>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowBulkModal(true)}
            className="btn-secondary flex items-center gap-2 text-sm py-2 px-3.5"
          >
            <FileSpreadsheet size={16} /> Bulk Upload (Excel)
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm py-2 px-3.5">
            <Plus size={16} /> Add Student
          </button>
        </div>
      </div>

      <div className="bg-ink-900 border border-ink-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-ink-800 flex flex-col sm:flex-row gap-3">
          <input
            className="input w-full sm:w-64 text-sm"
            placeholder="Search students..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
          />
          <select 
            className="input w-full sm:w-48 text-sm"
            value={departmentFilter}
            onChange={e => { setDepartmentFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Departments</option>
            {Object.keys(DEPART_CHECKER).map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select 
            className="input w-full sm:w-40 text-sm"
            value={yearFilter}
            onChange={e => { setYearFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="">All Years</option>
            {ACADEMIC_YEARS.map(yr => (
              <option key={yr} value={yr}>{yr}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm whitespace-nowrap">
                <thead className="text-ink-500 text-xs uppercase border-b border-ink-800">
                <tr>
                  <th className="px-5 py-3 text-left">Name</th>
                  <th className="px-5 py-3 text-left">Department</th>
                  <th className="px-5 py-3 text-left">Student ID</th>
                  <th className="px-5 py-3 text-left">Reg Num</th>
                  <th className="px-5 py-3 text-left">Year</th>
                  <th className="px-5 py-3 text-left">Batch</th>
                  <th className="px-5 py-3 text-left">IsActive</th>
                  <th className="px-5 py-3 text-left">IsMigrated</th>
                  <th className="px-5 py-3 text-left sticky right-0 bg-ink-900 border-l border-ink-800 z-10 shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.5)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map(s => (
                  <tr key={s._id} className="border-t border-ink-800 hover:bg-ink-800/40">
                    <td className="px-5 py-3">
                      <p className="text-ink-100 font-medium">{s.name}</p>
                      <p className="text-ink-500 text-xs">{s.email}</p>
                    </td>
                    <td className="px-5 py-3 text-ink-300">{s.department || '—'}</td>
                    <td className="px-5 py-3 text-ink-300 font-mono text-xs">
                      {s.studentId || s.studentRefId || s.studentUniqueId || s.uniqueId ? (
                        <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold tracking-wider">
                          {s.studentId || s.studentRefId || s.studentUniqueId || s.uniqueId}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3 text-ink-300">{s.regnum || '—'}</td>
                    <td className="px-5 py-3 text-ink-300 font-medium">
                      <span className="px-2 py-0.5 rounded bg-lime-400/10 text-lime-400 border border-lime-400/20 text-xs font-semibold">
                        {s.yearName || s.yearCode || 'First Year'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-300">{s.batch || '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${Number(s.isActive) === 1 ? 'bg-lime-400/10 text-lime-400 border border-lime-400/20' : 'bg-red-400/10 text-red-400 border border-red-400/20'}`} title={Number(s.isActive) === 1 ? 'Active (1)' : 'Inactive (0)'}>
                        <span className={`w-1.5 h-1.5 rounded-full ${Number(s.isActive) === 1 ? 'bg-lime-400' : 'bg-red-400'}`}></span>
                        {Number(s.isActive) === 1 ? '1' : '0'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold ${Number(s.isMigrated) === 1 ? 'bg-purple-400/10 text-purple-400 border border-purple-400/20' : 'bg-ink-800 text-ink-400 border border-ink-700'}`} title={Number(s.isMigrated) === 1 ? 'Migrated (1)' : 'Not Migrated (0)'}>
                        <span className={`w-1.5 h-1.5 rounded-full ${Number(s.isMigrated) === 1 ? 'bg-purple-400' : 'bg-ink-500'}`}></span>
                        {Number(s.isMigrated) === 1 ? '1' : '0'}
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
                  <tr><td colSpan={9} className="px-5 py-8 text-center text-ink-500">No students found</td></tr>
                )}
              </tbody>
            </table>
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize)
                setCurrentPage(1)
              }}
              itemLabel="students"
            />
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-ink-900 border border-ink-800 rounded-2xl p-6 w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-ink-100 font-semibold mb-4">{editing ? 'Edit Student' : 'Add Student'}</h2>
            <div className="space-y-3">
              {[['name','Name'],['email','Email'],['phone','Phone'],['regnum','RegNum'],['batch','Batch']].map(([field, label]) => (
                <div key={field}>
                  <label className="text-ink-500 text-xs mb-1 block">{label}</label>
                  <input className="input w-full text-sm" value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} />
                </div>
              ))}
              <div>
                <label className="text-ink-500 text-xs mb-1 block">Year</label>
                <select className="input w-full text-sm" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })}>
                  {ACADEMIC_YEARS.map(yr => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-ink-500 text-xs mb-1 block">Department</label>
                <select className="input w-full text-sm" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                  <option value="" disabled>Select Department</option>
                  {Object.keys(DEPART_CHECKER).map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              {editing && (
                <div>
                  <label className="text-ink-500 text-xs mb-1 block">Status (IsActive)</label>
                  <select
                    className="input w-full text-sm"
                    value={form.isActive}
                    onChange={e => setForm({ ...form, isActive: Number(e.target.value) })}
                  >
                    <option value={STATUS.ACTIVE}>Active ({STATUS.ACTIVE})</option>
                    <option value={STATUS.INACTIVE}>Inactive ({STATUS.INACTIVE})</option>
                  </select>
                </div>
              )}
              {!editing && (
                <div>
                  <label className="text-ink-500 text-xs mb-1 block">Password</label>
                  <input
                    type="password"
                    className="input w-full text-sm"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#\-_^()]).{8,}$"
                    title="Password must be at least 8 characters long and include uppercase, lowercase, number, and special character"
                  />
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

      {/* Bulk Upload Modal */}
      <BulkStudentUploadModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onSuccess={fetch}
      />
    </div>
  )
}