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

// 🌐 CORS
app.use(
  cors({
    origin: [process.env.CLIENT_URL , `https://localhost:/${process.env.PORT}` ],
    credentials: true,
  })
)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use(cookieParser())
app.use(morgan('dev'))

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

// ❤️ Root
app.get('/', (req, res) => {
  res.send('E.G.S Learning Platform API is running...')
})

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