import { useState, useEffect } from 'react'
import { studentService } from '../../services/api'
import { getSocket } from '../../services/socket'
import { useAuth } from '../../context/AuthContext'
import { BookOpen, Video, Mic, File, Download, Search, Filter, Play, Pause, X, Eye, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const typeConfig = {
  notes: { icon: BookOpen, color: 'tag-lime', label: 'Notes' },
  video: { icon: Video, color: 'tag-sky', label: 'Video' },
  voice: { icon: Mic, color: 'tag-amber', label: 'Voice' },
  file: { icon: File, color: 'tag-red', label: 'File' },
}
import MaterialViewer from '../../components/MaterialViewer'

import { Link } from 'react-router-dom'

export default function StudentMaterials() {
  const { token } = useAuth()
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [selectedMaterial, setSelectedMaterial] = useState(null)

  // Initialize and cleanup Audio element
  useEffect(() => {
    const fetchItems = () => {
      setLoading(true)
      const params = {}
      if (departmentFilter) params.department = departmentFilter
      
      studentService.getMaterials(params)
        .then(res => setMaterials(res.data || []))
        .catch(() => toast.error('Failed to load materials'))
        .finally(() => setLoading(false))
    }
    fetchItems()
    const socket = getSocket(token)
    const handleDataChanged = (type) => { if (type === 'material') fetchItems() }
    socket.on('data_changed', handleDataChanged)
    return () => socket.off('data_changed', handleDataChanged)
  }, [token, departmentFilter])

  const filtered = materials?.filter(m => {
    const matchSearch = m.title?.toLowerCase().includes(search.toLowerCase())
    const mType = m.fileType || m.type
    const matchFilter = filter === 'all' || mType === filter
    return matchSearch && matchFilter
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Link to="/student" className="inline-flex items-center gap-2 text-ink-400 hover:text-lime-300 transition-colors mb-2 text-sm font-500">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="page-title">Materials</h1>
        <span className="tag-sky badge">{materials.length} items</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            className="input pl-9"
            placeholder="Search materials…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <select 
            className="input w-full"
            value={departmentFilter}
            onChange={e => setDepartmentFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            <option value="CSE">CSE</option>
            <option value="IT">IT</option>
            <option value="ECE">ECE</option>
            <option value="MECH">MECH</option>
            <option value="CIVIL">CIVIL</option>
            <option value="EEE">EEE</option>
            <option value="AI&DS">AI&DS</option>
            <option value="CSBS">CSBS</option>
          </select>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'notes', 'video', 'voice', 'file'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-sm font-500 border transition-all capitalize ${
                filter === f
                  ? 'bg-lime-300/10 border-lime-300 text-lime-300'
                  : 'border-ink-700 text-ink-400 hover:border-ink-500'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="w-10 h-10 bg-ink-800 rounded-xl mb-3" />
              <div className="h-4 bg-ink-800 rounded w-3/4 mb-2" />
              <div className="h-3 bg-ink-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No materials found" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => {
            const mType = m.fileType || m.type
            const cfg = typeConfig[mType] || typeConfig.file
            const Icon = cfg.icon
            return (
              <div 
                key={m._id} 
                className="card p-5 hover:border-ink-700 transition-all group flex flex-col h-full cursor-pointer"
                onClick={() => setSelectedMaterial(m)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-ink-800 rounded-xl flex items-center justify-center">
                    <Icon size={18} className="text-ink-400 group-hover:text-lime-300 transition-colors" />
                  </div>
                  <span className={cfg.color}>{cfg.label}</span>
                </div>
                <h3 className="text-ink-100 font-500 text-sm mb-1 line-clamp-2 group-hover:text-lime-300 transition-colors">{m.title}</h3>
                {m.description && (
                  <p className="text-ink-500 text-xs line-clamp-2 mb-3">{m.description}</p>
                )}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-ink-800">
                  <span className="text-ink-600 text-xs">
                    {m.uploadedBy?.name || 'Instructor'}
                  </span>
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    {m.fileUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMaterial(m);
                          }}
                          className="btn-ghost py-1 px-2 text-xs flex items-center gap-1"
                          title="View"
                        >
                          {mType === 'video' || mType === 'voice' ? <Play size={12} /> : <Eye size={12} />} 
                          {mType === 'voice' ? 'Listen' : mType === 'video' ? 'Watch' : 'View'}
                        </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      {/* Material Viewer Modal */}
      {selectedMaterial && (
        <MaterialViewer 
          material={selectedMaterial} 
          onClose={() => setSelectedMaterial(null)} 
        />
      )}
    </div>
  )
}

function EmptyState({ message }) {
  return (
    <div className="card p-12 flex flex-col items-center text-center">
      <BookOpen size={32} className="text-ink-700 mb-3" />
      <p className="text-ink-500 text-sm">{message}</p>
    </div>
  )
}
