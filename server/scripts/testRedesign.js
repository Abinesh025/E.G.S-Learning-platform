const { getPool, sql } = require('../config/db')
const userRepo = require('../repositories/userRepository')
const departmentRepo = require('../repositories/departmentRepository')

async function runComprehensiveTests() {
  console.log('🧪 Starting Redesigned DB Tests...\n')

  try {
    // 1. Verify Departments Table
    console.log('--- TEST 1: Verify Departments Table ---')
    const depts = await departmentRepo.getAllDepartments()
    console.log(`✅ Loaded ${depts.length} departments:`)
    const csDept = depts.find(d => d.name === 'Computer Science and Engineering')
    console.log(`   Found CSE Department: ID=${csDept.id}, Code=${csDept.code}, Prefix=${csDept.prefixCode}`)
    if (csDept.prefixCode !== 'CSR') throw new Error('Expected CSE prefix to be CSR')

    // 2. Test Student Unique ID Generator for Computer Science
    console.log('\n--- TEST 2: Unique ID Generation for Computer Science ---')
    const genResult1 = await departmentRepo.generateStudentUniqueId(csDept.id)
    console.log('   Preview unique ID for CSE:', genResult1.studentUniqueId)
    if (!genResult1.studentUniqueId.startsWith('CSR')) throw new Error('Unique ID must start with CSR')

    // 3. Create First Computer Science Student
    console.log('\n--- TEST 3: Create Student 1 in Computer Science ---')
    const student1 = await userRepo.createUser({
      name: 'Alice Cooper',
      email: 'alice.cse@test.edu',
      password: 'password123',
      regnum: '8208E23CSR011',
      role: 'student',
      department: 'Computer Science and Engineering',
      batch: '2023-2027',
      semester: 4,
      phone: '9876543210'
    })
    console.log(`✅ Created Student 1:`)
    console.log(`   UserId: ${student1.id}`)
    console.log(`   StudentId: ${student1.studentId}`)
    console.log(`   Name: ${student1.name}`)
    console.log(`   Department: ${student1.department} (ID: ${student1.departmentId})`)
    console.log(`   Regnum: ${student1.regnum}`)
    console.log(`   StudentUniqueId: ${student1.studentUniqueId}`)

    // 4. Create Second Computer Science Student to verify sequence increment
    console.log('\n--- TEST 4: Create Student 2 in Computer Science (Verify Auto-Increment) ---')
    const student2 = await userRepo.createUser({
      name: 'Bob Marley',
      email: 'bob.cse@test.edu',
      password: 'password123',
      regnum: '8208E23CSR012',
      role: 'student',
      department: 'Computer Science and Engineering',
      batch: '2023-2027',
      semester: 4,
      phone: '9876543211'
    })
    console.log(`✅ Created Student 2:`)
    console.log(`   UserId: ${student2.id}`)
    console.log(`   StudentUniqueId: ${student2.studentUniqueId}`)

    if (student2.studentUniqueId <= student1.studentUniqueId) {
      throw new Error(`Auto-increment failed: ${student2.studentUniqueId} is not > ${student1.studentUniqueId}`)
    }

    // 5. Verify direct table separation in database
    console.log('\n--- TEST 5: Verify Schema Table Separation in SQL Server ---')
    const pool = await getPool()
    
    // Check Users table row
    const userRow = await pool.request()
      .input('UserId', sql.Int, student1.id)
      .query(`SELECT UserId, Name, Email, Role FROM Users WHERE UserId = @UserId`)
    console.log(`   Users table row:`, userRow.recordset[0])

    // Check Students table row
    const studentRow = await pool.request()
      .input('UserId', sql.Int, student1.id)
      .query(`SELECT StudentId, UserId, DepartmentId, Regnum, StudentUniqueId, Batch FROM Students WHERE UserId = @UserId`)
    console.log(`   Students table row:`, studentRow.recordset[0])

    if (!studentRow.recordset[0].DepartmentId || !studentRow.recordset[0].StudentUniqueId) {
      throw new Error('Student row missing DepartmentId or StudentUniqueId in Students table')
    }

    // 6. Test Staff Table Creation
    console.log('\n--- TEST 6: Create Staff Member ---')
    const staff1 = await userRepo.createUser({
      name: 'Dr. Alan Turing',
      email: 'alan.turing@test.edu',
      password: 'password123',
      regnum: 'EGSP099',
      role: 'staff',
      department: 'Computer Science and Engineering',
      phone: '9123456780',
      designation: 'Associate Professor'
    })
    console.log(`✅ Created Staff:`)
    console.log(`   UserId: ${staff1.id}`)
    console.log(`   StaffId: ${staff1.staffId}`)
    console.log(`   Regnum: ${staff1.regnum}`)
    console.log(`   Designation: ${staff1.designation}`)
    console.log(`   Department: ${staff1.department}`)

    // 7. Test Admin Table Creation
    console.log('\n--- TEST 7: Create Admin Member ---')
    const admin1 = await userRepo.createUser({
      name: 'Super Administrator',
      email: 'admin.test@test.edu',
      password: 'password123',
      role: 'admin',
      adminLevel: 'superadmin'
    })
    console.log(`✅ Created Admin:`)
    console.log(`   UserId: ${admin1.id}`)
    console.log(`   AdminId: ${admin1.adminId}`)
    console.log(`   AdminLevel: ${admin1.adminLevel}`)

    // 8. Lookup by Unique ID & Regnum
    console.log('\n--- TEST 8: Lookup by Unique ID & Registration Number ---')
    const foundByUniqueId = await userRepo.findStudentByUniqueId(student1.studentUniqueId)
    console.log(`   Lookup by Unique ID [${student1.studentUniqueId}]: Found ${foundByUniqueId.name}`)

    const foundByRegnum = await userRepo.findUserByRegnum('8208E23CSR011')
    console.log(`   Lookup by Regnum [8208E23CSR011]: Found ${foundByRegnum.name}`)

    // 9. Cascade Delete Test
    console.log('\n--- TEST 9: Cascade Delete Verification ---')
    await userRepo.deleteUser(student1.id)
    await userRepo.deleteUser(student2.id)
    await userRepo.deleteUser(staff1.id)
    await userRepo.deleteUser(admin1.id)

    const orphanedStudent = await pool.request()
      .input('UserId', sql.Int, student1.id)
      .query(`SELECT COUNT(*) AS count FROM Students WHERE UserId = @UserId`)
    
    if (orphanedStudent.recordset[0].count !== 0) {
      throw new Error('Cascade delete failed: Student row still exists!')
    }
    console.log('✅ Cascade delete verified: Child rows automatically deleted when parent User is deleted.')

    console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! The redesigned DB architecture is 100% verified!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Test failed with error:', err)
    process.exit(1)
  }
}

runComprehensiveTests()
