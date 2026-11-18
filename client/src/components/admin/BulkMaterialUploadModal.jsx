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
  BookOpen
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../services/api'

export default function BulkMaterialUploadModal({ isOpen, onClose, onSuccess }) {
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
      const response = await api.get('/api/admin/materials/sample-template', {
        responseType: 'blob'
      })
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'materials_bulk_upload_template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Sample materials template downloaded')
    } catch (err) {
      toast.error('Failed to download template')
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
      const res = await api.post('/api/admin/materials/bulk-validate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setValidationResult(res.data.data)
      if (res.data.data.valid) {
        toast.success(`Validation passed! All ${res.data.data.validCount} materials are valid.`)
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
      const res = await api.post('/api/admin/materials/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success(res.data.message || 'Materials successfully imported!')
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-800 bg-ink-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink-100">Bulk Upload Learning Materials</h2>
              <p className="text-xs text-ink-400">Upload migrated learning materials using an Excel spreadsheet (.xlsx, .csv)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-ink-200 transition-colors p-1 rounded-lg hover:bg-ink-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Action Row: Download Template */}
          <div className="flex items-center justify-between bg-ink-950/60 border border-ink-800/80 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="text-lime-400" size={24} />
              <div>
                <p className="text-sm font-medium text-ink-200">Need the standardized template?</p>
                <p className="text-xs text-ink-500">Download the pre-formatted Excel template with required columns</p>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              disabled={downloading}
              className="flex items-center gap-2 px-3 py-1.5 bg-ink-800 hover:bg-ink-700 text-ink-200 rounded-lg text-xs font-medium border border-ink-700 transition-colors"
            >
              {downloading ? (
                <RefreshCw size={14} className="animate-spin text-lime-400" />
              ) : (
                <Download size={14} className="text-lime-400" />
              )}
              Download Template
            </button>
          </div>

          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
              dragOver
                ? 'border-sky-500 bg-sky-500/5'
                : file
                ? 'border-lime-500/40 bg-lime-500/5'
                : 'border-ink-800 hover:border-ink-700 bg-ink-950/30'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />

            {file ? (
              <div className="flex items-center gap-4 py-2">
                <div className="w-12 h-12 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-lime-400">
                  <FileSpreadsheet size={24} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-ink-100">{file.name}</p>
                  <p className="text-xs text-ink-400">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); resetAll() }}
                  className="p-1.5 rounded-lg text-ink-400 hover:text-ink-200 hover:bg-ink-800 transition-colors ml-4"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="space-y-2 py-4">
                <div className="w-12 h-12 rounded-xl bg-ink-800 flex items-center justify-center text-ink-400 mx-auto">
                  <Upload size={24} />
                </div>
                <p className="text-sm text-ink-200 font-medium">Click or drag & drop Excel file here</p>
                <p className="text-xs text-ink-500">Supports .xlsx, .xls, and .csv files up to 10MB</p>
              </div>
            )}
          </div>

          {/* Validation Feedback & Preview */}
          {validationResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-ink-950/60 border border-ink-800 p-3 rounded-xl">
                  <p className="text-xs text-ink-400">Total Rows</p>
                  <p className="text-lg font-bold text-ink-100">{validationResult.totalRows}</p>
                </div>
                <div className="bg-ink-950/60 border border-lime-900/30 p-3 rounded-xl">
                  <p className="text-xs text-lime-400 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Valid
                  </p>
                  <p className="text-lg font-bold text-lime-300">{validationResult.validCount}</p>
                </div>
                <div className="bg-ink-950/60 border border-rose-900/30 p-3 rounded-xl">
                  <p className="text-xs text-rose-400 flex items-center gap-1">
                    <XCircle size={12} /> Errors
                  </p>
                  <p className="text-lg font-bold text-rose-300">{validationResult.errorCount}</p>
                </div>
              </div>

              {/* Errors List */}
              {!validationResult.valid && (
                <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold">
                    <AlertCircle size={14} />
                    <span>Row Validation Errors ({validationResult.errors.length})</span>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                    {validationResult.errors.map((err, i) => (
                      <div key={i} className="text-xs bg-rose-950/40 p-2 rounded-lg border border-rose-900/20 flex flex-col gap-0.5">
                        <span className="font-semibold text-rose-300">
                          Row {err.row}: <span className="font-normal text-rose-200">"{err.title}"</span>
                        </span>
                        <span className="text-rose-400/90">{err.errors.join(' • ')}</span>
                      </div>
                    ))}
                  </div>

                  <label className="flex items-center gap-2 pt-2 text-xs text-ink-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={skipErrors}
                      onChange={(e) => setSkipErrors(e.target.checked)}
                      className="rounded border-ink-700 bg-ink-900 text-sky-500 focus:ring-0"
                    />
                    <span>Skip invalid rows and import {validationResult.validCount} valid material(s)</span>
                  </label>
                </div>
              )}

              {/* Preview Table */}
              {validationResult.preview && validationResult.preview.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Preview (First 10 Valid Rows)</p>
                  <div className="border border-ink-800 rounded-xl overflow-x-auto max-h-48">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-ink-950 text-ink-400 border-b border-ink-800 uppercase">
                        <tr>
                          <th className="px-3 py-2">Title</th>
                          <th className="px-3 py-2">Subject</th>
                          <th className="px-3 py-2">Unit</th>
                          <th className="px-3 py-2">Department</th>
                          <th className="px-3 py-2">Semester</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-800 text-ink-200">
                        {validationResult.preview.map((m, idx) => (
                          <tr key={idx} className="hover:bg-ink-800/20">
                            <td className="px-3 py-2 font-medium text-ink-100">{m.title}</td>
                            <td className="px-3 py-2">{m.subject}</td>
                            <td className="px-3 py-2">{m.unit}</td>
                            <td className="px-3 py-2 text-ink-400">{m.department}</td>
                            <td className="px-3 py-2">{m.semester || '—'}</td>
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

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-ink-800 bg-ink-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-ink-400 hover:text-ink-200 rounded-lg hover:bg-ink-800 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {!validationResult ? (
              <button
                onClick={handleValidate}
                disabled={!file || validating}
                className="btn-primary flex items-center gap-2 text-sm bg-sky-500 hover:bg-sky-400 disabled:opacity-50"
              >
                {validating && <RefreshCw size={15} className="animate-spin" />}
                {validating ? 'Validating...' : 'Validate File'}
              </button>
            ) : (
              <button
                onClick={handleImport}
                disabled={uploading || (!validationResult.valid && !skipErrors) || validationResult.validCount === 0}
                className="btn-primary flex items-center gap-2 text-sm bg-lime-500 hover:bg-lime-400 text-ink-950 font-semibold disabled:opacity-50 shadow-lg shadow-lime-500/20"
              >
                {uploading && <RefreshCw size={15} className="animate-spin" />}
                {uploading ? 'Importing...' : `Import ${skipErrors ? validationResult.validCount : validationResult.totalRows} Materials`}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
