const mongoose = require('mongoose')

const materialSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: '',
      trim: true
    },

    subject: {
      type: String,
      required: true,
      trim: true
    },

    unit: {
      type: String,
      required: true,
      trim: true
    },

    topic: {
      type: String,
      required: true,
      trim: true
    },

    fileType: {
      type: String,
      required: true
    },

    fileUrl: {
      type: String,
      required: true
    },

    department: {
      type: String,
      default: '' // Optional for older records
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
)

// ⚡ Faster filtering
materialSchema.index({ subject: 1, topic: 1 })

module.exports = mongoose.model('Material', materialSchema)