import { useState, useEffect, useRef } from 'react'
import { File, Download, X, Play, Pause, BookOpen, Video, Mic, Loader } from 'lucide-react'
import { renderAsync } from 'docx-preview'
import toast from 'react-hot-toast'

const typeConfig = {
  notes: { icon: BookOpen, color: 'tag-lime', label: 'Notes' },
  video: { icon: Video, color: 'tag-sky', label: 'Video' },
  voice: { icon: Mic, color: 'tag-amber', label: 'Voice' },
  file: { icon: File, color: 'tag-red', label: 'File' },
}

export default function MaterialViewer({ material, onClose }) {
  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const [audioElement, setAudioElement] = useState(null)

  const sType = material?.fileType || material?.type || 'file'

  // Helper to get correct static files URL from backend
  const getBackendUrl = (url) => {
    if (!url || url === 'undefined' || url.includes('/undefined')) return ''
    if (url.startsWith('http')) return url
    // If VITE_API_URL exists and ends with /api, remove it to get the base domain
    let baseUrl = import.meta.env.VITE_API_URL || ''
    if (baseUrl.endsWith('/api')) {
      baseUrl = baseUrl.slice(0, -4)
    }
    // If baseUrl is empty, we return a relative path so Vite proxy (or Prod web server) serves it from exactly the same domain/IP you accessed the frontend with
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
  }

  // Initialize and cleanup Audio element
  useEffect(() => {
    if (sType === 'voice' && material?.fileUrl) {
      const fullUrl = getBackendUrl(material.fileUrl)
      
      const audio = new Audio(fullUrl)
      
      const setAudioData = () => {
        setAudioDuration(audio.duration)
        setAudioProgress(audio.currentTime)
      }
      
      const setAudioTime = () => setAudioProgress(audio.currentTime)
      const onEnded = () => setIsPlaying(false)

      audio.addEventListener('loadedmetadata', setAudioData)
      audio.addEventListener('timeupdate', setAudioTime)
      audio.addEventListener('ended', onEnded)

      setAudioElement(audio)

      return () => {
        audio.pause()
        audio.removeEventListener('loadedmetadata', setAudioData)
        audio.removeEventListener('timeupdate', setAudioTime)
        audio.removeEventListener('ended', onEnded)
      }
    } else {
      if (audioElement) {
        audioElement.pause()
        setAudioElement(null)
        setIsPlaying(false)
        setAudioProgress(0)
      }
    }
    // Only log if material is actually provided (not null)
    if (material) {
        console.log('MaterialViewer opened with data:', {
            id: material._id,
            title: material.title,
            type: material.type,
            fileType: material.fileType,
            url: material.fileUrl
        });
    }

  }, [material, sType])

  const handleDownload = async (url, filename) => {
    try {
      if (!url) return;
      toast.loading('Starting download...', { id: 'download' });
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      
      // Try to determine extension
      let ext = url.split('.').pop()?.split('?')[0];
      if (!ext || ext.length > 4) ext = 'file';
      const downloadName = filename ? `${filename}.${ext}` : `download.${ext}`;
      
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
      toast.success('Download complete', { id: 'download' });
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Download failed. Opening in new tab...', { id: 'download' });
      window.open(url, '_blank');
    }
  };

  const toggleAudioPlay = () => {
    if (!audioElement) return
    if (isPlaying) {
      audioElement.pause()
    } else {
      audioElement.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleAudioSeek = (e) => {
    if (!audioElement) return
    const time = Number(e.target.value)
    audioElement.currentTime = time
    setAudioProgress(time)
  }

  const formatTime = (timeInSeconds) => {
    if (!timeInSeconds || isNaN(timeInSeconds)) return "0:00"
    const m = Math.floor(timeInSeconds / 60)
    const s = Math.floor(timeInSeconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Detect Word documents
  const fileUrl = material?.fileUrl || ''
  const isWordDoc = /\.(docx?)(\?.*)?$/i.test(fileUrl)

  // Word doc preview via docx-preview (client-side, no external service needed)
  const wordContainerRef = useRef(null)
  const [wordLoading, setWordLoading] = useState(false)
  const [wordError, setWordError] = useState(null)

  useEffect(() => {
    if (!isWordDoc || !material?.fileUrl) return
    const url = getBackendUrl(material.fileUrl)
    if (!url) return
    setWordLoading(true)
    setWordError(null)
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`Failed to fetch file (${res.status})`)
        return res.blob()
      })
      .then(blob =>
        renderAsync(blob, wordContainerRef.current, undefined, {
          className: 'docx-render',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          debug: false,
        })
      )
      .then(() => setWordLoading(false))
      .catch(err => {
        setWordError(err.message || 'Failed to load document')
        setWordLoading(false)
      })
  }, [isWordDoc, material?.fileUrl])

  if (!material) return null

  return (
    <div className="fixed inset-0 bg-ink-950/90 backdrop-blur-md flex items-center justify-center z-[100] p-4 sm:p-6 animate-fade-in" onClick={onClose}>
      <div 
        className={`bg-ink-900 border border-ink-800 rounded-2xl flex flex-col overflow-hidden animate-fade-up ${sType === 'voice' ? 'max-w-md w-full' : 'max-w-5xl w-full max-h-[90vh]'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-ink-800 bg-ink-950/50">
          <div className="flex items-center gap-3 truncate pr-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeConfig[sType]?.color.replace('tag-', 'bg-').replace('text', 'text-ink-950') || 'bg-ink-800'}`}>
              {(() => {
                const Icon = typeConfig[sType]?.icon || File
                return <Icon size={20} className={typeConfig[sType] ? 'text-ink-950' : 'text-ink-400'} />
              })()}
            </div>
            <div className="truncate">
              <h3 className="text-ink-50 font-600 truncate">{material.title}</h3>
              <p className="text-ink-500 text-xs truncate capitalize">{sType} • {material.uploadedBy?.name || 'Instructor'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getBackendUrl(material.fileUrl) && (
              <button
                onClick={() => handleDownload(getBackendUrl(material.fileUrl), material.title)}
                className="btn-ghost p-2 text-ink-400 hover:text-lime-300"
                title="Download"
              >
                <Download size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="btn-ghost p-2 text-ink-400 hover:text-red-400"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className={`flex-1 overflow-auto ${sType === 'voice' ? 'p-6' : 'p-0 bg-ink-950'}`}>
          {!getBackendUrl(material.fileUrl) ? (
            <div className="p-12 text-center flex flex-col items-center justify-center h-full">
              <File size={48} className="text-ink-600 mb-4" />
              <h4 className="text-red-400 font-medium mb-2">File not available</h4>
              <p className="text-ink-500 text-sm mb-6">The URL for this material is broken or undefined.</p>
            </div>
          ) : (
            <>
              {/* Notes & File Viewer (iframe/object) — PDFs and previewable files only */}
              {(sType === 'notes' || sType === 'file' || sType === 'pdf') && !isWordDoc && (
                <div className="w-full h-[60vh] sm:h-[75vh]">
                  <iframe
                    src={getBackendUrl(material.fileUrl)}
                    className="w-full h-full border-0 bg-white"
                    title={material.title}
                  >
                      <p>Your browser does not support iframes. <a href={getBackendUrl(material.fileUrl)}>Download the document</a></p>
                  </iframe>
                </div>
              )}

              {/* Word Document — client-side preview via docx-preview */}
              {isWordDoc && (
                <div className="w-full h-[60vh] sm:h-[75vh] overflow-auto bg-ink-950 flex flex-col">
                  {wordLoading && (
                    <div className="flex items-center justify-center h-full gap-3 text-ink-400">
                      <Loader size={20} className="animate-spin" />
                      <span className="text-sm">Loading document…</span>
                    </div>
                  )}
                  {wordError && (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                      <File size={36} className="text-ink-600" />
                      <p className="text-red-400 text-sm">{wordError}</p>
                      <button
                        onClick={() => handleDownload(getBackendUrl(material.fileUrl), material.title)}
                        className="btn-primary flex items-center gap-2 mt-2"
                      >
                        <Download size={14} /> Download Instead
                      </button>
                    </div>
                  )}
                  <div
                    ref={wordContainerRef}
                    className="flex-1 overflow-auto p-4 bg-white"
                    style={{ display: wordLoading || wordError ? 'none' : 'block' }}
                  />
                </div>
              )}

              {/* Video Player */}
              {sType === 'video' && (
                <div className="w-full aspect-video bg-black flex items-center justify-center">
                  <video
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                    width="100%"
                  >
                    <source src={getBackendUrl(material.fileUrl)} type="video/mp4" />
                    <source src={getBackendUrl(material.fileUrl)} type="video/webm" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {/* Voice Note Player (WhatsApp Style) */}
              {sType === 'voice' && (
                <div className="space-y-4">
                  {material.description && (
                    <p className="text-ink-400 text-sm">{material.description}</p>
                  )}
                  
                  <div className="bg-ink-950 border border-ink-800 rounded-full p-2 flex items-center gap-3">
                    <button
                      onClick={toggleAudioPlay}
                      className="w-10 h-10 shrink-0 bg-lime-400 hover:bg-lime-300 rounded-full flex items-center justify-center text-ink-950 transition-colors"
                    >
                      {isPlaying ? <Pause size={18} className="fill-ink-950" /> : <Play size={18} className="fill-ink-950 ml-0.5" />}
                    </button>
                    
                    <div className="flex-1 flex items-center gap-2 group">
                      <input
                        type="range"
                        min="0"
                        max={audioDuration || 100}
                        value={audioProgress}
                        onChange={handleAudioSeek}
                        className="w-full h-1.5 bg-ink-800 rounded-full appearance-none cursor-pointer accent-lime-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-lime-400 [&::-webkit-slider-thumb]:rounded-full transition-all group-hover:[&::-webkit-slider-thumb]:scale-125"
                        style={{
                          background: `linear-gradient(to right, #a3e635 ${(audioProgress / (audioDuration || 1)) * 100}%, #2d2d2d ${(audioProgress / (audioDuration || 1)) * 100}%)`
                        }}
                      />
                    </div>
                    
                    <span className="text-ink-400 text-xs font-mono w-12 text-right pr-2">
                      {formatTime(audioProgress)}
                    </span>
                  </div>
                </div>
              )}

              {/* Unsupported Type Fallback */}
              {sType !== 'notes' && sType !== 'file' && sType !== 'pdf' && sType !== 'video' && sType !== 'voice' && (
                  <div className="p-12 text-center flex flex-col items-center justify-center h-full">
                      <File size={48} className="text-ink-600 mb-4" />
                      <h4 className="text-ink-100 font-medium mb-2">Unsupported file type</h4>
                      <p className="text-ink-500 text-sm mb-6">This file cannot be previewed directly in the browser.</p>
                      <button
                        onClick={() => handleDownload(getBackendUrl(material.fileUrl), material.title)}
                        className="btn-primary"
                      >
                          Download File
                      </button>
                  </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
