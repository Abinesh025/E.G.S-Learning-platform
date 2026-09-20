require('dotenv').config()

const http = require('http')
const app = require('./app')
const connectDB = require('./config/db')
const { initSocket } = require('./socket/chatSocket')

// 🔌 Connect to Microsoft SQL Server
connectDB()
  .then(() => {
    console.log('✅ Microsoft SQL Server ready for incoming requests')
  })
  .catch((err) => {
    console.error('⚠️ SQL Server connection could not be established at startup:', err.message)
    console.log('👉 Please ensure SQL Server is running and .env parameters are correct.')
  })

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