const userRepository = require('../repositories/userRepository')
const materialRepository = require('../repositories/materialRepository')
const testRepository = require('../repositories/testRepository')
const submissionRepository = require('../repositories/submissionRepository')
const { getPool, sql } = require('../config/db')
const { validateName } = require('../utils/nameValidator')
const fs = require('fs')
const path = require('path')
const { getIo } = require('../socket/chatSocket')

// ─────────────────────────────────────────────
// GET STAFF PROFILE
// ─────────────────────────────────────────────
exports.getStaffProfile = async (req, res) => {
  try {
    const staff = await userRepository.findUserById(req.user._id)

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      })
    }

    const { Password, password, ...safeStaff } = staff

    res.status(200).json({
      success: true,
      data: safeStaff,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ─────────────────────────────────────────────
// UPDATE STAFF PROFILE
// ─────────────────────────────────────────────
exports.updateStaffProfile = async (req, res) => {
  try {
    const { name, department, avatar } = req.body

    const staff = await userRepository.findUserById(req.user._id)
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff not found',
      })
    }

    const updates = {}
    if (name) {
      const nameValidation = validateName(name)
      if (!nameValidation.valid) {
        return res.status(400).json({
          success: false,
          message: nameValidation.message,
        })
      }
      updates.name = name
    }
    if (department) updates.department = department
    if (avatar) updates.avatar = avatar

    const updatedStaff = await userRepository.updateUser(req.user._id, updates)
    const { Password, password, ...safeStaff } = updatedStaff

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: safeStaff,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ─────────────────────────────────────────────
// UPDATE MATERIAL
// ─────────────────────────────────────────────
exports.updateMaterial = async (req, res) => {
  try {
    const { title, subject, unit, type, fileType, semester, course } = req.body
    const finalType = type || fileType

    const material = await materialRepository.getMaterialById(req.params.id)
    if (!material) {
      return res.status(404).json({ success: false, message: 'Material not found' })
    }

    const uploaderId = material.uploadedBy?._id || material.uploadedBy || material.UploadedBy
    if (uploaderId !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }

    const updates = {}
    if (title) updates.title = title
    if (subject) updates.subject = subject
    if (req.user.department) updates.department = req.user.department
    if (unit) updates.unit = unit
    if (finalType) updates.fileType = finalType
    if (semester !== undefined) updates.semester = semester ? Number(semester) : null
    if (course !== undefined) updates.course = course || ''

    const updatedMaterial = await materialRepository.updateMaterial(req.params.id, updates)

    const io = getIo()
    if (io) io.emit('data_changed', 'material')

    res.status(200).json({ success: true, message: 'Material updated successfully', data: updatedMaterial })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────
// GET MY MATERIALS
// ─────────────────────────────────────────────
exports.getMyMaterials = async (req, res) => {
  try {
    const { semester, course } = req.query
    const materials = await materialRepository.getMaterials({
      uploadedBy: req.user._id,
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
// DELETE MATERIAL
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

    const uploaderId = material.uploadedBy?._id || material.uploadedBy || material.UploadedBy
    if (uploaderId !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      })
    }

    // delete local file if present
    if (material.fileUrl && !material.fileUrl.startsWith('http')) {
      const filePath = path.join(__dirname, '..', material.fileUrl.startsWith('/') ? material.fileUrl.slice(1) : material.fileUrl)
      fs.unlink(filePath, (err) => {
        if (err) console.log('File delete error:', err)
      })
    }

    await materialRepository.deleteMaterial(req.params.id)

    const io = getIo()
    if (io) io.emit('data_changed', 'material')

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
// GET MY TESTS
// ─────────────────────────────────────────────
exports.getMyTests = async (req, res) => {
  try {
    const tests = await testRepository.getTests({ createdBy: req.user._id })

    res.status(200).json({
      success: true,
      count: tests.length,
      data: tests,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ─────────────────────────────────────────────
// DELETE TEST
// ─────────────────────────────────────────────
exports.deleteTest = async (req, res) => {
  try {
    const testId = Number(req.params.id)
    const test = await testRepository.getTestById(testId)

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Test not found',
      })
    }

    if (test.createdBy !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      })
    }

    await testRepository.deleteTest(testId)

    const io = getIo()
    if (io) io.emit('data_changed', 'test')

    res.status(200).json({
      success: true,
      message: 'Test deleted successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ─────────────────────────────────────────────
// GET TEST RESULTS
// ─────────────────────────────────────────────
exports.getTestResults = async (req, res) => {
  try {
    const results = await submissionRepository.getResultsByTest(req.params.testId)

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ─────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const pool = await getPool()
    let totalStudents = 0, totalStaff = 0, totalMaterials = 0, totalTests = 0, totalResults = 0

    if (req.user.role === 'admin') {
      const q = await pool.request().query(`
        SELECT 
          (SELECT COUNT(*) FROM Users WHERE Role = 'student') AS totalStudents,
          (SELECT COUNT(*) FROM Users WHERE Role = 'staff') AS totalStaff,
          (SELECT COUNT(*) FROM Materials) AS totalMaterials,
          (SELECT COUNT(*) FROM Tests) AS totalTests,
          (SELECT COUNT(*) FROM Results) AS totalResults
      `)
      const row = q.recordset[0]
      totalStudents = row.totalStudents
      totalStaff = row.totalStaff
      totalMaterials = row.totalMaterials
      totalTests = row.totalTests
      totalResults = row.totalResults
    } else if (req.user.role === 'staff') {
      const q = await pool.request()
        .input('UserId', sql.Int, req.user._id)
        .query(`
          SELECT 
            (SELECT COUNT(*) FROM Materials WHERE UploadedBy = @UserId) AS totalMaterials,
            (SELECT COUNT(*) FROM Tests WHERE CreatedBy = @UserId) AS totalTests,
            (SELECT COUNT(*) FROM Results r INNER JOIN Tests t ON r.TestId = t.TestId WHERE t.CreatedBy = @UserId) AS totalResults
        `)
      const row = q.recordset[0]
      totalMaterials = row.totalMaterials
      totalTests = row.totalTests
      totalResults = row.totalResults
    }

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalStaff,
        totalMaterials,
        totalTests,
        totalResults,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
    })
  }
}