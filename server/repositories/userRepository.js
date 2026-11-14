const { getPool, sql } = require('../config/db')
const departmentRepository = require('./departmentRepository')

// Helper to format user row with both lowercase and PascalCase properties for 100% frontend & backend compatibility
const formatUser = (row) => {
  if (!row) return null

  const studentUniqueId = row.StudentUniqueId || ''
  const regnum = row.StudentRegnum || row.StaffRegnum || row.Regnum || ''
  const departmentName = row.DepartmentName || row.Department || ''
  const departmentId = row.StudentDeptId || row.StaffDeptId || row.DepartmentId || null
  const batch = row.StudentBatch || row.Batch || ''
  const semester =
    row.StudentSemester !== undefined && row.StudentSemester !== null
      ? Number(row.StudentSemester)
      : row.Semester !== undefined && row.Semester !== null
      ? Number(row.Semester)
      : null

  return {
    ...row,
    // Core user identity
    _id: row.UserId,
    id: row.UserId,
    UserId: row.UserId,
    userId: row.UserId,
    name: row.Name,
    Name: row.Name,
    email: row.Email,
    Email: row.Email,
    role: row.Role,
    Role: row.Role,
    avatar: row.Avatar || '',
    Avatar: row.Avatar || '',
    phone: row.Phone || '',
    Phone: row.Phone || '',
    isActive: row.IsActive !== undefined ? Boolean(row.IsActive) : true,
    IsActive: row.IsActive !== undefined ? Boolean(row.IsActive) : true,

    // OTP security fields
    otpHash: row.OtpHash || null,
    OtpHash: row.OtpHash || null,
    otpExpiresAt: row.OtpExpiresAt || null,
    OtpExpiresAt: row.OtpExpiresAt || null,
    otpPurpose: row.OtpPurpose || null,
    OtpPurpose: row.OtpPurpose || null,
    otpVerified: Boolean(row.OtpVerified),
    OtpVerified: Boolean(row.OtpVerified),

    // Timestamps
    createdAt: row.CreatedAt,
    CreatedAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
    UpdatedAt: row.UpdatedAt,

    // Role-specific identifiers
    studentId: row.StudentId || null,
    StudentId: row.StudentId || null,
    staffId: row.StaffId || null,
    StaffId: row.StaffId || null,
    adminId: row.AdminId || null,
    AdminId: row.AdminId || null,

    // Student / Staff details
    regnum,
    Regnum: regnum,
    registerNumber: regnum,

    // Student Unique ID (e.g. CSR001, ADR001, etc.)
    studentUniqueId,
    StudentUniqueId: studentUniqueId,
    uniqueId: studentUniqueId,
    UniqueId: studentUniqueId,
    studentCode: studentUniqueId,
    StudentCode: studentUniqueId,

    // Department details
    department: departmentName,
    Department: departmentName,
    departmentName,
    DepartmentName: departmentName,
    departmentId,
    DepartmentId: departmentId,
    departmentCode: row.DepartmentCode || '',
    DepartmentCode: row.DepartmentCode || '',
    prefixCode: row.PrefixCode || '',
    PrefixCode: row.PrefixCode || '',

    // Academic details
    batch,
    Batch: batch,
    semester,
    Semester: semester,

    // Staff details
    designation: row.Designation || 'Staff',
    Designation: row.Designation || 'Staff',

    // Admin details
    adminLevel: row.AdminLevel || 'superadmin',
    AdminLevel: row.AdminLevel || 'superadmin',
  }
}

const BASE_USER_SELECT = `
  SELECT 
    u.UserId, u.Name, u.Email, u.Password, u.Role, u.Avatar, u.Phone, u.IsActive,
    u.OtpHash, u.OtpExpiresAt, u.OtpPurpose, u.OtpVerified, u.CreatedAt, u.UpdatedAt,
    s.StudentId, s.Regnum AS StudentRegnum, s.StudentUniqueId, s.Batch AS StudentBatch,
    s.Semester AS StudentSemester, s.DepartmentId AS StudentDeptId,
    st.StaffId, st.Regnum AS StaffRegnum, st.Designation, st.DepartmentId AS StaffDeptId,
    a.AdminId, a.AdminLevel,
    d.DepartmentId, d.DepartmentName, d.DepartmentCode, d.PrefixCode
  FROM Users u
  LEFT JOIN Students s ON u.UserId = s.UserId
  LEFT JOIN Staff st ON u.UserId = st.UserId
  LEFT JOIN Admins a ON u.UserId = a.UserId
  LEFT JOIN Departments d ON COALESCE(s.DepartmentId, st.DepartmentId) = d.DepartmentId
`

exports.createUser = async ({
  name,
  email,
  password,
  regnum,
  role = 'student',
  department,
  departmentId,
  phone,
  batch,
  semester,
  avatar,
  designation,
  adminLevel,
}) => {
  const pool = await getPool()
  const transaction = new sql.Transaction(pool)
  await transaction.begin()

  try {
    const userRole = (role || 'student').toLowerCase()

    // 1. Insert into Users table (only basic user authentication & identity data)
    const userReq = new sql.Request(transaction)
    const userResult = await userReq
      .input('Name', sql.NVarChar(100), name)
      .input('Email', sql.NVarChar(255), email)
      .input('Password', sql.NVarChar(255), password)
      .input('Role', sql.VarChar(10), userRole)
      .input('Avatar', sql.NVarChar(500), avatar || '')
      .input('Phone', sql.NVarChar(20), phone || '')
      .query(`
        INSERT INTO Users (Name, Email, Password, Role, Avatar, Phone, IsActive)
        OUTPUT INSERTED.UserId
        VALUES (@Name, @Email, @Password, @Role, @Avatar, @Phone, 1)
      `)

    const newUserId = userResult.recordset[0].UserId

    // 2. Resolve Department if needed
    let resolvedDeptId = departmentId ? Number(departmentId) : null
    if (!resolvedDeptId && department) {
      const deptReq = new sql.Request(transaction)
      const deptResult = await deptReq
        .input('DeptName', sql.NVarChar(100), department.trim())
        .query(`SELECT DepartmentId FROM Departments WHERE LOWER(DepartmentName) = LOWER(@DeptName)`)
      if (deptResult.recordset.length > 0) {
        resolvedDeptId = deptResult.recordset[0].DepartmentId
      }
    }

    // Fallback department for students if none matched
    if (!resolvedDeptId && userRole === 'student') {
      const defaultDeptReq = new sql.Request(transaction)
      const defaultDeptResult = await defaultDeptReq.query(`SELECT TOP 1 DepartmentId FROM Departments ORDER BY DepartmentId ASC`)
      if (defaultDeptResult.recordset.length > 0) {
        resolvedDeptId = defaultDeptResult.recordset[0].DepartmentId
      }
    }

    // 3. Insert into Role-Specific Table
    if (userRole === 'student') {
      // Generate the student's unique ID based on the Department's PrefixCode (e.g. CSR001, ADR001)
      const genReq = new sql.Request(transaction)
      const deptInfoResult = await genReq
        .input('GenDeptId', sql.Int, resolvedDeptId)
        .query(`SELECT PrefixCode FROM Departments WHERE DepartmentId = @GenDeptId`)

      const prefix = deptInfoResult.recordset[0]?.PrefixCode || 'CSR'

      const seqReq = new sql.Request(transaction)
      const seqResult = await seqReq
        .input('PrefixPattern', sql.VarChar(15), `${prefix}%`)
        .input('PrefixLen', sql.Int, prefix.length)
        .query(`
          SELECT MAX(CAST(SUBSTRING(StudentUniqueId, @PrefixLen + 1, 10) AS INT)) AS MaxSeq
          FROM Students
          WHERE StudentUniqueId LIKE @PrefixPattern
            AND ISNUMERIC(SUBSTRING(StudentUniqueId, @PrefixLen + 1, 10)) = 1
        `)

      const nextSeq = (seqResult.recordset[0]?.MaxSeq || 0) + 1
      const studentUniqueId = `${prefix}${String(nextSeq).padStart(3, '0')}`

      const normalizedRegnum = (regnum && regnum.trim()) || `REG-${newUserId}`

      const studentReq = new sql.Request(transaction)
      await studentReq
        .input('UserId', sql.Int, newUserId)
        .input('DepartmentId', sql.Int, resolvedDeptId)
        .input('Regnum', sql.NVarChar(50), normalizedRegnum)
        .input('StudentUniqueId', sql.NVarChar(50), studentUniqueId)
        .input('Batch', sql.NVarChar(20), batch || '')
        .input('Semester', sql.TinyInt, semester ? Number(semester) : null)
        .query(`
          INSERT INTO Students (UserId, DepartmentId, Regnum, StudentUniqueId, Batch, Semester)
          VALUES (@UserId, @DepartmentId, @Regnum, @StudentUniqueId, @Batch, @Semester)
        `)
    } else if (userRole === 'staff') {
      const normalizedRegnum = (regnum && regnum.trim()) || `EGSP${String(newUserId).padStart(3, '0')}`
      const staffReq = new sql.Request(transaction)
      await staffReq
        .input('UserId', sql.Int, newUserId)
        .input('DepartmentId', sql.Int, resolvedDeptId)
        .input('Regnum', sql.NVarChar(50), normalizedRegnum)
        .input('Designation', sql.NVarChar(100), designation || 'Staff')
        .query(`
          INSERT INTO Staff (UserId, DepartmentId, Regnum, Designation)
          VALUES (@UserId, @DepartmentId, @Regnum, @Designation)
        `)
    } else if (userRole === 'admin') {
      const adminReq = new sql.Request(transaction)
      await adminReq
        .input('UserId', sql.Int, newUserId)
        .input('AdminLevel', sql.NVarChar(50), adminLevel || 'superadmin')
        .query(`
          INSERT INTO Admins (UserId, AdminLevel)
          VALUES (@UserId, @AdminLevel)
        `)
    }

    await transaction.commit()

    // Retrieve and return fully hydrated user
    return await exports.findUserById(newUserId)
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

exports.findUserByEmail = async (email) => {
  if (!email) return null
  const pool = await getPool()
  const result = await pool.request()
    .input('Email', sql.NVarChar(255), email.trim().toLowerCase())
    .query(`
      ${BASE_USER_SELECT}
      WHERE LOWER(u.Email) = @Email
    `)
  return formatUser(result.recordset[0])
}

exports.findUserById = async (userId) => {
  if (!userId) return null
  const pool = await getPool()
  const result = await pool.request()
    .input('UserId', sql.Int, Number(userId))
    .query(`
      ${BASE_USER_SELECT}
      WHERE u.UserId = @UserId
    `)
  return formatUser(result.recordset[0])
}

exports.findUserByRegnum = async (regnum) => {
  if (!regnum) return null
  const normalized = regnum.trim().toUpperCase()
  const pool = await getPool()
  const result = await pool.request()
    .input('Regnum', sql.NVarChar(50), normalized)
    .query(`
      ${BASE_USER_SELECT}
      WHERE UPPER(s.Regnum) = @Regnum 
         OR UPPER(st.Regnum) = @Regnum
         OR UPPER(s.StudentUniqueId) = @Regnum
    `)
  return formatUser(result.recordset[0])
}

exports.findStudentByUniqueId = async (studentUniqueId) => {
  if (!studentUniqueId) return null
  const normalized = studentUniqueId.trim().toUpperCase()
  const pool = await getPool()
  const result = await pool.request()
    .input('UniqueId', sql.NVarChar(50), normalized)
    .query(`
      ${BASE_USER_SELECT}
      WHERE UPPER(s.StudentUniqueId) = @UniqueId
    `)
  return formatUser(result.recordset[0])
}

exports.updateUser = async (userId, fields) => {
  const pool = await getPool()
  const transaction = new sql.Transaction(pool)
  await transaction.begin()

  try {
    const userReq = new sql.Request(transaction).input('UserId', sql.Int, Number(userId))
    const userSetClauses = []

    if (fields.name !== undefined) {
      userReq.input('Name', sql.NVarChar(100), fields.name)
      userSetClauses.push('Name = @Name')
    }
    if (fields.email !== undefined) {
      userReq.input('Email', sql.NVarChar(255), fields.email)
      userSetClauses.push('Email = @Email')
    }
    if (fields.password !== undefined) {
      userReq.input('Password', sql.NVarChar(255), fields.password)
      userSetClauses.push('Password = @Password')
    }
    if (fields.phone !== undefined) {
      userReq.input('Phone', sql.NVarChar(20), fields.phone)
      userSetClauses.push('Phone = @Phone')
    }
    if (fields.avatar !== undefined) {
      userReq.input('Avatar', sql.NVarChar(500), fields.avatar)
      userSetClauses.push('Avatar = @Avatar')
    }
    if (fields.isActive !== undefined) {
      userReq.input('IsActive', sql.Bit, fields.isActive ? 1 : 0)
      userSetClauses.push('IsActive = @IsActive')
    }

    if (userSetClauses.length > 0) {
      userSetClauses.push('UpdatedAt = SYSUTCDATETIME()')
      await userReq.query(`
        UPDATE Users
        SET ${userSetClauses.join(', ')}
        WHERE UserId = @UserId
      `)
    }

    // Resolve Department if updated
    let resolvedDeptId = fields.departmentId ? Number(fields.departmentId) : undefined
    if (resolvedDeptId === undefined && fields.department) {
      const deptReq = new sql.Request(transaction)
      const deptRes = await deptReq
        .input('DeptName', sql.NVarChar(100), fields.department.trim())
        .query(`SELECT DepartmentId FROM Departments WHERE LOWER(DepartmentName) = LOWER(@DeptName)`)
      if (deptRes.recordset.length > 0) {
        resolvedDeptId = deptRes.recordset[0].DepartmentId
      }
    }

    // Update Students table if user is a student
    const studentCheck = await new sql.Request(transaction)
      .input('UserId', sql.Int, Number(userId))
      .query(`SELECT StudentId FROM Students WHERE UserId = @UserId`)

    if (studentCheck.recordset.length > 0) {
      const studentReq = new sql.Request(transaction).input('UserId', sql.Int, Number(userId))
      const studentSet = []

      if (resolvedDeptId !== undefined) {
        studentReq.input('DepartmentId', sql.Int, resolvedDeptId)
        studentSet.push('DepartmentId = @DepartmentId')
      }
      if (fields.regnum !== undefined) {
        studentReq.input('Regnum', sql.NVarChar(50), fields.regnum.trim().toUpperCase())
        studentSet.push('Regnum = @Regnum')
      }
      if (fields.batch !== undefined) {
        studentReq.input('Batch', sql.NVarChar(20), fields.batch)
        studentSet.push('Batch = @Batch')
      }
      if (fields.semester !== undefined) {
        studentReq.input('Semester', sql.TinyInt, fields.semester ? Number(fields.semester) : null)
        studentSet.push('Semester = @Semester')
      }

      if (studentSet.length > 0) {
        studentSet.push('UpdatedAt = SYSUTCDATETIME()')
        await studentReq.query(`
          UPDATE Students
          SET ${studentSet.join(', ')}
          WHERE UserId = @UserId
        `)
      }
    }

    // Update Staff table if user is staff
    const staffCheck = await new sql.Request(transaction)
      .input('UserId', sql.Int, Number(userId))
      .query(`SELECT StaffId FROM Staff WHERE UserId = @UserId`)

    if (staffCheck.recordset.length > 0) {
      const staffReq = new sql.Request(transaction).input('UserId', sql.Int, Number(userId))
      const staffSet = []

      if (resolvedDeptId !== undefined) {
        staffReq.input('DepartmentId', sql.Int, resolvedDeptId)
        staffSet.push('DepartmentId = @DepartmentId')
      }
      if (fields.regnum !== undefined) {
        staffReq.input('Regnum', sql.NVarChar(50), fields.regnum.trim().toUpperCase())
        staffSet.push('Regnum = @Regnum')
      }
      if (fields.designation !== undefined) {
        staffReq.input('Designation', sql.NVarChar(100), fields.designation)
        staffSet.push('Designation = @Designation')
      }

      if (staffSet.length > 0) {
        staffSet.push('UpdatedAt = SYSUTCDATETIME()')
        await staffReq.query(`
          UPDATE Staff
          SET ${staffSet.join(', ')}
          WHERE UserId = @UserId
        `)
      }
    }

    await transaction.commit()
    return await exports.findUserById(userId)
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

exports.updateOtp = async (userId, { otpHash, otpExpiresAt, otpPurpose, otpVerified }) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('UserId', sql.Int, Number(userId))
    .input('OtpHash', sql.NVarChar(255), otpHash || null)
    .input('OtpExpiresAt', sql.DateTime2, otpExpiresAt || null)
    .input('OtpPurpose', sql.VarChar(20), otpPurpose || null)
    .input('OtpVerified', sql.Bit, otpVerified ? 1 : 0)
    .query(`
      UPDATE Users 
      SET OtpHash = @OtpHash,
          OtpExpiresAt = @OtpExpiresAt,
          OtpPurpose = @OtpPurpose,
          OtpVerified = @OtpVerified,
          UpdatedAt = SYSUTCDATETIME()
      WHERE UserId = @UserId
    `)
  return await exports.findUserById(userId)
}

exports.getAllUsers = async ({ role, department, departmentId, search, isActive } = {}) => {
  const pool = await getPool()
  const request = pool.request()
  const conditions = []

  if (role) {
    request.input('Role', sql.VarChar(10), role.toLowerCase())
    conditions.push('u.Role = @Role')
  }
  if (departmentId) {
    request.input('DeptId', sql.Int, Number(departmentId))
    conditions.push('d.DepartmentId = @DeptId')
  } else if (department) {
    request.input('Department', sql.NVarChar(100), department.trim())
    conditions.push('LOWER(d.DepartmentName) = LOWER(@Department)')
  }
  if (isActive !== undefined) {
    request.input('IsActive', sql.Bit, isActive ? 1 : 0)
    conditions.push('u.IsActive = @IsActive')
  }
  if (search) {
    request.input('Search', sql.NVarChar(100), `%${search.trim()}%`)
    conditions.push(`
      (u.Name LIKE @Search 
       OR u.Email LIKE @Search 
       OR s.Regnum LIKE @Search 
       OR s.StudentUniqueId LIKE @Search 
       OR st.Regnum LIKE @Search)
    `)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await request.query(`
    ${BASE_USER_SELECT}
    ${whereClause}
    ORDER BY u.CreatedAt DESC
  `)
  return result.recordset.map(formatUser)
}

exports.deleteUser = async (userId) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('UserId', sql.Int, Number(userId))
    .query(`DELETE FROM Users WHERE UserId = @UserId`)
  return result.rowsAffected[0] > 0
}

exports.formatUser = formatUser
