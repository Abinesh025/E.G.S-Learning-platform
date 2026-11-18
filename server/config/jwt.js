const jwt = require('jsonwebtoken')
const { TOKEN_CONFIG } = require('../common')

const ACCESS_EXPIRES = TOKEN_CONFIG?.ACCESS_TOKEN_EXPIRES_IN || '15m'
const REFRESH_EXPIRES = TOKEN_CONFIG?.REFRESH_TOKEN_EXPIRES_IN || '1d'

const getRefreshSecret = () => {
  return (
    process.env.JWT_REFRESH_SECRET ||
    (process.env.JWT_SECRET ? `${process.env.JWT_SECRET}_refresh` : 'egs_jwt_refresh_secret_key')
  )
}

const generateAccessToken = (userID, role) => {
  return jwt.sign(
    { userID, role, tokenType: TOKEN_CONFIG?.ACCESS_TOKEN_TYPE || 'access' },
    process.env.JWT_SECRET,
    {
      expiresIn: ACCESS_EXPIRES,
    }
  )
}

const generateRefreshToken = (userID, role) => {
  return jwt.sign(
    { userID, role, tokenType: TOKEN_CONFIG?.REFRESH_TOKEN_TYPE || 'refresh' },
    getRefreshSecret(),
    {
      expiresIn: REFRESH_EXPIRES,
    }
  )
}

const verifyRefreshToken = (refreshToken) => {
  return jwt.verify(refreshToken, getRefreshSecret())
}

// Backward-compatible generateToken: returns access token
const generateToken = (userID, role) => {
  return generateAccessToken(userID, role)
}

generateToken.generateToken = generateToken
generateToken.generateAccessToken = generateAccessToken
generateToken.generateRefreshToken = generateRefreshToken
generateToken.verifyRefreshToken = verifyRefreshToken
generateToken.getRefreshSecret = getRefreshSecret
generateToken.TOKEN_CONFIG = TOKEN_CONFIG

module.exports = generateToken
module.exports.generateToken = generateToken
module.exports.generateAccessToken = generateAccessToken
module.exports.generateRefreshToken = generateRefreshToken
module.exports.verifyRefreshToken = verifyRefreshToken
module.exports.getRefreshSecret = getRefreshSecret
module.exports.TOKEN_CONFIG = TOKEN_CONFIG
