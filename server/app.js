const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const path = require('path')
const cookieParser = require('cookie-parser')

// 🚀 Route files
const authRoutes = require('./routes/authRoutes')
const staffRoutes = require('./routes/staffRoutes')
const studentRoutes = require('./routes/studentRoutes')
const materialRoutes = require('./routes/materialRoutes')
const testRoutes = require('./routes/testRoutes')
const chatRoutes = require('./routes/chatRoutes')
const adminRoutes = require('./routes/adminRoutes')

const app = express()

// 🌐 CORS — allow configured client origin in production, all origins in dev
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:3500'
app.use(
  cors({
    origin: process.env.NODE_ENV === 'production' ? allowedOrigin : true,
    credentials: true,
  })
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use(cookieParser())

// Only log in dev — cleaner production logs
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

// 📁 Static Upload Folder (local uploads — Cloudinary handles remote)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// 🛣️ API Routes
app.use('/api/auth', authRoutes)
app.use('/api/staff', staffRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/materials', materialRoutes)
app.use('/api/tests', testRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/admin', adminRoutes)

// 🏗️ Serve React client build in production
if (process.env.NODE_ENV === 'production') {
  const clientBuild = path.join(__dirname, '..', 'client', 'dist')
  app.use(express.static(clientBuild))

  // All non-API routes → React app (support client-side routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'))
  })
} else {
  // ❤️ Health Check (dev only)
  app.get('/', (req, res) => {
    res.send('College Self-Learning Platform API is running...')
  })
}

// ❌ 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' })
})

// ⚠️ Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: 'Server Error', error: err.message })
})

module.exports = app