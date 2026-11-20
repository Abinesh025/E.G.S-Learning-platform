const fs = require('fs');
const path = require('path');
const { sanitizeReqBody } = require('./errorSanitizer');

// 📁 Ensure logs directory exists
const LOGS_DIR = path.join(__dirname, '../logs');
if (!fs.existsSync(LOGS_DIR)) {
  try {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create logs directory:', err);
  }
}

const LOG_FILES = {
  application: path.join(LOGS_DIR, 'application.log'),
  error: path.join(LOGS_DIR, 'error.log'),
  actions: path.join(LOGS_DIR, 'actions.log'),
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per log file
const MAX_ARCHIVES = 3;

/**
 * Format timestamp as YYYY-MM-DD HH:mm:ss.SSS
 */
function getTimestamp() {
  const now = new Date();
  const pad = (n, s = 2) => String(n).padStart(s, '0');
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const min = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  const ms = pad(now.getMilliseconds(), 3);
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}.${ms}`;
}

/**
 * Rotates log file if size exceeds MAX_FILE_SIZE
 */
function rotateLogFileIfNeeded(filePath) {
  try {
    if (!fs.existsSync(filePath)) return;
    const stats = fs.statSync(filePath);
    if (stats.size >= MAX_FILE_SIZE) {
      for (let i = MAX_ARCHIVES - 1; i >= 1; i--) {
        const oldFile = `${filePath}.${i}`;
        const newFile = `${filePath}.${i + 1}`;
        if (fs.existsSync(oldFile)) {
          fs.renameSync(oldFile, newFile);
        }
      }
      fs.renameSync(filePath, `${filePath}.1`);
    }
  } catch (e) {
    // Non-blocking fallback
  }
}

/**
 * Append line safely to a log file
 */
function appendToFile(filePath, line) {
  try {
    rotateLogFileIfNeeded(filePath);
    fs.appendFileSync(filePath, line + '\n', 'utf8');
  } catch (err) {
    console.error(`[Logger] Failed to write to ${filePath}:`, err.message);
  }
}

/**
 * Clean and serialize metadata object
 */
function formatMeta(meta) {
  if (!meta || Object.keys(meta).length === 0) return '';
  try {
    const safeMeta = sanitizeReqBody(meta);
    return ' ' + JSON.stringify(safeMeta);
  } catch (e) {
    return ' [Unserializable metadata]';
  }
}

class Logger {
  /**
   * General informational log
   */
  info(message, meta = {}) {
    const timestamp = getTimestamp();
    const metaStr = formatMeta(meta);
    const line = `[${timestamp}] [INFO] [SYSTEM] ${message}${metaStr}`;
    
    appendToFile(LOG_FILES.application, line);
    console.log(`\x1b[32m[INFO]\x1b[0m ${message}`);
  }

  /**
   * Application action log (logins, submissions, uploads, CRUD operations)
   */
  action(actionName, message, meta = {}) {
    const timestamp = getTimestamp();
    const metaStr = formatMeta(meta);
    const line = `[${timestamp}] [ACTION] [${actionName.toUpperCase()}] ${message}${metaStr}`;

    appendToFile(LOG_FILES.application, line);
    appendToFile(LOG_FILES.actions, line);
    console.log(`\x1b[36m[ACTION:${actionName.toUpperCase()}]\x1b[0m ${message}`);
  }

  /**
   * Warning log
   */
  warn(message, meta = {}) {
    const timestamp = getTimestamp();
    const metaStr = formatMeta(meta);
    const line = `[${timestamp}] [WARN] [SYSTEM] ${message}${metaStr}`;

    appendToFile(LOG_FILES.application, line);
    console.warn(`\x1b[33m[WARN]\x1b[0m ${message}`);
  }

  /**
   * Error log with full technical details, error messages, and stack traces
   */
  error(errorOrMessage, meta = {}) {
    const timestamp = getTimestamp();

    let message = '';
    let stack = null;
    let code = null;
    let originalError = null;

    if (errorOrMessage instanceof Error) {
      message = errorOrMessage.message || 'Unknown Error';
      stack = errorOrMessage.stack;
      code = errorOrMessage.code;
      originalError = errorOrMessage.toString();
    } else if (typeof errorOrMessage === 'object' && errorOrMessage !== null) {
      message = errorOrMessage.message || JSON.stringify(errorOrMessage);
      stack = errorOrMessage.stack;
      code = errorOrMessage.code;
      originalError = errorOrMessage;
    } else {
      message = String(errorOrMessage);
    }

    // Merge error details into metadata for deep inspection
    const errorDetails = {
      ...meta,
      errorCode: code || meta.errorCode,
      stack: stack || meta.stack,
    };

    const metaStr = formatMeta(errorDetails);
    const line = `[${timestamp}] [ERROR] [APPLICATION_ERROR] ${message}${metaStr}`;

    appendToFile(LOG_FILES.application, line);
    appendToFile(LOG_FILES.error, line);

    // Also write full stack trace on its own lines to error.log if available
    if (stack) {
      appendToFile(LOG_FILES.error, `--- STACK TRACE [${timestamp}] ---\n${stack}\n----------------------------------`);
    }

    console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`, stack ? `\n${stack}` : '');
  }

  /**
   * HTTP request/response log
   */
  http(req, res, durationMs) {
    const timestamp = getTimestamp();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const status = res.statusCode;
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const user = req.user ? `${req.user.email || req.user.name || req.user._id} (${req.user.role || 'user'})` : 'guest';

    const line = `[${timestamp}] [HTTP] [API] ${method} ${url} ${status} ${durationMs}ms - User: ${user} - IP: ${ip}`;
    appendToFile(LOG_FILES.application, line);

    // Colorized console output
    const statusColor = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : status >= 300 ? '\x1b[36m' : '\x1b[32m';
    console.log(`[HTTP] ${method} ${url} ${statusColor}${status}\x1b[0m ${durationMs}ms - ${user}`);
  }

  /**
   * Parses a single log line into a structured object
   */
  parseLogLine(line, id) {
    if (!line || !line.trim()) return null;

    // Pattern: [YYYY-MM-DD HH:mm:ss.SSS] [LEVEL] [CATEGORY] Message { JSON }
    const match = line.match(/^\[([^\]]+)\]\s+\[([^\]]+)\]\s+\[([^\]]+)\]\s+(.*?)(?:\s+(\{.*\}))?$/);
    if (!match) {
      // Check if this is a stack trace header or body
      return {
        id: `log-${id}`,
        timestamp: '',
        level: 'DEBUG',
        category: 'RAW',
        message: line,
        meta: null,
        raw: line,
      };
    }

    let meta = null;
    if (match[5]) {
      try {
        meta = JSON.parse(match[5]);
      } catch (e) {
        meta = { rawMeta: match[5] };
      }
    }

    return {
      id: `log-${id}`,
      timestamp: match[1],
      level: match[2],
      category: match[3],
      message: match[4],
      meta,
      raw: line,
    };
  }

  /**
   * Retrieve recent logs with filtering and pagination
   */
  getRecentLogs({ type = 'all', limit = 100, page = 1, search = '', level = 'ALL' } = {}) {
    const targetFile = type === 'error'
      ? LOG_FILES.error
      : type === 'actions'
      ? LOG_FILES.actions
      : LOG_FILES.application;

    if (!fs.existsSync(targetFile)) {
      return {
        logs: [],
        total: 0,
        page: 1,
        totalPages: 0,
        limit,
      };
    }

    try {
      const content = fs.readFileSync(targetFile, 'utf8');
      const rawLines = content.split(/\r?\n/).filter(line => line.trim().length > 0);

      // Reverse so most recent entries appear first
      const reversed = rawLines.reverse();

      // Parse and filter
      const searchLower = (search || '').toLowerCase().trim();
      const levelUpper = (level || 'ALL').toUpperCase();

      const parsedLogs = [];
      let entryIndex = 0;

      for (const line of reversed) {
        entryIndex++;
        const parsed = this.parseLogLine(line, entryIndex);
        if (!parsed) continue;

        // Level filter
        if (levelUpper !== 'ALL' && parsed.level !== levelUpper) {
          continue;
        }

        // Search filter
        if (searchLower) {
          const inMessage = parsed.message && parsed.message.toLowerCase().includes(searchLower);
          const inCategory = parsed.category && parsed.category.toLowerCase().includes(searchLower);
          const inRaw = parsed.raw && parsed.raw.toLowerCase().includes(searchLower);
          if (!inMessage && !inCategory && !inRaw) {
            continue;
          }
        }

        parsedLogs.push(parsed);
      }

      const total = parsedLogs.length;
      const parsedPage = Math.max(1, parseInt(page, 10) || 1);
      const parsedLimit = Math.max(1, Math.min(500, parseInt(limit, 10) || 100));
      const totalPages = Math.ceil(total / parsedLimit) || 1;

      const startIndex = (parsedPage - 1) * parsedLimit;
      const paginated = parsedLogs.slice(startIndex, startIndex + parsedLimit);

      return {
        logs: paginated,
        total,
        page: parsedPage,
        totalPages,
        limit: parsedLimit,
      };
    } catch (err) {
      console.error('[Logger] Error reading log file:', err);
      return { logs: [], total: 0, page: 1, totalPages: 0, limit };
    }
  }

  /**
   * Return storage and health statistics for log files
   */
  getStats() {
    const stats = {
      files: {},
      totalSize: 0,
      todayErrors: 0,
      todayActions: 0,
    };

    const todayStr = getTimestamp().split(' ')[0];

    for (const [key, filePath] of Object.entries(LOG_FILES)) {
      if (fs.existsSync(filePath)) {
        try {
          const fileStat = fs.statSync(filePath);
          stats.files[key] = {
            sizeBytes: fileStat.size,
            sizeFormatted: (fileStat.size / (1024 * 1024)).toFixed(2) + ' MB',
            lastModified: fileStat.mtime,
          };
          stats.totalSize += fileStat.size;

          if (key === 'error') {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            stats.todayErrors = lines.filter(l => l.includes(`[${todayStr}`) && l.includes('[ERROR]')).length;
          }
          if (key === 'actions') {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');
            stats.todayActions = lines.filter(l => l.includes(`[${todayStr}`) && l.includes('[ACTION]')).length;
          }
        } catch (e) {
          stats.files[key] = { error: e.message };
        }
      } else {
        stats.files[key] = { sizeBytes: 0, sizeFormatted: '0 MB', lastModified: null };
      }
    }

    stats.totalSizeFormatted = (stats.totalSize / (1024 * 1024)).toFixed(2) + ' MB';
    return stats;
  }

  /**
   * Clear log files
   */
  clearLogs(type = 'all') {
    if (type === 'all') {
      for (const filePath of Object.values(LOG_FILES)) {
        if (fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, '', 'utf8');
        }
      }
      return { success: true, message: 'All log files have been cleared.' };
    }

    const filePath = LOG_FILES[type];
    if (filePath && fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '', 'utf8');
      return { success: true, message: `${type} log file has been cleared.` };
    }

    return { success: false, message: 'Invalid log type specified.' };
  }

  /**
   * Return path for file download
   */
  getLogFilePath(type = 'application') {
    return LOG_FILES[type] || LOG_FILES.application;
  }
}

// Singleton instance
const logger = new Logger();

module.exports = logger;
