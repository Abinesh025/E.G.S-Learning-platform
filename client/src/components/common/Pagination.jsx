import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { PAGINATION } from '../../common'

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = PAGINATION?.DEFAULT_LIMIT || 50,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = PAGINATION?.LIMIT_OPTIONS || [25, 50, 100, 200],
  itemLabel = 'records',
}) {
  if (totalItems === 0) return null

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  // Generate visible page numbers with ellipsis
  const getPageNumbers = () => {
    const pages = []
    const maxButtons = 5

    if (totalPages <= maxButtons + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      if (currentPage <= 3) {
        start = 2
        end = 4
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3
        end = totalPages - 1
      }

      if (start > 2) pages.push('...')
      for (let i = start; i <= end; i++) pages.push(i)
      if (end < totalPages - 1) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

  const pages = getPageNumbers()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3.5 border-t border-ink-800 bg-ink-900/60 text-xs">
      
      {/* Left side: Stats & Rows per page selector */}
      <div className="flex items-center gap-3 text-ink-400">
        <span>
          Showing <strong className="text-ink-100 font-semibold">{startItem}</strong> to{' '}
          <strong className="text-ink-100 font-semibold">{endItem}</strong> of{' '}
          <strong className="text-ink-100 font-semibold">{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-ink-800">
            <span className="text-ink-500">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-ink-950 border border-ink-700 hover:border-ink-600 text-ink-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-lime-400 transition"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right side: Navigation buttons */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-ink-800 text-ink-400 hover:text-ink-100 hover:bg-ink-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-400 disabled:cursor-not-allowed transition"
          title="First Page"
        >
          <ChevronsLeft size={15} />
        </button>

        {/* Previous Page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-ink-800 text-ink-400 hover:text-ink-100 hover:bg-ink-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-400 disabled:cursor-not-allowed transition"
          title="Previous Page"
        >
          <ChevronLeft size={15} />
        </button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1 mx-1">
          {pages.map((p, idx) =>
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="px-2 py-1 text-ink-500 font-mono select-none">
                …
              </span>
            ) : (
              <button
                key={`page-${p}`}
                onClick={() => onPageChange(p)}
                className={`min-w-[28px] h-7 px-2 rounded-lg font-medium transition text-xs ${
                  currentPage === p
                    ? 'bg-lime-400 text-ink-950 font-bold shadow-sm shadow-lime-400/20'
                    : 'text-ink-300 hover:text-ink-100 hover:bg-ink-800 border border-transparent'
                }`}
              >
                {p}
              </button>
            )
          )}
        </div>

        {/* Next Page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-ink-800 text-ink-400 hover:text-ink-100 hover:bg-ink-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-400 disabled:cursor-not-allowed transition"
          title="Next Page"
        >
          <ChevronRight size={15} />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg border border-ink-800 text-ink-400 hover:text-ink-100 hover:bg-ink-800 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-400 disabled:cursor-not-allowed transition"
          title="Last Page"
        >
          <ChevronsRight size={15} />
        </button>
      </div>

    </div>
  )
}
