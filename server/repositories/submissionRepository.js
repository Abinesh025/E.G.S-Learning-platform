const { getPool, sql } = require('../config/db')

const formatResult = (row) => {
  if (!row) return null
  return {
    _id: row.ResultId,
    id: row.ResultId,
    ResultId: row.ResultId,
    student: row.StudentId
      ? {
          _id: row.StudentId,
          id: row.StudentId,
          name: row.StudentName,
          email: row.StudentEmail,
          regnum: row.StudentRegnum,
          department: row.StudentDept,
          batch: row.StudentBatch,
        }
      : row.StudentId,
    test: row.TestId
      ? {
          _id: row.TestId,
          id: row.TestId,
          title: row.TestTitle,
          subject: row.TestSubject,
          department: row.TestDept,
        }
      : row.TestId,
    score: row.Score,
    totalMarks: row.TotalMarks,
    percentage: row.Percentage,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  }
}

const formatSubmission = (row) => {
  if (!row) return null
  return {
    _id: row.SubmissionId,
    id: row.SubmissionId,
    SubmissionId: row.SubmissionId,
    student: row.StudentId,
    test: row.TestId,
    score: row.Score,
    totalQuestions: row.TotalQuestions,
    smsStatus: row.SmsStatus,
    smsSentAt: row.SmsSentAt,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  }
}

exports.findExistingResult = async (studentId, testId) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('StudentId', sql.Int, studentId)
    .input('TestId', sql.Int, testId)
    .query(`SELECT * FROM Results WHERE StudentId = @StudentId AND TestId = @TestId`)
  return formatResult(result.recordset[0])
}

exports.createSubmissionAndResult = async ({
  studentId,
  testId,
  score,
  totalMarks,
  percentage,
  totalQuestions,
  smsStatus = 'not_sent',
  smsSentAt = null,
  studentAnswerMappings = [], // [{ questionId, selectedOptionId }]
}) => {
  const pool = await getPool()
  const transaction = new sql.Transaction(pool)
  await transaction.begin()

  try {
    // 1. Insert Result
    const resReq = new sql.Request(transaction)
    const resResult = await resReq
      .input('StudentId', sql.Int, studentId)
      .input('TestId', sql.Int, testId)
      .input('Score', sql.Decimal(5, 2), score)
      .input('TotalMarks', sql.Decimal(5, 2), totalMarks)
      .input('Percentage', sql.Decimal(5, 2), percentage)
      .query(`
        INSERT INTO Results (StudentId, TestId, Score, TotalMarks, Percentage)
        OUTPUT INSERTED.*
        VALUES (@StudentId, @TestId, @Score, @TotalMarks, @Percentage)
      `)
    const createdResult = resResult.recordset[0]

    // 2. Insert TestSubmission
    const subReq = new sql.Request(transaction)
    const subResult = await subReq
      .input('StudentId', sql.Int, studentId)
      .input('TestId', sql.Int, testId)
      .input('Score', sql.Int, Math.round(score))
      .input('TotalQuestions', sql.Int, totalQuestions)
      .input('SmsStatus', sql.VarChar(20), smsStatus)
      .input('SmsSentAt', sql.DateTime2, smsSentAt)
      .query(`
        INSERT INTO TestSubmissions (StudentId, TestId, Score, TotalQuestions, SmsStatus, SmsSentAt)
        OUTPUT INSERTED.*
        VALUES (@StudentId, @TestId, @Score, @TotalQuestions, @SmsStatus, @SmsSentAt)
      `)
    const createdSubmission = subResult.recordset[0]

    // 3. Insert StudentAnswers
    for (const ans of studentAnswerMappings) {
      if (ans.questionId) {
        const ansReq = new sql.Request(transaction)
        await ansReq
          .input('ResultId', sql.Int, createdResult.ResultId)
          .input('QuestionId', sql.Int, ans.questionId)
          .input('SelectedOptionId', sql.Int, ans.selectedOptionId || null)
          .query(`
            INSERT INTO StudentAnswers (ResultId, QuestionId, SelectedOptionId)
            VALUES (@ResultId, @QuestionId, @SelectedOptionId)
          `)
      }
    }

    await transaction.commit()

    return {
      result: formatResult(createdResult),
      submission: formatSubmission(createdSubmission),
    }
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

exports.getResultsByStudent = async (studentId) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('StudentId', sql.Int, studentId)
    .query(`
      SELECT 
        r.*,
        t.Title AS TestTitle,
        t.Subject AS TestSubject,
        t.Department AS TestDept
      FROM Results r
      INNER JOIN Tests t ON r.TestId = t.TestId
      WHERE r.StudentId = @StudentId
      ORDER BY r.CreatedAt DESC
    `)
  return result.recordset.map(formatResult)
}

exports.getResultsByTest = async (testId) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('TestId', sql.Int, testId)
    .query(`
      SELECT 
        r.*,
        u.Name AS StudentName,
        u.Email AS StudentEmail,
        u.Regnum AS StudentRegnum,
        u.Department AS StudentDept,
        u.Batch AS StudentBatch,
        t.Title AS TestTitle,
        t.Subject AS TestSubject,
        t.Department AS TestDept
      FROM Results r
      INNER JOIN Users u ON r.StudentId = u.UserId
      INNER JOIN Tests t ON r.TestId = t.TestId
      WHERE r.TestId = @TestId
      ORDER BY r.Score DESC
    `)
  return result.recordset.map(formatResult)
}

exports.getAllResults = async ({ department, search } = {}) => {
  const pool = await getPool()
  const request = pool.request()
  const conditions = []

  if (department) {
    request.input('Department', sql.NVarChar(100), department)
    conditions.push('(u.Department = @Department OR t.Department = @Department)')
  }
  if (search) {
    request.input('Search', sql.NVarChar(100), `%${search}%`)
    conditions.push('(u.Name LIKE @Search OR u.Regnum LIKE @Search OR t.Title LIKE @Search)')
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const result = await request.query(`
    SELECT 
      r.*,
      u.Name AS StudentName,
      u.Email AS StudentEmail,
      u.Regnum AS StudentRegnum,
      u.Department AS StudentDept,
      u.Batch AS StudentBatch,
      t.Title AS TestTitle,
      t.Subject AS TestSubject,
      t.Department AS TestDept
    FROM Results r
    INNER JOIN Users u ON r.StudentId = u.UserId
    INNER JOIN Tests t ON r.TestId = t.TestId
    ${whereClause}
    ORDER BY r.CreatedAt DESC
  `)
  return result.recordset.map(formatResult)
}

exports.deleteResult = async (resultId) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('ResultId', sql.Int, resultId)
    .query(`DELETE FROM Results WHERE ResultId = @ResultId`)
  return result.rowsAffected[0] > 0
}
