const express = require('express')
const router = express.Router()
const { getChatHistory, uploadVoice } = require('../controllers/chatController')
const { protectMe } = require('../middleware/authMiddleware')
const upload = require('../middleware/uploadMiddleware')

router.get('/history/:userId', protectMe, getChatHistory)
router.post('/upload-voice', protectMe, upload.single('audio'), uploadVoice)

module.exports = router