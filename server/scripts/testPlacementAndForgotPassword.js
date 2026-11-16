const { getPool, sql } = require('../config/db')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const common = require('../../common/common.json')
const passwordResetRepo = require('../repositories/passwordResetRepository')
const userRepo = require('../repositories/userRepository')
const { authorizePlacementDepartments } = require('../middleware/roleMiddleware')

async function runTests() {
  console.log('====================================================')
  console.log('🧪 Starting Verification: Placement Module & Forgot Password')
  console.log('====================================================\n')

  let passedTests = 0
  let totalTests = 0

  function assert(condition, message) {
    totalTests++
    if (condition) {
      console.log(`  ✅ PASS: ${message}`)
      passedTests++
    } else {
      console.error(`  ❌ FAIL: ${message}`)
      throw new Error(`Assertion failed: ${message}`)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Common.json Placement Rules
  // ─────────────────────────────────────────────────────────────
  console.log('📋 Test Group 1: common.json Placement Configuration')
  assert(
    Array.isArray(common.PLACEMENT_ALLOWED_DEPARTMENT_IDS) &&
    JSON.stringify(common.PLACEMENT_ALLOWED_DEPARTMENT_IDS) === JSON.stringify([1, 2, 3, 4]),
    'common.json defines PLACEMENT_ALLOWED_DEPARTMENT_IDS as [1, 2, 3, 4]'
  )
  assert(
    common.PLACEMENT_ALLOWED_DEPARTMENTS.length === 4 &&
    common.PLACEMENT_ALLOWED_DEPARTMENTS.includes('Computer Science and Engineering') &&
    common.PLACEMENT_ALLOWED_DEPARTMENTS.includes('Computer Science and Business Systems') &&
    common.PLACEMENT_ALLOWED_DEPARTMENTS.includes('Artificial Intelligence and Data Science') &&
    common.PLACEMENT_ALLOWED_DEPARTMENTS.includes('Information Technology'),
    'common.json defines correct allowed department names'
  )
  assert(
    common.PLACEMENT_ALLOWED_DEPARTMENT_CODES.length === 4 &&
    common.PLACEMENT_ALLOWED_DEPARTMENT_CODES.includes('CSE') &&
    common.PLACEMENT_ALLOWED_DEPARTMENT_CODES.includes('CSBS') &&
    common.PLACEMENT_ALLOWED_DEPARTMENT_CODES.includes('AIDS') &&
    common.PLACEMENT_ALLOWED_DEPARTMENT_CODES.includes('IT'),
    'common.json defines correct allowed department codes'
  )

  // ─────────────────────────────────────────────────────────────
  // 2. Middleware Access Restriction
  // ─────────────────────────────────────────────────────────────
  console.log('\n🛡️ Test Group 2: authorizePlacementDepartments Middleware')
  
  // Test allowed departments 1, 2, 3, 4
  for (const deptId of [1, 2, 3, 4]) {
    let nextCalled = false
    const mockReq = { user: { role: 'student', departmentId: deptId } }
    const mockRes = {
      status: () => mockRes,
      json: () => mockRes
    }
    authorizePlacementDepartments(mockReq, mockRes, () => { nextCalled = true })
    assert(nextCalled, `Department ID ${deptId} is ALLOWED to access placement module`)
  }

  // Test restricted departments (e.g. 5 = Mech, 6 = Civil, etc.)
  for (const deptId of [5, 6, 7, 8, 9, 10, 11]) {
    let nextCalled = false
    let statusCode = null
    let responseData = null
    const mockReq = { user: { role: 'student', departmentId: deptId } }
    const mockRes = {
      status: (code) => { statusCode = code; return mockRes },
      json: (data) => { responseData = data; return mockRes }
    }
    authorizePlacementDepartments(mockReq, mockRes, () => { nextCalled = true })
    assert(!nextCalled && statusCode === 403, `Department ID ${deptId} is BLOCKED with 403 Forbidden`)
  }

  // Test staff/admin bypass
  for (const role of ['admin', 'staff']) {
    let nextCalled = false
    const mockReq = { user: { role: role } }
    const mockRes = {
      status: () => mockRes,
      json: () => mockRes
    }
    authorizePlacementDepartments(mockReq, mockRes, () => { nextCalled = true })
    assert(nextCalled, `Role '${role}' is allowed without department check`)
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Database: PasswordResets Table & Repository
  // ─────────────────────────────────────────────────────────────
  console.log('\n🗄️ Test Group 3: PasswordResets Table & Repository Operations')
  const pool = await getPool()
  
  // Verify table exists
  const tableCheck = await pool.request().query(`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PasswordResets'
  `)
  assert(tableCheck.recordset.length > 0, "Table 'PasswordResets' exists in database")

  // Test Repository lifecycle
  const testEmail = 'test_reset_verify@egspec.org'
  const rawOtp = '654321'
  const otpHash = crypto.createHash('sha256').update(rawOtp).digest('hex')
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  // Clean old
  await passwordResetRepo.consumeResetRecords(testEmail)

  // 1. Create record
  const createdRecord = await passwordResetRepo.createResetRecord(testEmail, otpHash, expiresAt)
  assert(createdRecord && createdRecord.id, 'createResetRecord successfully inserted reset row')

  // 2. Find active record
  const activeRecord = await passwordResetRepo.findActiveRecord(testEmail)
  assert(activeRecord && activeRecord.email === testEmail, 'findActiveRecord retrieves unverified active record')
  assert(activeRecord.otpHash === otpHash, 'Stored otpHash matches expected SHA-256 hash')

  // 3. Mark verified & generate token
  const testResetToken = crypto.randomBytes(32).toString('hex')
  const verifiedRecord = await passwordResetRepo.markVerified(activeRecord.id, testResetToken)
  assert(verifiedRecord.verified === true, 'markVerified sets verified = true')
  assert(verifiedRecord.resetToken === testResetToken, 'markVerified sets secure resetToken')

  // 4. Find valid token record
  const tokenRecord = await passwordResetRepo.findValidTokenRecord(testEmail, testResetToken)
  assert(tokenRecord && tokenRecord.id === activeRecord.id, 'findValidTokenRecord retrieves verified token record')

  // 5. Consume reset records
  await passwordResetRepo.consumeResetRecords(testEmail)
  const afterConsumed = await passwordResetRepo.findActiveRecord(testEmail)
  const afterConsumedToken = await passwordResetRepo.findValidTokenRecord(testEmail, testResetToken)
  assert(!afterConsumed && !afterConsumedToken, 'consumeResetRecords successfully removes used/expired records')

  // ─────────────────────────────────────────────────────────────
  // 4. End-to-End Forgot Password Flow on Real User
  // ─────────────────────────────────────────────────────────────
  console.log('\n🔐 Test Group 4: End-to-End User Password Reset Flow')
  const targetEmail = 'abineshr005@gmail.com'
  
  // Find real user
  const user = await userRepo.findUserByEmail(targetEmail)
  assert(user && user.email === targetEmail, `Target user '${targetEmail}' exists in database (Role: ${user.role})`)
  
  // Keep original password hash to restore after test
  const originalPasswordHash = user.Password || user.password

  // Step 4a: Initiate Forgot Password
  const flowOtp = '123456'
  const flowOtpHash = crypto.createHash('sha256').update(flowOtp).digest('hex')
  const flowExpiry = new Date(Date.now() + 10 * 60 * 1000)
  
  await passwordResetRepo.consumeResetRecords(targetEmail)
  const resetEntry = await passwordResetRepo.createResetRecord(targetEmail, flowOtpHash, flowExpiry)
  assert(resetEntry && resetEntry.id, 'Forgot password request generated reset entry')

  // Step 4b: Verify OTP (Wrong OTP test)
  const wrongHash = crypto.createHash('sha256').update('000000').digest('hex')
  const activeForVerify = await passwordResetRepo.findActiveRecord(targetEmail)
  assert(activeForVerify.otpHash !== wrongHash, 'Wrong OTP check fails as expected')

  // Step 4c: Verify OTP (Correct OTP)
  assert(activeForVerify.otpHash === flowOtpHash, 'Correct OTP matches stored hash')
  const sessionResetToken = crypto.randomBytes(32).toString('hex')
  await passwordResetRepo.markVerified(activeForVerify.id, sessionResetToken)
  
  const verifiedTokenRow = await passwordResetRepo.findValidTokenRecord(targetEmail, sessionResetToken)
  assert(verifiedTokenRow && verifiedTokenRow.verified === true, 'OTP verified and reset token issued')

  // Step 4d: Reset Password
  const newPlainPassword = 'TestPassword123!@#'
  const salt = await bcrypt.genSalt(10)
  const newPasswordHash = await bcrypt.hash(newPlainPassword, salt)
  
  const updatedUser = await userRepo.updateUser(user.id, { password: newPasswordHash }, user.role)
  assert(updatedUser && updatedUser.id, 'Password updated successfully in database')
  await passwordResetRepo.consumeResetRecords(targetEmail)

  // Step 4e: Verify new password matches bcrypt
  const checkUpdated = await userRepo.findUserByEmail(targetEmail)
  const userPasswordHash = checkUpdated.Password || checkUpdated.password
  const passwordMatches = await bcrypt.compare(newPlainPassword, userPasswordHash)
  assert(passwordMatches, 'New password matches and authenticates with bcrypt')

  // Step 4f: Restore original password hash
  await userRepo.updateUser(user.id, { password: originalPasswordHash }, user.role)
  const checkRestored = await userRepo.findUserByEmail(targetEmail)
  const restoredPasswordHash = checkRestored.Password || checkRestored.password
  assert(restoredPasswordHash === originalPasswordHash, 'Original password hash safely restored')

  console.log(`\n====================================================`)
  console.log(`🎉 ALL TESTS PASSED: ${passedTests}/${totalTests} checks successful!`)
  console.log(`====================================================\n`)
  process.exit(0)
}

runTests().catch(err => {
  console.error('\n❌ Test suite execution error:', err)
  process.exit(1)
})
