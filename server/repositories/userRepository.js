const { getPool, sql } = require('../config/db')
const departmentRepository = require('./departmentRepository')
const yearRepository = require('./yearRepository')
const { ROLES, STATUS, MIGRATED_STATUS } = require('../common')

// Helper to format user row with both lowercase and PascalCase properties for 100% frontend & backend compatibility
const formatUser = (row) => {
  if (!row) return null

  const id = row.Id || row.StudentId || (row.StaffId ? String(row.StaffId) : null) || (row.AdminId ? String(row.AdminId) : null)
  const studentId = row.StudentId || (row.Role === ROLES.STUDENT ? id : '')
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

  const yearId = row.YearId || null
  const yearName = row.YearName || ''
  const yearCode = row.YearCode || ''
  const yearNumber = row.YearNumber || null

  return {
    ...row,
    // Core user identity (compatible with _id, id, and legacy UserId references)
    _id: id,
    id,
    UserId: id,
    userId: id,
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
    isActive: (row.IsActive === true || row.IsActive === 1 || row.IsActive === '1') ? 1 : 0,
    IsActive: (row.IsActive === true || row.IsActive === 1 || row.IsActive === '1') ? 1 : 0,
    isMigrated: (row.IsMigrated === true || row.IsMigrated === 1 || row.IsMigrated === '1') ? 1 : 0,
    IsMigrated: (row.IsMigrated === true || row.IsMigrated === 1 || row.IsMigrated === '1') ? 1 : 0,

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
    studentId: studentId || null,
    StudentId: studentId || null,
    staffId: row.StaffId || null,
    StaffId: row.StaffId || null,
    adminId: row.AdminId || null,
    AdminId: row.AdminId || null,

    // Student / Staff details
    regnum,
    Regnum: regnum,
    registerNumber: regnum,

    // Student Unique ID aliases for backwards compatibility (all point to StudentId e.g. CSR001, BSR001)
    studentRefId: studentId,
    StudentRefId: studentId,
    studentUniqueId: studentId,
    StudentUniqueId: studentId,
    uniqueId: studentId,
    UniqueId: studentId,
    studentCode: studentId,
    StudentCode: studentId,

    // Department details
    deptId: departmentId,
    DeptId: departmentId,
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

    // Academic & Year details
    yearId,
    YearId: yearId,
    yearName,
    YearName: yearName,
    yearCode,
    YearCode: yearCode,
    yearNumber,
    YearNumber: yearNumber,
    batch,
    Batch: batch,
    semester,
    Semester: semester,

    // Staff details
    designation: row.Designation || (row.Role === ROLES.STAFF ? 'Staff' : ''),
    Designation: row.Designation || (row.Role === ROLES.STAFF ? 'Staff' : ''),

    // Admin details
    adminLevel: row.AdminLevel || (row.Role === ROLES.ADMIN ? 'superadmin' : ''),
    AdminLevel: row.AdminLevel || (row.Role === ROLES.ADMIN ? 'superadmin' : ''),
  }
}

// Unified query directly reading from independent entity tables (Students, Staff, Admins)
const UNIFIED_ACCOUNTS_CTE = `
  WITH UnifiedAccounts AS (
    SELECT 
      s.StudentId AS Id, s.StudentId, NULL AS StaffId, NULL AS AdminId,
      s.Name, s.Email, s.Password, 'student' AS Role, '' AS Avatar, s.Phone, s.IsActive,
      s.IsMigrated,
      NULL AS OtpHash, NULL AS OtpExpiresAt, NULL AS OtpPurpose, 0 AS OtpVerified, s.CreatedAt, s.UpdatedAt,
      s.Regnum AS StudentRegnum, s.Batch AS StudentBatch,
      s.Semester AS StudentSemester, s.DepartmentId AS StudentDeptId,
      s.YearId, y.YearName, y.YearCode, y.YearNumber,
      NULL AS StaffRegnum, NULL AS Designation, NULL AS StaffDeptId,
      NULL AS AdminLevel,
      d.DepartmentId, d.DepartmentName, d.DepartmentCode, d.PrefixCode
    FROM Students s
    LEFT JOIN Years y ON s.YearId = y.YearId
    LEFT JOIN Departments d ON s.DepartmentId = d.DepartmentId

    UNION ALL

    SELECT 
      CAST(st.StaffId AS NVARCHAR(50)) AS Id, NULL AS StudentId, st.StaffId, NULL AS AdminId,
      st.Name, st.Email, st.Password, 'staff' AS Role, st.Avatar, st.Phone, st.IsActive,
      0 AS IsMigrated,
      st.OtpHash, st.OtpExpiresAt, st.OtpPurpose, st.OtpVerified, st.CreatedAt, st.UpdatedAt,
      NULL AS StudentRegnum, NULL AS StudentBatch,
      NULL AS StudentSemester, NULL AS StudentDeptId,
      NULL AS YearId, NULL AS YearName, NULL AS YearCode, NULL AS YearNumber,
      st.Regnum AS StaffRegnum, st.Designation, st.DepartmentId AS StaffDeptId,
      NULL AS AdminLevel,
      d.DepartmentId, d.DepartmentName, d.DepartmentCode, d.PrefixCode
    FROM Staff st
    LEFT JOIN Departments d ON st.DepartmentId = d.DepartmentId

    UNION ALL

    SELECT 
      CAST(a.AdminId AS NVARCHAR(50)) AS Id, NULL AS StudentId, NULL AS StaffId, a.AdminId,
      a.Name, a.Email, a.Password, 'admin' AS Role, a.Avatar, a.Phone, a.IsActive,
      0 AS IsMigrated,
      NULL AS OtpHash, NULL AS OtpExpiresAt, NULL AS OtpPurpose, 0 AS OtpVerified, a.CreatedAt, a.UpdatedAt,
      NULL AS StudentRegnum, NULL AS StudentBatch,
      NULL AS StudentSemester, NULL AS StudentDeptId,
      NULL AS YearId, NULL AS YearName, NULL AS YearCode, NULL AS YearNumber,
      NULL AS StaffRegnum, NULL AS Designation, NULL AS StaffDeptId,
      a.AdminLevel,
      NULL AS DepartmentId, NULL AS DepartmentName, NULL AS DepartmentCode, NULL AS PrefixCode
    FROM Admins a
  )
`

exports.createUser = async ({
  name,
  email,
  password,
  regnum,
  role = ROLES.STUDENT,
  department,
  departmentId,
  phone,
  batch,
  semester,
  yearId,
  year,
  avatar,
  designation,
  adminLevel,
}) => {
  const pool = await getPool()
  const transaction = new sql.Transaction(pool)
  await transaction.begin()

  try {
    const userRole = (role || ROLES.STUDENT).toLowerCase()

    // 1. Resolve Department if needed
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
    if (!resolvedDeptId && userRole === ROLES.STUDENT) {
      const defaultDeptReq = new sql.Request(transaction)
      const defaultDeptResult = await defaultDeptReq.query(`SELECT TOP 1 DepartmentId FROM Departments ORDER BY DepartmentId ASC`)
      if (defaultDeptResult.recordset.length > 0) {
        resolvedDeptId = defaultDeptResult.recordset[0].DepartmentId
      }
    }

    let createdId = null

    // 2. Insert Directly into Standalone Entity Tables
    if (userRole === ROLES.STUDENT) {
      // Generate StudentId based on the Department's PrefixCode (e.g. CSR001, ADR001, BSR001)
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
          SELECT MAX(CAST(SUBSTRING(StudentId, @PrefixLen + 1, 10) AS INT)) AS MaxSeq
          FROM Students
          WHERE StudentId LIKE @PrefixPattern
            AND ISNUMERIC(SUBSTRING(StudentId, @PrefixLen + 1, 10)) = 1
        `)

      const nextSeq = (seqResult.recordset[0]?.MaxSeq || 0) + 1
      const studentId = `${prefix}${String(nextSeq).padStart(3, '0')}`

      const normalizedRegnum = (regnum && regnum.trim()) || `REG-${Date.now()}`

      // Resolve Year ID
      let resolvedYearId = null
      if (yearId !== undefined && yearId !== null) {
        resolvedYearId = await yearRepository.resolveYearId(yearId)
      } else if (year !== undefined && year !== null) {
        resolvedYearId = await yearRepository.resolveYearId(year)
      } else if (semester) {
        const semNum = Number(semester)
        const yrNum = semNum <= 2 ? 1 : semNum <= 4 ? 2 : semNum <= 6 ? 3 : 4
        resolvedYearId = await yearRepository.resolveYearId(yrNum)
      }
      if (!resolvedYearId) {
        resolvedYearId = await yearRepository.resolveYearId(1)
      }

      const studentReq = new sql.Request(transaction)
      await studentReq
        .input('StudentId', sql.NVarChar(50), studentId)
        .input('DepartmentId', sql.Int, resolvedDeptId)
        .input('YearId', sql.Int, resolvedYearId)
        .input('Name', sql.NVarChar(100), name)
        .input('Regnum', sql.NVarChar(50), normalizedRegnum)
        .input('Email', sql.NVarChar(255), email)
        .input('Phone', sql.NVarChar(20), phone || '')
        .input('Password', sql.NVarChar(255), password)
        .input('Batch', sql.NVarChar(20), batch || '')
        .input('Semester', sql.TinyInt, semester ? Number(semester) : null)
        .query(`
          INSERT INTO Students (
            StudentId, DepartmentId, YearId,
            Name, Regnum, Email, Phone, Password, Batch, Semester, IsActive, IsMigrated
          )
          VALUES (
            @StudentId, @DepartmentId, @YearId,
            @Name, @Regnum, @Email, @Phone, @Password, @Batch, @Semester, 1, 0
          )
        `)
      createdId = studentId
    } else if (userRole === ROLES.STAFF) {
      const normalizedRegnum = (regnum && regnum.trim()) || `EGSP${Date.now().toString().slice(-4)}`
      const staffReq = new sql.Request(transaction)
      const staffResult = await staffReq
        .input('DepartmentId', sql.Int, resolvedDeptId)
        .input('Name', sql.NVarChar(100), name)
        .input('Email', sql.NVarChar(255), email)
        .input('Phone', sql.NVarChar(20), phone || '')
        .input('Password', sql.NVarChar(255), password)
        .input('Avatar', sql.NVarChar(500), avatar || '')
        .input('Regnum', sql.NVarChar(50), normalizedRegnum)
        .input('Designation', sql.NVarChar(100), designation || 'Staff')
        .query(`
          INSERT INTO Staff (
            DepartmentId, Name, Email, Phone, Password, Avatar, Regnum, Designation, IsActive
          )
          OUTPUT INSERTED.StaffId
          VALUES (
            @DepartmentId, @Name, @Email, @Phone, @Password, @Avatar, @Regnum, @Designation, 1
          )
        `)
      createdId = String(staffResult.recordset[0].StaffId)
    } else if (userRole === ROLES.ADMIN) {
      const adminReq = new sql.Request(transaction)
      const adminResult = await adminReq
        .input('Name', sql.NVarChar(100), name)
        .input('Email', sql.NVarChar(255), email)
        .input('Phone', sql.NVarChar(20), phone || '')
        .input('Password', sql.NVarChar(255), password)
        .input('Avatar', sql.NVarChar(500), avatar || '')
        .input('AdminLevel', sql.NVarChar(50), adminLevel || 'superadmin')
        .query(`
          INSERT INTO Admins (
            Name, Email, Phone, Password, Avatar, AdminLevel, IsActive
          )
          OUTPUT INSERTED.AdminId
          VALUES (
            @Name, @Email, @Phone, @Password, @Avatar, @AdminLevel, 1
          )
        `)
      createdId = String(adminResult.recordset[0].AdminId)
    }

    await transaction.commit()

    // Retrieve and return fully hydrated user
    return await exports.findUserById(createdId, userRole)
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
      ${UNIFIED_ACCOUNTS_CTE}
      SELECT * FROM UnifiedAccounts
      WHERE LOWER(Email) = @Email
    `)
  return formatUser(result.recordset[0])
}

exports.findUserById = async (userId, role = null) => {
  if (userId === undefined || userId === null || userId === '') return null
  const pool = await getPool()
  const idStr = String(userId).trim()

  if ((idStr === '0' || idStr === '000000000000000000000000') && (!role || role.toLowerCase() === ROLES.ADMIN)) {
    return {
      _id: '0',
      id: '0',
      UserId: '0',
      userId: '0',
      name: 'Administrator',
      Name: 'Administrator',
      email: 'admin@egspec.edu',
      Email: 'admin@egspec.edu',
      role: ROLES.ADMIN,
      Role: ROLES.ADMIN,
      isActive: 1,
      IsActive: 1,
    }
  }

  const req = pool.request().input('Id', sql.NVarChar(50), idStr)
  let query = `
    ${UNIFIED_ACCOUNTS_CTE}
    SELECT * FROM UnifiedAccounts
    WHERE Id = @Id
  `
  if (role) {
    req.input('Role', sql.VarChar(10), role.toLowerCase())
    query += ` AND Role = @Role`
  }

  const result = await req.query(query)
  return formatUser(result.recordset[0])
}

exports.findUserByRegnum = async (regnum) => {
  if (!regnum) return null
  const normalized = regnum.trim().toUpperCase()
  const pool = await getPool()
  const result = await pool.request()
    .input('Regnum', sql.NVarChar(50), normalized)
    .query(`
      ${UNIFIED_ACCOUNTS_CTE}
      SELECT * FROM UnifiedAccounts
      WHERE UPPER(StudentRegnum) = @Regnum 
         OR UPPER(StaffRegnum) = @Regnum
         OR UPPER(Id) = @Regnum
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
      ${UNIFIED_ACCOUNTS_CTE}
      SELECT * FROM UnifiedAccounts
      WHERE Role = 'student'
        AND (UPPER(Id) = @UniqueId OR UPPER(StudentRegnum) = @UniqueId)
    `)
  return formatUser(result.recordset[0])
}

exports.findStudentByRefId = async (refId) => {
  return exports.findStudentByUniqueId(refId)
}

exports.updateUser = async (userId, fields, role = null) => {
  const pool = await getPool()
  const idStr = String(userId).trim()

  // 1. Resolve role if not passed
  let resolvedRole = role ? role.toLowerCase() : null
  if (!resolvedRole) {
    const existing = await exports.findUserById(idStr)
    if (!existing) throw new Error('User not found')
    resolvedRole = existing.Role || existing.role
  }

  // Resolve Department if updated
  let resolvedDeptId = fields.departmentId ? Number(fields.departmentId) : undefined
  if (resolvedDeptId === undefined && fields.department) {
    const deptRes = await pool.request()
      .input('DeptName', sql.NVarChar(100), fields.department.trim())
      .query(`SELECT DepartmentId FROM Departments WHERE LOWER(DepartmentName) = LOWER(@DeptName)`)
    if (deptRes.recordset.length > 0) {
      resolvedDeptId = deptRes.recordset[0].DepartmentId
    }
  }

  if (resolvedRole === ROLES.STUDENT) {
    const req = pool.request().input('StudentId', sql.NVarChar(50), idStr)
    const setClauses = []

    if (fields.name !== undefined) {
      req.input('Name', sql.NVarChar(100), fields.name)
      setClauses.push('Name = @Name')
    }
    if (fields.email !== undefined) {
      req.input('Email', sql.NVarChar(255), fields.email)
      setClauses.push('Email = @Email')
    }
    if (fields.password !== undefined) {
      req.input('Password', sql.NVarChar(255), fields.password)
      setClauses.push('Password = @Password')
    }
    if (fields.phone !== undefined) {
      req.input('Phone', sql.NVarChar(20), fields.phone || '')
      setClauses.push('Phone = @Phone')
    }
    if (fields.isActive !== undefined) {
      req.input('IsActive', sql.Bit, (fields.isActive === 1 || fields.isActive === true || fields.isActive === '1') ? 1 : 0)
      setClauses.push('IsActive = @IsActive')
    }
    if (fields.isMigrated !== undefined) {
      req.input('IsMigrated', sql.Bit, (fields.isMigrated === 1 || fields.isMigrated === true || fields.isMigrated === '1') ? 1 : 0)
      setClauses.push('IsMigrated = @IsMigrated')
    }
    if (resolvedDeptId !== undefined) {
      req.input('DepartmentId', sql.Int, resolvedDeptId)
      setClauses.push('DepartmentId = @DepartmentId')
    }
    if (fields.regnum !== undefined) {
      req.input('Regnum', sql.NVarChar(50), fields.regnum.trim().toUpperCase())
      setClauses.push('Regnum = @Regnum')
    }
    if (fields.yearId !== undefined || fields.year !== undefined) {
      const resolvedYear = await yearRepository.resolveYearId(fields.yearId || fields.year)
      req.input('YearId', sql.Int, resolvedYear)
      setClauses.push('YearId = @YearId')
    }
    if (fields.batch !== undefined) {
      req.input('Batch', sql.NVarChar(20), fields.batch)
      setClauses.push('Batch = @Batch')
    }
    if (fields.semester !== undefined) {
      req.input('Semester', sql.TinyInt, fields.semester ? Number(fields.semester) : null)
      setClauses.push('Semester = @Semester')
    }

    if (setClauses.length > 0) {
      setClauses.push('UpdatedAt = SYSUTCDATETIME()')
      await req.query(`
        UPDATE Students
        SET ${setClauses.join(', ')}
        WHERE StudentId = @StudentId
      `)
    }
  } else if (resolvedRole === ROLES.STAFF) {
    const req = pool.request().input('StaffId', sql.Int, Number(idStr))
    const setClauses = []

    if (fields.name !== undefined) {
      req.input('Name', sql.NVarChar(100), fields.name)
      setClauses.push('Name = @Name')
    }
    if (fields.email !== undefined) {
      req.input('Email', sql.NVarChar(255), fields.email)
      setClauses.push('Email = @Email')
    }
    if (fields.password !== undefined) {
      req.input('Password', sql.NVarChar(255), fields.password)
      setClauses.push('Password = @Password')
    }
    if (fields.phone !== undefined) {
      req.input('Phone', sql.NVarChar(20), fields.phone || '')
      setClauses.push('Phone = @Phone')
    }
    if (fields.avatar !== undefined) {
      req.input('Avatar', sql.NVarChar(500), fields.avatar || '')
      setClauses.push('Avatar = @Avatar')
    }
    if (fields.isActive !== undefined) {
      req.input('IsActive', sql.Bit, fields.isActive ? 1 : 0)
      setClauses.push('IsActive = @IsActive')
    }
    if (resolvedDeptId !== undefined) {
      req.input('DepartmentId', sql.Int, resolvedDeptId)
      setClauses.push('DepartmentId = @DepartmentId')
    }
    if (fields.regnum !== undefined) {
      req.input('Regnum', sql.NVarChar(50), fields.regnum.trim().toUpperCase())
      setClauses.push('Regnum = @Regnum')
    }
    if (fields.designation !== undefined) {
      req.input('Designation', sql.NVarChar(100), fields.designation)
      setClauses.push('Designation = @Designation')
    }

    if (setClauses.length > 0) {
      setClauses.push('UpdatedAt = SYSUTCDATETIME()')
      await req.query(`
        UPDATE Staff
        SET ${setClauses.join(', ')}
        WHERE StaffId = @StaffId
      `)
    }
  } else if (resolvedRole === ROLES.ADMIN) {
    const req = pool.request().input('AdminId', sql.Int, Number(idStr))
    const setClauses = []

    if (fields.name !== undefined) {
      req.input('Name', sql.NVarChar(100), fields.name)
      setClauses.push('Name = @Name')
    }
    if (fields.email !== undefined) {
      req.input('Email', sql.NVarChar(255), fields.email)
      setClauses.push('Email = @Email')
    }
    if (fields.password !== undefined) {
      req.input('Password', sql.NVarChar(255), fields.password)
      setClauses.push('Password = @Password')
    }
    if (fields.phone !== undefined) {
      req.input('Phone', sql.NVarChar(20), fields.phone || '')
      setClauses.push('Phone = @Phone')
    }
    if (fields.avatar !== undefined) {
      req.input('Avatar', sql.NVarChar(500), fields.avatar || '')
      setClauses.push('Avatar = @Avatar')
    }
    if (fields.isActive !== undefined) {
      req.input('IsActive', sql.Bit, fields.isActive ? 1 : 0)
      setClauses.push('IsActive = @IsActive')
    }
    if (fields.adminLevel !== undefined) {
      req.input('AdminLevel', sql.NVarChar(50), fields.adminLevel)
      setClauses.push('AdminLevel = @AdminLevel')
    }

    if (setClauses.length > 0) {
      setClauses.push('UpdatedAt = SYSUTCDATETIME()')
      await req.query(`
        UPDATE Admins
        SET ${setClauses.join(', ')}
        WHERE AdminId = @AdminId
      `)
    }
  }

  return await exports.findUserById(idStr, resolvedRole)
}

exports.updateOtp = async (userId, { otpHash, otpExpiresAt, otpPurpose, otpVerified }, role = null) => {
  const pool = await getPool()
  const idStr = String(userId).trim()

  let resolvedRole = role ? role.toLowerCase() : null
  if (!resolvedRole) {
    const existing = await exports.findUserById(idStr)
    if (!existing) throw new Error('User not found')
    resolvedRole = existing.Role || existing.role
  }

  if (resolvedRole === ROLES.STUDENT) {
    // OTP functionality for students removed per schema requirements; return student
    return await exports.findUserById(idStr, resolvedRole)
  } else if (resolvedRole === ROLES.STAFF) {
    await pool.request()
      .input('Id', sql.Int, Number(idStr))
      .input('OtpHash', sql.NVarChar(255), otpHash || null)
      .input('OtpExpiresAt', sql.DateTime2, otpExpiresAt || null)
      .input('OtpPurpose', sql.VarChar(20), otpPurpose || null)
      .input('OtpVerified', sql.Bit, otpVerified ? 1 : 0)
      .query(`
        UPDATE Staff
        SET OtpHash = @OtpHash,
            OtpExpiresAt = @OtpExpiresAt,
            OtpPurpose = @OtpPurpose,
            OtpVerified = @OtpVerified,
            UpdatedAt = SYSUTCDATETIME()
        WHERE StaffId = @Id
      `)
  }

  return await exports.findUserById(idStr, resolvedRole)
}

exports.getAllUsers = async ({ role, department, departmentId, yearId, year, search, isActive, page, limit } = {}) => {
  const pool = await getPool()
  const request = pool.request()
  const conditions = []

  if (role) {
    request.input('Role', sql.VarChar(10), role.toLowerCase())
    conditions.push('Role = @Role')
  }
  if (departmentId) {
    request.input('DeptId', sql.Int, Number(departmentId))
    conditions.push('(DepartmentId = @DeptId OR StudentDeptId = @DeptId)')
  } else if (department) {
    request.input('Department', sql.NVarChar(100), department.trim())
    conditions.push('LOWER(DepartmentName) = LOWER(@Department)')
  }
  if (yearId) {
    request.input('YearId', sql.Int, Number(yearId))
    conditions.push('YearId = @YearId')
  } else if (year) {
    request.input('YearParam', sql.NVarChar(50), `%${year}%`)
    conditions.push('(YearName LIKE @YearParam OR YearCode LIKE @YearParam OR CAST(YearNumber AS VARCHAR) = @YearParam)')
  }
  if (isActive !== undefined) {
    request.input('IsActive', sql.Bit, isActive ? 1 : 0)
    conditions.push('IsActive = @IsActive')
  }
  if (search) {
    request.input('Search', sql.NVarChar(100), `%${search.trim()}%`)
    conditions.push(`
      (Name LIKE @Search 
       OR Email LIKE @Search 
       OR StudentRegnum LIKE @Search 
       OR Id LIKE @Search 
       OR StaffRegnum LIKE @Search)
    `)
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  if (page !== undefined || limit !== undefined) {
    const pageNum = Math.max(1, Number(page) || 1)
    const limitNum = Math.max(1, Number(limit) || 50)
    const offset = (pageNum - 1) * limitNum

    request.input('Offset', sql.Int, offset)
    request.input('PageLimit', sql.Int, limitNum)

    const result = await request.query(`
      ${UNIFIED_ACCOUNTS_CTE}
      SELECT *, COUNT(*) OVER() AS TotalRowsCount
      FROM UnifiedAccounts
      ${whereClause}
      ORDER BY CreatedAt DESC
      OFFSET @Offset ROWS FETCH NEXT @PageLimit ROWS ONLY
    `)

    const totalCount = result.recordset.length > 0 ? result.recordset[0].TotalRowsCount : 0
    return {
      users: result.recordset.map(formatUser),
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
    }
  }

  const result = await request.query(`
    ${UNIFIED_ACCOUNTS_CTE}
    SELECT * FROM UnifiedAccounts
    ${whereClause}
    ORDER BY CreatedAt DESC
  `)
  return result.recordset.map(formatUser)
}

exports.deleteUser = async (userId, role = null) => {
  const pool = await getPool()
  const idStr = String(userId).trim()

  let resolvedRole = role ? role.toLowerCase() : null
  if (!resolvedRole) {
    const existing = await exports.findUserById(idStr)
    if (!existing) return false
    resolvedRole = existing.Role || existing.role
  }

  let result
  if (resolvedRole === ROLES.STUDENT) {
    result = await pool.request()
      .input('Id', sql.NVarChar(50), idStr)
      .query(`DELETE FROM Students WHERE StudentId = @Id`)
  } else if (resolvedRole === ROLES.STAFF) {
    result = await pool.request()
      .input('Id', sql.Int, Number(idStr))
      .query(`DELETE FROM Staff WHERE StaffId = @Id`)
  } else if (resolvedRole === ROLES.ADMIN) {
    result = await pool.request()
      .input('Id', sql.Int, Number(idStr))
      .query(`DELETE FROM Admins WHERE AdminId = @Id`)
  }

  return result ? result.rowsAffected[0] > 0 : false
}

exports.formatUser = formatUser
