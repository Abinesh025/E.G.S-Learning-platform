const express = require('express')
const router = express.Router()

const {
  register,
  getMe,
  login
} = require('../controllers/authController')
const  {protectMe } = require('../middleware/authMiddleware')

router.post('/register',register);
router.post('/login' ,login);
router.get('/profile', protectMe,getMe);

module.exports = router