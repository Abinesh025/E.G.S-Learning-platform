const { sql, getPool } = require('../config/db');
const userRepository = require('../repositories/userRepository');
const bulkStudentService = require('../services/bulkStudentService');
const XLSX = require('xlsx');

async function test() {
  console.log('🧪 Starting Students Table & Functionality Verification...\n');
  const pool = await getPool();

  // Clean any previous test students if needed
  await pool.request().query("DELETE FROM Students WHERE Email LIKE '%@test.com' OR Email LIKE '%@example.com'");

  // Test 1: Check Columns in Students Table
  console.log('--- Test 1: Verifying Columns in Students Table ---');
  const colsRes = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE, ORDINAL_POSITION, IS_NULLABLE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Students'
    ORDER BY ORDINAL_POSITION
  `);
  const cols = colsRes.recordset.map(c => c.COLUMN_NAME);
  console.log('Current Students Columns in Order:', cols.join(', '));

  // Check prohibited columns are removed
  const prohibited = ['DeptId', 'Avatar', 'OtpHash', 'OtpExpiresAt', 'OtpPurpose', 'OtpVerified', 'StudentRefId', 'StudentUniqueId'];
  for (const p of prohibited) {
    if (cols.includes(p)) {
      throw new Error(`FAIL: Prohibited column '${p}' is still in Students table!`);
    }
  }
  console.log('✅ PASS: Prohibited columns (DeptId, Avatar, OtpHash, OtpExpiresAt, OtpPurpose, OtpVerified) are all removed.');

  // Check required columns exist
  const required = ['StudentId', 'DepartmentId', 'YearId', 'Name', 'Regnum', 'Email', 'Phone', 'Password', 'Batch', 'Semester', 'IsActive', 'IsMigrated', 'CreatedAt', 'UpdatedAt'];
  for (const r of required) {
    if (!cols.includes(r)) {
      throw new Error(`FAIL: Required column '${r}' is missing from Students table!`);
    }
  }
  console.log('✅ PASS: All required columns exist in Students table.');

  // Check priority ordering:
  // 1. IDs First
  if (cols[0] !== 'StudentId' || cols[1] !== 'DepartmentId' || cols[2] !== 'YearId') {
    throw new Error(`FAIL: Priority order 1 (IDs First) not matched! Found: ${cols.slice(0, 3).join(', ')}`);
  }
  // 2. Personal Details Second
  if (cols[3] !== 'Name' || cols[4] !== 'Regnum' || cols[5] !== 'Email' || cols[6] !== 'Phone' || cols[7] !== 'Password') {
    throw new Error(`FAIL: Priority order 2 (Personal Details Second) not matched! Found: ${cols.slice(3, 8).join(', ')}`);
  }
  // 3. Academic Details Third
  if (cols[8] !== 'Batch' || cols[9] !== 'Semester') {
    throw new Error(`FAIL: Priority order 3 (Academic Details Third) not matched! Found: ${cols.slice(8, 10).join(', ')}`);
  }
  // 4. Status & Timestamps
  if (cols[10] !== 'IsActive' || cols[11] !== 'IsMigrated' || cols[12] !== 'CreatedAt' || cols[13] !== 'UpdatedAt') {
    throw new Error(`FAIL: Priority order 4 (Status & Timestamps) not matched! Found: ${cols.slice(10, 14).join(', ')}`);
  }
  console.log('✅ PASS: Column ordering matches exact priority requirements.');

  // Test 2: Check Existing Migrated Student Record
  console.log('\n--- Test 2: Checking Existing Migrated Student Record ---');
  const existingStudent = await userRepository.findUserById('BSR001');
  if (!existingStudent) {
    throw new Error('FAIL: Existing student BSR001 not found!');
  }
  console.log('BSR001 Student details:');
  console.log({
    studentId: existingStudent.studentId,
    name: existingStudent.name,
    email: existingStudent.email,
    department: existingStudent.department,
    isActive: existingStudent.isActive,
    isMigrated: existingStudent.isMigrated,
  });

  if (existingStudent.isActive !== 1) {
    throw new Error(`FAIL: Expected existingStudent.isActive to be 1, got ${existingStudent.isActive}`);
  }
  if (existingStudent.isMigrated !== 1) {
    throw new Error(`FAIL: Expected existingStudent.isMigrated to be 1, got ${existingStudent.isMigrated}`);
  }
  console.log('✅ PASS: Existing student has isActive = 1 and isMigrated = 1.');

  // Test 3: Create Normal New Student (Non-migrated)
  console.log('\n--- Test 3: Creating Normal New Student ---');
  const testRegnum = `TESTREG${Date.now().toString().slice(-6)}`;
  const testEmail = `normal_${Date.now()}@test.com`;
  const createdStudent = await userRepository.createUser({
    name: 'Normal Test Student',
    email: testEmail,
    regnum: testRegnum,
    role: 'student',
    department: 'Civil Engineering',
    year: 'Second Year',
    password: 'Password@123',
  });
  console.log('Created normal student:', {
    studentId: createdStudent.studentId,
    name: createdStudent.name,
    isActive: createdStudent.isActive,
    isMigrated: createdStudent.isMigrated,
  });

  if (createdStudent.isActive !== 1) {
    throw new Error(`FAIL: Expected createdStudent.isActive to be 1, got ${createdStudent.isActive}`);
  }
  if (createdStudent.isMigrated !== 0) {
    throw new Error(`FAIL: Expected normal new student to have isMigrated = 0, got ${createdStudent.isMigrated}`);
  }
  console.log('✅ PASS: Normal new student has isActive = 1 and isMigrated = 0.');

  // Test 4: Update Student Active status
  console.log('\n--- Test 4: Updating Student Active Status ---');
  const updatedStudent = await userRepository.updateUser(createdStudent.studentId, {
    isActive: 0,
  });
  console.log('Updated student (deactivated):', {
    studentId: updatedStudent.studentId,
    isActive: updatedStudent.isActive,
    isMigrated: updatedStudent.isMigrated,
  });
  if (updatedStudent.isActive !== 0) {
    throw new Error(`FAIL: Expected updatedStudent.isActive to be 0, got ${updatedStudent.isActive}`);
  }
  console.log('✅ PASS: Student can be deactivated (isActive = 0).');

  // Test 5: Bulk Excel Import (Migrated Students)
  console.log('\n--- Test 5: Bulk Excel Upload (Migrated Students) ---');
  const bulkRows = [
    {
      'Student Name': 'Arun Kumar',
      'Reg Num': '8208E23MER091',
      'Email': `bulk_arun_${Date.now()}@example.com`,
      'Department': 'Mechanical Engineering',
      'Year': 'Third Year',
      'Batch': '2023-2027',
      'Phone': '9876543210',
    },
    {
      'Student Name': 'Priya Sharma',
      'Reg Num': '8208E23CER092',
      'Email': `bulk_priya_${Date.now()}@example.com`,
      'Department': 'Civil Engineering',
      'Year': 'Final Year',
      'Batch': '2022-2026',
      'Phone': '9876543211',
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(bulkRows);
  XLSX.utils.book_append_sheet(wb, ws, 'Students');
  const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  const valRes = await bulkStudentService.validateStudentExcelBuffer(excelBuffer);
  if (!valRes.valid) {
    throw new Error(`FAIL: Bulk validation failed: ${JSON.stringify(valRes.errors)}`);
  }
  console.log(`Validated ${valRes.validCount} bulk students.`);

  const insertRes = await bulkStudentService.insertBulkStudents(valRes.validStudents);
  console.log(`Successfully inserted ${insertRes.insertedCount} bulk students.`);

  for (const s of insertRes.students) {
    const fetched = await userRepository.findUserById(s.studentId);
    console.log(`Bulk student ${s.studentId}: isActive = ${fetched.isActive}, isMigrated = ${fetched.isMigrated}`);
    if (fetched.isActive !== 1) {
      throw new Error(`FAIL: Bulk student ${s.studentId} expected isActive = 1, got ${fetched.isActive}`);
    }
    if (fetched.isMigrated !== 1) {
      throw new Error(`FAIL: Bulk student ${s.studentId} expected isMigrated = 1, got ${fetched.isMigrated}`);
    }
  }
  console.log('✅ PASS: Bulk uploaded students have isActive = 1 and isMigrated = 1.');

  // Clean up test created records
  console.log('\n--- Cleaning up temporary test records ---');
  await userRepository.deleteUser(createdStudent.studentId);
  for (const s of insertRes.students) {
    await userRepository.deleteUser(s.studentId);
  }
  console.log('✅ Cleanup complete.');

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 100% Verified.');
  process.exit(0);
}

test().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
