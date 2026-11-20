const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const path = require('path')
const cookieParser = require('cookie-parser')

// 📝 Logger & Error Sanitizer
const logger = require('./utils/logger')
const { responseSanitizer } = require('./middleware/responseSanitizer')
const { sanitizeErrorMessage } = require('./utils/errorSanitizer')

// 🚀 Route files
const authRoutes = require('./routes/authRoutes')
const staffRoutes = require('./routes/staffRoutes')
const studentRoutes = require('./routes/studentRoutes')
const materialRoutes = require('./routes/materialRoutes')
const testRoutes = require('./routes/testRoutes')
const chatRoutes = require('./routes/chatRoutes')
const adminRoutes = require('./routes/adminRoutes')
const notificationRoutes = require('./routes/notificationRoutes')
const departmentRoutes = require('./routes/departmentRoutes')
const yearRoutes = require('./routes/yearRoutes')

const app = express()

// 🌐 CORS
app.use(
  cors({
    origin: [process.env.CLIENT_URL, 'http://localhost:5000', 'https://127.0.0.1:5000',"https://egs-lms.vercel.app",],
    credentials: true,
  })
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use(cookieParser())

// 🛡️ Dedicated Response Sanitizer & Application HTTP Logger
app.use(responseSanitizer)

// ❤️ Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', env: process.env.NODE_ENV || 'development' })
})

// 📁 Static Upload Folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 🛣️ API Routes
app.use('/api/auth', authRoutes)
app.use('/api/staff', staffRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/materials', materialRoutes)
app.use('/api/tests', testRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/years', yearRoutes)

// 🛡️ Admin login aliases for browser navigation & API requests
const { verifyPassword } = require('./controllers/authController')
app.get('/api/admin-login', (req, res) => res.redirect('/admin-login'))
app.post('/api/admin-login', verifyPassword)

// ❤️ Root
app.get('/', (req, res) => {
  res.send('E.G.S Learning Platform API is running...')
})

// ❌ 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Requested resource or route was not found.' })
})

// ⚠️ Global Error Handler
app.use((err, req, res, next) => {
  // 1. Log full technical details & stack trace into dedicated Logger
  logger.error(err, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user ? `${req.user.email || req.user.name} (${req.user.role})` : 'guest',
  })

  // 2. Return ONLY clean, user-understandable message to the client
  const userMessage = sanitizeErrorMessage(err)
  const statusCode = err.status || err.statusCode || 500
  res.status(statusCode).json({ success: false, message: userMessage })
})

module.exports = app