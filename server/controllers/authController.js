const User = require('../models/User')
const bcrypt = require('bcryptjs')
const generateToken = require('../config/jwt')
const { validateRegNum } = require('../utils/regNumValidator')
   const jwt = require('jsonwebtoken')

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
exports.register = async (req, res) => {

  try {
    const { name, email, password, role, regnum } = req.body

    // ✅ Basic field validation
    if (!name || !email || !password || !regnum) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required (name, email, password, registration number)'
      })
    }

    // ✅ Role restriction
    const allowedRoles = ['student', 'staff']
    const userRole = role || 'student'
    if (!allowedRoles.includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      })
    }

    // ✅ Registration number validation (role-aware)
    const regValidation = validateRegNum(regnum, userRole)
    if (!regValidation.valid) {
      return res.status(400).json({
        success: false,
        message: regValidation.message
      })
    }
    const normalizedRegnum = regnum.trim().toUpperCase()

    // ✅ Duplicate checks
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      })
    }

    const regnumExists = await User.findOne({ regnum: normalizedRegnum })
    if (regnumExists) {
      return res.status(400).json({
        success: false,
        message: 'This registration number is already registered'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      regnum: normalizedRegnum,
      role: userRole
    })

    const token = generateToken(user._id, user.role)

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department || '',
        avatar: user.avatar || null
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
        role: user.role,
        department: user.department || '',
        avatar: user.avatar || null
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
    const user = await User.findById(req.user._id).select("-password");

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

// ─────────────────────────────────────────────
// VERIFY PASSWORD FOR ADMIN UNLOCK
// ─────────────────────────────────────────────
exports.verifyPassword = async (req, res) => {
  try {
    const { password } = req.body

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required"
      })
    }

    const adminSecret = process.env.ADMIN_SECRET || 'egspec@2026'

    if (password !== adminSecret) {
      console.log(`[ADMIN] Failed login attempt at ${new Date().toISOString()}`)
      return res.status(401).json({
        success: false,
        message: "Incorrect password"
      })
    }

    // Issue a short-lived admin access token (10 minutes)
 
    const adminToken = jwt.sign(
      { type: 'admin-access', grantedAt: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    )

    console.log(`[ADMIN] ✅ Admin access granted at ${new Date().toISOString()}`)

    res.status(200).json({
      success: true,
      message: "Admin access granted",
      adminToken
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    })
  }
}

// ─────────────────────────────────────────────
// UPDATE PROFILE (Name, Password, Avatar)
// ─────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, password } = req.body

    const user = await User.findById(req.user._id)
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" })
    }

    if (name) {
      user.name = name
    }

    if (password) {
      const bcrypt = require('bcryptjs')
      user.password = await bcrypt.hash(password, 10)
    }

    if (req.file) {
      user.avatar = '/uploads/' + req.file.filename
    }

    await user.save()

    const updatedUser = await User.findById(user._id).select("-password")

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    })

  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message
    })
  }
}