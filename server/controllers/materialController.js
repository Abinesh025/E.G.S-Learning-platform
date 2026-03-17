const Material = require('../models/Material')
const fs = require('fs')
const path = require('path')

// ─────────────────────────────────────────────
// UPLOAD MATERIAL
// ─────────────────────────────────────────────
exports.uploadMaterial = async (req, res) => {
  try {
    const { title, description, subject, unit, topic } = req.body

    if (!title || !subject) {
      return res.status(400).json({
        success: false,
        message: "Title and subject are required"
      })
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "File is required"
      })
    }

    const material = await Material.create({
      title,
      description,
      subject,
      unit,
      topic,
      fileType: req.file.mimetype,
      fileUrl: req.file.path,
      uploadedBy: req.user._id
    })

    res.status(201).json({
      success: true,
      message: "Material uploaded successfully",
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
// GET ALL MATERIALS (WITH FILTER)
// ─────────────────────────────────────────────
exports.getMaterials = async (req, res) => {
  try {
    const { subject, unit, topic } = req.query

    const filter = {}

    if (subject) filter.subject = subject
    if (unit) filter.unit = unit
    if (topic) filter.topic = topic

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
// UPDATE MATERIAL
// ─────────────────────────────────────────────
// exports.updateMaterial = async (req, res) => {
//   try {
//     const { title, description, subject, unit, topic } = req.body

//     const updateData = {}

//     if (title) updateData.title = title
//     if (description) updateData.description = description
//     if (subject) updateData.subject = subject
//     if (unit) updateData.unit = unit
//     if (topic) updateData.topic = topic

//     const material = await Material.findByIdAndUpdate(
//       req.params.id,
//       { $set: updateData },
//       { new: true, runValidators: true }
//     )

//     if (!material) {
//       return res.status(404).json({
//         success: false,
//         message: "Material not found"
//       })
//     }

//     res.status(200).json({
//       success: true,
//       message: "Material updated successfully",
//       data: material
//     })

//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     })
//   }
// }

// exports.uploadMaterial = async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

//     const newMaterial = await Material.create({
//       title: req.body.title,
//       description: req.body.description,
//       type: req.body.type,
//       fileName: req.file.filename,
//       originalName: req.file.originalname,
//       uploadedBy: req.user._id,
//     })

//     res.status(201).json(newMaterial)
//   } catch (err) {
//     console.error(err)
//     res.status(500).json({ message: 'Upload failed' })
//   }
// }

exports.uploadMaterial = async (req, res) => {
  try {
    // Validate file
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

    // Make sure all required fields exist
    const { title, description, type, subject, unit, topic } = req.body
    if (!title || !type || !subject || !unit || !topic) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    // Construct fileUrl – for example, path on server or S3 URL
    const fileUrl = `/uploads/${req.file.filename}`

    const newMaterial = await Material.create({
      title,
      description,
      type,
      subject,
      unit,
      topic,
      fileUrl,
      fileType: type,
      uploadedBy: req.user._id,
    })

    res.status(201).json(newMaterial)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Material upload failed', error: err.message })
  }
}

// ─────────────────────────────────────────────
// DELETE MATERIAL
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

    // Delete file from server
    if (material.fileUrl) {
      const filePath = path.join(__dirname, "..", material.fileUrl)

      fs.unlink(filePath, (err) => {
        if (err) console.log("File delete error:", err)
      })
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