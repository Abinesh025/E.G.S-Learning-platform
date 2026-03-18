import { useState, useEffect, useRef } from 'react'
import api from '../../services/api'
import { BookOpen, Upload, Trash2, Video, Mic, File, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

const typeConfig = {
  notes: { icon: BookOpen, color: 'tag-lime' },
  video: { icon: Video, color: 'tag-sky' },
  voice: { icon: Mic, color: 'tag-amber' },
  file: { icon: File, color: 'tag-red' },
}

export default function StaffMaterials() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'notes',
    subject: '',
    unit: '',
    topic: ''
  })
  const [file, setFile] = useState(null)
  const fileRef = useRef()

  // Load materials
  const loadMaterials = () => {
    setLoading(true)
    api.get('/staff/materials')
      .then(res => setMaterials(res.data?.data || []))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load materials'))
      .finally(() => setLoading(false))
  }

  useEffect(loadMaterials, [])

  // Upload material
  const handleUpload = async (e) => {
    e.preventDefault()
    if (!file) return toast.error('Please select a file')

    // Validate required fields
    if (!form.title || !form.subject || !form.unit || !form.topic || !form.type) {
      return toast.error('Please fill all required fields')
    }

    setUploading(true)
    setProgress(0)

    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('file', file)

      const res = await api.post('/materials/upload', fd, {
        onUploadProgress: (p) => setProgress(Math.round((p.loaded * 100) / p.total)),
      })

      setMaterials(prev => [res.data.data || res.data, ...prev])
      setForm({ title: '', description: '', type: 'notes', subject: '', unit: '', topic: '' })
      setFile(null)
      setShowForm(false)
      setProgress(0)
      toast.success('Material uploaded!')
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  // Delete material
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material?')) return
    try {
      await api.delete(`/staff/materials/${id}`)
      setMaterials(m => m.filter(x => x._id !== id))
      toast.success('Deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Materials</h1>
        <button onClick={() => setShowForm(s => !s)} className="btn-primary">
          {showForm ? <><X size={15} /> Cancel</> : <><Plus size={15} /> Upload</>}
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <div className="card p-6 animate-fade-up">
          <h2 className="section-title mb-4">Upload New Material</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Title</label>
                <input
                  className="input"
                  placeholder="Material title"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Type</label>
                <select
                  className="input"
                  value={form.type}
                  onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                >
                  <option value="notes">Notes</option>
                  <option value="video">Video</option>
                  <option value="voice">Voice</option>
                  <option value="file">File</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Subject</label>
                <input
                  className="input"
                  placeholder="Subject"
                  value={form.subject}
                  onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Unit</label>
                <input
                  className="input"
                  placeholder="Unit"
                  value={form.unit}
                  onChange={e => setForm(p => ({ ...p, unit: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="label">Topic</label>
                <input
                  className="input"
                  placeholder="Topic"
                  value={form.topic}
                  onChange={e => setForm(p => ({ ...p, topic: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                className="input resize-none"
                rows={2}
                placeholder="Brief description…"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div>
              <label className="label">File</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border border-dashed border-ink-700 rounded-xl p-6 text-center cursor-pointer hover:border-lime-300/50 transition-colors"
              >
                <Upload size={20} className="text-ink-500 mx-auto mb-2" />
                {file ? (
                  <p className="text-ink-200 text-sm">{file.name}</p>
                ) : (
                  <p className="text-ink-500 text-sm">Click to select file</p>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={e => setFile(e.target.files[0])}
                />
              </div>

              {uploading && (
                <div className="mt-2 w-full bg-ink-700 rounded-full h-2">
                  <div
                    className="bg-lime-400 h-2 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={uploading} className="btn-primary">
                <Upload size={15} /> {uploading ? 'Uploading…' : 'Upload Material'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List of materials */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-ink-500 text-sm">Loading…</div>
        ) : materials.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen size={32} className="text-ink-700 mx-auto mb-3" />
            <p className="text-ink-500 text-sm">No materials uploaded yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-800">
                <th className="text-left px-5 py-3 text-ink-500 font-500 text-xs uppercase tracking-wider">Title</th>
                <th className="text-left px-5 py-3 text-ink-500 font-500 text-xs uppercase tracking-wider">Type</th>
                <th className="text-left px-5 py-3 text-ink-500 font-500 text-xs uppercase tracking-wider">Uploaded</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {Array.isArray(materials) && materials.map((m, i) => {
                const cfg = typeConfig[m.type] || typeConfig.file
                const Icon = cfg.icon
                return (
                  <tr key={m._id || i} className="table-row">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-ink-800 rounded-lg flex items-center justify-center">
                          <Icon size={13} className="text-ink-400" />
                        </div>
                        <div>
                          <p className="text-ink-200 font-500">{m.title}</p>
                          {m.description && <p className="text-ink-600 text-xs line-clamp-1">{m.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={cfg.color}>{m.type}</span>
                    </td>
                    <td className="px-5 py-3 text-ink-500 text-xs">
                      {m.createdAt ? new Date(m.createdAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDelete(m._id)}
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