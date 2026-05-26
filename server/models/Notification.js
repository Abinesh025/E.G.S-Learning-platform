const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'material'
    },
    department: {
      type: String
    },
    staffName: {
      type: String
    },
    subjectName: {
      type: String
    },
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Material'
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Notification', notificationSchema)
