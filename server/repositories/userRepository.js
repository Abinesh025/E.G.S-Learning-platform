const { getPool, sql } = require('../config/db')

// Helper to format user row with _id alias for frontend compatibility
const formatUser = (row) => {
  if (!row) return null
  return {
    ...row,
    _id: row.UserId,
    id: row.UserId,
  }
}

exports.createUser = async ({ name, email, password, regnum, role, department, phone, batch, semester, avatar }) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('Name', sql.NVarChar(100), name)
    .input('Email', sql.NVarChar(255), email)
    .input('Regnum', sql.NVarChar(50), regnum || null)
    .input('Password', sql.NVarChar(255), password)
    .input('Role', sql.VarChar(10), role)
    .input('Department', sql.NVarChar(100), department || '')
    .input('Phone', sql.NVarChar(20), phone || '')
    .input('Batch', sql.NVarChar(20), batch || '')
    .input('Semester', sql.TinyInt, semester || null)
    .input('Avatar', sql.NVarChar(500), avatar || '')
    .query(`
      INSERT INTO Users (Name, Email, Regnum, Password, Role, Department, Phone, Batch, Semester, Avatar)
      OUTPUT INSERTED.*
      VALUES (@Name, @Email, @Regnum, @Password, @Role, @Department, @Phone, @Batch, @Semester, @Avatar)
    `)
  return formatUser(result.recordset[0])
}

exports.findUserByEmail = async (email) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('Email', sql.NVarChar(255), email)
    .query(`SELECT * FROM Users WHERE Email = @Email`)
  return formatUser(result.recordset[0])
}

exports.findUserById = async (userId) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .query(`SELECT * FROM Users WHERE UserId = @UserId`)
  return formatUser(result.recordset[0])
}

exports.findUserByRegnum = async (regnum) => {
  if (!regnum) return null
  const pool = await getPool()
  const result = await pool.request()
    .input('Regnum', sql.NVarChar(50), regnum)
    .query(`SELECT * FROM Users WHERE Regnum = @Regnum`)
  return formatUser(result.recordset[0])
}

exports.updateUser = async (userId, fields) => {
  const pool = await getPool()
  const request = pool.request().input('UserId', sql.Int, userId)
  
  const setClauses = []
  
  if (fields.name !== undefined) {
    request.input('Name', sql.NVarChar(100), fields.name)
    setClauses.push('Name = @Name')
  }
  if (fields.email !== undefined) {
    request.input('Email', sql.NVarChar(255), fields.email)
    setClauses.push('Email = @Email')
  }
  if (fields.password !== undefined) {
    request.input('Password', sql.NVarChar(255), fields.password)
    setClauses.push('Password = @Password')
  }
  if (fields.phone !== undefined) {
    request.input('Phone', sql.NVarChar(20), fields.phone)
    setClauses.push('Phone = @Phone')
  }
  if (fields.department !== undefined) {
    request.input('Department', sql.NVarChar(100), fields.department)
    setClauses.push('Department = @Department')
  }
  if (fields.batch !== undefined) {
    request.input('Batch', sql.NVarChar(20), fields.batch)
    setClauses.push('Batch = @Batch')
  }
  if (fields.semester !== undefined) {
    request.input('Semester', sql.TinyInt, fields.semester || null)
    setClauses.push('Semester = @Semester')
  }
  if (fields.avatar !== undefined) {
    request.input('Avatar', sql.NVarChar(500), fields.avatar)
    setClauses.push('Avatar = @Avatar')
  }
  if (fields.isActive !== undefined) {
    request.input('IsActive', sql.Bit, fields.isActive ? 1 : 0)
    setClauses.push('IsActive = @IsActive')
  }

  setClauses.push('UpdatedAt = SYSUTCDATETIME()')

  const query = `
    UPDATE Users 
    SET ${setClauses.join(', ')}
    OUTPUT INSERTED.*
    WHERE UserId = @UserId
  `
  const result = await request.query(query)
  return formatUser(result.recordset[0])
}

exports.updateOtp = async (userId, { otpHash, otpExpiresAt, otpPurpose, otpVerified }) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
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
      OUTPUT INSERTED.*
      WHERE UserId = @UserId
    `)
  return formatUser(result.recordset[0])
}

exports.getAllUsers = async ({ role, department, search, isActive } = {}) => {
  const pool = await getPool()
  const request = pool.request()
  const conditions = []

  if (role) {
    request.input('Role', sql.VarChar(10), role)
    conditions.push('Role = @Role')
  }
  if (department) {
    request.input('Department', sql.NVarChar(100), department)
    conditions.push('Department = @Department')
  }
  if (isActive !== undefined) {
    request.input('IsActive', sql.Bit, isActive ? 1 : 0)
    conditions.push('IsActive = @IsActive')
  }
  if (search) {
    request.input('Search', sql.NVarChar(100), `%${search}%`)
    conditions.push('(Name LIKE @Search OR Email LIKE @Search OR Regnum LIKE @Search)')
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const result = await request.query(`
    SELECT UserId, Name, Email, Regnum, Role, Avatar, Department, Phone, Batch, Semester, IsActive, CreatedAt, UpdatedAt
    FROM Users
    ${whereClause}
    ORDER BY CreatedAt DESC
  `)
  return result.recordset.map(formatUser)
}

exports.deleteUser = async (userId) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .query(`DELETE FROM Users WHERE UserId = @UserId`)
  return result.rowsAffected[0] > 0
}
