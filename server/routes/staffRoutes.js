const express = require('express')
const router = express.Router()

const {
  getStaffProfile,
  updateStaffProfile,
  getMyMaterials,
  deleteMaterial,
  getMyTests,
  deleteTest,
  getTestResults,
  getStudents,
  getDashboardStats,
  deleteStudent
} = require('../controllers/staffController')



const { protectMe } = require('../middleware/authMiddleware')
const { authorizeRoles } = require('../middleware/roleMiddleware')

// ✅ FIXED
router.use(protectMe)
router.use(authorizeRoles('staff'))

router.get('/profile', getStaffProfile)
router.put('/profile', updateStaffProfile)

router.get("/students",getStudents);
router.delete("/delete/:id",deleteStudent);

router.get('/materials', getMyMaterials)
router.delete('/materials/:id', deleteMaterial)

router.get('/tests', getMyTests)
router.delete('/tests/:id', deleteTest)

router.get('/results/:testId', getTestResults)

router.get('/stats', getDashboardStats)

module.exports = router