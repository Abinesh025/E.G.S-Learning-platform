const jwt = require('jsonwebtoken')
const User = require('../models/User')

exports.protectMe = async (req, res, next) => {
  try {
    let token

    // ✅ Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]
    }

    // ❌ No token
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' })
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // ✅ Get user
    const user = await User.findById(decoded.userID).select('-password')

    if (!user) {
      return res.status(401).json({ message: 'User not found' })
    }

    // ✅ Attach user to request
    req.user = user

    next()

  } catch (error) {
    return res.status(401).json({ message: 'Token failed or expired' })
  }
}