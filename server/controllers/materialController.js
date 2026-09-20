const materialRepository = require('../repositories/materialRepository')
const userRepository = require('../repositories/userRepository')
const { cloudinary } = require('../config/cloudinary')
const https = require('https')
const http = require('http')
const path = require('path')
const fs = require('fs')
const createNotifications = require('../utils/createNotification')

// Map common extensions → MIME types for correct browser previewing
const MIME_MAP = {
  pdf: 'application/pdf',
  mp4: 'video/mp4',
  webm: 'video/webm',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  txt: 'text/plain',
}

// ─────────────────────────────────────────────
// GET ALL MATERIALS (WITH FILTER)
// ─────────────────────────────────────────────
exports.getMaterials = async (req, res) => {
  try {
    const { subject, unit, department, semester, course } = req.query

    const materials = await materialRepository.getMaterials({
      subject,
      unit,
      department,
      semester,
      course,
    })

    res.status(200).json({
      success: true,
      count: materials.length,
      data: materials,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ─────────────────────────────────────────────
// GET SINGLE MATERIAL
// ─────────────────────────────────────────────
exports.getMaterialById = async (req, res) => {
  try {
    const material = await materialRepository.getMaterialById(req.params.id)

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found',
      })
    }

    res.status(200).json({
      success: true,
      data: material,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ─────────────────────────────────────────────
// UPLOAD MATERIAL (Cloudinary)
// ─────────────────────────────────────────────
exports.uploadMaterial = async (req, res) => {
  try {
    // Verify logged-in user role is staff or admin
    if (req.user.role !== 'staff' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only staff can upload materials' })
    }

    // Validate file
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

    const { title, type, fileType, subject, unit, semester, course } = req.body
    const finalType = type || fileType

    if (!title || !finalType || !subject || !unit) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const department = req.user.department
    if (!department) {
      return res.status(400).json({ message: 'Staff department is required' })
    }

    const parsedSemester = semester ? Number(semester) : null

    let fileUrl = req.file.path
    if (!fileUrl.startsWith('http')) {
      const parts = req.file.path.split(/[\/\\]/)
      const filename = parts[parts.length - 1]
      fileUrl = `/uploads/materials/${filename}`
    }

    const staffName = req.user.name || 'Staff'
    const actualSubjectName = req.body.subjectName || subject

    const newMaterial = await materialRepository.createMaterial({
      title,
      subject,
      subjectName: actualSubjectName,
      unit,
      fileType: finalType,
      fileUrl,
      department,
      semester: parsedSemester,
      course: course || '',
      uploadedBy: req.user._id,
      staffName,
    })

    // Find students in department to send notifications
    const students = await userRepository.getAllUsers({
      role: 'student',
      department,
    })

    const filteredStudents = parsedSemester
      ? students.filter((s) => s.semester === parsedSemester || s.Semester === parsedSemester)
      : students

    const notificationMessage = `New material uploaded by ${staffName}: ${title}`

    await createNotifications({
      senderId: req.user._id,
      receivers: filteredStudents,
      receiverRole: 'student',
      department,
      type: 'material_upload',
      title: 'New Material Uploaded',
      message: notificationMessage,
      materialId: newMaterial._id,
      relatedModel: 'Material',
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
    const material = await materialRepository.getMaterialById(req.params.id)

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found',
      })
    }

    // Delete from Cloudinary if it's a Cloudinary URL
    if (material.fileUrl && material.fileUrl.includes('cloudinary')) {
      try {
        const urlParts = material.fileUrl.split('/')
        const filenameWithExt = urlParts[urlParts.length - 1]
        const folder = urlParts[urlParts.length - 2]
        const publicId = `${folder}/${filenameWithExt.split('.')[0]}`
        await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' })
      } catch (cloudErr) {
        console.log('Cloudinary delete warning:', cloudErr.message)
      }
    }

    await materialRepository.deleteMaterial(req.params.id)

    res.status(200).json({
      success: true,
      message: 'Material deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ─────────────────────────────────────────────
// DOWNLOAD MATERIAL (proxy to avoid CORS)
// ─────────────────────────────────────────────
exports.downloadMaterial = async (req, res) => {
  try {
    const material = await materialRepository.getMaterialById(req.params.id)
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' })
    }

    const fileUrl = material.fileUrl
    if (!fileUrl) {
      return res.status(404).json({ success: false, message: 'No file URL for this material' })
    }

    const dbType = (material.fileType || material.type || '').toLowerCase()

    const TYPE_EXT_MAP = {
      pdf: 'pdf',
      notes: 'pdf',
      video: 'mp4',
      voice: 'mp3',
      file: 'bin',
      image: 'png',
    }

    let rawExt = (fileUrl.split('?')[0].split('.').pop() || '').toLowerCase()
    let ext = rawExt.length > 0 && rawExt.length <= 5 ? rawExt : (TYPE_EXT_MAP[dbType] || 'bin')

    const safeName = material.title.replace(/[^a-z0-9_\- ]/gi, '_')
    const filename = `${safeName}.${ext}`

    const disposition = req.query.inline === '1' ? 'inline' : 'attachment'

    const DB_MIME_MAP = {
      pdf: 'application/pdf',
      notes: 'application/pdf',
      video: 'video/mp4',
      voice: 'audio/mpeg',
      image: 'image/jpeg',
      file: 'application/octet-stream',
    }

    const knownMime = MIME_MAP[ext] || DB_MIME_MAP[dbType]

    if (fileUrl.startsWith('http')) {
      const proto = fileUrl.startsWith('https') ? https : http
      proto.get(fileUrl, (fileRes) => {
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
