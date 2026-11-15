const { getPool, sql } = require('../config/db')
const userRepo = require('../repositories/userRepository')
const departmentRepo = require('../repositories/departmentRepository')
const yearRepo = require('../repositories/yearRepository')

async function runComprehensiveTests() {
  console.log('🧪 Starting Redesigned DB Tests (Departments, Years, Students Schema)...\n')

  try {
    // 1. Verify Departments Table
    console.log('--- TEST 1: Verify Departments Table ---')
    const depts = await departmentRepo.getAllDepartments()
    console.log(`✅ Loaded ${depts.length} departments:`)
    const csDept = depts.find(d => d.name === 'Computer Science and Engineering')
    console.log(`   Found CSE Department: ID=${csDept.id}, Code=${csDept.code}, Prefix=${csDept.prefixCode}`)
    if (csDept.prefixCode !== 'CSR') throw new Error('Expected CSE prefix to be CSR')

    // 2. Verify Years Table & Seed Data
    console.log('\n--- TEST 2: Verify Years Table & Seed Data ---')
    const years = await yearRepo.getAllYears()
    console.log(`✅ Loaded ${years.length} Academic Years:`)
    years.forEach(y => console.log(`   Year ${y.number}: [ID=${y.id}] ${y.name} (${y.code})`))
    if (years.length < 4) throw new Error('Expected at least 4 academic years (1st, 2nd, 3rd, Final/Last Year)')

    const resolvedFirstYear = await yearRepo.resolveYearId('first year')
    const resolvedLastYear = await yearRepo.resolveYearId('last year')
    console.log(`   Resolved 'first year' -> ID: ${resolvedFirstYear}`)
    console.log(`   Resolved 'last year'  -> ID: ${resolvedLastYear}`)
    if (!resolvedFirstYear || !resolvedLastYear) throw new Error('Failed to resolve year aliases')

    // 3. Test Student Unique ID Generator for Computer Science
    console.log('\n--- TEST 3: Unique ID Generation for Computer Science ---')
    const genResult1 = await departmentRepo.generateStudentUniqueId(csDept.id)
    console.log('   Preview unique ID for CSE:', genResult1.studentUniqueId)
    if (!genResult1.studentUniqueId.startsWith('CSR')) throw new Error('Unique ID must start with CSR')

    // 4. Create First Computer Science Student (First Year)
    console.log('\n--- TEST 4: Create Student 1 in Computer Science (First Year) ---')
    const student1 = await userRepo.createUser({
      name: 'Alice Cooper',
      email: 'alice.cse@test.edu',
      password: 'password123',
      regnum: '8208E23CSR011',
      role: 'student',
      department: 'Computer Science and Engineering',
      year: 'First Year',
      batch: '2023-2027',
      semester: 1,
      phone: '9876543210'
    })
    console.log(`✅ Created Student 1:`)
    console.log(`   UserId: ${student1.id}`)
    console.log(`   StudentId: ${student1.studentId}`)
    console.log(`   Name: ${student1.name}`)
    console.log(`   Department: ${student1.department} (ID: ${student1.departmentId})`)
    console.log(`   Regnum: ${student1.regnum}`)
    console.log(`   StudentRefId: ${student1.studentRefId}`)
    console.log(`   Year: ${student1.yearName} (ID: ${student1.yearId})`)

    if (student1.yearName !== 'First Year') throw new Error('Expected student1 to be First Year')

    // 5. Create Second Student (Second Year)
    console.log('\n--- TEST 5: Create Student 2 in Computer Science (Second Year) ---')
    const student2 = await userRepo.createUser({
      name: 'Bob Marley',
      email: 'bob.cse@test.edu',
      password: 'password123',
      regnum: '8208E23CSR012',
      role: 'student',
      department: 'Computer Science and Engineering',
      year: 'Second Year',
      batch: '2023-2027',
      semester: 3,
      phone: '9876543211'
    })
    console.log(`✅ Created Student 2:`)
    console.log(`   UserId: ${student2.id}`)
    console.log(`   StudentRefId: ${student2.studentRefId}`)
    console.log(`   Year: ${student2.yearName} (ID: ${student2.yearId})`)

    if (student2.yearName !== 'Second Year') throw new Error('Expected student2 to be Second Year')

    // 6. Create Third Student (Final Year / Last Year)
    console.log('\n--- TEST 6: Create Student 3 in Computer Science (Last Year / Final Year) ---')
    const student3 = await userRepo.createUser({
      name: 'Charlie Chaplin',
      email: 'charlie.cse@test.edu',
      password: 'password123',
      regnum: '8208E23CSR013',
      role: 'student',
      department: 'Computer Science and Engineering',
      year: 'last year',
      batch: '2021-2025',
      semester: 7,
      phone: '9876543212'
    })
    console.log(`✅ Created Student 3:`)
    console.log(`   UserId: ${student3.id}`)
    console.log(`   StudentRefId: ${student3.studentRefId}`)
    console.log(`   Year: ${student3.yearName} (ID: ${student3.yearId})`)

    if (student3.yearName !== 'Final Year') throw new Error('Expected student3 to be Final Year')

    // 7. Verify All Requested Columns directly in Students table in SQL Server
    console.log('\n--- TEST 7: Verify Requested Columns in Students Table ---')
    const pool = await getPool()
    const studentRow = await pool.request()
      .input('UserId', sql.Int, student1.id)
      .query(`
        SELECT 
          StudentId, StudentRefId, Name, Regnum, DeptId, Email, Password, Phone, YearId,
          UserId, DepartmentId, StudentUniqueId, Batch, Semester
        FROM Students 
        WHERE UserId = @UserId
      `)
    const rawStudent = studentRow.recordset[0]
    console.log('   Raw Students table row from SQL Server:')
    console.table([rawStudent])

    // Verify each column exists and is populated
    if (!rawStudent.StudentId) throw new Error('Missing StudentId in Students table')
    if (!rawStudent.StudentRefId) throw new Error('Missing StudentRefId in Students table')
    if (!rawStudent.Name) throw new Error('Missing Name in Students table')
    if (!rawStudent.Regnum) throw new Error('Missing Regnum in Students table')
    if (!rawStudent.DeptId) throw new Error('Missing DeptId in Students table')
    if (!rawStudent.Email) throw new Error('Missing Email in Students table')
    if (!rawStudent.Password) throw new Error('Missing Password in Students table')
    if (rawStudent.Phone === undefined || rawStudent.Phone === null) throw new Error('Missing Phone in Students table')
    if (!rawStudent.YearId) throw new Error('Missing YearId in Students table')

    console.log('✅ ALL requested columns verified in Students table:')
    console.log('   ✓ StudentId')
    console.log('   ✓ StudentRefId')
    console.log('   ✓ Name')
    console.log('   ✓ Regnum')
    console.log('   ✓ DeptId')
    console.log('   ✓ Email')
    console.log('   ✓ Password')
    console.log('   ✓ Phone')
    console.log('   ✓ YearId')

    // 8. Lookup by StudentRefId
    console.log('\n--- TEST 8: Lookup by StudentRefId ---')
    const foundByRef = await userRepo.findStudentByRefId(student1.studentRefId)
    console.log(`   Lookup by RefId [${student1.studentRefId}]: Found ${foundByRef.name}, Year: ${foundByRef.yearName}`)
    if (foundByRef.id !== student1.id) throw new Error('Lookup by StudentRefId failed')

    // 9. Filter Students by Year
    console.log('\n--- TEST 9: Filter Students by Year ---')
    const firstYearStudents = await userRepo.getAllUsers({ role: 'student', year: 'First Year' })
    console.log(`   First Year students count: ${firstYearStudents.length}`)
    const finalYearStudents = await userRepo.getAllUsers({ role: 'student', year: 'Final Year' })
    console.log(`   Final Year students count: ${finalYearStudents.length}`)

    // 10. Update Student Year
    console.log('\n--- TEST 10: Update Student Year ---')
    const updatedStudent = await userRepo.updateUser(student1.id, { year: 'Second Year' })
    console.log(`   Updated student 1 year to: ${updatedStudent.yearName} (ID: ${updatedStudent.yearId})`)
    if (updatedStudent.yearName !== 'Second Year') throw new Error('Update student year failed')

    // 11. Clean Up Test Data
    console.log('\n--- TEST 11: Cleanup Test Data ---')
    await userRepo.deleteUser(student1.id)
    await userRepo.deleteUser(student2.id)
    await userRepo.deleteUser(student3.id)
    console.log('✅ Cleaned up test students successfully')

    console.log('\n🎉 ALL TESTS PASSED! Database redesign for Years and Students is 100% verified!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Test failed with error:', err)
    process.exit(1)
  }
}

runComprehensiveTests()
