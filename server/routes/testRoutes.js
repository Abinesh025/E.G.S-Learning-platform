const express = require('express')
const router = express.Router()
const {
  createTest,
  getTests,
  getTestById,
  submitTest,
  getStudentResults
} = require('../controllers/testController')

const { protectMe } = require('../middleware/authMiddleware')
const { authorizeRoles } = require('../middleware/roleMiddleware')
const { ROLES } = require('../common')

// Staff creates test
router.post('/', protectMe, authorizeRoles(ROLES.STAFF, ROLES.ADMIN), createTest)
router.get('/all', protectMe, authorizeRoles(ROLES.STAFF, ROLES.ADMIN), getTests)

// Students view tests
router.get('/', protectMe, authorizeRoles(ROLES.STUDENT), getTests)
router.get('/:id', protectMe, authorizeRoles(ROLES.STUDENT), getTestById)

// Student submits
router.post('/:id/submit', protectMe, authorizeRoles(ROLES.STUDENT), submitTest)

// Student results
router.get('/results/me', protectMe, authorizeRoles(ROLES.STUDENT), getStudentResults)

module.exports = router