require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const common = require('../../common/common.json');
const userRepository = require('../repositories/userRepository');
const { ROLES } = require('../common');

async function runPaginationTests() {
  console.log('====================================================');
  console.log('🧪 Testing Staff & Student Pagination (Initial 50)');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(cond, msg) {
    total++;
    if (cond) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  // 1. Common.json configuration
  console.log('📋 Test Group 1: Configuration in common.json');
  assert(common.PAGINATION !== undefined, 'common.json defines PAGINATION block');
  assert(common.PAGINATION.DEFAULT_LIMIT === 50, 'PAGINATION.DEFAULT_LIMIT is 50');
  assert(common.PAGINATION.DEFAULT_PAGE === 1, 'PAGINATION.DEFAULT_PAGE is 1');
  assert(Array.isArray(common.PAGINATION.LIMIT_OPTIONS) && common.PAGINATION.LIMIT_OPTIONS.includes(50), 'PAGINATION.LIMIT_OPTIONS includes 50');

  // 2. Repository Paginated Calls for Staff
  console.log('\n👥 Test Group 2: Staff Pagination in Repository');
  const staffPage1 = await userRepository.getAllUsers({
    role: ROLES.STAFF,
    page: 1,
    limit: 50,
  });

  assert(staffPage1 && Array.isArray(staffPage1.users), 'Repository returns users array');
  assert(typeof staffPage1.totalCount === 'number', `totalCount is a number (${staffPage1.totalCount})`);
  assert(staffPage1.page === 1, 'Page number is 1');
  assert(staffPage1.limit === 50, 'Page limit is 50');
  assert(typeof staffPage1.totalPages === 'number', `totalPages is calculated (${staffPage1.totalPages})`);
  assert(staffPage1.users.length <= 50, `Returned staff length (${staffPage1.users.length}) <= limit 50`);

  // 3. Repository Paginated Calls for Students
  console.log('\n🎓 Test Group 3: Students Pagination in Repository');
  const studentPage1 = await userRepository.getAllUsers({
    role: ROLES.STUDENT,
    page: 1,
    limit: 50,
  });

  assert(studentPage1 && Array.isArray(studentPage1.users), 'Repository returns students array');
  assert(typeof studentPage1.totalCount === 'number', `totalCount is a number (${studentPage1.totalCount})`);
  assert(studentPage1.page === 1, 'Page number is 1');
  assert(studentPage1.limit === 50, 'Page limit is 50');
  assert(typeof studentPage1.totalPages === 'number', `totalPages is calculated (${studentPage1.totalPages})`);
  assert(studentPage1.users.length <= 50, `Returned students length (${studentPage1.users.length}) <= limit 50`);

  // 4. Non-paginated backwards compatibility
  console.log('\n🔄 Test Group 4: Backwards Compatibility');
  const allStaff = await userRepository.getAllUsers({ role: ROLES.STAFF });
  assert(Array.isArray(allStaff), 'Without page/limit, returns raw array of all staff');
  assert(allStaff.length === staffPage1.totalCount, 'Raw array length matches paginated totalCount');

  const allStudents = await userRepository.getAllUsers({ role: ROLES.STUDENT });
  assert(Array.isArray(allStudents), 'Without page/limit, returns raw array of all students');
  assert(allStudents.length === studentPage1.totalCount, 'Raw array length matches paginated totalCount');

  console.log('\n====================================================');
  console.log(`🎉 ALL TESTS PASSED: ${passed}/${total} checks successful!`);
  console.log('====================================================\n');
  process.exit(0);
}

runPaginationTests().catch(err => {
  console.error('\n❌ Test execution failed:', err);
  process.exit(1);
});
