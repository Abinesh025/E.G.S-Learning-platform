const { getPool, sql } = require('../config/db')

const formatMaterial = (row) => {
  if (!row) return null
  return {
    _id: row.MaterialId,
    id: row.MaterialId,
    MaterialId: row.MaterialId,
    title: row.Title,
    subject: row.Subject,
    subjectName: row.SubjectName,
    unit: row.Unit,
    fileType: row.FileType,
    fileUrl: row.FileUrl,
    department: row.Department,
    semester: row.Semester,
    course: row.Course,
    staffName: row.StaffName || row.UploaderName,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
    uploadedBy: row.UploaderId
      ? {
          _id: row.UploaderId,
          id: row.UploaderId,
          name: row.UploaderName,
          email: row.UploaderEmail,
          role: row.UploaderRole,
        }
      : row.UploadedBy,
  }
}

exports.createMaterial = async ({
  title,
  subject,
  subjectName,
  unit,
  fileType,
  fileUrl,
  department,
  semester,
  course,
  uploadedBy,
  staffName,
}) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('Title', sql.NVarChar(200), title)
    .input('Subject', sql.NVarChar(100), subject)
    .input('SubjectName', sql.NVarChar(200), subjectName || null)
    .input('Unit', sql.NVarChar(50), unit)
    .input('FileType', sql.VarChar(20), fileType)
    .input('FileUrl', sql.NVarChar(1000), fileUrl)
    .input('Department', sql.NVarChar(100), department || '')
    .input('Semester', sql.TinyInt, semester || null)
    .input('Course', sql.NVarChar(100), course || '')
    .input('UploadedBy', sql.Int, uploadedBy)
    .input('StaffName', sql.NVarChar(100), staffName || null)
    .query(`
      INSERT INTO Materials (Title, Subject, SubjectName, Unit, FileType, FileUrl, Department, Semester, Course, UploadedBy, StaffName)
      OUTPUT INSERTED.*
      VALUES (@Title, @Subject, @SubjectName, @Unit, @FileType, @FileUrl, @Department, @Semester, @Course, @UploadedBy, @StaffName)
    `)
  return formatMaterial(result.recordset[0])
}

exports.getMaterials = async ({ subject, unit, department, semester, course, uploadedBy, search, page, limit } = {}) => {
  const pool = await getPool()
  const request = pool.request()
  const conditions = []

  if (subject) {
    request.input('Subject', sql.NVarChar(100), subject)
    conditions.push('m.Subject = @Subject')
  }
  if (unit) {
    request.input('Unit', sql.NVarChar(50), unit)
    conditions.push('m.Unit = @Unit')
  }
  if (department) {
    request.input('Department', sql.NVarChar(100), department)
    conditions.push('m.Department = @Department')
  }
  if (semester) {
    request.input('Semester', sql.TinyInt, Number(semester))
    conditions.push('m.Semester = @Semester')
  }
  if (course) {
    request.input('Course', sql.NVarChar(100), `%${course}%`)
    conditions.push('m.Course LIKE @Course')
  }
  if (uploadedBy) {
    request.input('UploadedBy', sql.Int, uploadedBy)
    conditions.push('m.UploadedBy = @UploadedBy')
  }
  if (search) {
    request.input('Search', sql.NVarChar(100), `%${search.trim()}%`)
    conditions.push('(m.Title LIKE @Search OR m.Subject LIKE @Search OR m.Topic LIKE @Search OR m.Description LIKE @Search)')
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  if (page !== undefined || limit !== undefined) {
    const pageNum = Math.max(1, Number(page) || 1)
    const limitNum = Math.max(1, Number(limit) || 50)
    const offset = (pageNum - 1) * limitNum

    request.input('Offset', sql.Int, offset)
    request.input('PageLimit', sql.Int, limitNum)

    const query = `
      SELECT 
        m.*,
        u.StaffId AS UploaderId,
        u.Name AS UploaderName,
        u.Email AS UploaderEmail,
        'staff' AS UploaderRole,
        COUNT(*) OVER() AS TotalRowsCount
      FROM Materials m
      LEFT JOIN Staff u ON m.UploadedBy = u.StaffId
      ${whereClause}
      ORDER BY m.CreatedAt DESC
      OFFSET @Offset ROWS FETCH NEXT @PageLimit ROWS ONLY
    `

    const result = await request.query(query)
    const totalCount = result.recordset.length > 0 ? result.recordset[0].TotalRowsCount : 0
    return {
      materials: result.recordset.map(formatMaterial),
      totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
    }
  }

  const query = `
    SELECT 
      m.*,
      u.StaffId AS UploaderId,
      u.Name AS UploaderName,
      u.Email AS UploaderEmail,
      'staff' AS UploaderRole
    FROM Materials m
    LEFT JOIN Staff u ON m.UploadedBy = u.StaffId
    ${whereClause}
    ORDER BY m.CreatedAt DESC
  `

  const result = await request.query(query)
  return result.recordset.map(formatMaterial)
}

exports.getMaterialById = async (materialId) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('MaterialId', sql.Int, materialId)
    .query(`
      SELECT 
        m.*,
        u.StaffId AS UploaderId,
        u.Name AS UploaderName,
        u.Email AS UploaderEmail,
        'staff' AS UploaderRole
      FROM Materials m
      LEFT JOIN Staff u ON m.UploadedBy = u.StaffId
      WHERE m.MaterialId = @MaterialId
    `)
  return formatMaterial(result.recordset[0])
}

exports.updateMaterial = async (materialId, fields) => {
  const pool = await getPool()
  const request = pool.request().input('MaterialId', sql.Int, materialId)
  const setClauses = []

  if (fields.title !== undefined) {
    request.input('Title', sql.NVarChar(200), fields.title)
    setClauses.push('Title = @Title')
  }
  if (fields.subject !== undefined) {
    request.input('Subject', sql.NVarChar(100), fields.subject)
    setClauses.push('Subject = @Subject')
  }
  if (fields.subjectName !== undefined) {
    request.input('SubjectName', sql.NVarChar(200), fields.subjectName)
    setClauses.push('SubjectName = @SubjectName')
  }
  if (fields.unit !== undefined) {
    request.input('Unit', sql.NVarChar(50), fields.unit)
    setClauses.push('Unit = @Unit')
  }
  if (fields.fileType !== undefined) {
    request.input('FileType', sql.VarChar(20), fields.fileType)
    setClauses.push('FileType = @FileType')
  }
  if (fields.fileUrl !== undefined) {
    request.input('FileUrl', sql.NVarChar(1000), fields.fileUrl)
    setClauses.push('FileUrl = @FileUrl')
  }
  if (fields.department !== undefined) {
    request.input('Department', sql.NVarChar(100), fields.department)
    setClauses.push('Department = @Department')
  }
  if (fields.semester !== undefined) {
    request.input('Semester', sql.TinyInt, fields.semester)
    setClauses.push('Semester = @Semester')
  }
  if (fields.course !== undefined) {
    request.input('Course', sql.NVarChar(100), fields.course)
    setClauses.push('Course = @Course')
  }

  setClauses.push('UpdatedAt = SYSUTCDATETIME()')

  const query = `
    UPDATE Materials
    SET ${setClauses.join(', ')}
    OUTPUT INSERTED.*
    WHERE MaterialId = @MaterialId
  `
  const result = await request.query(query)
  return formatMaterial(result.recordset[0])
}

exports.deleteMaterial = async (materialId) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('MaterialId', sql.Int, materialId)
    .query(`DELETE FROM Materials WHERE MaterialId = @MaterialId`)
  return result.rowsAffected[0] > 0
}
