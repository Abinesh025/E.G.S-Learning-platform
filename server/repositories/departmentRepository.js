const { getPool, sql } = require('../config/db')

const formatDepartment = (row) => {
  if (!row) return null
  return {
    _id: row.DepartmentId,
    id: row.DepartmentId,
    DepartmentId: row.DepartmentId,
    departmentId: row.DepartmentId,
    name: row.DepartmentName,
    Name: row.DepartmentName,
    departmentName: row.DepartmentName,
    DepartmentName: row.DepartmentName,
    code: row.DepartmentCode,
    Code: row.DepartmentCode,
    departmentCode: row.DepartmentCode,
    DepartmentCode: row.DepartmentCode,
    prefixCode: row.PrefixCode,
    PrefixCode: row.PrefixCode,
    createdAt: row.CreatedAt,
    CreatedAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
    UpdatedAt: row.UpdatedAt,
  }
}

exports.getAllDepartments = async () => {
  const pool = await getPool()
  const result = await pool.request().query(`
    SELECT * FROM Departments ORDER BY DepartmentName ASC
  `)
  return result.recordset.map(formatDepartment)
}

exports.getDepartmentById = async (departmentId) => {
  if (!departmentId) return null
  const pool = await getPool()
  const result = await pool.request()
    .input('DepartmentId', sql.Int, departmentId)
    .query(`SELECT * FROM Departments WHERE DepartmentId = @DepartmentId`)
  return formatDepartment(result.recordset[0])
}

exports.getDepartmentByName = async (departmentName) => {
  if (!departmentName) return null
  const pool = await getPool()
  const result = await pool.request()
    .input('DepartmentName', sql.NVarChar(100), departmentName.trim())
    .query(`SELECT * FROM Departments WHERE LOWER(DepartmentName) = LOWER(@DepartmentName)`)
  return formatDepartment(result.recordset[0])
}

exports.getDepartmentByCode = async (code) => {
  if (!code) return null
  const pool = await getPool()
  const result = await pool.request()
    .input('Code', sql.VarChar(10), code.trim().toUpperCase())
    .query(`
      SELECT * FROM Departments 
      WHERE UPPER(DepartmentCode) = @Code OR UPPER(PrefixCode) = @Code
    `)
  return formatDepartment(result.recordset[0])
}

/**
 * Generates the next sequential unique student ID for a given department.
 * E.g., for Computer Science and Engineering (Prefix 'CSR'):
 * CSR001, CSR002, CSR003, etc.
 *
 * @param {number|string} departmentId
 * @param {sql.Request|null} [customRequest] - Optional request in an active transaction
 * @returns {Promise<{ studentUniqueId: string, prefix: string, sequenceNumber: number }>}
 */
exports.generateStudentUniqueId = async (departmentId, customRequest = null) => {
  let pool
  let request = customRequest
  if (!request) {
    pool = await getPool()
    request = pool.request()
  }

  // 1. Get Department details
  const deptResult = await request
    .input('DeptIdForGen', sql.Int, Number(departmentId))
    .query(`SELECT DepartmentId, DepartmentName, PrefixCode FROM Departments WHERE DepartmentId = @DeptIdForGen`)

  if (deptResult.recordset.length === 0) {
    throw new Error(`Department with ID ${departmentId} does not exist`)
  }

  const dept = deptResult.recordset[0]
  const prefix = (dept.PrefixCode || 'STU').trim().toUpperCase()

  // 2. Query maximum sequence currently assigned for this prefix
  const seqReq = customRequest || pool.request()
  const seqResult = await seqReq
    .input('PrefixPattern', sql.VarChar(15), `${prefix}%`)
    .input('PrefixLen', sql.Int, prefix.length)
    .query(`
      SELECT MAX(CAST(SUBSTRING(StudentUniqueId, @PrefixLen + 1, 10) AS INT)) AS MaxSeq
      FROM Students
      WHERE StudentUniqueId LIKE @PrefixPattern
        AND ISNUMERIC(SUBSTRING(StudentUniqueId, @PrefixLen + 1, 10)) = 1
    `)

  const currentMax = seqResult.recordset[0].MaxSeq || 0
  const nextSeq = currentMax + 1
  const studentUniqueId = `${prefix}${String(nextSeq).padStart(3, '0')}`

  return {
    studentUniqueId,
    prefix,
    sequenceNumber: nextSeq,
    departmentName: dept.DepartmentName,
  }
}

exports.formatDepartment = formatDepartment
