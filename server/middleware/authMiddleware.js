const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const roleRepository = require('../repositories/roleRepository');
const { ROLES, HTTP_STATUS, MESSAGES } = require('../common');

exports.protectMe = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // No token
    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: MESSAGES.TOKEN_REQUIRED });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validate that role exists in database Roles table
    if (decoded.role) {
      const isRoleInDb = await roleRepository.isValidRole(decoded.role);
      if (!isRoleInDb) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          message: `${MESSAGES.ROLE_NOT_FOUND_IN_DB}: '${decoded.role}'`,
        });
      }
    }

    // Get user from SQL Server
    const user = await userRepository.findUserById(decoded.userID, decoded.role);

    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: MESSAGES.USER_NOT_FOUND });
    }

    // Attach user to request (omit password for security)
    const { Password, password, ...safeUser } = user;
    req.user = safeUser;

    next();
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: MESSAGES.TOKEN_FAILED });
  }
};

// ── Accepts EITHER a regular Bearer JWT (staff/student) OR an x-admin-token ──
exports.protectAny = async (req, res, next) => {
  try {
    // 1. Check for admin token first
    const adminToken = req.headers['x-admin-token'];
    if (adminToken) {
      const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
      if (decoded.type === 'admin-access' || decoded.role === ROLES.ADMIN) {
        req.user = { _id: 0, UserId: 0, role: ROLES.ADMIN, name: 'Administrator' };
        return next();
      }
    }

    // 2. Fall back to regular Bearer JWT
    let bearerToken;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      bearerToken = req.headers.authorization.split(' ')[1];
    }

    if (!bearerToken) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: MESSAGES.TOKEN_REQUIRED });
    }

    const decoded = jwt.verify(bearerToken, process.env.JWT_SECRET);

    // Validate role in DB
    if (decoded.role) {
      const isRoleInDb = await roleRepository.isValidRole(decoded.role);
      if (!isRoleInDb) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          message: `${MESSAGES.ROLE_NOT_FOUND_IN_DB}: '${decoded.role}'`,
        });
      }
    }

    const user = await userRepository.findUserById(decoded.userID, decoded.role);
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: MESSAGES.USER_NOT_FOUND });
    }

    const { Password, password, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (error) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: MESSAGES.TOKEN_FAILED });
  }
};
