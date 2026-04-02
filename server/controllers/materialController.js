const Material = require('../models/Material')
const { cloudinary } = require('../config/cloudinary')
const https = require('https')
const http = require('http')
const path = require('path')
const fs = require('fs')

// Map common extensions → MIME types for correct browser previewing
const MIME_MAP = {
  pdf:  'application/pdf',
  mp4:  'video/mp4',
  webm: 'video/webm',
  mp3:  'audio/mpeg',
  wav:  'audio/wav',
  ogg:  'audio/ogg',
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  gif:  'image/gif',
  webp: 'image/webp',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc:  'application/msword',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt:  'text/plain',
}


// ─────────────────────────────────────────────
// GET ALL MATERIALS (WITH FILTER)
// ─────────────────────────────────────────────
exports.getMaterials = async (req, res) => {
  try {
    const { subject, unit, topic, department } = req.query

    const filter = {}

    if (subject) filter.subject = subject
    if (unit) filter.unit = unit
    if (topic) filter.topic = topic
    if (department) filter.department = department

    const materials = await Material.find(filter)
      .populate('uploadedBy', 'name email role')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      count: materials.length,
      data: materials
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// ─────────────────────────────────────────────
// GET SINGLE MATERIAL
// ─────────────────────────────────────────────
exports.getMaterialById = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id)
      .populate('uploadedBy', 'name email role')

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found"
      })
    }

    res.status(200).json({
      success: true,
      data: material
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// ─────────────────────────────────────────────
// UPLOAD MATERIAL (Cloudinary)
// ─────────────────────────────────────────────
exports.uploadMaterial = async (req, res) => {
  try {
    // Validate file
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

    // AdminMaterials sends 'fileType', StaffMaterials sends 'type'
    const { title, description, type, fileType, subject, unit, topic, department } = req.body
    
    const finalType = type || fileType

    // Make sure all required fields exist
    if (!title || !finalType || !subject || !unit || !topic) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Department is required for new uploads
    if (!department) {
      return res.status(400).json({ message: 'Department is required' })
    }

    // Cloudinary stores the full URL in req.file.path
    // If local, we need to map the relative path to /uploads/materials/...
    let fileUrl = req.file.path
    if (!fileUrl.startsWith('http')) {
      const parts = req.file.path.split(/[\/\\]/)
      const filename = parts[parts.length - 1]
      fileUrl = `/uploads/materials/${filename}`
    }

    const newMaterial = await Material.create({
      title,
      description,
      type: finalType,
      subject,
      unit,
      topic,
      department,
      fileUrl,
      fileType: finalType,
      uploadedBy: req.user._id,
    })

    res.status(201).json(newMaterial)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Material upload failed', error: err.message })
  }
}

// ─────────────────────────────────────────────
// DELETE MATERIAL (Cloudinary)
// ─────────────────────────────────────────────
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id)

    if (!material) {
      return res.status(404).json({
        success: false,
        message: "Material not found"
      })
    }

    // Delete from Cloudinary if it's a Cloudinary URL
    if (material.fileUrl && material.fileUrl.includes('cloudinary')) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = material.fileUrl.split('/')
        const filenameWithExt = urlParts[urlParts.length - 1]
        const folder = urlParts[urlParts.length - 2]
        const publicId = `${folder}/${filenameWithExt.split('.')[0]}`
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' })
      } catch (cloudErr) {
        console.log('Cloudinary delete warning:', cloudErr.message)
      }
    }

    await material.deleteOne()

    res.status(200).json({
      success: true,
      message: "Material deleted successfully"
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// ─────────────────────────────────────────────
// DOWNLOAD MATERIAL (proxy to avoid CORS)
// Supports ?inline=1 for in-browser preview (iframe)
// ─────────────────────────────────────────────
exports.downloadMaterial = async (req, res) => {
  try {
    const material = await Material.findById(req.params.id)
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' })
    }

    const fileUrl = material.fileUrl
    if (!fileUrl) {
      return res.status(404).json({ success: false, message: 'No file URL for this material' })
    }

    // ── Determine extension & MIME ────────────────────────────────────────
    // Cloudinary often stores raw files WITHOUT an extension in the URL.
    // When that happens, fall back to the fileType / type stored in MongoDB.
    const dbType = (material.fileType || material.type || '').toLowerCase()

    // DB type → default extension (used when URL has no recognisable ext)
    const TYPE_EXT_MAP = {
      pdf:   'pdf',
      notes: 'pdf',   // staff/students upload PDFs as "notes"
      video: 'mp4',
      voice: 'mp3',
      file:  'bin',
      image: 'png',
    }

    let rawExt = (fileUrl.split('?')[0].split('.').pop() || '').toLowerCase()
    // If the "extension" is very long it's not really an extension (Cloudinary ID suffix)
    let ext = rawExt.length > 0 && rawExt.length <= 5 ? rawExt : (TYPE_EXT_MAP[dbType] || 'bin')

    const safeName = material.title.replace(/[^a-z0-9_\- ]/gi, '_')
    const filename = `${safeName}.${ext}`

    // Use inline disposition for preview requests (?inline=1), attachment for downloads
    const disposition = req.query.inline === '1' ? 'inline' : 'attachment'

    // DB-type MIME map (used when URL ext gives nothing useful)
    const DB_MIME_MAP = {
      pdf:   'application/pdf',
      notes: 'application/pdf',
      video: 'video/mp4',
      voice: 'audio/mpeg',
      image: 'image/jpeg',
      file:  'application/octet-stream',
    }

    // Prefer URL-extension MIME, then DB-type MIME
    const knownMime = MIME_MAP[ext] || DB_MIME_MAP[dbType]

    if (fileUrl.startsWith('http')) {
      // Remote URL (Cloudinary) — pipe through this server
      const proto = fileUrl.startsWith('https') ? https : http
      proto.get(fileUrl, (fileRes) => {
        // Use our known MIME type if available; otherwise fall back to what the remote says
        const contentType = knownMime || fileRes.headers['content-type'] || 'application/octet-stream'
        res.setHeader('Content-Type', contentType)
        res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`)
        res.setHeader('Access-Control-Allow-Origin', '*')
        if (fileRes.headers['content-length']) {
          res.setHeader('Content-Length', fileRes.headers['content-length'])
        }
        fileRes.pipe(res)
      }).on('error', (err) => {
        console.error('Download proxy error:', err.message)
        res.status(500).json({ success: false, message: 'Failed to download file' })
      })
    } else {
      // Local file
      const localPath = path.join(__dirname, '..', fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl)
      if (!fs.existsSync(localPath)) {
        return res.status(404).json({ success: false, message: 'Local file not found' })
      }
      const contentType = knownMime || 'application/octet-stream'
      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`)
      res.sendFile(localPath)
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}