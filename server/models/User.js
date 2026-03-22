const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  regnum: {
    type: String,
    default: '',
    sparse: true   // allows multiple docs without regnum (e.g. admin)
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['staff', 'student',"admin"],
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  department: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  batch: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)