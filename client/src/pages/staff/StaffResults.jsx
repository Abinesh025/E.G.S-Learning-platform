import { useState, useEffect } from 'react'
import { testService } from '../../services/api'
import { BarChart3 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StaffResults() {
  const [tests, setTests] = useState([])
  const [selected, setSelected] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  // Load all tests for dropdown
  useEffect(() => {
    testService.getAll()
      .then(res => setTests(Array.isArray(res?.data) ? res.data : res.data?.data || []))
      .catch(() => toast.error('Failed to load tests'))
  }, [])

  // Load results when a test is selected
  useEffect(() => {
    if (!selected) { 
      setResults([]) 
      return 
    }
    setLoading(true)
    testService.getResults(selected)
      .then(res => {
        const arr = Array.isArray(res.data) ? res.data : res.data?.data || []
        setResults(arr)
      })
      .catch(() => toast.error('Failed to load results'))
      .finally(() => setLoading(false))
  }, [selected])

  const avg = results.length
    ? Math.round(results.reduce((a, r) => a + (r.score || 0), 0) / results.length)
    : null

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="page-title">Results</h1>

      {/* Test selection */}
      <div>
        <label className="label">Select Test</label>
        <select
          className="input max-w-sm"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          <option value="">— Choose a test —</option>
          {Array.isArray(tests) && tests.map(t => (
            <option key={t._id} value={t._id}>{t.title}</option>
          ))}
        </select>
      </div>

      {/* Stats and table */}
      {selected && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="stat-card">
              <p className="text-ink-500 text-xs">Submissions</p>
              <p className="font-display font-700 text-2xl text-ink-50">{results.length}</p>
            </div>
            <div className="stat-card">
              <p className="text-ink-500 text-xs">Average Score</p>
              <p className="font-display font-700 text-2xl text-ink-50">{avg !== null ? `${avg}%` : '—'}</p>
            </div>
            <div className="stat-card">
              <p className="text-ink-500 text-xs">Pass Rate (≥70%)</p>
              <p className="font-display font-700 text-2xl text-ink-50">
                {results.length
                  ? `${Math.round((results.filter(r => r.score >= 70).length / results.length) * 100)}%`
                  : '—'}
              </p>
            </div>
          </div>

          <div className="card overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-ink-500 text-sm">Loading…</div>
            ) : !Array.isArray(results) || results.length === 0 ? (
              <div className="p-12 text-center">
                <BarChart3 size={32} className="text-ink-700 mx-auto mb-3" />
                <p className="text-ink-500 text-sm">No submissions yet</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-800">
                    <th className="text-left px-5 py-3 text-ink-500 font-500 text-xs uppercase tracking-wider">Student</th>
                    <th className="text-left px-5 py-3 text-ink-500 font-500 text-xs uppercase tracking-wider">Score</th>
                    <th className="text-left px-5 py-3 text-ink-500 font-500 text-xs uppercase tracking-wider">Progress</th>
                    <th className="text-left px-5 py-3 text-ink-500 font-500 text-xs uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(results) && results.map((r, i) => (
                    <tr key={r._id || i} className="table-row">
                      <td className="px-5 py-3 text-ink-200">{r.student?.name || '—'}</td>
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
        </>
      )}
    </div>
  )
}