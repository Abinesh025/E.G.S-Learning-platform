const jwt = require('jsonwebtoken');
const roleRepository = require('../repositories/roleRepository');
const { ROLES, HTTP_STATUS, MESSAGES } = require('../common');

exports.verifyAdminToken = async (req, res, next) => {
  const adminToken = req.headers['x-admin-token'];
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  const token = adminToken || bearerToken;

  if (!token) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: MESSAGES.ADMIN_TOKEN_REQUIRED });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type === 'admin-access' || decoded.role === ROLES.ADMIN) {
      // Validate that 'admin' is a recognized role in the DB Roles table
      const isRoleInDb = await roleRepository.isValidRole(ROLES.ADMIN);
      if (!isRoleInDb) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          message: `${MESSAGES.ROLE_NOT_FOUND_IN_DB}: '${ROLES.ADMIN}'`,
        });
      }

      req.user = {
        _id: decoded.userId || decoded.id || '000000000000000000000000',
        role: ROLES.ADMIN,
      };
      return next();
    }

    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: MESSAGES.INVALID_ADMIN_TOKEN });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: MESSAGES.ADMIN_SESSION_EXPIRED });
    }
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({ message: MESSAGES.INVALID_ADMIN_TOKEN });
  }
};
