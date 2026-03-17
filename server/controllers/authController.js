const User = require('../models/User')
const bcrypt = require('bcryptjs')
const generateToken = require('../config/jwt')

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    // ✅ Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      })
    }

    // ✅ Role restriction
    const allowedRoles = ["student", "staff"]
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role"
      })
    }

    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists"
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "student"
    })

    const token = generateToken(user._id, user.role)

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    // ✅ Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      })
    }

    const token = generateToken(user._id, user.role)

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// ─────────────────────────────────────────────
// GET CURRENT USER (/me)
// ─────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password")

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }

    res.status(200).json({
      success: true,
      user
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile"
    })
  }
}