const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiverRole: {
      type: String,
      enum: ['student', 'staff', 'admin'],
      required: true
    },
    department: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['material_upload', 'test_upload', 'test_submission'],
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
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'relatedModel'
    },
    relatedModel: {
      type: String,
      enum: ['Material', 'Test', 'TestSubmission'],
      required: true
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
