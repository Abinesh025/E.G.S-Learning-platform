const http = require('http')
const app = require('./app')
const connectDB = require('./config/db')
const  initSocket  = require('./socket/chatSocket')

// 🌍 Load Environment Variables
require('dotenv').config()

// 🔌 Connect to MongoDB
connectDB()

// 🚀 Create HTTP Server
const server = http.createServer(app)

// 🔗 Initialize Socket.IO
initSocket(server)

// 🌐 Define Port
const PORT = process.env.PORT || 5000

// ▶️ Start Server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})