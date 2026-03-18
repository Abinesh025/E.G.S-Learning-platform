import { useState, useEffect, useCallback } from 'react'
import { testService, studentService } from '../../services/api'
import { getSocket } from '../../services/socket'
import { useAuth } from '../../context/AuthContext'
import { FileText, Clock, CheckCircle, Play, X, ChevronRight, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StudentTests() {
  const { token } = useAuth()
  const [tests, setTests] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTest, setActiveTest] = useState(null)
  const [fetchingTestId, setFetchingTestId] = useState(null)

  useEffect(() => {
    const fetchItems = () => {
      setLoading(true)
      studentService.getTests()
        .then(res => setTests(res.data || []))
        .catch(() => toast.error('Failed to load tests'))
        .finally(() => setLoading(false))
    }
    fetchItems()
    const socket = getSocket(token)
    const handleDataChanged = (type) => { if (type === 'test') fetchItems() }
    socket.on('data_changed', handleDataChanged)
    return () => socket.off('data_changed', handleDataChanged)
  }, [token])

  if (activeTest) {
    return <TestRunner test={activeTest} onFinish={(result) => {
      setActiveTest(null)
      toast.success(`Test submitted! Score: ${result?.score ?? '—'}%`)
    }} onExit={() => setActiveTest(null)} />
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="page-title">Tests</h1>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-20" />
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText size={32} className="text-ink-700 mx-auto mb-3" />
          <p className="text-ink-500 text-sm">No tests available yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map(test => (
            <div key={test._id} className="card p-5 flex items-center gap-4 hover:border-ink-700 transition-all">
              <div className="w-10 h-10 bg-ink-800 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-ink-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-ink-100 font-500 text-sm mb-0.5">{test.title}</h3>
                <div className="flex items-center gap-3 text-xs text-ink-500">
                  <span className="flex items-center gap-1"><Clock size={11} /> {test.duration || 30} min</span>
                  <span>{test.questions?.length || 0} questions</span>
                </div>
              </div>
              <button
                onClick={async () => {
                  setFetchingTestId(test._id)
                  try {
                    const res = await studentService.getTest(test._id)
                    setActiveTest(res.data)
                  } catch (err) {
                    toast.error('Failed to load test details')
                  }
                  setFetchingTestId(null)
                }}
                disabled={fetchingTestId === test._id}
                className="btn-primary py-2 px-4 text-xs"
              >
                <Play size={13} /> {fetchingTestId === test._id ? '...' : 'Start'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TestRunner({ test, onFinish, onExit }) {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const questions = test.questions || []
  const q = questions[current]
  const progress = ((current + 1) / questions.length) * 100

  const handleSubmit = async () => {
    setSubmitting(true)

    // Map the dictionary of answers into an ordered array for the backend.
    // If a question was skipped, we insert -1.
    const orderedAnswers = questions.map((_, i) => (answers[i] !== undefined ? answers[i] : -1))

    try {
      const res = await testService.submit(test._id, orderedAnswers)
      onFinish(res.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
      setSubmitting(false)
    }
  }

  if (!questions.length) {
    return (
      <div className="p-6 text-center">
        <p className="text-ink-500">This test has no questions.</p>
        <button onClick={onExit} className="btn-ghost mt-4">Exit</button>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display font-600 text-ink-100">{test.title}</h2>
          <p className="text-ink-500 text-sm">{current + 1} / {questions.length}</p>
        </div>
        <button onClick={onExit} className="btn-ghost p-2"><X size={18} /></button>
      </div>

      {/* Progress */}
      <div className="h-1.5 bg-ink-800 rounded-full mb-8">
        <div
          className="h-full bg-lime-300 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Question */}
      <div className="card p-6 mb-6">
        <p className="text-ink-100 font-500 mb-6">{q.question}</p>
        <div className="space-y-3">
          {(q.options || []).map((opt, i) => (
            <button
              key={i}
              onClick={() => setAnswers(a => ({ ...a, [current]: i }))}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                answers[current] === i
                  ? 'border-lime-300 bg-lime-300/10 text-lime-300'
                  : 'border-ink-700 text-ink-300 hover:border-ink-500'
              }`}
            >
              <span className="font-mono text-xs mr-3 opacity-50">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent(c => c - 1)}
          disabled={current === 0}
          className="btn-outline disabled:opacity-30"
        >
          <ChevronLeft size={16} /> Previous
        </button>

        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent(c => c + 1)}
            className="btn-primary"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary"
          >
            <CheckCircle size={16} />
            {submitting ? 'Submitting…' : 'Submit Test'}
          </button>
        )}
      </div>
    </div>
  )
}
