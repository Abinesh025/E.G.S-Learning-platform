const Message = require('../models/Message')

let onlineUsers = {}

const chatSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id)

    // ── User joins ───────────────────────────────
    socket.on('join', (userId) => {
      onlineUsers[userId] = socket.id
      io.emit('onlineUsers', Object.keys(onlineUsers))
      console.log('Online Users:', Object.keys(onlineUsers))
    })

    // ── Send message ─────────────────────────────
    socket.on('sendMessage', async (data) => {
      try {
        const { sender, receiver, message, messageType = 'text', audioUrl = '', fileUrl = '' } = data

        // Save message in DB
        const newMessage = await Message.create({
          sender,
          receiver,
          message,
          messageType,
          audioUrl,
          fileUrl
        })

        // Send to receiver if online
        const receiverSocket = onlineUsers[receiver]
        if (receiverSocket) {
          io.to(receiverSocket).emit('receiveMessage', newMessage)
        }

        // Echo back to sender
        const senderSocket = onlineUsers[sender]
        if (senderSocket) {
          io.to(senderSocket).emit('receiveMessage', newMessage)
        }
      } catch (error) {
        console.error('Error sending message:', error.message)
      }
    })

    // ── Disconnect ───────────────────────────────
    socket.on('disconnect', () => {
      for (const userId in onlineUsers) {
        if (onlineUsers[userId] === socket.id) {
          delete onlineUsers[userId]
          break
        }
      }
      io.emit('onlineUsers', Object.keys(onlineUsers))
      console.log('User disconnected:', socket.id)
    })
  })
}

module.exports = chatSocket