const logger = require('../utils/logger');
const { sanitizeErrorMessage, isTechnicalError, sanitizeReqBody } = require('../utils/errorSanitizer');

/**
 * Express Middleware: Response Sanitizer and HTTP Action Logger
 *
 * 1. HTTP Logger: Logs every API request and response duration.
 * 2. Error Logger: When status >= 500 or technical errors occur, logs FULL stack trace,
 *    request context, client IP, and user identity to server/logs/error.log.
 * 3. Error Masker: Sanitizes the payload returned to the client so that only
 *    clean, user-understandable error messages are sent to the UI.
 */
function responseSanitizer(req, res, next) {
  const startTime = Date.now();

  // Intercept res.json
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    const statusCode = res.statusCode || 200;

    // 1. Intercept 500+ Server Errors
    if (statusCode >= 500) {
      let rawError = body?.error || body?.message || 'Internal Server Error';
      let stack = body?.stack || (body?.error instanceof Error ? body.error.stack : null);

      // Log full technical details & stack trace into dedicated logger
      logger.error(rawError, {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode,
        ip: req.ip || req.connection?.remoteAddress,
        user: req.user ? `${req.user.email || req.user.name || req.user._id} (${req.user.role || 'user'})` : 'guest',
        stack,
        requestBody: req.method !== 'GET' ? sanitizeReqBody(req.body) : undefined,
        queryParams: Object.keys(req.query || {}).length ? req.query : undefined,
      });

      // Transform client-facing payload to user-understandable message
      if (body && typeof body === 'object') {
        const userFriendly = sanitizeErrorMessage(rawError);
        body.message = userFriendly;
        body.success = false;

        // Never leak stack or internal error properties to UI
        delete body.error;
        delete body.stack;
        delete body.details;
        delete body.driver;
      }
      res._sanitized = true;
    }
    // 2. Intercept 4xx Client Errors leaking technical details
    else if (statusCode >= 400 && body && typeof body === 'object') {
      const candidate = body.message || body.error;
      if (isTechnicalError(candidate)) {
        logger.warn(`Technical error intercepted in ${statusCode} response: ${candidate}`, {
          method: req.method,
          url: req.originalUrl || req.url,
          statusCode,
          ip: req.ip,
        });

        body.message = sanitizeErrorMessage(candidate);
        delete body.error;
        delete body.stack;
        delete body.details;
        delete body.driver;
      }
      res._sanitized = true;
    }

    return originalJson(body);
  };

  // Intercept res.send in case a controller calls res.status(500).send(...)
  const originalSend = res.send.bind(res);
  res.send = function (body) {
    if (res._sanitized) {
      return originalSend(body);
    }
    const statusCode = res.statusCode || 200;
    if (statusCode >= 500 && typeof body === 'string') {
      if (isTechnicalError(body) || body.includes('Error:') || body.includes('at ')) {
        logger.error(`Raw text 500 intercepted: ${body.substring(0, 300)}`, {
          method: req.method,
          url: req.originalUrl,
          statusCode,
        });
        const sanitized = sanitizeErrorMessage(body);
        return originalSend(JSON.stringify({ success: false, message: sanitized }));
      }
    }
    return originalSend(body);
  };

  // Log HTTP completion
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.http(req, res, duration);
  });

  next();
}

/**
 * Controller helper to log and return sanitized error response
 */
function sendErrorResponse(res, error, userFriendlyDefault = 'An unexpected error occurred. Please try again later.', statusCode = 500, req = null) {
  // Log technical error
  logger.error(error, {
    url: req?.originalUrl || req?.url,
    method: req?.method,
    statusCode,
    user: req?.user ? `${req.user.email} (${req.user.role})` : undefined,
  });

  const message = sanitizeErrorMessage(error, userFriendlyDefault);
  return res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = {
  responseSanitizer,
  sendErrorResponse,
};
