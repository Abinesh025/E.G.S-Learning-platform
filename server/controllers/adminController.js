const userRepository = require('../repositories/userRepository')
const materialRepository = require('../repositories/materialRepository')
const testRepository = require('../repositories/testRepository')
const submissionRepository = require('../repositories/submissionRepository')
const bulkStudentService = require('../services/bulkStudentService')
const bulkStaffService = require('../services/bulkStaffService')
const { getPool } = require('../config/db')
const bcrypt = require('bcryptjs')
const { getIo } = require('../socket/chatSocket')
const { validateRegNum } = require('../utils/regNumValidator')
const { validateName } = require('../utils/nameValidator')
const { validatePassword } = require('../utils/passwordValidator')
const { ROLES } = require('../common')

// ─────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const pool = await getPool()
    const q = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM Staff) AS totalStaff,
        (SELECT COUNT(*) FROM Students) AS totalStudents,
        (SELECT COUNT(*) FROM Materials) AS totalMaterials,
        (SELECT COUNT(*) FROM Tests) AS totalTests,
        (SELECT COUNT(*) FROM Results) AS totalResults
    `)
    const row = q.recordset[0]

    res.status(200).json({
      success: true,
      data: {
        totalStaff: row.totalStaff,
        totalStudents: row.totalStudents,
        totalMaterials: row.totalMaterials,
        totalTests: row.totalTests,
        totalResults: row.totalResults,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────
// CREATE STAFF
// ─────────────────────────────────────────────
exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, phone, department, regnum } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      })
    }

    const nameValidation = validateName(name)
    if (!nameValidation.valid) {
      return res.status(400).json({ success: false, message: nameValidation.message })
    }

    const existing = await userRepository.findUserByEmail(email)
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already exists' })
    }

    if (regnum && regnum.trim()) {
      const regValidation = validateRegNum(regnum.trim(), 'staff')
      if (!regValidation.valid) {
        return res.status(400).json({ success: false, message: regValidation.message })
      }
      const regnumExists = await userRepository.findUserByRegnum(regnum.trim().toUpperCase())
      if (regnumExists) {
        return res.status(400).json({ success: false, message: 'Registration number already in use' })
      }
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return res.status(400).json({ success: false, message: passwordValidation.message })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const staff = await userRepository.createUser({
      name,
      email,
      password: hashedPassword,
      phone,
      department,
      regnum: regnum ? regnum.trim().toUpperCase() : '',
      role: ROLES.STAFF,
    })

    const { Password, password: p, ...data } = staff

    const io = getIo()
    if (io) io.emit('data_changed', 'staff')

    res.status(201).json({
      success: true,
      message: 'Staff created',
      data,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────
// UPDATE STAFF
// ─────────────────────────────────────────────
exports.updateStaff = async (req, res) => {
  try {
    const { name, email, phone, department, isActive, password, regnum } = req.body
    const updateData = {}

    if (name) {
      const nameValidation = validateName(name)
      if (!nameValidation.valid) {
        return res.status(400).json({ success: false, message: nameValidation.message })
      }
      updateData.name = name
    }

    if (email) {
      const exists = await userRepository.findUserByEmail(email)
      if (exists && exists._id !== Number(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Email already in use' })
      }
      updateData.email = email
    }

    if (phone !== undefined) updateData.phone = phone
    if (department !== undefined) updateData.department = department
    if (typeof isActive !== 'undefined') updateData.isActive = isActive

    if (regnum !== undefined) {
      if (regnum && regnum.trim()) {
        const regValidation = validateRegNum(regnum.trim(), 'staff')
        if (!regValidation.valid) {
          return res.status(400).json({ success: false, message: regValidation.message })
        }
        updateData.regnum = regnum.trim().toUpperCase()
      } else {
        updateData.regnum = ''
      }
    }

    if (password) {
      const passwordValidation = validatePassword(password)
      if (!passwordValidation.valid) {
        return res.status(400).json({ success: false, message: passwordValidation.message })
      }
      updateData.password = await bcrypt.hash(password, 10)
    }

    const staff = await userRepository.updateUser(Number(req.params.id), updateData)
    if (!staff) {
      return res.status(404).json({ success: false, message: 'Staff not found' })
    }

    const { Password, password: p, ...safeStaff } = staff

    const io = getIo()
    if (io) io.emit('data_changed', 'staff')

    res.status(200).json({
      success: true,
      message: 'Staff updated',
      data: safeStaff,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────
// DELETE STAFF
// ─────────────────────────────────────────────
exports.deleteStaff = async (req, res) => {
  try {
    const deleted = await userRepository.deleteUser(Number(req.params.id))
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Staff not found' })
    }

    const io = getIo()
    if (io) io.emit('data_changed', 'staff')

    res.status(200).json({
      success: true,
      message: 'Staff deleted',
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────
// GET ALL STUDENTS
// ─────────────────────────────────────────────
exports.getAllStudents = async (req, res) => {
  try {
    const { page, limit, search, department, departmentId, yearId, year, isActive } = req.query
    if (page !== undefined || limit !== undefined) {
      const pageNum = Number(page) || 1
      const limitNum = Number(limit) || 50
      const result = await userRepository.getAllUsers({
        role: ROLES.STUDENT,
        search,
        department,
        departmentId,
        yearId,
        year,
        isActive,
        page: pageNum,
        limit: limitNum,
      })
      return res.status(200).json({
        success: true,
        count: result.users.length,
        total: result.totalCount,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        data: result.users,
      })
    }

    const students = await userRepository.getAllUsers({
      role: ROLES.STUDENT,
      search,
      department,
      departmentId,
      yearId,
      year,
      isActive,
    })
    res.status(200).json({
      success: true,
      count: students.length,
      data: students,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────
// UPDATE STUDENT
// ─────────────────────────────────────────────
exports.updateStudent = async (req, res) => {
  try {
    const { name, email, regnum, phone, batch, department, isActive, password } = req.body
    const updateData = {}

    if (name) {
      const nameValidation = validateName(name)
      if (!nameValidation.valid) {
        return res.status(400).json({ success: false, message: nameValidation.message })
      }
      updateData.name = name
    }

    if (email) {
      const exists = await userRepository.findUserByEmail(email)
      if (exists && exists._id !== Number(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Email already in use' })
      }
      updateData.email = email
    }

    if (phone !== undefined) updateData.phone = phone
    if (batch !== undefined) updateData.batch = batch
    if (department !== undefined) updateData.department = department
    if (typeof isActive !== 'undefined') updateData.isActive = isActive
    if (req.body.yearId !== undefined) updateData.yearId = req.body.yearId
    if (req.body.year !== undefined) updateData.year = req.body.year
    if (req.body.semester !== undefined) updateData.semester = req.body.semester

    if (regnum) {
      const regValidation = validateRegNum(regnum, 'student')
      if (!regValidation.valid) {
        return res.status(400).json({ success: false, message: regValidation.message })
      }
      const regnumExists = await userRepository.findUserByRegnum(regnum.trim().toUpperCase())
      if (regnumExists && regnumExists._id !== Number(req.params.id)) {
        return res.status(400).json({ success: false, message: 'Registration number already in use' })
      }
      updateData.regnum = regnum.trim().toUpperCase()
    }

    if (password) {
      const passwordValidation = validatePassword(password)
      if (!passwordValidation.valid) {
        return res.status(400).json({ success: false, message: passwordValidation.message })
      }
      updateData.password = await bcrypt.hash(password, 10)
    }

    const student = await userRepository.updateUser(req.params.id, updateData)
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' })
    }

    const { Password, password: p, ...safeStudent } = student

    res.status(200).json({
      success: true,
      message: 'Student updated',
      data: safeStudent,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────
// DELETE STUDENT
// ─────────────────────────────────────────────
exports.deleteStudent = async (req, res) => {
  try {
    const deleted = await userRepository.deleteUser(req.params.id)
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Student not found' })
    }

    const io = getIo()
    if (io) io.emit('data_changed', 'student')

    res.status(200).json({
      success: true,
      message: 'Student deleted',
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────
// GET ALL STAFF
// ─────────────────────────────────────────────
exports.getAllStaff = async (req, res) => {
  try {
    const { page, limit, search, department, departmentId, isActive } = req.query
    if (page !== undefined || limit !== undefined) {
      const pageNum = Number(page) || 1
      const limitNum = Number(limit) || 50
      const result = await userRepository.getAllUsers({
        role: ROLES.STAFF,
        search,
        department,
        departmentId,
        isActive,
        page: pageNum,
        limit: limitNum,
      })
      return res.status(200).json({
        success: true,
        count: result.users.length,
        total: result.totalCount,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        data: result.users,
      })
    }

    const staff = await userRepository.getAllUsers({
      role: ROLES.STAFF,
      search,
      department,
      departmentId,
      isActive,
    })
    res.status(200).json({ success: true, count: staff.length, data: staff })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────
// CREATE STUDENT
// ─────────────────────────────────────────────
exports.createStudent = async (req, res) => {
  try {
    const { name, email, password, phone, batch, regnum, department, yearId, year, semester } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Required fields missing' })
    }

    const nameValidation = validateName(name)
    if (!nameValidation.valid) {
      return res.status(400).json({ success: false, message: nameValidation.message })
    }

    if (await userRepository.findUserByEmail(email)) {
      return res.status(400).json({ success: false, message: 'Email already exists' })
    }

    if (regnum) {
      const regValidation = validateRegNum(regnum, 'student')
      if (!regValidation.valid) {
        return res.status(400).json({ success: false, message: regValidation.message })
      }
      const regnumExists = await userRepository.findUserByRegnum(regnum.trim().toUpperCase())
      if (regnumExists) {
        return res.status(400).json({ success: false, message: 'Registration number already in use' })
      }
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return res.status(400).json({ success: false, message: passwordValidation.message })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const student = await userRepository.createUser({
      name,
      email,
      password: hashedPassword,
      phone,
      batch,
      regnum: regnum ? regnum.trim().toUpperCase() : '',
      department,
      yearId,
      year,
      semester,
      role: ROLES.STUDENT,
    })

    const { Password, password: p, ...data } = student

    const io = getIo()
    if (io) io.emit('data_changed', 'student')

    res.status(201).json({ success: true, message: 'Student created', data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────
// ADMIN MATERIALS
// ─────────────────────────────────────────────
exports.getAllMaterials = async (req, res) => {
  try {
    const materials = await materialRepository.getMaterials()
    res.status(200).json({ success: true, data: materials })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.createMaterial = async (req, res) => {
  try {
    const material = await materialRepository.createMaterial({
      ...req.body,
      uploadedBy: req.user._id,
    })

    const io = getIo()
    if (io) io.emit('data_changed', 'material')

    res.status(201).json({ success: true, data: material })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.updateMaterial = async (req, res) => {
  try {
    const material = await materialRepository.updateMaterial(Number(req.params.id), req.body)

    const io = getIo()
    if (io) io.emit('data_changed', 'material')

    res.status(200).json({ success: true, data: material })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.deleteMaterial = async (req, res) => {
  try {
    await materialRepository.deleteMaterial(Number(req.params.id))

    const io = getIo()
    if (io) io.emit('data_changed', 'material')

    res.status(200).json({ success: true, message: 'Material deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────
// ADMIN TESTS
// ─────────────────────────────────────────────
exports.getAllTests = async (req, res) => {
  try {
    const tests = await testRepository.getTests({ department: req.query.department })
    res.status(200).json({ success: true, data: tests })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.createTest = async (req, res) => {
  try {
    const test = await testRepository.createTestWithQuestions({
      ...req.body,
      createdBy: req.user._id,
    })

    const io = getIo()
    if (io) io.emit('data_changed', 'test')

    res.status(201).json({ success: true, data: test })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.updateTest = async (req, res) => {
  try {
    // For test updates, can update test header
    const pool = await getPool()
    const { title, subject, department, duration } = req.body
    await pool.request()
      .input('TestId', require('../config/db').sql.Int, Number(req.params.id))
      .input('Title', require('../config/db').sql.NVarChar(200), title)
      .input('Subject', require('../config/db').sql.NVarChar(100), subject)
      .input('Department', require('../config/db').sql.NVarChar(100), department || '')
      .input('Duration', require('../config/db').sql.Int, duration)
      .query(`
        UPDATE Tests 
        SET Title = COALESCE(@Title, Title),
            Subject = COALESCE(@Subject, Subject),
            Department = COALESCE(@Department, Department),
            Duration = COALESCE(@Duration, Duration),
            UpdatedAt = SYSUTCDATETIME()
        WHERE TestId = @TestId
      `)

    const test = await testRepository.getTestById(Number(req.params.id))

    const io = getIo()
    if (io) io.emit('data_changed', 'test')

    res.status(200).json({ success: true, data: test })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.deleteTest = async (req, res) => {
  try {
    await testRepository.deleteTest(Number(req.params.id))

    const io = getIo()
    if (io) io.emit('data_changed', 'test')

    res.status(200).json({ success: true, message: 'Test deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────
// ADMIN TEST RESULTS
// ─────────────────────────────────────────────
exports.getAllResults = async (req, res) => {
  try {
    const results = await submissionRepository.getAllResults()
    res.status(200).json({ success: true, data: results })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

exports.deleteResult = async (req, res) => {
  try {
    await submissionRepository.deleteResult(Number(req.params.id))

    const io = getIo()
    if (io) io.emit('data_changed', 'result')

    res.status(200).json({ success: true, message: 'Result deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────
// BULK STUDENT IMPORT (EXCEL)
// ─────────────────────────────────────────────

/**
 * Validates uploaded Excel file without inserting records
 */
exports.validateBulkStudents = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a valid .xlsx, .xls, or .csv file.',
      })
    }

    const validationResult = await bulkStudentService.validateStudentExcelBuffer(req.file.buffer)

    res.status(200).json({
      success: true,
      data: validationResult,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
}

/**
 * Inserts bulk students from uploaded file or pre-validated list
 */
exports.uploadBulkStudents = async (req, res) => {
  try {
    let validStudents = []

    if (req.file && req.file.buffer) {
      const validation = await bulkStudentService.validateStudentExcelBuffer(req.file.buffer)
      const skipErrors = req.body.skipErrors === 'true' || req.body.skipErrors === true

      if (!validation.valid && !skipErrors) {
        return res.status(400).json({
          success: false,
          message: `File contains ${validation.errorCount} error(s). Please review errors or enable skip invalid rows.`,
          data: validation,
        })
      }

      validStudents = validation.validStudents
    } else if (Array.isArray(req.body.students)) {
      validStudents = req.body.students
    } else {
      return res.status(400).json({
        success: false,
        message: 'No file or valid student data provided',
      })
    }

    if (validStudents.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid students available to import',
      })
    }

    const result = await bulkStudentService.insertBulkStudents(validStudents)

    const io = getIo()
    if (io) io.emit('data_changed', 'student')

    res.status(201).json({
      success: true,
      message: `Successfully imported ${result.insertedCount} student(s) into database.`,
      count: result.insertedCount,
      data: result.students,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

/**
 * Downloads sample Excel template for bulk student upload
 */
exports.downloadStudentTemplate = (req, res) => {
  try {
    const buffer = bulkStudentService.generateSampleExcelTemplate()

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="students_bulk_upload_template.xlsx"'
    )
    res.send(buffer)
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate template',
    })
  }
}

/**
 * Validates uploaded Excel file for bulk staff import without saving
 */
exports.validateBulkStaff = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a valid .xlsx, .xls, or .csv file.',
      })
    }

    const validationResult = await bulkStaffService.validateStaffExcelBuffer(req.file.buffer)

    res.status(200).json({
      success: true,
      data: validationResult,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
}

/**
 * Inserts bulk staff from uploaded file or pre-validated list
 */
exports.uploadBulkStaff = async (req, res) => {
  try {
    let validStaff = []

    if (req.file && req.file.buffer) {
      const validation = await bulkStaffService.validateStaffExcelBuffer(req.file.buffer)
      const skipErrors = req.body.skipErrors === 'true' || req.body.skipErrors === true

      if (!validation.valid && !skipErrors) {
        return res.status(400).json({
          success: false,
          message: `File contains ${validation.errorCount} error(s). Please review errors or enable skip invalid rows.`,
          data: validation,
        })
      }

      validStaff = validation.validStaff
    } else if (Array.isArray(req.body.staff)) {
      validStaff = req.body.staff
    } else {
      return res.status(400).json({
        success: false,
        message: 'No file or valid staff data provided',
      })
    }

    if (validStaff.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid staff available to import',
      })
    }

    const result = await bulkStaffService.insertBulkStaff(validStaff)

    const io = getIo()
    if (io) io.emit('data_changed', 'staff')

    res.status(201).json({
      success: true,
      message: `Successfully imported ${result.insertedCount} staff member(s) into database.`,
      count: result.insertedCount,
      data: result.staff,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

/**
 * Downloads sample Excel template for bulk staff upload
 */
exports.downloadStaffTemplate = (req, res) => {
  try {
    const buffer = bulkStaffService.generateSampleStaffExcelTemplate()

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="staff_bulk_upload_template.xlsx"'
    )
    res.send(buffer)
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate template',
    })
  }
}
