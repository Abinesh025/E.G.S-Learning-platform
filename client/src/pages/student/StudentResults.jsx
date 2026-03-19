import { useState, useEffect } from 'react'
import { studentService } from '../../services/api'
import { getSocket } from '../../services/socket'
import { useAuth } from '../../context/AuthContext'
import { BarChart3, TrendingUp, Award } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentResults() {
  const { token } = useAuth()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchItems = () => {
      setLoading(true)
      studentService.getResults()
        .then(res => setResults(res.data || []))
        .catch(() => toast.error('Failed to load results'))
        .finally(() => setLoading(false))
    }
    fetchItems()
    const socket = getSocket(token)
    const handleDataChanged = (type) => { if (type === 'result') fetchItems() }
    socket.on('data_changed', handleDataChanged)
    return () => socket.off('data_changed', handleDataChanged)
  }, [token])

  const avg = results.length
    ? Math.round(results.reduce((a, r) => a + (r.score || 0), 0) / results.length)
    : null

  const best = results.length
    ? Math.max(...results.map(r => r.score || 0))
    : null

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="page-title">My Results</h1>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tests Taken', value: results.length, icon: BarChart3, color: 'text-sky-400' },
          { label: 'Average Score', value: avg !== null ? `${avg}%` : '—', icon: TrendingUp, color: 'text-lime-300' },
          { label: 'Best Score', value: best !== null ? `${best}%` : '—', icon: Award, color: 'text-sky-300' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <Icon size={18} className={`${color} mb-2`} />
            <p className="text-ink-500 text-xs">{label}</p>
            <p className="font-display font-700 text-2xl text-ink-50">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-ink-800">
          <h2 className="section-title">All Results</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-ink-500 text-sm">Loading…</div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center">
            <BarChart3 size={32} className="text-ink-700 mx-auto mb-3" />
            <p className="text-ink-500 text-sm">No results yet. Take a test!</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-800">
                <th className="text-left px-5 py-3 text-ink-500 font-500 text-xs uppercase tracking-wider">Test</th>
                <th className="text-left px-5 py-3 text-ink-500 font-500 text-xs uppercase tracking-wider">Score</th>
                <th className="text-left px-5 py-3 text-ink-500 font-500 text-xs uppercase tracking-wider">Progress</th>
                <th className="text-left px-5 py-3 text-ink-500 font-500 text-xs uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={r._id || i} className="table-row">
                  <td className="px-5 py-3 text-ink-200">{r.test?.title || 'Test'}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${r.score >= 70 ? 'tag-lime' : r.score >= 50 ? 'tag-amber' : 'tag-red'}`}>
                      {r.score ?? '—'}%
                    </span>
                  </td>
                  <td className="px-5 py-3 w-40">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-ink-800 rounded-full">
                        <div
                          className={`h-full rounded-full ${r.score >= 70 ? 'bg-lime-300' : r.score >= 50 ? 'bg-sky-300' : 'bg-red-400'}`}
                          style={{ width: `${r.score || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-ink-500 w-8">{r.score || 0}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-500 text-xs">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
