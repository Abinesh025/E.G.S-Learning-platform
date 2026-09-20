import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Star,
  Search,
  Copy,
  Check,
  Info,
  RotateCcw,
  Sparkles,
  Clock,
  LayoutGrid,
  ArrowRight,
  ExternalLink
} from 'lucide-react'
import toast from 'react-hot-toast'
import { dsaCategories, dsaTopicsMetadata } from '../../utils/dsaTopicsRegistry'

// Topic-specific localStorage key mapping
const TOPIC_STORAGE_KEYS = {
  Arrays: {
    solved: 'egs_array_solved_ids',
    bookmarked: 'egs_array_bookmarked_ids'
  },
  Strings: {
    solved: 'egs_string_solved_ids',
    bookmarked: 'egs_string_bookmarked_ids'
  },
  'Linked List': {
    solved: 'egs_linked_list_solved_ids',
    bookmarked: 'egs_linked_list_bookmarked_ids'
  },
  'Stack & Queue': {
    solved: 'egs_stack_queue_solved_ids',
    bookmarked: 'egs_stack_queue_bookmarked_ids'
  },
  HashMap: {
    solved: 'egs_hashmap_solved_ids',
    bookmarked: 'egs_hashmap_bookmarked_ids'
  },
  'Number Based Problems': {
    solved: 'egs_number_problems_solved_ids',
    bookmarked: 'egs_number_problems_bookmarked_ids'
  },
  'Pattern Printing': {
    solved: 'egs_pattern_printing_solved_ids',
    bookmarked: 'egs_pattern_printing_bookmarked_ids'
  }
}

const loadStoredList = (key) => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export default function CodingRounds() {
  // Currently Selected Topic from Navigation (default is 'Arrays')
  const [selectedTopic, setSelectedTopic] = useState('Arrays')

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All') // 'All' | 'Stack' | 'Queue'
  const [patternFilter, setPatternFilter] = useState('All Patterns')
  const [statusFilter, setStatusFilter] = useState('All') // 'All' | 'Solved' | 'Unsolved' | 'Bookmarked'
  const [showTheory, setShowTheory] = useState(false)

  // Persisted Solved & Starred State strictly isolated per Topic
  const [solvedByTopic, setSolvedByTopic] = useState(() => ({
    Arrays: loadStoredList(TOPIC_STORAGE_KEYS.Arrays.solved),
    Strings: loadStoredList(TOPIC_STORAGE_KEYS.Strings.solved),
    'Linked List': loadStoredList(TOPIC_STORAGE_KEYS['Linked List'].solved),
    'Stack & Queue': loadStoredList(TOPIC_STORAGE_KEYS['Stack & Queue'].solved),
    HashMap: loadStoredList(TOPIC_STORAGE_KEYS.HashMap.solved),
    'Number Based Problems': loadStoredList(TOPIC_STORAGE_KEYS['Number Based Problems'].solved),
    'Pattern Printing': loadStoredList(TOPIC_STORAGE_KEYS['Pattern Printing'].solved)
  }))

  const [bookmarkedByTopic, setBookmarkedByTopic] = useState(() => ({
    Arrays: loadStoredList(TOPIC_STORAGE_KEYS.Arrays.bookmarked),
    Strings: loadStoredList(TOPIC_STORAGE_KEYS.Strings.bookmarked),
    'Linked List': loadStoredList(TOPIC_STORAGE_KEYS['Linked List'].bookmarked),
    'Stack & Queue': loadStoredList(TOPIC_STORAGE_KEYS['Stack & Queue'].bookmarked),
    HashMap: loadStoredList(TOPIC_STORAGE_KEYS.HashMap.bookmarked),
    'Number Based Problems': loadStoredList(TOPIC_STORAGE_KEYS['Number Based Problems'].bookmarked),
    'Pattern Printing': loadStoredList(TOPIC_STORAGE_KEYS['Pattern Printing'].bookmarked)
  }))

  const [copiedId, setCopiedId] = useState(null)

  // Current active topic's solved and bookmarked IDs
  const solvedIds = useMemo(() => solvedByTopic[selectedTopic] || [], [solvedByTopic, selectedTopic])
  const bookmarkedIds = useMemo(() => bookmarkedByTopic[selectedTopic] || [], [bookmarkedByTopic, selectedTopic])

  // Active topic metadata from registry
  const currentTopicData = useMemo(() => {
    return dsaTopicsMetadata[selectedTopic] || dsaTopicsMetadata['Arrays']
  }, [selectedTopic])

  const isCurrentTopicAvailable = currentTopicData.status === 'available'
  const currentTopicContent = currentTopicData.content

  // Dynamic topic metrics across the platform
  const totalTopicsCount = useMemo(() => Object.keys(dsaTopicsMetadata).length, [])
  const availableTopicsCount = useMemo(
    () => Object.values(dsaTopicsMetadata).filter((t) => t.status === 'available').length,
    []
  )

  // Topic Switch Handler with Automatic Filter Reset
  const handleSelectTopic = useCallback((topicName) => {
    setSelectedTopic(topicName)
    setSearchQuery('')
    setDifficultyFilter('All')
    setCategoryFilter('All')
    setPatternFilter('All Patterns')
    setStatusFilter('All')
    setShowTheory(false)
  }, [])

  // Toggle Solved Handler with Topic-Isolated Storage
  const toggleSolved = useCallback((id) => {
    const topicKeys = TOPIC_STORAGE_KEYS[selectedTopic]
    setSolvedByTopic((prev) => {
      const currentList = prev[selectedTopic] || []
      const nextList = currentList.includes(id)
        ? currentList.filter((item) => item !== id)
        : [...currentList, id]

      if (topicKeys) {
        try {
          localStorage.setItem(topicKeys.solved, JSON.stringify(nextList))
        } catch (e) {
          console.error('Failed to save solved items', e)
        }
      }

      const isNowSolved = !currentList.includes(id)
      toast.success(isNowSolved ? 'Marked as completed!' : 'Marked as uncompleted', {
        id: `solved-${id}`,
        duration: 1500
      })

      return {
        ...prev,
        [selectedTopic]: nextList
      }
    })
  }, [selectedTopic])

  // Toggle Bookmark Handler with Topic-Isolated Storage
  const toggleBookmark = useCallback((id) => {
    const topicKeys = TOPIC_STORAGE_KEYS[selectedTopic]
    setBookmarkedByTopic((prev) => {
      const currentList = prev[selectedTopic] || []
      const nextList = currentList.includes(id)
        ? currentList.filter((item) => item !== id)
        : [...currentList, id]

      if (topicKeys) {
        try {
          localStorage.setItem(topicKeys.bookmarked, JSON.stringify(nextList))
        } catch (e) {
          console.error('Failed to save bookmarked items', e)
        }
      }

      const isStarred = !currentList.includes(id)
      toast.success(isStarred ? 'Saved to bookmarks' : 'Removed from bookmarks', {
        id: `bookmark-${id}`,
        duration: 1500
      })

      return {
        ...prev,
        [selectedTopic]: nextList
      }
    })
  }, [selectedTopic])

  // Copy Question Statement
  const handleCopyQuestion = useCallback((q) => {
    const textToCopy = `${q.title} (${q.difficulty} - ${q.pattern})\n\n${q.question}`
    navigator.clipboard.writeText(textToCopy)
    setCopiedId(q.id)
    toast.success('Problem statement copied to clipboard!')
    setTimeout(() => setCopiedId(null), 2000)
  }, [])

  // Memoized Filtered Questions for the available topic
  const filteredQuestions = useMemo(() => {
    if (!isCurrentTopicAvailable || !currentTopicContent?.allQuestions) return []

    const qLower = searchQuery.trim().toLowerCase()

    return currentTopicContent.allQuestions.filter((item) => {
      // Difficulty filter
      if (difficultyFilter !== 'All' && item.difficulty !== difficultyFilter) {
        return false
      }

      // Category filter (e.g. Stack vs Queue)
      if (categoryFilter !== 'All' && item.category && item.category !== categoryFilter) {
        return false
      }

      // Pattern filter
      if (patternFilter !== 'All Patterns' && item.pattern !== patternFilter && item.type !== patternFilter) {
        return false
      }

      // Status filter
      if (statusFilter === 'Solved' && !solvedIds.includes(item.id)) return false
      if (statusFilter === 'Unsolved' && solvedIds.includes(item.id)) return false
      if (statusFilter === 'Bookmarked' && !bookmarkedIds.includes(item.id)) return false

      // Search query
      if (qLower) {
        const matchesTitle = item.title.toLowerCase().includes(qLower)
        const matchesPattern = item.pattern.toLowerCase().includes(qLower)
        const matchesQuestion = item.question.toLowerCase().includes(qLower)
        const matchesCategory = item.category ? item.category.toLowerCase().includes(qLower) : false
        const matchesType = item.type ? item.type.toLowerCase().includes(qLower) : false
        if (!matchesTitle && !matchesPattern && !matchesQuestion && !matchesCategory && !matchesType) {
          return false
        }
      }

      return true
    })
  }, [
    isCurrentTopicAvailable,
    currentTopicContent,
    searchQuery,
    difficultyFilter,
    categoryFilter,
    patternFilter,
    statusFilter,
    solvedIds,
    bookmarkedIds
  ])

  // Progress Metrics Calculation
  const progressMetrics = useMemo(() => {
    if (!isCurrentTopicAvailable || !currentTopicContent?.allQuestions) {
      return { total: 0, solved: 0, percentage: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0 }
    }

    const total = currentTopicContent.allQuestions.length
    const solved = solvedIds.length
    const percentage = Math.round((solved / total) * 100)

    const easySolved = (currentTopicContent.easyQuestions || []).filter((q) => solvedIds.includes(q.id)).length
    const mediumSolved = (currentTopicContent.mediumQuestions || []).filter((q) => solvedIds.includes(q.id)).length
    const hardSolved = (currentTopicContent.hardQuestions || []).filter((q) => solvedIds.includes(q.id)).length

    return {
      total,
      solved,
      percentage,
      easySolved,
      mediumSolved,
      hardSolved,
      bookmarkedCount: bookmarkedIds.length
    }
  }, [isCurrentTopicAvailable, currentTopicContent, solvedIds, bookmarkedIds])

  return (
    <div className="p-4 md:p-6 max-w-none w-full space-y-6 animate-fade-up">
      {/* Breadcrumbs */}
      <nav className="text-xs font-500 text-ink-400 flex items-center gap-2 mb-1 flex-wrap">
        <Link to="/student" className="hover:text-lime-300 transition-colors">
          Dashboard
        </Link>
        <span className="text-ink-600">/</span>
        <Link to="/student/placement/on-campus" className="hover:text-lime-300 transition-colors">
          Placement Preparation
        </Link>
        <span className="text-ink-600">/</span>
        <Link to="/student/placement/on-campus" className="hover:text-lime-300 transition-colors">
          On-Campus Rounds
        </Link>
        <span className="text-ink-600">/</span>
        <span className="text-ink-200">DSA and Coding Preparation</span>
      </nav>

      {/* Back to On-Campus */}
      <div>
        <Link
          to="/student/placement/on-campus"
          className="inline-flex items-center gap-2 text-ink-400 hover:text-lime-300 transition-colors text-sm font-500"
        >
          <ArrowLeft size={16} /> Back to On-Campus Rounds
        </Link>
      </div>

      {/* Unified Header */}
      <div className="card p-6 border-l-4 border-l-lime-400 bg-ink-900/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="tag-lime badge text-xs font-semibold px-2.5 py-1 uppercase tracking-wider">
                Placement Module
              </span>
              <span className="bg-sky-400/10 text-sky-300 border border-sky-400/20 text-xs px-2.5 py-1 rounded-full font-medium">
                Data Structures & Algorithms
              </span>
              <span className="bg-amber-400/10 text-amber-300 border border-amber-400/20 text-xs px-2.5 py-1 rounded-full font-medium">
                Campus Drive Ready
              </span>
            </div>
            <h1 className="page-title text-2xl md:text-3xl text-white font-bold">
              DSA and Coding Preparation
            </h1>
            <p className="text-sm text-ink-300 leading-relaxed">
              Learn important data structures, problem-solving patterns, and placement-oriented coding questions. Select any data structure below to access curated interview questions.
            </p>
          </div>

          {/* Module Stats Pill */}
          <div className="bg-ink-950/70 p-4 rounded-xl border border-ink-800 min-w-[240px] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-400 font-medium">Active Topic Progress ({selectedTopic})</span>
              <span className="font-bold text-lime-300">
                {isCurrentTopicAvailable ? `${progressMetrics.percentage}%` : 'Pending'}
              </span>
            </div>
            <div className="w-full bg-ink-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-lime-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${isCurrentTopicAvailable ? progressMetrics.percentage : 0}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-ink-400 pt-1 border-t border-ink-800/60">
              <span>{availableTopicsCount} of {totalTopicsCount} Topics Active</span>
              <span className="text-lime-300 font-medium">
                {isCurrentTopicAvailable ? `${progressMetrics.solved}/${progressMetrics.total} Solved` : 'Coming Soon'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DATA STRUCTURE NAVIGATION (Linear & Other Categories) */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <LayoutGrid size={16} className="text-lime-400" />
            Select Data Structure / Topic
          </h2>
          <span className="text-xs text-ink-400">
            Current: <strong className="text-lime-300">{selectedTopic}</strong>
          </span>
        </div>

        {/* Navigation Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
          {dsaCategories.map((category) => (
            <div
              key={category.id}
              className="card p-4 bg-ink-900/60 border border-ink-800 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-ink-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      category.priority === 'HIGH' ? 'bg-lime-400' : 'bg-sky-400'
                    }`}
                  ></span>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    {category.name}
                  </h3>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    category.priority === 'HIGH'
                      ? 'bg-lime-400/10 text-lime-300 border-lime-400/20'
                      : 'bg-sky-400/10 text-sky-300 border-sky-400/20'
                  }`}
                >
                  {category.badge}
                </span>
              </div>

              {/* Topic Selector Pills */}
              <div className="flex flex-wrap gap-2">
                {category.topics.map((topicName) => {
                  const meta = dsaTopicsMetadata[topicName]
                  const isSelected = selectedTopic === topicName
                  const isAvailable = meta?.status === 'available'

                  return (
                    <button
                      key={topicName}
                      onClick={() => handleSelectTopic(topicName)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${
                        isSelected
                          ? 'bg-lime-400 text-white border-lime-400 shadow-md shadow-lime-400/10 scale-[1.02]'
                          : isAvailable
                          ? 'bg-ink-950 text-ink-200 border-ink-800 hover:border-lime-400/50 hover:text-white'
                          : 'bg-ink-950/70 text-ink-400 border-ink-800/80 hover:border-ink-700 hover:text-ink-200'
                      }`}
                    >
                      <span>{topicName}</span>
                      {isAvailable ? (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/20'
                          }`}
                        >
                          {meta?.totalQuestions ? `${meta.totalQuestions} Qs` : '40 Qs'}
                        </span>
                      ) : (
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-ink-800 text-ink-500'
                          }`}
                        >
                          Soon
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DYNAMIC CONTENT AREA */}
      {/* ========================================================================= */}

      {/* CASE 1: UNAVAILABLE TOPIC STATE (COMING SOON) */}
      {!isCurrentTopicAvailable && (
        <div className="card p-8 md:p-12 text-center space-y-6 bg-ink-900/80 border border-ink-800">
          <div className="w-16 h-16 rounded-2xl bg-ink-950 border border-ink-800 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
            <Clock size={32} />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20 text-xs font-semibold">
              <span>{currentTopicData.category}</span>
              <span>•</span>
              <span>Priority: {currentTopicData.priority}</span>
            </div>

            <h2 className="text-2xl font-bold text-white">
              {currentTopicData.name} Module
            </h2>

            {/* Exact Required Placeholder Message */}
            <p className="text-sm font-medium text-amber-300/90 bg-amber-400/5 py-2.5 px-4 rounded-xl border border-amber-400/10">
              No data available right now. We are working on this section and will add the content soon.
            </p>

            <p className="text-xs text-ink-400 leading-relaxed pt-2">
              {currentTopicData.shortDescription}
            </p>
          </div>

          {/* Informative Roadmap Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left text-xs">
            <div className="bg-ink-950 p-4 rounded-xl border border-ink-800 space-y-1.5">
              <span className="font-bold text-lime-300 block flex items-center gap-1.5">
                <Sparkles size={14} /> Planned Placement Patterns
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(currentTopicData.expectedPatterns || []).map((pat, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded bg-ink-900 text-ink-300 border border-ink-800 text-[11px]"
                  >
                    {pat}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-ink-950 p-4 rounded-xl border border-ink-800 space-y-1.5">
              <span className="font-bold text-sky-300 block flex items-center gap-1.5">
                <Info size={14} /> Placement Round Relevance
              </span>
              <p className="text-ink-400 text-[11px] leading-relaxed">
                {currentTopicData.placementRelevance}
              </p>
            </div>
          </div>

          {/* Quick Action to return to Available Topics */}
          <div className="pt-2 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => handleSelectTopic('Arrays')}
              className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
            >
              <span>Arrays (40 Qs)</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={() => handleSelectTopic('Strings')}
              className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
            >
              <span>Strings (40 Qs)</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={() => handleSelectTopic('Linked List')}
              className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
            >
              <span>Linked List (40 Qs)</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={() => handleSelectTopic('Stack & Queue')}
              className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
            >
              <span>Stack & Queue (20 Qs)</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={() => handleSelectTopic('HashMap')}
              className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
            >
              <span>HashMap (10 Qs)</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={() => handleSelectTopic('Number Based Problems')}
              className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
            >
              <span>Number Based (20 Qs)</span>
              <ArrowRight size={13} />
            </button>
            <button
              onClick={() => handleSelectTopic('Pattern Printing')}
              className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
            >
              <span>Pattern Printing (20 Qs)</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* CASE 2: AVAILABLE TOPIC STATE */}
      {isCurrentTopicAvailable && (
        <div className="space-y-6">
          {/* Theoretical Foundations Card (when topic has structured theory) */}
          {currentTopicContent?.theory && (
            <div className="card p-5 bg-ink-900/80 border border-ink-800 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-lime-400/10 text-lime-400 border border-lime-400/20 flex items-center justify-center font-bold">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      {currentTopicContent.theory.introduction?.title || 'Theoretical Foundations & Concepts'}
                    </h3>
                    <p className="text-xs text-ink-400">
                      Master LIFO vs FIFO access patterns, O(1) primitives, and core placement applications
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTheory((prev) => !prev)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-ink-800 hover:bg-ink-700 text-ink-200 border border-ink-700 transition-colors self-start sm:self-auto"
                >
                  {showTheory ? 'Collapse Theory' : 'Expand Complete Theory'}
                </button>
              </div>

              <p className="text-xs text-ink-300 leading-relaxed">
                {currentTopicContent.theory.introduction?.content}
              </p>

              {/* Detailed Breakdown when expanded */}
              {showTheory && (
                <div className="space-y-4 pt-2 border-t border-ink-800/60 animate-fade-in">
                  {/* Stack vs Queue Comparison Matrix */}
                  {currentTopicContent.theory.comparison && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-lime-300 uppercase tracking-wider">
                        {currentTopicContent.theory.comparison.title}
                      </h4>
                      <div className="overflow-x-auto rounded-xl border border-ink-800 bg-ink-950">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-ink-900/90 text-ink-400 uppercase text-[10px] tracking-wider border-b border-ink-800">
                            <tr>
                              {currentTopicContent.theory.comparison.columns.map((col) => (
                                <th key={col} className="py-2.5 px-3.5 font-bold">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-ink-800/60">
                            {currentTopicContent.theory.comparison.rows.map((row, idx) => (
                              <tr key={idx} className="hover:bg-ink-900/40 transition-colors">
                                <td className="py-2 px-3.5 font-semibold text-white">{row.feature}</td>
                                <td className="py-2 px-3.5 text-lime-300 font-mono text-[11px]">{row.stack}</td>
                                <td className="py-2 px-3.5 text-sky-300 font-mono text-[11px]">{row.queue}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Core Primitives & O(1) Operations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-ink-950/70 border border-ink-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-lime-300">Stack (LIFO) Primitives</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-lime-400/10 text-lime-400 border border-lime-400/20">All O(1)</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {currentTopicContent.theory.stack?.core_operations?.map((op, idx) => (
                          <div key={idx} className="flex items-baseline justify-between text-[11px] py-0.5 border-b border-ink-800/40 last:border-none">
                            <span className="font-mono text-ink-200">{op.operation}</span>
                            <span className="text-ink-400 text-right">{op.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-ink-950/70 border border-ink-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-sky-300">Queue (FIFO) Primitives</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-400/10 text-sky-400 border border-sky-400/20">All O(1)</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {currentTopicContent.theory.queue?.core_operations?.map((op, idx) => (
                          <div key={idx} className="flex items-baseline justify-between text-[11px] py-0.5 border-b border-ink-800/40 last:border-none">
                            <span className="font-mono text-ink-200">{op.operation}</span>
                            <span className="text-ink-400 text-right">{op.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Filter and Search Bar */}
          <div className="card p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Search Bar */}
              <div className="md:col-span-4 relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" size={16} />
                <input
                  type="text"
                  placeholder="Search questions by name, pattern, or statement..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-ink-950 border border-ink-800 rounded-xl pl-10 pr-4 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none focus:border-lime-400 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-500 hover:text-ink-300"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Difficulty Tabs */}
              <div className="md:col-span-3 flex items-center bg-ink-950 p-1 rounded-xl border border-ink-800">
                {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficultyFilter(diff)}
                    className={`flex-1 py-1 text-xs font-semibold rounded-lg transition-all ${
                      difficultyFilter === diff
                        ? 'bg-lime-400 text-white shadow-sm'
                        : 'text-ink-400 hover:text-ink-200'
                    }`}
                  >
                    {diff === 'All' ? `All (${currentTopicData.totalQuestions || 40})` : diff}
                  </button>
                ))}
              </div>

              {/* Pattern Filter */}
              <div className="md:col-span-3">
                <select
                  value={patternFilter}
                  onChange={(e) => setPatternFilter(e.target.value)}
                  className="w-full bg-ink-950 border border-ink-800 rounded-xl px-3 py-2 text-xs text-ink-200 focus:outline-none focus:border-lime-400 cursor-pointer"
                >
                  {(currentTopicContent?.patternsList || []).map((pat) => (
                    <option key={pat} value={pat} className="bg-ink-900 text-ink-100">
                      {pat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="md:col-span-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-ink-950 border border-ink-800 rounded-xl px-3 py-2 text-xs text-ink-200 focus:outline-none focus:border-lime-400 cursor-pointer"
                >
                  <option value="All" className="bg-ink-900 text-ink-100">
                    Status: All
                  </option>
                  <option value="Solved" className="bg-ink-900 text-ink-100">
                    Solved Only ({progressMetrics.solved})
                  </option>
                  <option value="Unsolved" className="bg-ink-900 text-ink-100">
                    Unsolved ({progressMetrics.total - progressMetrics.solved})
                  </option>
                  <option value="Bookmarked" className="bg-ink-900 text-ink-100">
                    Bookmarked ({progressMetrics.bookmarkedCount})
                  </option>
                </select>
              </div>
            </div>

            {/* Category Filter for topics like Stack & Queue */}
            {currentTopicContent?.categoriesList && (
              <div className="flex items-center gap-2 pt-2 border-t border-ink-800/40">
                <span className="text-xs text-ink-400 font-medium">Category:</span>
                <div className="flex items-center bg-ink-950 p-1 rounded-xl border border-ink-800">
                  {currentTopicContent.categoriesList.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                        categoryFilter === cat
                          ? 'bg-sky-400 text-ink-950 shadow-sm'
                          : 'text-ink-400 hover:text-ink-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Metrics Bar */}
            <div className="flex flex-wrap items-center justify-between text-xs text-ink-400 pt-2 border-t border-ink-800/50">
              <div className="flex items-center gap-2">
                <span>
                  Showing <strong className="text-white">{filteredQuestions.length}</strong> of{' '}
                  <strong className="text-white">{currentTopicData.totalQuestions || 40}</strong> problems
                </span>
                {(difficultyFilter !== 'All' ||
                  categoryFilter !== 'All' ||
                  patternFilter !== 'All Patterns' ||
                  statusFilter !== 'All' ||
                  searchQuery) && (
                  <button
                    onClick={() => {
                      setDifficultyFilter('All')
                      setCategoryFilter('All')
                      setPatternFilter('All Patterns')
                      setStatusFilter('All')
                      setSearchQuery('')
                    }}
                    className="text-lime-300 hover:underline inline-flex items-center gap-1 ml-2 font-medium"
                  >
                    <RotateCcw size={12} /> Reset filters
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 text-ink-400">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> {currentTopicData.easyCount || 15} Easy
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span> {currentTopicData.mediumCount || 15} Medium
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span> {currentTopicData.hardCount || 10} Hard
                </span>
              </div>
            </div>
          </div>

          {/* Questions List */}
          {filteredQuestions.length === 0 ? (
            <div className="card p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-ink-800/80 flex items-center justify-center mx-auto text-ink-400">
                <Search size={22} />
              </div>
              <h3 className="text-base font-semibold text-white">No matching questions found</h3>
              <p className="text-xs text-ink-400 max-w-md mx-auto">
                No problems match your current filter and search criteria. Reset filters to view all questions.
              </p>
              <button
                onClick={() => {
                  setDifficultyFilter('All')
                  setPatternFilter('All Patterns')
                  setStatusFilter('All')
                  setSearchQuery('')
                }}
                className="btn-primary inline-flex items-center gap-2 text-xs py-2 px-4"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredQuestions.map((q) => {
                const isSolved = solvedIds.includes(q.id)
                const isBookmarked = bookmarkedIds.includes(q.id)

                let diffBadgeClass = 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'
                if (q.difficulty === 'Medium') {
                  diffBadgeClass = 'bg-amber-400/10 text-amber-300 border-amber-400/20'
                } else if (q.difficulty === 'Hard') {
                  diffBadgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }

                return (
                  <div
                    key={q.id}
                    className={`card p-5 space-y-3 transition-all duration-200 relative group border ${
                      isSolved
                        ? 'border-emerald-500/30 bg-ink-900/40'
                        : 'hover:border-ink-700 bg-ink-900/90'
                    }`}
                  >
                    {/* Question Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${diffBadgeClass}`}>
                            {q.difficulty}
                          </span>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-ink-800 text-ink-300 border border-ink-700">
                            {q.type || q.category || q.topic}
                          </span>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-400/10 text-sky-300 border border-sky-400/20">
                            {q.pattern}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-white flex items-center gap-2">
                          <span>{q.title}</span>
                          {isSolved && (
                            <CheckCircle2 size={16} className="text-emerald-400 shrink-0 inline" />
                          )}
                        </h3>
                      </div>

                      {/* Quick Actions: Bookmark, Copy, Solved Check */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => toggleBookmark(q.id)}
                          title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Question'}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isBookmarked
                              ? 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                              : 'text-ink-500 hover:text-ink-200 border-ink-800 hover:bg-ink-800'
                          }`}
                        >
                          <Star size={15} fill={isBookmarked ? 'currentColor' : 'none'} />
                        </button>

                        <button
                          onClick={() => handleCopyQuestion(q)}
                          title="Copy problem statement"
                          className="p-1.5 rounded-lg text-ink-500 hover:text-ink-200 border border-ink-800 hover:bg-ink-800 transition-colors"
                        >
                          {copiedId === q.id ? <Check size={15} className="text-lime-400" /> : <Copy size={15} />}
                        </button>

                        <button
                          onClick={() => toggleSolved(q.id)}
                          title={isSolved ? 'Mark as Unsolved' : 'Mark as Solved'}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            isSolved
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'text-ink-400 border-ink-800 hover:bg-ink-800 hover:text-white'
                          }`}
                        >
                          {isSolved ? (
                            <>
                              <CheckCircle2 size={13} className="text-emerald-400" /> Solved
                            </>
                          ) : (
                            <>
                              <Circle size={13} /> Solve
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Problem Statement Only */}
                    <div className="bg-ink-950/60 p-3.5 rounded-xl border border-ink-800/80">
                      <p className="text-xs text-ink-200 leading-relaxed font-normal">{q.question}</p>
                    </div>

                    {/* Solve on LeetCode Button */}
                    {q.leetcode?.available && q.leetcode?.url && (
                      <div className="pt-1 flex items-center justify-end">
                        <a
                          href={q.leetcode.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 hover:border-amber-400/50 transition-all group shadow-sm"
                        >
                          <span>Solve on LeetCode</span>
                          <ExternalLink size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-amber-400" />
                        </a>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
