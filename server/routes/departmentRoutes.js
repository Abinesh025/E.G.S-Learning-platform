const express = require('express')
const router = express.Router()
const departmentRepository = require('../repositories/departmentRepository')

// GET all departments
router.get('/', async (req, res) => {
  try {
    const departments = await departmentRepository.getAllDepartments()
    res.status(200).json({ success: true, count: departments.length, data: departments })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET department by ID
router.get('/:id', async (req, res) => {
  try {
    const department = await departmentRepository.getDepartmentById(req.params.id)
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' })
    }
    res.status(200).json({ success: true, data: department })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
