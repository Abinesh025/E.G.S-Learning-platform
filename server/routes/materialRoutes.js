const express = require('express')
const multer = require('multer')
const router = express.Router()
const { uploadMaterial, getMaterials } = require('../controllers/materialController')
const { protectMe } = require('../middleware/authMiddleware')
const { authorizeRoles } = require('../middleware/roleMiddleware')

// Multer setup – 20MB max
const upload = multer({ limits: { fileSize: 20 * 1024 * 1024 } })

// Only staff can upload materials
router.post(
  '/upload',
  protectMe,
  authorizeRoles('staff'),
  upload.single('file'),
  uploadMaterial
)

// Students can view materials
router.get('/', protectMe, getMaterials)

module.exports = router