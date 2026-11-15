import { useState, useRef } from 'react'
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

export default function BulkStudentUploadModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [validating, setValidating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [validationResult, setValidationResult] = useState(null)
  const [skipErrors, setSkipErrors] = useState(false)
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  const handleDownloadTemplate = async () => {
    try {
      setDownloading(true)
      const response = await api.get('/api/admin/students/sample-template', {
        responseType: 'blob'
      })
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'students_bulk_upload_template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Sample template downloaded')
    } catch (err) {
      toast.error('Failed to download sample template')
    } finally {
      setDownloading(false)
    }
  }

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return
    const ext = selectedFile.name.split('.').pop().toLowerCase()
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      toast.error('Please upload an Excel file (.xlsx, .xls) or .csv file')
      return
    }
    setFile(selectedFile)
    setValidationResult(null)
    setSkipErrors(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleValidate = async () => {
    if (!file) {
      toast.error('Please select an Excel file first')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    try {
      setValidating(true)
      const res = await api.post('/api/admin/students/bulk-validate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setValidationResult(res.data.data)
      if (res.data.data.valid) {
        toast.success(`Validation passed! All ${res.data.data.validCount} records are valid.`)
      } else {
        toast.error(`Validation found ${res.data.data.errorCount} row error(s). Please review.`)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'File validation failed'
      toast.error(msg)
      setValidationResult(null)
    } finally {
      setValidating(false)
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file to import')
      return
    }

    if (!validationResult) {
      toast.error('Please validate the file first')
      return
    }

    if (!validationResult.valid && !skipErrors) {
      toast.error('Please resolve validation errors or check "Skip invalid rows" to proceed')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('skipErrors', skipErrors)

    try {
      setUploading(true)
      const res = await api.post('/api/admin/students/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success(res.data.message || 'Students successfully imported!')
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Bulk upload failed')
    } finally {
      setUploading(false)
    }
  }

  const resetAll = () => {
    setFile(null)
    setValidationResult(null)
    setSkipErrors(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-ink-900 border border-ink-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-ink-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink-100">Bulk Upload Students via Excel</h2>
              <p className="text-xs text-ink-400">Validate column headers, data integrity, and import multiple students at once.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:text-ink-100 hover:bg-ink-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">

          {/* Action Toolbar: Template Download & Requirements Notice */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-ink-800/40 border border-ink-800">
            <div>
              <p className="font-medium text-ink-200 text-xs">Required Columns in Spreadsheet:</p>
              <p className="text-ink-400 text-xs mt-0.5 font-mono">
                Name, Regnum, Email, Department, Year <span className="text-ink-500">(Optional: Batch, Semester, Phone, Password)</span>
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              disabled={downloading}
              className="btn-secondary flex items-center gap-2 text-xs py-1.5 px-3 shrink-0"
            >
              <Download size={14} />
              {downloading ? 'Downloading...' : 'Download Template (.xlsx)'}
            </button>
          </div>

          {/* Drag & Drop Upload Zone */}
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
                dragOver
                  ? 'border-sky-500 bg-sky-500/5'
                  : 'border-ink-700 hover:border-ink-500 bg-ink-950/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-3">
                <Upload size={28} />
              </div>
              <p className="font-semibold text-ink-100 text-base">Click to upload or drag and drop</p>
              <p className="text-ink-400 text-xs mt-1">Supports Microsoft Excel (.xlsx, .xls) and CSV files up to 10MB</p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-ink-950/60 border border-ink-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-ink-100 font-medium text-sm">{file.name}</p>
                  <p className="text-ink-500 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetAll}
                  className="btn-ghost text-xs text-ink-400 hover:text-red-400"
                >
                  Change File
                </button>
                <button
                  onClick={handleValidate}
                  disabled={validating}
                  className="btn-primary text-xs flex items-center gap-1.5 py-1.5 px-3"
                >
                  {validating ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Validate File'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Validation Results Section */}
          {validationResult && (
            <div className="space-y-4">
              
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-ink-950/60 border border-ink-800 text-center">
                  <p className="text-xs text-ink-400 font-medium">Total Rows</p>
                  <p className="text-xl font-bold text-ink-100 mt-1">{validationResult.totalRows}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                  <p className="text-xs text-emerald-400 font-medium flex items-center justify-center gap-1">
                    <CheckCircle2 size={13} /> Valid Records
                  </p>
                  <p className="text-xl font-bold text-emerald-400 mt-1">{validationResult.validCount}</p>
                </div>
                <div className={`p-3.5 rounded-xl text-center ${
                  validationResult.errorCount > 0
                    ? 'bg-red-500/10 border border-red-500/30'
                    : 'bg-ink-950/60 border border-ink-800'
                }`}>
                  <p className={`text-xs font-medium flex items-center justify-center gap-1 ${
                    validationResult.errorCount > 0 ? 'text-red-400' : 'text-ink-400'
                  }`}>
                    <XCircle size={13} /> Errors Found
                  </p>
                  <p className={`text-xl font-bold mt-1 ${
                    validationResult.errorCount > 0 ? 'text-red-400' : 'text-ink-100'
                  }`}>{validationResult.errorCount}</p>
                </div>
              </div>

              {/* Error Details Accordion / List */}
              {validationResult.errorCount > 0 && (
                <div className="border border-red-500/30 rounded-xl bg-red-500/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-400 font-semibold text-xs uppercase tracking-wide">
                      <AlertCircle size={16} />
                      Row Validation Errors ({validationResult.errorCount})
                    </div>
                    {validationResult.validCount > 0 && (
                      <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-ink-200">
                        <input
                          type="checkbox"
                          checked={skipErrors}
                          onChange={(e) => setSkipErrors(e.target.checked)}
                          className="rounded border-ink-700 text-sky-500 focus:ring-sky-500/20"
                        />
                        <span>Skip invalid rows and import {validationResult.validCount} valid student(s)</span>
                      </label>
                    )}
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-lg border border-red-500/20 bg-ink-950/80">
                    <table className="w-full text-xs">
                      <thead className="text-ink-400 uppercase bg-red-950/30 border-b border-red-500/20 sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left w-16">Row #</th>
                          <th className="px-3 py-2 text-left w-36">Student Name</th>
                          <th className="px-3 py-2 text-left w-32">Reg Number</th>
                          <th className="px-3 py-2 text-left">Validation Issues</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-500/10 text-ink-300">
                        {validationResult.errors.map((err, i) => (
                          <tr key={i} className="hover:bg-red-500/5">
                            <td className="px-3 py-2 font-mono text-red-400 font-semibold">{err.rowNumber}</td>
                            <td className="px-3 py-2 font-medium text-ink-200">{err.name}</td>
                            <td className="px-3 py-2 font-mono text-ink-400">{err.regnum}</td>
                            <td className="px-3 py-2 text-red-300">
                              <ul className="list-disc list-inside space-y-0.5">
                                {err.issues.map((issue, j) => (
                                  <li key={j}>{issue.message}</li>
                                ))}
                              </ul>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Valid Students Preview Table */}
              {validationResult.validCount > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-ink-300 uppercase tracking-wider flex items-center justify-between">
                    <span>Preview Valid Students ({validationResult.preview.length} of {validationResult.validCount})</span>
                    <span className="text-emerald-400 text-xs normal-case font-normal">Ready for database import</span>
                  </p>
                  <div className="rounded-xl border border-ink-800 bg-ink-950/60 overflow-hidden">
                    <table className="w-full text-xs whitespace-nowrap">
                      <thead className="bg-ink-800/40 text-ink-400 uppercase border-b border-ink-800">
                        <tr>
                          <th className="px-3 py-2 text-left">Name</th>
                          <th className="px-3 py-2 text-left">Department</th>
                          <th className="px-3 py-2 text-left">Reg Num</th>
                          <th className="px-3 py-2 text-left">Email</th>
                          <th className="px-3 py-2 text-left">Year</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-800/60 text-ink-200">
                        {validationResult.preview.map((s, idx) => (
                          <tr key={idx} className="hover:bg-ink-800/20">
                            <td className="px-3 py-2 font-medium text-ink-100">{s.name}</td>
                            <td className="px-3 py-2 text-ink-400">{s.departmentName}</td>
                            <td className="px-3 py-2 font-mono text-sky-400">{s.regnum}</td>
                            <td className="px-3 py-2 text-ink-400">{s.email}</td>
                            <td className="px-3 py-2">
                              <span className="px-1.5 py-0.5 rounded bg-lime-400/10 text-lime-400 border border-lime-400/20 font-medium">
                                Year {s.yearId}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-ink-800 flex items-center justify-between bg-ink-900/60">
          <button
            onClick={onClose}
            className="btn-ghost text-xs text-ink-400 hover:text-ink-100"
          >
            Cancel
          </button>
          
          <div className="flex items-center gap-2">
            {validationResult && validationResult.validCount > 0 && (
              <button
                onClick={handleImport}
                disabled={uploading || (!validationResult.valid && !skipErrors)}
                className="btn-primary text-xs flex items-center gap-2 py-2 px-4 font-semibold disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Importing Students...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    Import {skipErrors ? validationResult.validCount : (validationResult.valid ? validationResult.validCount : 0)} Students
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
