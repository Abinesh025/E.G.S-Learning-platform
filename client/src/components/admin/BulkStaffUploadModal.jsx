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

export default function BulkStaffUploadModal({ isOpen, onClose, onSuccess }) {
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
      const response = await api.get('/api/admin/staff/sample-template', {
        responseType: 'blob'
      })
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'staff_bulk_upload_template.xlsx')
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
      const res = await api.post('/api/admin/staff/bulk-validate', formData, {
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
      const res = await api.post('/api/admin/staff/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success(res.data.message || 'Staff successfully imported!')
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
              <h2 className="text-lg font-semibold text-ink-100">Bulk Upload Staff via Excel</h2>
              <p className="text-xs text-ink-400">Validate column headers, faculty format, and import multiple staff members at once.</p>
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
                Name, Regnum, Email, Department <span className="text-ink-500">(Optional: Designation, Phone, Password)</span>
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
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <p className="text-xs text-emerald-400 font-medium flex items-center justify-center gap-1">
                    <CheckCircle2 size={13} /> Valid Rows
                  </p>
                  <p className="text-xl font-bold text-emerald-300 mt-1">{validationResult.validCount}</p>
                </div>
                <div className={`p-3.5 rounded-xl text-center border ${
                  validationResult.errorCount > 0
                    ? 'bg-red-500/10 border-red-500/20'
                    : 'bg-ink-950/60 border-ink-800'
                }`}>
                  <p className={`text-xs font-medium flex items-center justify-center gap-1 ${
                    validationResult.errorCount > 0 ? 'text-red-400' : 'text-ink-400'
                  }`}>
                    <XCircle size={13} /> Error Rows
                  </p>
                  <p className={`text-xl font-bold mt-1 ${
                    validationResult.errorCount > 0 ? 'text-red-300' : 'text-ink-300'
                  }`}>
                    {validationResult.errorCount}
                  </p>
                </div>
              </div>

              {/* Status Banner */}
              {validationResult.valid ? (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5 text-emerald-300 text-xs">
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                  <span>Validation passed! All {validationResult.validCount} staff records are ready for import.</span>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-amber-300 text-xs">
                  <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold">Some rows failed validation:</p>
                    <p className="text-amber-300/80 mt-0.5">
                      Review the error log below. You can fix the spreadsheet and re-upload, or choose to skip invalid rows and import only valid ones.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Details Accordion/Table */}
              {validationResult.errorCount > 0 && (
                <div className="border border-red-500/20 rounded-xl overflow-hidden bg-red-950/10">
                  <div className="p-3 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between">
                    <span className="font-semibold text-xs text-red-300">
                      Validation Errors ({validationResult.errorCount} rows)
                    </span>
                    <span className="text-[11px] text-red-400">Row numbers correspond to Excel rows</span>
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-red-500/10">
                    {validationResult.errors.map((err, idx) => (
                      <div key={idx} className="p-3 text-xs flex flex-col gap-1">
                        <div className="flex items-center justify-between text-ink-300">
                          <span className="font-semibold text-red-300">Row {err.rowNumber}: {err.name}</span>
                          <span className="font-mono text-[11px] text-ink-400">Reg: {err.regnum} | {err.email}</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-red-400 pl-1">
                          {err.issues.map((issue, i) => (
                            <li key={i}><span className="font-medium capitalize">{issue.field}:</span> {issue.message}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Valid Records */}
              {validationResult.validCount > 0 && (
                <div className="border border-ink-800 rounded-xl overflow-hidden">
                  <div className="p-3 bg-ink-800/40 border-b border-ink-800 flex items-center justify-between">
                    <span className="font-semibold text-xs text-ink-200">
                      Preview Valid Records (First {Math.min(validationResult.validCount, 10)} of {validationResult.validCount})
                    </span>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-ink-950/60 text-ink-400 border-b border-ink-800">
                        <tr>
                          <th className="px-3 py-2">Row</th>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">Regnum</th>
                          <th className="px-3 py-2">Email</th>
                          <th className="px-3 py-2">Department</th>
                          <th className="px-3 py-2">Designation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink-800/60">
                        {validationResult.preview.map((s, idx) => (
                          <tr key={idx} className="hover:bg-ink-800/30">
                            <td className="px-3 py-2 font-mono text-ink-500">{s.rowNumber}</td>
                            <td className="px-3 py-2 text-ink-200 font-medium">{s.name}</td>
                            <td className="px-3 py-2 font-mono text-sky-400">{s.regnum}</td>
                            <td className="px-3 py-2 text-ink-300">{s.email}</td>
                            <td className="px-3 py-2 text-ink-300">{s.departmentName}</td>
                            <td className="px-3 py-2 text-ink-400">{s.designation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Skip Errors Checkbox when errors exist */}
              {validationResult.errorCount > 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-ink-800/30 border border-ink-800">
                  <input
                    type="checkbox"
                    id="skipStaffErrors"
                    checked={skipErrors}
                    onChange={(e) => setSkipErrors(e.target.checked)}
                    className="checkbox"
                  />
                  <label htmlFor="skipStaffErrors" className="text-xs text-ink-300 cursor-pointer select-none">
                    Skip invalid rows and proceed with importing <strong className="text-emerald-400">{validationResult.validCount}</strong> valid staff members
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-ink-800 bg-ink-950/40 flex items-center justify-between">
          <button
            onClick={resetAll}
            className="btn-ghost text-xs text-ink-400 hover:text-ink-200"
          >
            Reset
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="btn-ghost text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={
                uploading ||
                !validationResult ||
                validationResult.validCount === 0 ||
                (!validationResult.valid && !skipErrors)
              }
              className="btn-primary text-xs flex items-center gap-1.5 py-2 px-4 disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Import {validationResult?.validCount ? `${skipErrors && !validationResult.valid ? validationResult.validCount : validationResult.validCount} Staff` : 'Staff'}
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
