const XLSX = require('xlsx');
const bulkStaffService = require('../services/bulkStaffService');
const { getPool, sql } = require('../config/db');
const bcrypt = require('bcryptjs');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 Starting Verification: Bulk Staff Upload Service');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // 1. Template Generation Test
  console.log('📋 Test Group 1: Template Generation');
  const templateBuffer = bulkStaffService.generateSampleStaffExcelTemplate();
  assert(Buffer.isBuffer(templateBuffer) && templateBuffer.length > 0, 'generateSampleStaffExcelTemplate returns non-empty buffer');

  const workbook = XLSX.read(templateBuffer, { type: 'buffer' });
  assert(workbook.SheetNames.includes('Staff_Template'), 'Template contains sheet "Staff_Template"');
  const templateRows = XLSX.utils.sheet_to_json(workbook.Sheets['Staff_Template']);
  assert(templateRows.length >= 3, 'Template contains sample staff rows');
  assert(templateRows[0].Name && templateRows[0].Regnum && templateRows[0].Department && templateRows[0].Email, 'Template contains all required column keys');

  // 2. Missing Required Columns Validation
  console.log('\n🛡️ Test Group 2: Header Validation');
  const invalidSheetData = [
    { 'Name': 'Test Staff', 'Phone': '9876543210' } // Missing Regnum, Email, Department
  ];
  const invalidWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(invalidWb, XLSX.utils.json_to_sheet(invalidSheetData), 'Sheet1');
  const invalidBuffer = XLSX.write(invalidWb, { type: 'buffer', bookType: 'xlsx' });

  let headerErrorCaught = false;
  try {
    await bulkStaffService.validateStaffExcelBuffer(invalidBuffer);
  } catch (err) {
    headerErrorCaught = true;
    assert(err.message.includes('missing required column'), `Missing column error thrown: ${err.message}`);
  }
  assert(headerErrorCaught, 'Header validator correctly rejected incomplete header');

  // 3. Row-level Data Validation (Valid vs Invalid Rows)
  console.log('\n🔍 Test Group 3: Row-level Validation Rules');
  const testRows = [
    {
      'Name': 'Valid Staff One',
      'Regnum': 'EGSP991',
      'Email': 'valid.staff1.test@egspec.org',
      'Department': 'Computer Science and Engineering',
      'Designation': 'Associate Professor',
      'Phone': '9876543210',
      'Password': 'Password@123',
    },
    {
      'Name': 'Valid Staff Two',
      'Regnum': 'EGSPE992',
      'Email': 'valid.staff2.test@egspec.org',
      'Department': 'Information Technology',
      'Designation': 'Assistant Professor',
      'Phone': '9876543211',
      'Password': 'Password@123',
    },
    {
      'Name': '123 Invalid Name',
      'Regnum': 'EGSP993',
      'Email': 'invalid.name@egspec.org',
      'Department': 'Computer Science and Engineering',
    },
    {
      'Name': 'Wrong Regnum Staff',
      'Regnum': '8208E23CSR001', // Student format, not EGSP
      'Email': 'wrong.regnum@egspec.org',
      'Department': 'Computer Science and Engineering',
    },
    {
      'Name': 'Unknown Dept Staff',
      'Regnum': 'EGSP994',
      'Email': 'unknown.dept@egspec.org',
      'Department': 'NonExistentEngineering',
    },
  ];

  const testWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(testWb, XLSX.utils.json_to_sheet(testRows), 'Sheet1');
  const testBuffer = XLSX.write(testWb, { type: 'buffer', bookType: 'xlsx' });

  const valResult = await bulkStaffService.validateStaffExcelBuffer(testBuffer);
  assert(valResult.totalRows === 5, 'Total rows detected is 5');
  assert(valResult.validCount === 2, 'Exactly 2 rows are valid');
  assert(valResult.errorCount === 3, 'Exactly 3 rows have validation errors');
  assert(valResult.valid === false, 'File validation result is false due to errors');

  // Check specific error messages
  const invalidNameError = valResult.errors.find(e => e.rowNumber === 4);
  assert(invalidNameError && invalidNameError.issues.some(i => i.field === 'name'), 'Row 4 flagged with name issue');

  const invalidRegnumError = valResult.errors.find(e => e.rowNumber === 5);
  assert(invalidRegnumError && invalidRegnumError.issues.some(i => i.field === 'regnum'), 'Row 5 flagged with regnum format issue');

  const invalidDeptError = valResult.errors.find(e => e.rowNumber === 6);
  assert(invalidDeptError && invalidDeptError.issues.some(i => i.field === 'department'), 'Row 6 flagged with department issue');

  // 4. Batch Insertion Test into Database
  console.log('\n🗄️ Test Group 4: Atomic Batch Insertion & Database Verification');
  const pool = await getPool();

  // Clean any previous test rows
  await pool.request().query(`
    DELETE FROM Staff WHERE Email IN ('valid.staff1.test@egspec.org', 'valid.staff2.test@egspec.org')
  `);

  const insertResult = await bulkStaffService.insertBulkStaff(valResult.validStaff);
  assert(insertResult.insertedCount === 2, 'insertBulkStaff inserted 2 records');
  assert(insertResult.staff.length === 2, 'Returned array contains 2 staff objects');

  // Verify in database
  const dbCheck = await pool.request().query(`
    SELECT StaffId, Name, Email, Regnum, DepartmentId, Password, Designation, IsActive
    FROM Staff
    WHERE Email IN ('valid.staff1.test@egspec.org', 'valid.staff2.test@egspec.org')
    ORDER BY StaffId ASC
  `);

  assert(dbCheck.recordset.length === 2, '2 staff records found in SQL Server database');
  const firstInserted = dbCheck.recordset[0];
  assert(firstInserted.Regnum === 'EGSP991', 'Stored Regnum matches EGSP991');
  assert(firstInserted.DepartmentId === 1, 'DepartmentId resolved to 1 (CSE)');
  assert(firstInserted.IsActive === true, 'IsActive is set to 1');
  assert(await bcrypt.compare('Password@123', firstInserted.Password), 'Password hashed and authenticates with bcrypt');

  // Clean up test staff
  await pool.request().query(`
    DELETE FROM Staff WHERE Email IN ('valid.staff1.test@egspec.org', 'valid.staff2.test@egspec.org')
  `);
  console.log('  🧹 Cleaned up temporary test staff records');

  console.log('\n====================================================');
  console.log(`🎉 ALL TESTS PASSED: ${passedTests}/${totalTests} checks successful!`);
  console.log('====================================================\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('\n❌ Test execution error:', err);
  process.exit(1);
});
