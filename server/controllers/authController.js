const userRepository = require('../repositories/userRepository')
const bcrypt = require('bcryptjs')
const {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../config/jwt')
const { validateRegNum } = require('../utils/regNumValidator')
const { validateName } = require('../utils/nameValidator')
const { validatePassword } = require('../utils/passwordValidator')
const { generateOtp, hashOtp } = require('../utils/generateOtp')
const sendEmail = require('../utils/sendEmail')
const jwt = require('jsonwebtoken')
const roleRepository = require('../repositories/roleRepository')
const passwordResetRepository = require('../repositories/passwordResetRepository')
const { ROLES, HTTP_STATUS, MESSAGES, TOKEN_CONFIG } = require('../common')

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, regnum, department, yearId, year, phone, batch, semester } = req.body

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

    // Role restriction against DB Roles table
    const userRole = (role || ROLES.STUDENT).toLowerCase()
    const isRoleInDb = await roleRepository.isValidRole(userRole)
    if (!isRoleInDb || userRole === ROLES.ADMIN) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
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
      yearId,
      year,
      phone: phone || '',
      batch: batch || '',
      semester: semester ? Number(semester) : null,
    })

    const staffRole = user.Role || user.role
    const accessToken = generateAccessToken(user._id, staffRole)
    const refreshToken = generateRefreshToken(user._id, staffRole)

    res.status(201).json({
      success: true,
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.Name || user.name,
        email: user.Email || user.email,
        role: user.Role || user.role,
        department: user.Department || user.department || '',
        departmentId: user.DepartmentId || user.departmentId || null,
        regnum: user.Regnum || user.regnum || '',
        studentUniqueId: user.StudentUniqueId || user.studentUniqueId || '',
        studentRefId: user.StudentRefId || user.studentRefId || user.StudentUniqueId || '',
        uniqueId: user.StudentUniqueId || user.studentUniqueId || '',
        studentCode: user.StudentUniqueId || user.studentUniqueId || '',
        yearId: user.YearId || user.yearId || null,
        yearName: user.YearName || user.yearName || '',
        yearCode: user.YearCode || user.yearCode || '',
        yearNumber: user.YearNumber || user.yearNumber || null,
        avatar: user.Avatar || user.avatar || null,
        semester: user.Semester || user.semester || null,
        batch: user.Batch || user.batch || '',
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
    if (userRole === ROLES.STAFF) {
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
    const accessToken = generateAccessToken(user._id, userRole)
    const refreshToken = generateRefreshToken(user._id, userRole)
    let adminToken = null
    if (userRole === ROLES.ADMIN) {
      adminToken = jwt.sign(
        { type: 'admin-access', grantedAt: Date.now(), userId: user._id, role: ROLES.ADMIN },
        process.env.JWT_SECRET,
        { expiresIn: '10m' }
      )
    }

    res.status(200).json({
      success: true,
      requiresOtp: false,
      token: accessToken,
      accessToken,
      refreshToken,
      adminToken,
      user: {
        _id: user._id,
        name: user.Name || user.name,
        email: user.Email || user.email,
        role: userRole,
        department: user.Department || user.department || '',
        departmentId: user.DepartmentId || user.departmentId || null,
        regnum: user.Regnum || user.regnum || '',
        studentUniqueId: user.StudentUniqueId || user.studentUniqueId || '',
        studentRefId: user.StudentRefId || user.studentRefId || user.StudentUniqueId || '',
        uniqueId: user.StudentUniqueId || user.studentUniqueId || '',
        studentCode: user.StudentUniqueId || user.studentUniqueId || '',
        yearId: user.YearId || user.yearId || null,
        yearName: user.YearName || user.yearName || '',
        yearCode: user.YearCode || user.yearCode || '',
        yearNumber: user.YearNumber || user.yearNumber || null,
        avatar: user.Avatar || user.avatar || null,
        semester: user.Semester || user.semester || null,
        batch: user.Batch || user.batch || '',
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
    if (!user || (user.Role !== ROLES.STAFF && user.role !== ROLES.STAFF)) {
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

    const staffRole = user.Role || user.role
    const accessToken = generateAccessToken(user._id, staffRole)
    const refreshToken = generateRefreshToken(user._id, staffRole)

    res.status(200).json({
      success: true,
      token: accessToken,
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.Name || user.name,
        email: user.Email || user.email,
        role: userRole,
        department: user.Department || user.department || '',
        departmentId: user.DepartmentId || user.departmentId || null,
        regnum: user.Regnum || user.regnum || '',
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

// ─────────────────────────────────────────────
// FORGOT PASSWORD - REQUEST OTP
// ─────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    if (!email || !email.trim()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email is required',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await userRepository.findUserByEmail(normalizedEmail)
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.USER_NOT_FOUND,
      })
    }

    // Generate 6-digit OTP
    const otp = generateOtp()
    const hashedOtp = hashOtp(otp)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    await passwordResetRepository.createResetRecord(normalizedEmail, hashedOtp, expiresAt)

    // Send Email
    let emailStatus = { sent: false }
    try {
      emailStatus = await sendEmail({
        email: normalizedEmail,
        subject: 'Password Reset Verification Code - E.G.S Academic Hub',
        message: `Hello ${user.name},\n\nYour password reset verification code is: ${otp}\n\nThis code will expire in 10 minutes.\nIf you did not request this, please ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <h2 style="color: #10b981;">Password Reset Code</h2>
            <p>Hello <b>${user.name}</b>,</p>
            <p>You requested to reset your password. Use the verification code below:</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; text-align: center; margin: 24px 0; color: #111827; background: #f3f4f6; padding: 12px; border-radius: 8px;">
              ${otp}
            </div>
            <p style="color: #6b7280; font-size: 13px;">This code will expire in 10 minutes. If you did not request this, you can safely ignore this email.</p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.warn('⚠️ sendEmail error:', emailErr.message)
      emailStatus = { sent: false, error: emailErr.message }
    }

    console.log(`🔑 [PASSWORD RESET OTP] ${normalizedEmail}: ${otp}`)

    const responsePayload = {
      success: true,
      emailSent: emailStatus.sent,
      message: emailStatus.sent
        ? 'A 6-digit verification code has been sent to your email.'
        : 'Verification code generated (Test mode: email delivery not configured in server/.env).',
      devOtp: otp,
    }

    return res.status(HTTP_STATUS.OK).json(responsePayload)
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    })
  }
}

// ─────────────────────────────────────────────
// VERIFY FORGOT PASSWORD OTP
// ─────────────────────────────────────────────
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email and OTP are required',
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const record = await passwordResetRepository.findActiveRecord(normalizedEmail)
    if (!record) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.INVALID_OTP,
      })
    }

    if (new Date(record.expiresAt) < new Date()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.',
      })
    }

    if (record.otpHash !== hashOtp(otp.trim())) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid verification code. Please check and try again.',
      })
    }

    // Generate signed reset token valid for 15 minutes
    const resetToken = jwt.sign(
      { email: normalizedEmail, purpose: 'reset-password' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    )

    await passwordResetRepository.markVerified(record.id, resetToken)

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.OTP_VERIFIED,
      resetToken,
    })
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    })
  }
}

// ─────────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { email, resetToken, otp, newPassword, confirmPassword } = req.body
    if (!email || !newPassword || !confirmPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email, new password, and confirm password are required',
      })
    }

    if (newPassword !== confirmPassword) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Passwords do not match',
      })
    }

    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: passwordValidation.message,
      })
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Verify token or OTP
    let tokenVerified = false
    if (resetToken) {
      try {
        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET)
        if (decoded.email === normalizedEmail && decoded.purpose === 'reset-password') {
          tokenVerified = true
        }
      } catch (err) {
        // Token invalid or expired
      }
    }

    if (!tokenVerified && otp) {
      const record = await passwordResetRepository.findActiveRecord(normalizedEmail)
      if (record && record.otpHash === hashOtp(otp.trim()) && new Date(record.expiresAt) >= new Date()) {
        tokenVerified = true
      }
    }

    if (!tokenVerified) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid or expired password reset session. Please request a new code.',
      })
    }

    const user = await userRepository.findUserByEmail(normalizedEmail)
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: MESSAGES.USER_NOT_FOUND,
      })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await userRepository.updateUser(user._id, { password: hashedPassword }, user.role)

    // Consume and clean up reset records for this email
    await passwordResetRepository.consumeResetRecords(normalizedEmail)

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.PASSWORD_RESET_SUCCESS,
    })
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message,
    })
  }
}

// ─────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────
exports.refreshToken = async (req, res) => {
  try {
    const rawRefreshToken = req.body?.refreshToken || req.headers['x-refresh-token']

    if (!rawRefreshToken) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: MESSAGES.REFRESH_TOKEN_REQUIRED || 'Refresh token is required',
      })
    }

    let decoded
    try {
      decoded = verifyRefreshToken(rawRefreshToken)
    } catch (err) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.INVALID_REFRESH_TOKEN || 'Invalid or expired refresh token',
      })
    }

    if (!decoded || decoded.userID === undefined || decoded.userID === null) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.INVALID_REFRESH_TOKEN || 'Invalid or expired refresh token',
      })
    }

    if (decoded.tokenType && decoded.tokenType !== (TOKEN_CONFIG?.REFRESH_TOKEN_TYPE || 'refresh')) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.INVALID_TOKEN_TYPE || 'Invalid token type',
      })
    }

    let user
    if (decoded.userID === 0 && decoded.role === ROLES.ADMIN) {
      user = { _id: 0, Name: 'Administrator', Email: 'admin@egspec.edu.in', Role: ROLES.ADMIN }
    } else {
      user = await userRepository.findUserById(decoded.userID, decoded.role)
    }

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: MESSAGES.USER_NOT_FOUND,
      })
    }

    const userRole = decoded.role || user.Role || user.role
    const newAccessToken = generateAccessToken(user._id, userRole)
    const newRefreshToken = generateRefreshToken(user._id, userRole)

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: MESSAGES.TOKEN_REFRESHED_SUCCESS || 'Token refreshed successfully',
      token: newAccessToken,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        _id: user._id,
        name: user.Name || user.name,
        email: user.Email || user.email,
        role: userRole,
        department: user.Department || user.department || '',
        departmentId: user.DepartmentId || user.departmentId || null,
        regnum: user.Regnum || user.regnum || '',
        avatar: user.Avatar || user.avatar || null,
        semester: user.Semester || user.semester || null,
      },
    })
  } catch (error) {
    console.error('Error in refreshToken controller:', error)
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: error.message || 'Internal server error',
    })
  }
}
