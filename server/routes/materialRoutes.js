const express = require('express')
const router = express.Router()
const { uploadMaterial, getMaterials } = require('../controllers/materialController')
const { protectMe } = require('../middleware/authMiddleware')
const { authorizeRoles } = require('../middleware/roleMiddleware')
const { uploadMaterial: cloudinaryUpload } = require('../config/cloudinary')

// Only staff can upload materials
router.post(
  '/upload',
  protectMe,
  authorizeRoles('staff', 'admin'),
  cloudinaryUpload.single('file'),
  uploadMaterial
)

// Students can view materials
router.get('/', protectMe, getMaterials)

module.exports = router