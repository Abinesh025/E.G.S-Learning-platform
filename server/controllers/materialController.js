const Material = require('../models/Material')
const { cloudinary } = require('../config/cloudinary')

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