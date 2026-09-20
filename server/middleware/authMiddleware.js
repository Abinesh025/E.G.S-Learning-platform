const jwt = require('jsonwebtoken')
const userRepository = require('../repositories/userRepository')

exports.protectMe = async (req, res, next) => {
  try {
    let token

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]
    }

    // No token
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' })
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Get user from SQL Server
    const user = await userRepository.findUserById(decoded.userID)

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    // Attach user to request (omit password for security)
    const { Password, password, ...safeUser } = user
    req.user = safeUser

    next()
  } catch (error) {
    return res.status(401).json({ message: 'Token failed or expired' })
  }
}

// ── Accepts EITHER a regular Bearer JWT (staff/student) OR an x-admin-token ──
exports.protectAny = async (req, res, next) => {
  try {
    // 1. Check for admin token first
    const adminToken = req.headers['x-admin-token']
    if (adminToken) {
      const decoded = jwt.verify(adminToken, process.env.JWT_SECRET)
      if (decoded.type === 'admin-access') {
        req.user = { _id: 0, UserId: 0, role: 'admin', name: 'Administrator' }
        return next()
      }
    }

    // 2. Fall back to regular Bearer JWT
    let bearerToken
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      bearerToken = req.headers.authorization.split(' ')[1]
    }

    if (!bearerToken) {
      return res.status(401).json({ message: 'Not authorized, no token' })
    }

    const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET)
    const user = await userRepository.findUserById(decoded.userID)
    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    const { Password, password, ...safeUser } = user
    req.user = safeUser
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Token failed or expired' })
  }
}
