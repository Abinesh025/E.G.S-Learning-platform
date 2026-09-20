const userRepository = require('../repositories/userRepository')
const materialRepository = require('../repositories/materialRepository')
const testRepository = require('../repositories/testRepository')
const submissionRepository = require('../repositories/submissionRepository')
const { getPool } = require('../config/db')
const bcrypt = require('bcryptjs')
const { getIo } = require('../socket/chatSocket')
const { validateRegNum } = require('../utils/regNumValidator')
const { validateName } = require('../utils/nameValidator')
const { validatePassword } = require('../utils/passwordValidator')

// ─────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────
exports.getDashboardStats = async (req, res) => {
  try {
    const pool = await getPool()
    const q = await pool.request().query(`
      SELECT 
        (SELECT COUNT(*) FROM Users WHERE Role = 'staff') AS totalStaff,
        (SELECT COUNT(*) FROM Users WHERE Role = 'student') AS totalStudents,
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
      role: 'staff',
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
    const students = await userRepository.getAllUsers({ role: 'student' })
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

    const student = await userRepository.updateUser(Number(req.params.id), updateData)
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
    const deleted = await userRepository.deleteUser(Number(req.params.id))
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
    const staff = await userRepository.getAllUsers({ role: 'staff' })
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
    const { name, email, password, phone, batch, regnum, department } = req.body
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
      role: 'student',
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