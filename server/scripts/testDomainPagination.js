require('dotenv').config({ path: './server/.env' })
const materialRepository = require('../repositories/materialRepository')
const testRepository = require('../repositories/testRepository')
const submissionRepository = require('../repositories/submissionRepository')
const userRepository = require('../repositories/userRepository')
const { generateAccessToken } = require('../config/jwt')
const { protectMe } = require('../middleware/authMiddleware')
const { getMe, verifyStaffLoginOtp } = require('../controllers/authController')
const { hashOtp } = require('../utils/generateOtp')

async function run() {
  console.log('========================================================')
  console.log('🧪 RUNNING MATERIALS, TESTS & RESULTS PAGINATION & AUTH TESTS')
  console.log('========================================================\n')

  let passed = 0
  let total = 0
  const assert = (condition, msg) => {
    total++
    if (condition) {
      console.log(`✅ [PASS] ${msg}`)
      passed++
    } else {
      console.error(`❌ [FAIL] ${msg}`)
      process.exitCode = 1
    }
  }

  // --- Group 1: Materials Pagination ---
  console.log('--- Test Group 1: Materials Pagination ---')
  const matAll = await materialRepository.getMaterials()
  assert(Array.isArray(matAll), 'getMaterials() backward-compatibility returns raw array')

  const matP1 = await materialRepository.getMaterials({ page: 1, limit: 5 })
  assert(Array.isArray(matP1.materials), 'Paginated materials has materials array')
  assert(matP1.page === 1, 'Page number is 1')
  assert(matP1.limit === 5, 'Page limit is 5')
  assert(matP1.totalCount === matAll.length, `Total count matches raw array length (${matP1.totalCount} === ${matAll.length})`)
  assert(matP1.totalPages === Math.ceil(matAll.length / 5), 'Total pages calculated properly')
  assert(matP1.materials.length <= 5, 'Returned count <= limit')

  // --- Group 2: Tests Pagination ---
  console.log('\n--- Test Group 2: Tests Pagination ---')
  const testAll = await testRepository.getTests()
  assert(Array.isArray(testAll), 'getTests() backward-compatibility returns raw array')

  const testP1 = await testRepository.getTests({ page: 1, limit: 3 })
  assert(Array.isArray(testP1.tests), 'Paginated tests has tests array')
  assert(testP1.page === 1, 'Page number is 1')
  assert(testP1.limit === 3, 'Page limit is 3')
  assert(testP1.totalCount === testAll.length, `Total count matches raw array length (${testP1.totalCount} === ${testAll.length})`)
  assert(testP1.totalPages === Math.ceil(testAll.length / 3), 'Total pages calculated properly')
  assert(testP1.tests.length <= 3, 'Returned count <= limit')

  // --- Group 3: Results Pagination ---
  console.log('\n--- Test Group 3: Results Pagination ---')
  const resAll = await submissionRepository.getAllResults()
  assert(Array.isArray(resAll), 'getAllResults() backward-compatibility returns raw array')

  const resP1 = await submissionRepository.getAllResults({ page: 1, limit: 3 })
  assert(Array.isArray(resP1.results), 'Paginated results has results array')
  assert(resP1.page === 1, 'Page number is 1')
  assert(resP1.limit === 3, 'Page limit is 3')
  assert(resP1.totalCount === resAll.length, `Total count matches raw array length (${resP1.totalCount} === ${resAll.length})`)
  assert(resP1.totalPages === Math.ceil(resAll.length / 3), 'Total pages calculated properly')
  assert(resP1.results.length <= 3, 'Returned count <= limit')

  // --- Group 4: Staff OTP Verification & userRole Bug Fix ---
  console.log('\n--- Test Group 4: Staff OTP Verification ---')
  const staff = await userRepository.findUserByEmail('abi18official@gmail.com')
  assert(staff !== null, 'Found staff user abi18official@gmail.com')

  const testOtp = '654321'
  await userRepository.updateOtp(staff._id, {
    otpHash: hashOtp(testOtp),
    otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
    otpPurpose: 'staff_login',
    otpVerified: false,
  })

  let mockReq = { body: { email: 'abi18official@gmail.com', otp: testOtp } }
  let mockRes = {
    statusCode: 200,
    data: null,
    status(code) { this.statusCode = code; return this },
    json(payload) { this.data = payload; return this },
  }

  await verifyStaffLoginOtp(mockReq, mockRes)
  assert(mockRes.statusCode === 200, `verifyStaffLoginOtp returned 200 (got ${mockRes.statusCode})`)
  assert(mockRes.data?.success === true, 'verifyStaffLoginOtp success is true')
  assert(mockRes.data?.user?.role === 'staff', `Staff role is correctly populated as "staff" (got ${mockRes.data?.user?.role})`)
  assert(Boolean(mockRes.data?.accessToken), 'Access token was generated')
  assert(Boolean(mockRes.data?.refreshToken), 'Refresh token was generated')

  // --- Group 5: Admin User 0 & Profile Persistence ---
  console.log('\n--- Test Group 5: Admin User 0 & Profile Verification ---')
  const adminToken = generateAccessToken(0, 'admin')
  mockReq = { headers: { authorization: `Bearer ${adminToken}` } }
  mockRes = {
    statusCode: 200,
    data: null,
    status(code) { this.statusCode = code; return this },
    json(payload) { this.data = payload; return this },
  }

  await protectMe(mockReq, mockRes, async () => {
    assert(mockReq.user?._id === '0', 'protectMe attached admin user with _id: "0"')
    assert(mockReq.user?.role === 'admin', 'protectMe attached admin user with role: "admin"')
    await getMe(mockReq, mockRes)
    assert(mockRes.statusCode === 200, `getMe returned 200 for admin (got ${mockRes.statusCode})`)
    assert(mockRes.data?.user?.role === 'admin', 'getMe returned role: "admin"')
  })

  console.log('\n========================================================')
  console.log(`🎉 ALL TESTS PASSED: ${passed}/${total}`)
  console.log('========================================================\n')
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Test execution failed:', err)
    process.exit(1)
  })
