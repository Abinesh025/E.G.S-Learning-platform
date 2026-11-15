const express = require('express')
const router = express.Router()
const yearRepository = require('../repositories/yearRepository')

// GET all years
router.get('/', async (req, res) => {
  try {
    const years = await yearRepository.getAllYears()
    res.status(200).json({ success: true, count: years.length, data: years })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

// GET year by ID
router.get('/:id', async (req, res) => {
  try {
    const year = await yearRepository.getYearById(req.params.id)
    if (!year) {
      return res.status(404).json({ success: false, message: 'Year not found' })
    }
    res.status(200).json({ success: true, data: year })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
})

module.exports = router
