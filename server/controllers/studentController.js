const userRepository = require('../repositories/userRepository')
const materialRepository = require('../repositories/materialRepository')
const testRepository = require('../repositories/testRepository')
const submissionRepository = require('../repositories/submissionRepository')
const { validateName } = require('../utils/nameValidator')

// Get Student Profile
exports.getStudentProfile = async (req, res) => {
  try {
    const student = await userRepository.findUserById(req.user._id)
    if (!student) return res.status(404).json({ message: 'Student not found' })

    const { Password, password, ...safeStudent } = student
    res.json(safeStudent)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Update Student Profile
exports.updateStudentProfile = async (req, res) => {
  try {
    const { name, department, avatar } = req.body

    const student = await userRepository.findUserById(req.user._id)
    if (!student) return res.status(404).json({ message: 'Student not found' })

    const updates = {}
    if (name) {
      const nameValidation = validateName(name)
      if (!nameValidation.valid) {
        return res.status(400).json({ success: false, message: nameValidation.message })
      }
      updates.name = name
    }
    if (department) updates.department = department
    if (avatar) updates.avatar = avatar

    const updatedStudent = await userRepository.updateUser(req.user._id, updates)
    const { Password, password, ...safeStudent } = updatedStudent

    res.json({ message: 'Profile updated', student: safeStudent })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get All Study Materials (Filter supported)
exports.getAllMaterials = async (req, res) => {
  try {
    const { subject, department, semester, course } = req.query
    const studentDept = req.user.department || department

    const materials = await materialRepository.getMaterials({
      subject,
      department: studentDept,
      semester,
      course,
    })

    res.json(materials)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get Single Material
exports.getMaterialById = async (req, res) => {
  try {
    const material = await materialRepository.getMaterialById(req.params.id)
    if (!material) return res.status(404).json({ message: 'Material not found' })

    res.json(material)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get Available Tests
exports.getAvailableTests = async (req, res) => {
  try {
    const { department } = req.query
    const studentDept = department || req.user.department

    const tests = await testRepository.getTests({ department: studentDept })
    res.json(tests)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Get Test Details (hide answers)
exports.getTestDetails = async (req, res) => {
  try {
    const test = await testRepository.getTestById(req.params.id, false)
    if (!test) return res.status(404).json({ message: 'Test not found' })

    res.json(test)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// Submit Test
exports.submitTest = async (req, res) => {
  const { submitTest } = require('./testController')
  return submitTest(req, res)
}

// Get My Results
exports.getMyResults = async (req, res) => {
  try {
    const results = await submissionRepository.getResultsByStudent(req.user._id)
    res.json(results)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}