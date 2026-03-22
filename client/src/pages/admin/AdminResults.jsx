import api from '../../services/api'
import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export default function AdminResults() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = () => {
    setLoading(true)
    api.get('/api/admin/results')
      .then(r => setResults(r.data.data))
      .catch(err => toast.error(err.response?.data?.message || 'Failed to fetch results'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetch() }, [])

  const handleDelete = async id => {
    if (!window.confirm('Delete this result?')) return
    try {
      await api.delete(`/api/admin/results/${id}`)
      toast.success('Result deleted')
      fetch()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-ink-100 mb-6">Results</h1>

      <div className="bg-ink-900 border border-ink-800 rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-ink-500 text-sm p-4">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="text-ink-500 text-xs uppercase border-b border-ink-800">
                <tr>
                  <th className="px-5 py-3 text-left">Student</th>
                  <th className="px-5 py-3 text-left">Test</th>
                  <th className="px-5 py-3 text-left">Score</th>
                  <th className="px-5 py-3 text-left hidden sm:table-cell">Progress</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left hidden sm:table-cell">Date</th>
                  <th className="px-5 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => {
                  const pct     = r.test?.totalMarks ? Math.round((r.score / r.test.totalMarks) * 100) : 0
                  const passed  = r.score >= (r.test?.passingMarks || 0)
                  return (
                    <tr key={r._id} className="border-t border-ink-800 hover:bg-ink-800/40">
                      <td className="px-5 py-3 text-ink-100 font-medium max-w-[120px] truncate">{r.student?.name || '—'}</td>
                      <td className="px-5 py-3 text-ink-300 max-w-[120px] truncate">{r.test?.title || '—'}</td>
                      <td className="px-5 py-3 text-ink-300">{r.score}/{r.test?.totalMarks || '?'}</td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-ink-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${passed ? 'bg-lime-400' : 'bg-red-400'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-ink-500 text-xs">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`badge text-xs ${passed ? 'tag-lime' : 'tag-red'}`}>
                          {passed ? 'Pass' : 'Fail'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-ink-300 hidden sm:table-cell">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <button onClick={() => handleDelete(r._id)} className="btn-ghost p-1.5 text-red-400 hover:text-red-300">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {results.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-8 text-center text-ink-500">No results found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}