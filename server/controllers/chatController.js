const Message = require('../models/Message')

// ─────────────────────────────────────────────
// SEND MESSAGE (TEXT / FILE / VOICE)
// ─────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, messageType, text } = req.body

    if (!receiverId || !messageType) {
      return res.status(400).json({
        success: false,
        message: "Receiver and message type required"
      })
    }

    let fileUrl = null

    // If file or voice uploaded
    if (req.file) {
      fileUrl = req.file.path
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      text: messageType === "text" ? text : null,
      fileUrl: fileUrl,
      messageType, // text | image | file | voice
      timestamp: new Date()
    })

    const populatedMessage = await message.populate([
      { path: "sender", select: "name email role" },
      { path: "receiver", select: "name email role" }
    ])

    res.status(201).json({
      success: true,
      data: populatedMessage
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
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
        message: "User ID required"
      })
    }

    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id }
      ]
    })
      .populate("sender", "name email role")
      .populate("receiver", "name email role")
      .sort({ createdAt: 1 }) // better than timestamp if schema uses timestamps

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
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
        message: "No audio file uploaded"
      })
    }

    res.status(200).json({
      success: true,
      message: "Voice uploaded successfully",
      audioUrl: req.file.path
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}