const messageRepository = require('../repositories/messageRepository')

// ─────────────────────────────────────────────
// SEND MESSAGE (TEXT / FILE / VOICE)
// ─────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, messageType, text, message } = req.body

    if (!receiverId || !messageType) {
      return res.status(400).json({
        success: false,
        message: 'Receiver and message type required',
      })
    }

    let fileUrl = ''
    if (req.file) {
      fileUrl = req.file.path
    }

    const createdMessage = await messageRepository.createMessage({
      senderId: req.user._id,
      receiverId: Number(receiverId),
      message: text || message || '',
      messageType,
      fileUrl,
    })

    res.status(201).json({
      success: true,
      data: createdMessage,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ─────────────────────────────────────────────
// GET CHAT HISTORY
// ─────────────────────────────────────────────
exports.getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID required',
      })
    }

    const messages = await messageRepository.getDirectMessages(req.user._id, Number(userId))

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ─────────────────────────────────────────────
// UPLOAD VOICE MESSAGE
// ─────────────────────────────────────────────
exports.uploadVoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file uploaded',
      })
    }

    let audioUrl = req.file.path
    if (audioUrl && !audioUrl.startsWith('http')) {
      audioUrl = '/' + audioUrl.replace(/\\/g, '/')
      if (!audioUrl.startsWith('/uploads')) {
        audioUrl = '/uploads' + audioUrl
      }
    }

    res.status(200).json({
      success: true,
      message: 'Voice uploaded successfully',
      audioUrl,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ─────────────────────────────────────────────
// GET ROOM CHAT HISTORY
// ─────────────────────────────────────────────
exports.getRoomHistory = async (req, res) => {
  try {
    const { roomId } = req.params

    if (!roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID required',
      })
    }

    const messages = await messageRepository.getRoomMessages(roomId)

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages.map((m) => ({
        _id: m._id,
        content: m.message,
        messageType: m.messageType,
        audioUrl: m.audioUrl,
        fileUrl: m.fileUrl,
        sender: m.sender,
        createdAt: m.createdAt,
      })),
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}