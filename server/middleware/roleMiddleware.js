const roleRepository = require('../repositories/roleRepository');
const { HTTP_STATUS, MESSAGES } = require('../common');

/**
 * Middleware to authorize user roles against the database Roles table
 * @param  {...string} allowedRoles - Roles permitted to access the route
 */
exports.authorizeRoles = (...allowedRoles) => {
  // Normalize allowed roles to lowercase
  const normalizedAllowedRoles = allowedRoles.map(r => String(r).trim().toLowerCase());

  return async (req, res, next) => {
    try {
      // 1. Check if user is authenticated
      if (!req.user || !req.user.role) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: MESSAGES.NOT_AUTHENTICATED,
        });
      }

      const userRole = String(req.user.role).trim().toLowerCase();

      // 2. Validate user's role against the database Roles table
      const isRoleInDb = await roleRepository.isValidRole(userRole);
      if (!isRoleInDb) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: `${MESSAGES.ROLE_NOT_FOUND_IN_DB}: '${req.user.role}'`,
        });
      }

      // 3. Check if user's role is among the allowed roles for this route
      if (!normalizedAllowedRoles.includes(userRole)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: `${MESSAGES.ACCESS_DENIED} (${req.user.role})`,
        });
      }

      next();
    } catch (err) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || 'Authorization check failed',
      });
    }
  };
};
