const roleRepository = require('../repositories/roleRepository');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const common = require('../common');
const { ROLES, ROLES_ARRAY, HTTP_STATUS, MESSAGES, STATUS, MIGRATED_STATUS } = common;

async function runTests() {
  console.log('🧪 Starting Role Restriction & Common Constants Verification...\n');

  // Test 1: Verify common.json structure and key-value pairs
  console.log('--- Test 1: Verifying common.json Structure ---');
  console.log('ROLES keys/values:', ROLES);
  if (!ROLES.ADMIN || !ROLES.STAFF || !ROLES.STUDENT) {
    throw new Error('FAIL: ROLES keys missing in common.json');
  }
  if (!Array.isArray(ROLES_ARRAY) || ROLES_ARRAY.length !== 3) {
    throw new Error('FAIL: ROLES_ARRAY missing or invalid length');
  }
  console.log('ROLES_ARRAY:', ROLES_ARRAY);
  console.log('STATUS:', STATUS);
  console.log('MIGRATED_STATUS:', MIGRATED_STATUS);
  console.log('✅ PASS: common.json structure and key-value arrays verified.');

  // Test 2: Database Roles Table Lookup
  console.log('\n--- Test 2: Checking DB Roles Table via roleRepository ---');
  const dbRoles = await roleRepository.getAllRoles(true);
  console.log('DB Roles retrieved:', dbRoles);
  if (dbRoles.length < 3) {
    throw new Error(`FAIL: Expected at least 3 roles in DB Roles table, found ${dbRoles.length}`);
  }
  const validKeys = await roleRepository.getValidRoleKeys();
  console.log('Valid DB role keys:', validKeys);
  if (!validKeys.includes('admin') || !validKeys.includes('staff') || !validKeys.includes('student')) {
    throw new Error('FAIL: Roles table must contain Admin, Staff, and Student');
  }
  console.log('✅ PASS: Database Roles table queried and verified.');

  // Test 3: isValidRole against DB
  console.log('\n--- Test 3: Testing isValidRole against DB ---');
  const isAdminValid = await roleRepository.isValidRole('Admin');
  const isStaffValid = await roleRepository.isValidRole('staff');
  const isStudentValid = await roleRepository.isValidRole('Student');
  const isFakeValid = await roleRepository.isValidRole('hacker_role');

  if (!isAdminValid || !isStaffValid || !isStudentValid) {
    throw new Error('FAIL: Valid system roles returned false from DB check');
  }
  if (isFakeValid) {
    throw new Error('FAIL: Invalid role returned true from DB check');
  }
  console.log('✅ PASS: Role validity checked accurately against DB Roles table.');

  // Test 4: roleMiddleware authorization
  console.log('\n--- Test 4: Testing authorizeRoles Middleware ---');
  const staffOnlyMiddleware = authorizeRoles(ROLES.STAFF);

  // Case A: User has staff role -> Should succeed (call next)
  let nextCalled = false;
  let statusSent = null;
  let jsonSent = null;
  const mockReqStaff = { user: { role: ROLES.STAFF, name: 'Staff User' } };
  const mockRes = {
    status: (s) => { statusSent = s; return mockRes; },
    json: (j) => { jsonSent = j; return mockRes; },
  };

  await staffOnlyMiddleware(mockReqStaff, mockRes, () => { nextCalled = true; });
  if (!nextCalled) {
    throw new Error(`FAIL: Staff user was not allowed access to staff route! Response: ${JSON.stringify(jsonSent)}`);
  }
  console.log('✅ Case A: Staff user authorized successfully by middleware.');

  // Case B: User has student role on staff route -> Should be forbidden (403)
  nextCalled = false;
  statusSent = null;
  jsonSent = null;
  const mockReqStudent = { user: { role: ROLES.STUDENT, name: 'Student User' } };
  await staffOnlyMiddleware(mockReqStudent, mockRes, () => { nextCalled = true; });
  if (nextCalled || statusSent !== HTTP_STATUS.FORBIDDEN) {
    throw new Error(`FAIL: Student user was not rejected with 403 on staff route! Got status: ${statusSent}`);
  }
  console.log(`✅ Case B: Student correctly blocked with HTTP ${statusSent} (${jsonSent?.message}).`);

  // Case C: User has a role not in DB Roles table -> Should be forbidden (403)
  nextCalled = false;
  statusSent = null;
  jsonSent = null;
  const mockReqFake = { user: { role: 'fake_role', name: 'Unknown User' } };
  await staffOnlyMiddleware(mockReqFake, mockRes, () => { nextCalled = true; });
  if (nextCalled || statusSent !== HTTP_STATUS.FORBIDDEN) {
    throw new Error(`FAIL: User with unknown role not in DB was not blocked with 403! Got status: ${statusSent}`);
  }
  console.log(`✅ Case C: Unknown role rejected against DB Roles table with HTTP ${statusSent} (${jsonSent?.message}).`);

  // Case D: No user authenticated -> Should be 401 Unauthorized
  nextCalled = false;
  statusSent = null;
  jsonSent = null;
  const mockReqUnauth = {};
  await staffOnlyMiddleware(mockReqUnauth, mockRes, () => { nextCalled = true; });
  if (nextCalled || statusSent !== HTTP_STATUS.UNAUTHORIZED) {
    throw new Error(`FAIL: Unauthenticated request was not blocked with 401! Got status: ${statusSent}`);
  }
  console.log(`✅ Case D: Unauthenticated request rejected with HTTP ${statusSent} (${jsonSent?.message}).`);

  console.log('\n🎉 ALL ROLE RESTRICTION & COMMON CONSTANTS TESTS PASSED!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
