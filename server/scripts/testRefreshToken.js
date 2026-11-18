const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const jwt = require('jsonwebtoken')
const {
  generateToken,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TOKEN_CONFIG,
} = require('../config/jwt')
const { protectMe, protectAny } = require('../middleware/authMiddleware')
const { refreshToken } = require('../controllers/authController')
const userRepository = require('../repositories/userRepository')
const { ROLES, HTTP_STATUS, MESSAGES } = require('../common')

async function runTests() {
  console.log('========================================================')
  console.log('🧪 RUNNING DUAL-TOKEN (ACCESS + REFRESH) AUTH TESTS')
  console.log('========================================================\n')

  let passed = 0
  let total = 0

  function assert(condition, message) {
    total++
    if (condition) {
      passed++
      console.log(`✅ [PASS] ${message}`)
    } else {
      console.error(`❌ [FAIL] ${message}`)
      throw new Error(`Assertion failed: ${message}`)
    }
  }

  // -------------------------------------------------------------------
  // TEST 1: Expiration Limits Configuration
  // -------------------------------------------------------------------
  console.log('--- Test 1: Expiration Limits in Config ---')
  assert(TOKEN_CONFIG.ACCESS_TOKEN_EXPIRES_IN === '15m', 'Access token expiry configured to 15m')
  assert(TOKEN_CONFIG.REFRESH_TOKEN_EXPIRES_IN === '1d', 'Refresh token expiry configured to 1d')
  assert(TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY_MS === 15 * 60 * 1000, 'Access token ms configured to 900,000 (15m)')
  assert(TOKEN_CONFIG.REFRESH_TOKEN_EXPIRY_MS === 24 * 60 * 60 * 1000, 'Refresh token ms configured to 86,400,000 (1d)')

  // -------------------------------------------------------------------
  // TEST 2: Token Generation & Expiration Windows
  // -------------------------------------------------------------------
  console.log('\n--- Test 2: Token Generation & Expiration Decoding ---')
  const testUserId = 'TEST_USER_123'
  const testRole = ROLES.STUDENT

  const accessToken = generateAccessToken(testUserId, testRole)
  const decodedAccess = jwt.decode(accessToken)
  const accessDurationSeconds = decodedAccess.exp - decodedAccess.iat

  assert(decodedAccess.tokenType === 'access', 'Access token has tokenType = "access"')
  assert(accessDurationSeconds === 15 * 60, `Access token expires in exactly 15 minutes (900s, got ${accessDurationSeconds}s)`)

  const refreshTokenVal = generateRefreshToken(testUserId, testRole)
  const decodedRefresh = jwt.decode(refreshTokenVal)
  const refreshDurationSeconds = decodedRefresh.exp - decodedRefresh.iat

  assert(decodedRefresh.tokenType === 'refresh', 'Refresh token has tokenType = "refresh"')
  assert(refreshDurationSeconds === 24 * 60 * 60, `Refresh token expires in exactly 24 hours / 1 day (86400s, got ${refreshDurationSeconds}s)`)

  // -------------------------------------------------------------------
  // TEST 3: Backward-compatibility of generateToken
  // -------------------------------------------------------------------
  console.log('\n--- Test 3: Backward-compatibility of generateToken ---')
  const legacyToken = generateToken(testUserId, testRole)
  const decodedLegacy = jwt.decode(legacyToken)
  assert(decodedLegacy.exp - decodedLegacy.iat === 15 * 60, 'generateToken returns 15m access token')

  // -------------------------------------------------------------------
  // TEST 4: Signature Separation / Cryptographic Protection
  // -------------------------------------------------------------------
  console.log('\n--- Test 4: Signature Isolation ---')
  let accessVerifiedWithRefreshSecret = false
  try {
    verifyRefreshToken(accessToken)
    accessVerifiedWithRefreshSecret = true
  } catch (err) {
    accessVerifiedWithRefreshSecret = false
  }
  assert(!accessVerifiedWithRefreshSecret, 'Access token is rejected when evaluated as refresh token')

  // -------------------------------------------------------------------
  // TEST 5: Middleware Rejection of Refresh Token as Bearer Access Token
  // -------------------------------------------------------------------
  console.log('\n--- Test 5: Middleware Guard Against Refresh Token Misuse ---')
  let protectMeBlocked = false
  const mockReq = {
    headers: {
      authorization: `Bearer ${refreshTokenVal}`,
    },
  }
  const mockRes = {
    status(code) {
      if (code === HTTP_STATUS.UNAUTHORIZED) protectMeBlocked = true
      return this
    },
    json(payload) {
      return this
    },
  }
  await protectMe(mockReq, mockRes, () => {
    protectMeBlocked = false
  })
  assert(protectMeBlocked, 'protectMe middleware rejected refresh token used as Bearer access token')

  // -------------------------------------------------------------------
  // TEST 6: Refresh Token Controller Endpoint
  // -------------------------------------------------------------------
  console.log('\n--- Test 6: Refresh Token Controller Endpoint Execution ---')
  // We mock a user in DB or use admin superuser ID 0
  const adminRefreshToken = generateRefreshToken(0, ROLES.ADMIN)
  let endpointSuccess = false
  let returnedAccessToken = null
  let returnedRefreshToken = null

  const refreshReq = {
    body: {
      refreshToken: adminRefreshToken,
    },
    headers: {},
  }
  const refreshRes = {
    status(code) {
      if (code === HTTP_STATUS.OK) endpointSuccess = true
      return this
    },
    json(data) {
      returnedAccessToken = data.accessToken
      returnedRefreshToken = data.refreshToken
      return this
    },
  }

  await refreshToken(refreshReq, refreshRes)
  assert(endpointSuccess, 'refreshToken controller returned HTTP 200 OK')
  assert(Boolean(returnedAccessToken), 'refreshToken controller issued new access token')
  assert(Boolean(returnedRefreshToken), 'refreshToken controller issued new refresh token')

  const decodedNewAccess = jwt.decode(returnedAccessToken)
  assert(decodedNewAccess.exp - decodedNewAccess.iat === 15 * 60, 'Refreshed access token expires in 15m')

  // -------------------------------------------------------------------
  // TEST 7: Invalid or Expired Refresh Token Rejection
  // -------------------------------------------------------------------
  console.log('\n--- Test 7: Invalid Refresh Token Rejection ---')
  let invalidRejected = false
  const badReq = {
    body: {
      refreshToken: 'invalid.jwt.token.string',
    },
    headers: {},
  }
  const badRes = {
    status(code) {
      if (code === HTTP_STATUS.UNAUTHORIZED) invalidRejected = true
      return this
    },
    json() {
      return this
    },
  }
  await refreshToken(badReq, badRes)
  assert(invalidRejected, 'refreshToken controller rejected invalid token with HTTP 401')

  // -------------------------------------------------------------------
  // TEST 8: Live Database User Token Refresh
  // -------------------------------------------------------------------
  console.log('\n--- Test 8: Live SQL Server DB User Token Refresh ---')
  const { getPool } = require('../config/db')
  const pool = await getPool()
  const dbUserResult = await pool.request().query('SELECT TOP 1 CAST(studentId AS NVARCHAR(50)) AS Id, email AS Email, name AS Name FROM Students')
  if (dbUserResult.recordset.length > 0) {
    const dbStudent = dbUserResult.recordset[0]
    const studentRefreshToken = generateRefreshToken(dbStudent.Id, ROLES.STUDENT)
    
    let dbRefreshOk = false
    let studentNewAccess = null
    const studentReq = {
      body: { refreshToken: studentRefreshToken },
      headers: {},
    }
    const studentRes = {
      status(code) {
        if (code === HTTP_STATUS.OK) dbRefreshOk = true
        return this
      },
      json(data) {
        studentNewAccess = data.accessToken
        return this
      },
    }
    await refreshToken(studentReq, studentRes)
    assert(dbRefreshOk, `Successfully refreshed token for live DB student (Id: ${dbStudent.Id}, Email: ${dbStudent.Email})`)
    assert(Boolean(studentNewAccess), 'Received valid new access token for student')
    
    // Now verify the new access token with protectMe
    let studentAuthenticated = false
    const authReq = {
      headers: {
        authorization: `Bearer ${studentNewAccess}`,
      },
    }
    const authRes = {
      status(code) {
        return this
      },
      json() {
        return this
      },
    }
    await protectMe(authReq, authRes, () => {
      studentAuthenticated = true
    })
    assert(studentAuthenticated, 'Newly issued access token successfully authenticated student with protectMe middleware')
  } else {
    console.log('⚠️ No students found in database; skipping live student verification')
  }

  console.log('\n========================================================')
  console.log(`🎉 ALL TESTS PASSED: ${passed}/${total}`)
  console.log('========================================================\n')
  process.exit(0)
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err)
  process.exit(1)
})
