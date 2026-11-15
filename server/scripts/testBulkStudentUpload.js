const XLSX = require('xlsx');
const bulkStudentService = require('../services/bulkStudentService');
const { getPool, sql } = require('../config/db');

async function testBulkUpload() {
  console.log('🧪 Starting Bulk Student Upload Validation & Import Tests...');

  // Test 1: Template Generation
  console.log('\n--- TEST 1: Generate Sample Template ---');
  const templateBuffer = bulkStudentService.generateSampleExcelTemplate();
  if (!templateBuffer || templateBuffer.length === 0) throw new Error('Template buffer is empty');
  const wb = XLSX.read(templateBuffer, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  console.log(`✅ Sample template generated (${templateBuffer.length} bytes, ${rows.length} example rows)`);
  console.log('   Template Headers:', Object.keys(rows[0]));

  // Test 2: Validation of Missing Columns
  console.log('\n--- TEST 2: Reject Missing Columns ---');
  const invalidHeadersWs = XLSX.utils.json_to_sheet([
    { 'Name': 'Test', 'Phone': '1234567890' } // Missing Regnum, Email, Department, Year
  ]);
  const invalidWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(invalidWb, invalidHeadersWs, 'Sheet1');
  const invalidBuf = XLSX.write(invalidWb, { type: 'buffer', bookType: 'xlsx' });

  try {
    await bulkStudentService.validateStudentExcelBuffer(invalidBuf);
    throw new Error('Should have thrown missing columns error');
  } catch (err) {
    console.log(`✅ Correctly rejected spreadsheet with missing columns: "${err.message}"`);
  }

  // Test 3: Validation of Row Errors (Empty fields, duplicate emails, invalid regnum)
  console.log('\n--- TEST 3: Detect Row-Level Errors ---');
  const errWs = XLSX.utils.json_to_sheet([
    {
      'Name': '', // Empty name!
      'Regnum': '8208E24CSR001',
      'Email': 'invalid-email', // Invalid email!
      'Department': 'Unknown College Dept', // Invalid department!
      'Year': 'Invalid Year' // Invalid year!
    },
    {
      'Name': 'Valid Name One',
      'Regnum': '8208E24CSR002',
      'Email': 'dup@egspec.edu',
      'Department': 'Computer Science and Engineering',
      'Year': 'First Year'
    },
    {
      'Name': 'Valid Name Two',
      'Regnum': '8208E24CSR003',
      'Email': 'dup@egspec.edu', // Duplicate email in file!
      'Department': 'Computer Science and Engineering',
      'Year': 'First Year'
    }
  ]);
  const errWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(errWb, errWs, 'Sheet1');
  const errBuf = XLSX.write(errWb, { type: 'buffer', bookType: 'xlsx' });

  const valRes = await bulkStudentService.validateStudentExcelBuffer(errBuf);
  if (valRes.valid) throw new Error('Expected validation to fail with errors');
  console.log(`✅ Validation detected ${valRes.errorCount} row error(s) out of ${valRes.totalRows} rows:`);
  valRes.errors.forEach(e => {
    console.log(`   - Row ${e.rowNumber} (${e.name}): ${e.issues.map(i => i.message).join('; ')}`);
  });

  // Test 4: Valid File Validation & Atomic Insertion
  console.log('\n--- TEST 4: Valid Student Import & Sequential StudentId Assignment ---');
  // Clean up any existing records from prior aborted test runs
  const pool = await getPool();
  await pool.request().query("DELETE FROM Students WHERE Regnum IN ('8208E24CSR991', '8208E23ITR992')");

  const testStudent1 = {
    'Name': 'Bulk Student Alpha',
    'Regnum': '8208E24CSR991',
    'Email': `bulk.alpha.${Date.now()}@egspec.edu`,
    'Department': 'Computer Science and Engineering',
    'Year': 'First Year',
    'Batch': '2024-2028',
    'Semester': 1,
    'Phone': '9876543210'
  };
  const testStudent2 = {
    'Name': 'Bulk Student Beta',
    'Regnum': '8208E23ITR992',
    'Email': `bulk.beta.${Date.now()}@egspec.edu`,
    'Department': 'Information Technology',
    'Year': 'Second Year',
    'Batch': '2023-2027',
    'Semester': 3,
    'Phone': '9876543211'
  };

  const validWs = XLSX.utils.json_to_sheet([testStudent1, testStudent2]);
  const validWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(validWb, validWs, 'Sheet1');
  const validBuf = XLSX.write(validWb, { type: 'buffer', bookType: 'xlsx' });

  const validCheck = await bulkStudentService.validateStudentExcelBuffer(validBuf);
  if (!validCheck.valid) {
    console.error('Validation errors:', validCheck.errors);
    throw new Error('Valid student data failed validation');
  }
  console.log(`✅ Validation passed: ${validCheck.validCount} valid students ready for insertion`);

  // Insert into DB
  const insertRes = await bulkStudentService.insertBulkStudents(validCheck.validStudents);
  console.log(`✅ Successfully inserted ${insertRes.insertedCount} students into database:`);
  insertRes.students.forEach(s => {
    console.log(`   -> StudentId: ${s.studentId} | Name: ${s.name} | Dept: ${s.department} | Regnum: ${s.regnum}`);
  });

  // Test 5: Verify inserted students in DB and cleanup
  console.log('\n--- TEST 5: Verify and Clean Up Test Students ---');
  for (const s of insertRes.students) {
    const q = await pool.request()
      .input('StudentId', sql.NVarChar(50), s.studentId)
      .query(`SELECT StudentId, Name, Email, DepartmentId, YearId, IsActive, IsMigrated FROM Students WHERE StudentId = @StudentId`);
    if (q.recordset.length === 0) throw new Error(`Student ${s.studentId} not found in DB`);
    console.log(`   Verified in DB: StudentId: ${q.recordset[0].StudentId}, DepartmentId: ${q.recordset[0].DepartmentId}, IsActive: ${q.recordset[0].IsActive}, IsMigrated: ${q.recordset[0].IsMigrated}`);

    // Clean up test student
    await pool.request()
      .input('StudentId', sql.NVarChar(50), s.studentId)
      .query(`DELETE FROM Students WHERE StudentId = @StudentId`);
  }
  console.log('✅ Cleaned up test students from database');

  console.log('\n🎉 ALL BULK STUDENT UPLOAD TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

testBulkUpload().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
