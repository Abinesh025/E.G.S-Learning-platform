/**
 * Error Sanitization Utility
 * Maps internal, database, driver, and system errors into clean, user-understandable messages.
 * Prevents internal system details, SQL syntax, and stack traces from leaking to the UI.
 */

// Patterns indicating raw technical errors that should NEVER be shown directly to the user
const TECHNICAL_PATTERNS = [
  /msnodesqlv8/i,
  /mssql/i,
  /sql server/i,
  /syntax error/i,
  /invalid (column|object|procedure|parameter) name/i,
  /violation of (primary|unique|foreign) key/i,
  /the statement has been terminated/i,
  /cannot insert duplicate key/i,
  /cannot insert the value null/i,
  /conversion failed/i,
  /string or binary data would be truncated/i,
  /econnrefused/i,
  /ehostunreach/i,
  /etimedout/i,
  /cannot read propert/i,
  /is not a function/i,
  /referenceerror/i,
  /typeerror/i,
  /rangeerror/i,
  /at\s+[a-zA-Z0-9_.\/\\<>]+:\d+:\d+/i, // stack trace lines
  /node_modules/i,
  /\[object Object\]/i,
  /unexpected token/i,
  /failed with status code 500/i,
  /invalid or unexpected token/i,
  /jwt malformed/i,
  /jwt expired/i,
  /invalid signature/i,
  /secret or public key must be provided/i,
];

// Sensitive keys to redact when logging request bodies
const SENSITIVE_KEYS = new Set([
  'password',
  'confirmpassword',
  'currentpassword',
  'newpassword',
  'token',
  'admintoken',
  'refreshtoken',
  'otp',
  'secret',
  'authorization',
  'x-admin-token',
]);

/**
 * Checks if a string contains technical error details or stack traces
 */
function isTechnicalError(str) {
  if (!str || typeof str !== 'string') return false;
  return TECHNICAL_PATTERNS.some(pattern => pattern.test(str));
}

/**
 * Maps raw system, driver, or database errors to user-understandable messages
 */
function sanitizeErrorMessage(err, defaultFallback = 'An unexpected error occurred. Please try again later.') {
  if (!err) return defaultFallback;

  const raw = typeof err === 'string' ? err : err.message || String(err);

  // 1. Database Connection & Timeout Errors
  if (/econnrefused|ehostunreach|etimedout|connection lost|connection timeout|request failed to complete/i.test(raw)) {
    return 'Unable to connect to the database service. Please check your network or try again shortly.';
  }

  // 2. Duplicate / Unique Constraint Violations
  if (/violation of (primary|unique) key|cannot insert duplicate key|2627|2601/i.test(raw)) {
    return 'A record with this information already exists in the system.';
  }

  // 3. Foreign Key / Reference Constraints
  if (/reference constraint|foreign key|547/i.test(raw)) {
    return 'Cannot complete this action because related records exist or are dependent on this data.';
  }

  // 4. Missing required SQL column / NOT NULL constraints
  if (/cannot insert the value null into column/i.test(raw)) {
    return 'Required fields are missing. Please ensure all mandatory fields are provided.';
  }

  // 5. Data truncation / length issues
  if (/string or binary data would be truncated/i.test(raw)) {
    return 'One or more submitted fields exceed the maximum allowed length.';
  }

  // 6. SQL Syntax, Object names, or driver failures
  if (/syntax error|invalid (column|object|procedure) name|msnodesqlv8/i.test(raw)) {
    return 'The requested operation could not be processed. Our technical team has logged this issue.';
  }

  // 7. JWT & Session Expiration
  if (/jwt expired|token expired/i.test(raw)) {
    return 'Your session has expired. Please log in again to continue.';
  }
  if (/invalid token|jwt malformed|invalid signature/i.test(raw)) {
    return 'Invalid session credentials. Please log in again.';
  }

  // 8. File Upload & Storage (Multer / Cloudinary)
  if (/limit_file_size/i.test(raw)) {
    return 'The uploaded file is too large. Please select a smaller file (maximum 10MB).';
  }
  if (/limit_unexpected_file/i.test(raw)) {
    return 'Unexpected upload field received. Please check the upload form.';
  }
  if (/cloudinary|cloud storage/i.test(raw)) {
    return 'File upload to cloud storage failed. Please check the file and try again.';
  }

  // 9. JavaScript Runtime Exceptions (TypeError, ReferenceError, etc.)
  if (/cannot read propert|is not a function|referenceerror|typeerror|undefined is not/i.test(raw)) {
    return 'An unexpected system error occurred while processing your request. Please try again.';
  }

  // 10. Check if it matches any remaining technical patterns
  if (isTechnicalError(raw)) {
    return defaultFallback;
  }

  // 11. If it's a clean, human-readable message without code/symbols, preserve it
  if (raw.length < 200 && !raw.includes('\n') && !raw.includes('at ')) {
    return raw;
  }

  return defaultFallback;
}

/**
 * Redacts sensitive fields from objects (such as passwords, tokens, OTPs) for safe logging
 */
function sanitizeReqBody(data) {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeReqBody);

  const clean = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey) || lowerKey.includes('password') || lowerKey.includes('secret')) {
      clean[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeReqBody(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

module.exports = {
  isTechnicalError,
  sanitizeErrorMessage,
  sanitizeReqBody,
};
