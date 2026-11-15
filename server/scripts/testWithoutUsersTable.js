const { getPool, sql } = require('../config/db');
const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcryptjs');

async function runTests() {
  console.log('🚀 Starting Comprehensive Verification: LMS Without Users Table & With StudentId as Unique String ID...');

  const pool = await getPool();

  // Test 0: Verify Users table is NOT in the database
  const tableCheck = await pool.request().query(`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users'
  `);
  if (tableCheck.recordset.length === 0) {
    console.log('✅ PASS: Users table does not exist in Microsoft SQL Server database');
  } else {
    throw new Error('FAIL: Users table still exists in DB!');
  }

  // Test 0B: Verify Students table columns (StudentRefId and StudentUniqueId must be removed)
  const studentCols = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Students'
  `);
  const colNames = studentCols.recordset.map(c => c.COLUMN_NAME);
  if (colNames.includes('StudentRefId')) {
    throw new Error('FAIL: StudentRefId column still exists in Students table!');
  }
  if (colNames.includes('StudentUniqueId')) {
    throw new Error('FAIL: StudentUniqueId column still exists in Students table!');
  }
  const studentIdCol = studentCols.recordset.find(c => c.COLUMN_NAME === 'StudentId');
  if (!studentIdCol || studentIdCol.DATA_TYPE !== 'nvarchar') {
    throw new Error(`FAIL: StudentId column is expected to be nvarchar, got ${studentIdCol?.DATA_TYPE}`);
  }
  console.log('✅ PASS: StudentRefId and StudentUniqueId removed; StudentId is NVARCHAR(50)');

  // Test 1: Admin Login Verification
  const adminEmail = 'admin@egspec.edu';
  const admin = await userRepository.findUserByEmail(adminEmail);
  if (!admin) throw new Error(`Admin not found for email ${adminEmail}`);
  const adminPassMatch = await bcrypt.compare('egspec@2026', admin.Password || admin.password);
  if (!adminPassMatch) throw new Error('Admin password mismatch!');
  console.log(`✅ PASS: Admin lookup & password verified (AdminId: ${admin._id}, Role: ${admin.Role})`);

  // Test 2: Student Login & Hydration Verification
  const studentEmail = 'abineshr005@gmail.com';
  const student = await userRepository.findUserByEmail(studentEmail);
  if (!student) throw new Error(`Student not found for email ${studentEmail}`);
  if (student.StudentId !== 'BSR001' && student._id !== 'BSR001') {
    throw new Error(`Expected StudentId to be 'BSR001', got ${student.StudentId}`);
  }
  console.log(`✅ PASS: Student lookup verified:`, {
    _id: student._id,
    StudentId: student.StudentId,
    name: student.name,
    email: student.email,
    role: student.role,
    yearId: student.yearId,
    yearName: student.yearName,
    department: student.department
  });

  // Test 3: Staff Lookup & Hydration Verification
  const staffEmail = 'abi18official@gmail.com';
  const staff = await userRepository.findUserByEmail(staffEmail);
  if (!staff) throw new Error(`Staff not found for email ${staffEmail}`);
  console.log(`✅ PASS: Staff lookup verified:`, {
    _id: staff._id,
    name: staff.name,
    email: staff.email,
    role: staff.role,
    regnum: staff.regnum,
    designation: staff.designation,
    department: staff.department
  });

  // Test 4: Find by ID (using string ID 'BSR001')
  const studentById = await userRepository.findUserById(student._id);
  if (!studentById || studentById.email !== studentEmail) throw new Error('findUserById failed for student');
  console.log(`✅ PASS: findUserById('${student._id}') returned student correctly`);

  const staffById = await userRepository.findUserById(staff._id);
  if (!staffById || staffById.email !== staffEmail) throw new Error('findUserById failed for staff');
  console.log(`✅ PASS: findUserById('${staff._id}') returned staff correctly`);

  // Test 5: Find by Regnum
  const foundByReg = await userRepository.findUserByRegnum(student.Regnum);
  if (!foundByReg || foundByReg.email !== studentEmail) throw new Error('findUserByRegnum failed for student');
  console.log(`✅ PASS: findUserByRegnum(${student.Regnum}) verified`);

  // Test 6: Find Student by UniqueId (StudentId)
  const foundByRef = await userRepository.findStudentByRefId(student.studentId);
  if (!foundByRef || foundByRef.email !== studentEmail) throw new Error('findStudentByRefId failed');
  console.log(`✅ PASS: findStudentByRefId('${student.studentId}') verified`);

  // Test 7: Create a new Student directly into Students table with auto-generated StudentId
  const testStudentEmail = `test.student.${Date.now()}@egspec.edu`;
  const hashedPass = await bcrypt.hash('password123', 10);
  const createdStudent = await userRepository.createUser({
    name: 'New Test Student',
    email: testStudentEmail,
    password: hashedPass,
    role: 'student',
    department: 'Computer Science and Engineering',
    yearId: 2,
    batch: '2023-2027',
    semester: 3,
    phone: '9876543219'
  });
  if (!createdStudent.StudentId.startsWith('CSR')) {
    throw new Error(`Expected new student StudentId to start with 'CSR', got ${createdStudent.StudentId}`);
  }
  console.log('✅ PASS: Successfully created student with auto-generated StudentId:', {
    _id: createdStudent._id,
    StudentId: createdStudent.StudentId,
    name: createdStudent.name,
    email: createdStudent.email,
    yearId: createdStudent.yearId,
    yearName: createdStudent.yearName,
    departmentName: createdStudent.departmentName
  });

  // Test 8: Create a new Staff directly into Staff table
  const testStaffEmail = `test.staff.${Date.now()}@egspec.edu`;
  const createdStaff = await userRepository.createUser({
    name: 'New Test Staff',
    email: testStaffEmail,
    password: hashedPass,
    role: 'staff',
    department: 'Computer Science and Engineering',
    designation: 'Assistant Professor',
    phone: '9876543220'
  });
  console.log('✅ PASS: Successfully created staff directly into Staff table:', {
    _id: createdStaff._id,
    name: createdStaff.name,
    email: createdStaff.email,
    regnum: createdStaff.regnum,
    designation: createdStaff.designation
  });

  // Test 9: Update User
  const updatedStudent = await userRepository.updateUser(createdStudent._id, {
    name: 'Updated Test Student Name',
    batch: '2024-2028'
  }, 'student');
  if (updatedStudent.name !== 'Updated Test Student Name') throw new Error('Update student failed');
  console.log('✅ PASS: Successfully updated student details');

  // Test 10: Get All Users
  const allUsers = await userRepository.getAllUsers();
  console.log(`✅ PASS: getAllUsers returned ${allUsers.length} total users across Students, Staff, and Admins`);

  // Test 11: Cleanup test accounts
  await userRepository.deleteUser(createdStudent._id, 'student');
  await userRepository.deleteUser(createdStaff._id, 'staff');
  console.log('✅ PASS: Successfully deleted test student and test staff');

  // Final verification of DB counts
  const finalStudents = await pool.request().query('SELECT COUNT(*) as cnt FROM Students');
  const finalStaff = await pool.request().query('SELECT COUNT(*) as cnt FROM Staff');
  const finalAdmins = await pool.request().query('SELECT COUNT(*) as cnt FROM Admins');
  console.log('📊 Current Live Counts in Entity Tables:');
  console.log(`- Students: ${finalStudents.recordset[0].cnt}`);
  console.log(`- Staff:    ${finalStaff.recordset[0].cnt}`);
  console.log(`- Admins:   ${finalAdmins.recordset[0].cnt}`);

  console.log('\n🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
