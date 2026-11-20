const assert = require('assert')
const fs = require('fs')
const path = require('path')
const express = require('express')
const http = require('http')

const logger = require('../utils/logger')
const { sanitizeErrorMessage, isTechnicalError, sanitizeReqBody } = require('../utils/errorSanitizer')
const { responseSanitizer } = require('../middleware/responseSanitizer')

async function runTests() {
  console.log('--- Starting Logger & Error Sanitizer Tests ---')

  // ─────────────────────────────────────────────
  // 1. Error Sanitizer Unit Tests
  // ─────────────────────────────────────────────
  console.log('\n[1] Testing Error Sanitizer & Masking...')

  const sqlDuplicate = "Violation of PRIMARY KEY constraint 'PK_Users'. Cannot insert duplicate key in object 'dbo.Users'. The duplicate key value is (test@egspec.edu)."
  const maskedDuplicate = sanitizeErrorMessage(sqlDuplicate)
  console.log('Raw:', sqlDuplicate)
  console.log('Sanitized:', maskedDuplicate)
  assert.strictEqual(maskedDuplicate, 'A record with this information already exists in the system.')
  assert.strictEqual(isTechnicalError(sqlDuplicate), true)

  const sqlColumn = "Invalid column name 'NonExistentColumn' in table 'Students'."
  const maskedColumn = sanitizeErrorMessage(sqlColumn)
  console.log('Raw:', sqlColumn)
  console.log('Sanitized:', maskedColumn)
  assert.strictEqual(maskedColumn, 'The requested operation could not be processed. Our technical team has logged this issue.')

  const dbConnection = "Failed to connect to localhost:1433 - connect ECONNREFUSED 127.0.0.1:1433"
  const maskedConn = sanitizeErrorMessage(dbConnection)
  console.log('Raw:', dbConnection)
  console.log('Sanitized:', maskedConn)
  assert.strictEqual(maskedConn, 'Unable to connect to the database service. Please check your network or try again shortly.')

  const typeError = "TypeError: Cannot read properties of undefined (reading 'UserId')\n    at exports.createStaff (C:\\Users\\adminController.js:55:12)"
  const maskedType = sanitizeErrorMessage(typeError)
  console.log('Raw:', typeError)
  console.log('Sanitized:', maskedType)
  assert.strictEqual(maskedType, 'An unexpected system error occurred while processing your request. Please try again.')

  const jwtExpired = "jwt expired"
  const maskedJwt = sanitizeErrorMessage(jwtExpired)
  assert.strictEqual(maskedJwt, 'Your session has expired. Please log in again to continue.')

  const friendlyValidation = "Email and password are required"
  const maskedFriendly = sanitizeErrorMessage(friendlyValidation)
  assert.strictEqual(maskedFriendly, 'Email and password are required')
  assert.strictEqual(isTechnicalError(friendlyValidation), false)

  console.log('✅ Error Sanitizer Unit Tests Passed!')

  // ─────────────────────────────────────────────
  // 2. Sensitive Body Sanitization
  // ─────────────────────────────────────────────
  console.log('\n[2] Testing Sensitive Field Redaction...')
  const rawBody = {
    email: 'staff@egspec.edu',
    password: 'supersecretpassword123',
    otp: '123456',
    adminToken: 'eyJhbGciOi...',
    nested: {
      confirmPassword: 'supersecretpassword123',
      department: 'CSE',
    },
  }
  const cleanBody = sanitizeReqBody(rawBody)
  assert.strictEqual(cleanBody.password, '***REDACTED***')
  assert.strictEqual(cleanBody.otp, '***REDACTED***')
  assert.strictEqual(cleanBody.adminToken, '***REDACTED***')
  assert.strictEqual(cleanBody.nested.confirmPassword, '***REDACTED***')
  assert.strictEqual(cleanBody.email, 'staff@egspec.edu')
  assert.strictEqual(cleanBody.nested.department, 'CSE')
  console.log('Sanitized Body:', cleanBody)
  console.log('✅ Sensitive Field Redaction Passed!')

  // ─────────────────────────────────────────────
  // 3. Logger Appender & File Verification
  // ─────────────────────────────────────────────
  console.log('\n[3] Testing Logger Methods & File Persistence...')
  logger.info('Test Info Message', { metaTest: 'abc' })
  logger.action('TEST_ACTION', 'User completed test 101', { userId: '123', score: 95 })
  logger.warn('Test Warning Message', { attempt: 2 })
  logger.error(new Error('Simulated internal DB failure: msnodesqlv8 syntax error near WHERE'), {
    route: '/api/test',
    method: 'POST',
    ip: '127.0.0.1',
  })

  // Verify log files exist on disk
  const logsDir = path.join(__dirname, '../logs')
  const appLogPath = path.join(logsDir, 'application.log')
  const errLogPath = path.join(logsDir, 'error.log')
  const actLogPath = path.join(logsDir, 'actions.log')

  assert.ok(fs.existsSync(appLogPath), 'application.log should exist')
  assert.ok(fs.existsSync(errLogPath), 'error.log should exist')
  assert.ok(fs.existsSync(actLogPath), 'actions.log should exist')

  const appContent = fs.readFileSync(appLogPath, 'utf8')
  const errContent = fs.readFileSync(errLogPath, 'utf8')
  const actContent = fs.readFileSync(actLogPath, 'utf8')

  assert.ok(appContent.includes('Test Info Message'))
  assert.ok(appContent.includes('[ACTION] [TEST_ACTION]'))
  assert.ok(actContent.includes('TEST_ACTION'))
  assert.ok(errContent.includes('Simulated internal DB failure: msnodesqlv8'))

  console.log('✅ Logger files created and verified successfully!')

  // ─────────────────────────────────────────────
  // 4. Logger Querying & Pagination
  // ─────────────────────────────────────────────
  console.log('\n[4] Testing Logger getRecentLogs & stats...')
  const recentAll = logger.getRecentLogs({ type: 'all', limit: 10 })
  assert.ok(recentAll.logs.length > 0)
  assert.strictEqual(recentAll.page, 1)

  const recentErrors = logger.getRecentLogs({ type: 'error', limit: 10, level: 'ERROR' })
  assert.ok(recentErrors.logs.length > 0)
  assert.ok(recentErrors.logs.every(l => l.level === 'ERROR' || l.raw.includes('STACK TRACE')))

  const stats = logger.getStats()
  console.log('Logger Stats:', stats)
  assert.ok(stats.totalSize > 0)
  assert.ok(stats.todayErrors > 0)

  console.log('✅ Logger query & stats passed!')

  // ─────────────────────────────────────────────
  // 5. Express Middleware Interception & UI Error Masking
  // ─────────────────────────────────────────────
  console.log('\n[5] Testing Express Middleware Interception & UI Masking...')
  const app = express()
  app.use(express.json())
  app.use(responseSanitizer)

  // Route 1: Controller throwing raw 500 error
  app.get('/test-error', (req, res) => {
    res.status(500).json({
      success: false,
      message: "Violation of PRIMARY KEY constraint 'PK_Users' on insert",
      stack: "Error: at line 45 in db.js",
      driver: "msnodesqlv8",
    })
  })

  // Route 2: Normal route
  app.get('/test-ok', (req, res) => {
    res.status(200).json({ success: true, data: 'OK' })
  })

  // Start test server
  const server = http.createServer(app)
  await new Promise(resolve => server.listen(0, resolve))
  const port = server.address().port

  // Helper fetch
  const getJson = async (path) => {
    return new Promise((resolve, reject) => {
      http.get(`http://localhost:${port}${path}`, (res) => {
        let data = ''
        res.on('data', chunk => { data += chunk })
        res.on('end', () => {
          resolve({ status: res.statusCode, body: JSON.parse(data) })
        })
      }).on('error', reject)
    })
  }

  // Test Route 1: 500 error must be sanitized for client
  const errRes = await getJson('/test-error')
  console.log('Client received for 500 error:', errRes)
  assert.strictEqual(errRes.status, 500)
  assert.strictEqual(errRes.body.success, false)
  // Check that raw technical tokens are completely removed from UI payload
  assert.strictEqual(errRes.body.stack, undefined)
  assert.strictEqual(errRes.body.driver, undefined)
  assert.strictEqual(errRes.body.message, 'A record with this information already exists in the system.')

  // Test Route 2: OK route
  const okRes = await getJson('/test-ok')
  assert.strictEqual(okRes.status, 200)
  assert.strictEqual(okRes.body.data, 'OK')

  server.close()
  console.log('✅ Express Response Sanitizer Interception & UI Masking Passed!')

  console.log('\n=============================================')
  console.log('🎉 ALL LOGGER & ERROR SANITIZER TESTS PASSED!')
  console.log('=============================================')
}

runTests().catch(err => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
