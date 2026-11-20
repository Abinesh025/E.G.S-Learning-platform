import { useState, useEffect, useCallback } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import {
  Activity,
  AlertTriangle,
  FileText,
  RefreshCw,
  Trash2,
  Download,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Terminal,
  Clock,
  ShieldAlert,
  CheckCircle,
  Database,
  Layers,
} from 'lucide-react'

export default function AdminLogs() {
  const [logs, setLogs] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [clearing, setClearing] = useState(false)

  // Filters & Pagination
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'actions' | 'error'
  const [levelFilter, setLevelFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)

  // Expanded log row details
  const [expandedRow, setExpandedRow] = useState(null)

  const fetchLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await api.get('/api/admin/logs', {
        params: {
          type: activeTab,
          page,
          limit: pageSize,
          search: searchQuery,
          level: levelFilter,
        },
      })

      if (res.data?.success) {
        setLogs(res.data.data.logs || [])
        setTotalPages(res.data.data.totalPages || 1)
        setTotalLogs(res.data.data.total || 0)
        setStats(res.data.data.stats || null)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch logs')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeTab, page, pageSize, searchQuery, levelFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const handleClearLogs = async () => {
    if (!window.confirm(`Are you sure you want to clear ${activeTab} logs? This cannot be undone.`)) {
      return
    }

    setClearing(true)
    try {
      const res = await api.delete('/api/admin/logs', { params: { type: activeTab } })
      if (res.data?.success) {
        toast.success(res.data.message || 'Logs cleared')
        fetchLogs(true)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear logs')
    } finally {
      setClearing(false)
    }
  }

  const handleDownload = () => {
    const targetType = activeTab === 'error' ? 'error' : activeTab === 'actions' ? 'actions' : 'application'
    const token = sessionStorage.getItem('adminToken')
    const baseURL = import.meta.env.VITE_API_URL || ''
    window.open(`${baseURL}/api/admin/logs/download?type=${targetType}&adminToken=${token}`, '_blank')
  }

  const toggleRow = (id) => {
    setExpandedRow(prev => (prev === id ? null : id))
  }

  // Level Badge Styling
  const getLevelBadge = (level) => {
    const lvl = (level || '').toUpperCase()
    switch (lvl) {
      case 'ERROR':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">ERROR</span>
      case 'WARN':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">WARN</span>
      case 'ACTION':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">ACTION</span>
      case 'HTTP':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">HTTP</span>
      case 'INFO':
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-lime-500/20 text-lime-400 border border-lime-500/30">INFO</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-ink-800">
        <div>
          <h1 className="text-2xl font-bold text-ink-100 flex items-center gap-2.5">
            <Activity className="w-7 h-7 text-lime-400" />
            System & Application Logs
          </h1>
          <p className="text-sm text-ink-400 mt-1">
            Real-time server activity, application actions, and structured error logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-ink-800 text-ink-200 hover:bg-ink-700 hover:text-white border border-ink-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-lime-400' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-ink-800 text-ink-200 hover:bg-ink-700 hover:text-white border border-ink-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export Log File
          </button>

          <button
            onClick={handleClearLogs}
            disabled={clearing}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg bg-red-950/40 text-red-300 hover:bg-red-900/60 border border-red-800/50 transition"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            Clear {activeTab === 'all' ? 'All' : activeTab} Logs
          </button>
        </div>
      </div>

      {/* ── Stats Summary Cards ── */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-ink-900/60 p-4 rounded-xl border border-ink-800 flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-lime-500/10 border border-lime-500/20 text-lime-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-ink-400 font-medium">Total Log Storage</p>
              <p className="text-lg font-bold text-ink-100">{stats.totalSizeFormatted || '0 MB'}</p>
            </div>
          </div>

          <div className="bg-ink-900/60 p-4 rounded-xl border border-ink-800 flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-ink-400 font-medium">Actions Today</p>
              <p className="text-lg font-bold text-ink-100">{stats.todayActions || 0}</p>
            </div>
          </div>

          <div className="bg-ink-900/60 p-4 rounded-xl border border-ink-800 flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-ink-400 font-medium">Errors Logged Today</p>
              <p className="text-lg font-bold text-red-400">{stats.todayErrors || 0}</p>
            </div>
          </div>

          <div className="bg-ink-900/60 p-4 rounded-xl border border-ink-800 flex items-center gap-3.5">
            <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-ink-400 font-medium">Matching Filtered Logs</p>
              <p className="text-lg font-bold text-ink-100">{totalLogs}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter Controls ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-ink-900/50 p-3.5 rounded-xl border border-ink-800">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'All Logs' },
            { id: 'actions', label: 'Application Actions' },
            { id: 'error', label: 'Errors Only' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                setPage(1)
              }}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-lime-400/20 text-lime-300 border border-lime-400/40'
                  : 'text-ink-400 hover:text-ink-200 hover:bg-ink-800 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Level Dropdown */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative min-w-[200px] flex-1">
            <Search className="w-3.5 h-3.5 text-ink-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search in logs..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="w-full bg-ink-950 border border-ink-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-ink-200 placeholder-ink-500 focus:outline-none focus:border-lime-400 transition"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-ink-400" />
            <select
              value={levelFilter}
              onChange={(e) => {
                setLevelFilter(e.target.value)
                setPage(1)
              }}
              className="bg-ink-950 border border-ink-700 rounded-lg px-2.5 py-1.5 text-xs text-ink-200 focus:outline-none focus:border-lime-400"
            >
              <option value="ALL">All Levels</option>
              <option value="ERROR">ERROR</option>
              <option value="WARN">WARN</option>
              <option value="ACTION">ACTION</option>
              <option value="HTTP">HTTP</option>
              <option value="INFO">INFO</option>
            </select>
          </div>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
            className="bg-ink-950 border border-ink-700 rounded-lg px-2.5 py-1.5 text-xs text-ink-200 focus:outline-none focus:border-lime-400"
          >
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
            <option value="100">100 / page</option>
          </select>
        </div>
      </div>

      {/* ── Logs List / Table ── */}
      <div className="bg-ink-900/60 border border-ink-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-lime-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-ink-400">Loading system logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-ink-400">
            <Activity className="w-10 h-10 mx-auto text-ink-600 mb-2" />
            <p className="text-sm font-medium">No logs found</p>
            <p className="text-xs text-ink-500 mt-1">There are no records matching your selected filters or search query.</p>
          </div>
        ) : (
          <div className="divide-y divide-ink-800">
            {logs.map((log) => {
              const isExpanded = expandedRow === log.id
              const hasDetails = log.meta || log.raw?.includes('--- STACK TRACE') || log.level === 'ERROR'

              return (
                <div
                  key={log.id}
                  className={`transition hover:bg-ink-800/40 ${
                    log.level === 'ERROR' ? 'bg-red-950/10' : ''
                  }`}
                >
                  <div
                    onClick={() => hasDetails && toggleRow(log.id)}
                    className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                      hasDetails ? 'cursor-pointer' : ''
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                      {hasDetails && (
                        <button className="text-ink-400 hover:text-white mt-0.5 sm:mt-0 flex-shrink-0">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-lime-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getLevelBadge(log.level)}
                        {log.category && log.category !== 'SYSTEM' && (
                          <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-ink-800 text-ink-300 border border-ink-700">
                            {log.category}
                          </span>
                        )}
                      </div>

                      <p className="text-ink-200 font-mono text-xs break-all sm:break-normal line-clamp-2">
                        {log.message || log.raw}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-ink-500 text-[11px] flex-shrink-0 pl-7 sm:pl-0">
                      <Clock className="w-3 h-3 text-ink-500" />
                      <span>{log.timestamp || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {isExpanded && (
                    <div className="px-6 py-4 bg-ink-950/80 border-t border-ink-800 text-xs font-mono space-y-3">
                      <div>
                        <p className="text-ink-400 font-semibold mb-1 text-[11px]">Full Raw Log Entry:</p>
                        <pre className="p-3 bg-ink-900 rounded-lg text-ink-300 overflow-x-auto text-[11px] leading-relaxed whitespace-pre-wrap">
                          {log.raw}
                        </pre>
                      </div>

                      {log.meta && (
                        <div>
                          <p className="text-lime-400 font-semibold mb-1 text-[11px]">Structured Metadata Context:</p>
                          <pre className="p-3 bg-ink-900 rounded-lg text-lime-300/90 overflow-x-auto text-[11px] leading-relaxed">
                            {JSON.stringify(log.meta, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Pagination Footer ── */}
        {!loading && logs.length > 0 && (
          <div className="px-4 py-3 bg-ink-950/60 border-t border-ink-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-400">
            <div>
              Showing <span className="text-ink-200 font-semibold">{logs.length}</span> of{' '}
              <span className="text-ink-200 font-semibold">{totalLogs}</span> entries (Page{' '}
              <span className="text-ink-200 font-semibold">{page}</span> of{' '}
              <span className="text-ink-200 font-semibold">{totalPages}</span>)
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 rounded bg-ink-800 border border-ink-700 text-ink-200 hover:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-2 text-ink-400 font-medium">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 rounded bg-ink-800 border border-ink-700 text-ink-200 hover:bg-ink-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
