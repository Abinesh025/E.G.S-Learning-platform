const userRepository = require('../repositories/userRepository')
const bcrypt = require('bcryptjs')
const generateToken = require('../config/jwt')
const { validateRegNum } = require('../utils/regNumValidator')
const { validateName } = require('../utils/nameValidator')
const { validatePassword } = require('../utils/passwordValidator')
const { generateOtp, hashOtp } = require('../utils/generateOtp')
const sendEmail = require('../utils/sendEmail')
const jwt = require('jsonwebtoken')

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, regnum, department } = req.body

    // Name validation
    const nameValidation = validateName(name)
    if (!nameValidation.valid) {
      return res.status(400).json({
        success: false,
        message: nameValidation.message,
      })
    }

    // Basic field validation
    if (!name || !email || !password || !regnum || !department) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required (name, email, password, registration number, department)',
      })
    }

    // Role restriction
    const allowedRoles = ['student', 'staff']
    const userRole = role || 'student'
    if (!allowedRoles.includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      })
    }

    // Registration number validation (role-aware)
    const regValidation = validateRegNum(regnum, userRole, department)
    if (!regValidation.valid) {
      return res.status(400).json({
        success: false,
        message: regValidation.message,
      })
    }
    const normalizedRegnum = regnum.trim().toUpperCase()

    // Duplicate checks
    const userExists = await userRepository.findUserByEmail(email)
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      })
    }

    const regnumExists = await userRepository.findUserByRegnum(normalizedRegnum)
    if (regnumExists) {
      return res.status(400).json({
        success: false,
        message: 'This registration number is already registered',
      })
    }

    // Password validation
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await userRepository.createUser({
      name,
      email,
      password: hashedPassword,
      regnum: normalizedRegnum,
      role: userRole,
      department,
    })

    const token = generateToken(user._id, user.Role || user.role)

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.Name || user.name,
        email: user.Email || user.email,
        role: user.Role || user.role,
        department: user.Department || user.department || '',
        avatar: user.Avatar || user.avatar || null,
        semester: user.Semester || user.semester || null,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      })
    }

    const user = await userRepository.findUserByEmail(email)
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      })
    }

    const userPassword = user.Password || user.password
    const isMatch = await bcrypt.compare(password, userPassword)
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      })
    }

    const userRole = user.Role || user.role

    // Handle Staff OTP Login
    if (userRole === 'staff') {
      const otp = generateOtp()
      const hashedOtp = hashOtp(otp)
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

      await userRepository.updateOtp(user._id, {
        otpHash: hashedOtp,
        otpExpiresAt,
        otpPurpose: 'staff_login',
        otpVerified: false,
      })

      try {
        await sendEmail({
          email: user.Email || user.email,
          subject: 'Your Staff Login OTP Code',
          message: `Your OTP is ${otp}. This OTP is valid for 5 minutes. Do not share it with anyone.`,
          html: `<p>Your OTP is <b>${otp}</b>. This OTP is valid for 5 minutes. Do not share it with anyone.</p>`,
        })

        return res.status(200).json({
          success: true,
          requiresOtp: true,
          message: 'OTP sent to staff email.',
        })
      } catch (err) {
        await userRepository.updateOtp(user._id, {
          otpHash: null,
          otpExpiresAt: null,
          otpPurpose: null,
          otpVerified: false,
        })
        return res.status(500).json({ success: false, message: 'Failed to send OTP email' })
      }
    }

    // Normal Login (Student or Admin)
    const token = generateToken(user._id, userRole)

    res.status(200).json({
      success: true,
      requiresOtp: false,
      token,
      user: {
        _id: user._id,
        name: user.Name || user.name,
        email: user.Email || user.email,
        role: userRole,
        department: user.Department || user.department || '',
        avatar: user.Avatar || user.avatar || null,
        semester: user.Semester || user.semester || null,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ─────────────────────────────────────────────
// GET CURRENT USER (/me)
// ─────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await userRepository.findUserById(req.user._id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    const { Password, password, ...safeUser } = user

    res.status(200).json({
      success: true,
      user: safeUser,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
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
        message: 'Password is required',
      })
    }

    const adminSecret = process.env.ADMIN_SECRET || 'egspec@2026'

    if (password !== adminSecret) {
      console.log(`[ADMIN] Failed login attempt at ${new Date().toISOString()}`)
      return res.status(401).json({
        success: false,
        message: 'Incorrect password',
      })
    }

    const adminToken = jwt.sign(
      { type: 'admin-access', grantedAt: Date.now() },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    )

    console.log(`[ADMIN] ✅ Admin access granted at ${new Date().toISOString()}`)

    res.status(200).json({
      success: true,
      message: 'Admin access granted',
      adminToken,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

// ─────────────────────────────────────────────
// UPDATE PROFILE (Name, Password, Avatar, Phone)
// ─────────────────────────────────────────────
exports.updateProfile = async (req, res) => {
  try {
    const { name, password, phone } = req.body

    const user = await userRepository.findUserById(req.user._id)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    const updates = {}

    if (name) {
      const nameValidation = validateName(name)
      if (!nameValidation.valid) {
        return res.status(400).json({
          success: false,
          message: nameValidation.message,
        })
      }
      updates.name = name
    }

    if (phone !== undefined) {
      const trimmedPhone = phone.trim()
      if (trimmedPhone && !/^\+?[0-9]{10,15}$/.test(trimmedPhone)) {
        return res.status(400).json({
          success: false,
          message: "Invalid phone number format. It must be 10 to 15 digits long, optionally starting with '+'.",
        })
      }
      updates.phone = trimmedPhone || ''
    }

    if (password) {
      const passwordValidation = validatePassword(password)
      if (!passwordValidation.valid) {
        return res.status(400).json({
          success: false,
          message: passwordValidation.message,
        })
      }
      updates.password = await bcrypt.hash(password, 10)
    }

    if (req.file) {
      updates.avatar = '/uploads/' + req.file.filename
    }

    const updatedUser = await userRepository.updateUser(user._id, updates)
    const { Password, password: p, ...safeUser } = updatedUser

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: safeUser,
    })
  } catch (error) {
    console.error('Profile update error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    })
  }
}

// ─────────────────────────────────────────────
// VERIFY STAFF LOGIN OTP
// ─────────────────────────────────────────────
exports.verifyStaffLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' })
    }

    const user = await userRepository.findUserByEmail(email)
    if (!user || (user.Role !== 'staff' && user.role !== 'staff')) {
      return res.status(400).json({ success: false, message: 'Invalid request' })
    }

    const otpHash = user.OtpHash || user.otpHash
    const otpExpiresAt = user.OtpExpiresAt || user.otpExpiresAt
    const otpPurpose = user.OtpPurpose || user.otpPurpose

    if (!otpHash || !otpExpiresAt || otpPurpose !== 'staff_login') {
      return res.status(400).json({ success: false, message: 'OTP not found or expired' })
    }

    if (new Date(otpExpiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired' })
    }

    if (otpHash !== hashOtp(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' })
    }

    // Clear OTP
    await userRepository.updateOtp(user._id, {
      otpHash: null,
      otpExpiresAt: null,
      otpPurpose: null,
      otpVerified: true,
    })

    const userRole = user.Role || user.role
    const token = generateToken(user._id, userRole)

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.Name || user.name,
        email: user.Email || user.email,
        role: userRole,
        department: user.Department || user.department || '',
        avatar: user.Avatar || user.avatar || null,
        semester: user.Semester || user.semester || null,
      },
      message: 'Staff login successful.',
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────
// SEND PASSWORD CHANGE OTP
// ─────────────────────────────────────────────
exports.sendPasswordChangeOtp = async (req, res) => {
  try {
    const user = await userRepository.findUserById(req.user._id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    const otp = generateOtp()
    const hashedOtp = hashOtp(otp)
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000)

    await userRepository.updateOtp(user._id, {
      otpHash: hashedOtp,
      otpExpiresAt,
      otpPurpose: 'password_change',
      otpVerified: false,
    })

    await sendEmail({
      email: user.Email || user.email,
      subject: 'Password Change Verification Code',
      message: `Your OTP for changing password is ${otp}. Valid for 5 minutes.`,
      html: `<p>Your OTP for changing password is <b>${otp}</b>. Valid for 5 minutes.</p>`,
    })

    res.status(200).json({ success: true, message: 'Password change OTP sent to registered email.' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────
// VERIFY PASSWORD CHANGE OTP
// ─────────────────────────────────────────────
exports.verifyPasswordChangeOtp = async (req, res) => {
  try {
    const { otp } = req.body
    if (!otp) return res.status(400).json({ success: false, message: 'OTP is required' })

    const user = await userRepository.findUserById(req.user._id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    const otpHash = user.OtpHash || user.otpHash
    const otpExpiresAt = user.OtpExpiresAt || user.otpExpiresAt
    const otpPurpose = user.OtpPurpose || user.otpPurpose

    if (!otpHash || !otpExpiresAt || otpPurpose !== 'password_change') {
      return res.status(400).json({ success: false, message: 'OTP not found' })
    }

    if (new Date(otpExpiresAt) < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP expired' })
    }

    if (otpHash !== hashOtp(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' })
    }

    await userRepository.updateOtp(user._id, {
      otpHash,
      otpExpiresAt,
      otpPurpose,
      otpVerified: true,
    })

    res.status(200).json({ success: true, message: 'OTP verified. You can now change your password.' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ─────────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' })
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' })
    }

    const user = await userRepository.findUserById(req.user._id)
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })

    const otpVerified = user.OtpVerified || user.otpVerified
    const otpPurpose = user.OtpPurpose || user.otpPurpose

    if (!otpVerified || otpPurpose !== 'password_change') {
      return res.status(400).json({ success: false, message: 'Please verify OTP before changing password.' })
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return res.status(400).json({ success: false, message: passwordValidation.message })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await userRepository.updateUser(user._id, { password: hashedPassword })
    await userRepository.updateOtp(user._id, {
      otpHash: null,
      otpExpiresAt: null,
      otpPurpose: null,
      otpVerified: false,
    })

    res.status(200).json({ success: true, message: 'Password changed successfully.' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}