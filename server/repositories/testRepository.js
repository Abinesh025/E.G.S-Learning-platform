const { getPool, sql } = require('../config/db')

// Helper to format a test header row
const formatTest = (row, questions = []) => {
  if (!row) return null
  return {
    _id: row.TestId,
    id: row.TestId,
    TestId: row.TestId,
    title: row.Title,
    subject: row.Subject,
    department: row.Department,
    duration: row.Duration,
    createdBy: row.CreatedBy,
    creatorName: row.CreatorName,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
    questions: questions,
  }
}

// Create Test with TestQuestions and QuestionOptions within a transaction
exports.createTestWithQuestions = async ({
  title,
  subject,
  department,
  duration,
  createdBy,
  questions,
}) => {
  const pool = await getPool()
  const transaction = new sql.Transaction(pool)
  await transaction.begin()

  try {
    // 1. Insert Test
    const testRequest = new sql.Request(transaction)
    const testResult = await testRequest
      .input('Title', sql.NVarChar(200), title)
      .input('Subject', sql.NVarChar(100), subject)
      .input('Department', sql.NVarChar(100), department || '')
      .input('Duration', sql.Int, duration)
      .input('CreatedBy', sql.Int, createdBy)
      .query(`
        INSERT INTO Tests (Title, Subject, Department, Duration, CreatedBy)
        OUTPUT INSERTED.*
        VALUES (@Title, @Subject, @Department, @Duration, @CreatedBy)
      `)

    const createdTest = testResult.recordset[0]
    const testId = createdTest.TestId
    const formattedQuestions = []

    // 2. Insert Questions & Options
    for (let qIdx = 0; qIdx < questions.length; qIdx++) {
      const q = questions[qIdx]
      const questionRequest = new sql.Request(transaction)
      const qResult = await questionRequest
        .input('TestId', sql.Int, testId)
        .input('QuestionText', sql.NVarChar(sql.MAX), q.question)
        .input('QuestionOrder', sql.Int, qIdx + 1)
        .query(`
          INSERT INTO TestQuestions (TestId, QuestionText, QuestionOrder)
          OUTPUT INSERTED.*
          VALUES (@TestId, @QuestionText, @QuestionOrder)
        `)

      const createdQuestion = qResult.recordset[0]
      const questionId = createdQuestion.QuestionId
      const optionsArray = []

      for (let oIdx = 0; oIdx < q.options.length; oIdx++) {
        const optText = q.options[oIdx]
        const isCorrect = oIdx === Number(q.correctAnswer)

        const optRequest = new sql.Request(transaction)
        const optResult = await optRequest
          .input('QuestionId', sql.Int, questionId)
          .input('OptionText', sql.NVarChar(1000), optText)
          .input('OptionOrder', sql.Int, oIdx + 1)
          .input('IsCorrect', sql.Bit, isCorrect ? 1 : 0)
          .query(`
            INSERT INTO QuestionOptions (QuestionId, OptionText, OptionOrder, IsCorrect)
            OUTPUT INSERTED.*
            VALUES (@QuestionId, @OptionText, @OptionOrder, @IsCorrect)
          `)
        optionsArray.push(optResult.recordset[0])
      }

      formattedQuestions.push({
        _id: questionId,
        id: questionId,
        question: createdQuestion.QuestionText,
        options: optionsArray.map((o) => o.OptionText),
        optionsData: optionsArray,
        correctAnswer: q.correctAnswer,
      })
    }

    await transaction.commit()
    return formatTest(createdTest, formattedQuestions)
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

// Get all tests (optionally filtered by department or createdBy)
exports.getTests = async ({ department, createdBy } = {}) => {
  const pool = await getPool()
  const request = pool.request()
  const conditions = []

  if (department) {
    request.input('Department', sql.NVarChar(100), department)
    conditions.push('t.Department = @Department')
  }
  if (createdBy) {
    request.input('CreatedBy', sql.Int, createdBy)
    conditions.push('t.CreatedBy = @CreatedBy')
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const query = `
    SELECT 
      t.*,
      u.Name AS CreatorName,
      (SELECT COUNT(*) FROM TestQuestions WHERE TestId = t.TestId) AS QuestionCount
    FROM Tests t
    LEFT JOIN Users u ON t.CreatedBy = u.UserId
    ${whereClause}
    ORDER BY t.CreatedAt DESC
  `
  const result = await request.query(query)
  return result.recordset.map((row) => ({
    _id: row.TestId,
    id: row.TestId,
    TestId: row.TestId,
    title: row.Title,
    subject: row.Subject,
    department: row.Department,
    duration: row.Duration,
    createdBy: row.CreatedBy,
    creatorName: row.CreatorName,
    questionCount: row.QuestionCount,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  }))
}

// Get single test with its questions and options
exports.getTestById = async (testId, includeCorrectAnswer = false) => {
  const pool = await getPool()
  const testResult = await pool.request()
    .input('TestId', sql.Int, testId)
    .query(`
      SELECT t.*, u.Name AS CreatorName
      FROM Tests t
      LEFT JOIN Users u ON t.CreatedBy = u.UserId
      WHERE t.TestId = @TestId
    `)

  if (testResult.recordset.length === 0) return null
  const testRow = testResult.recordset[0]

  // Get questions
  const questionsResult = await pool.request()
    .input('TestId', sql.Int, testId)
    .query(`
      SELECT * FROM TestQuestions
      WHERE TestId = @TestId
      ORDER BY QuestionOrder ASC
    `)

  // Get all options for these questions
  const optionsResult = await pool.request()
    .input('TestId', sql.Int, testId)
    .query(`
      SELECT qo.* 
      FROM QuestionOptions qo
      INNER JOIN TestQuestions tq ON qo.QuestionId = tq.QuestionId
      WHERE tq.TestId = @TestId
      ORDER BY qo.QuestionId ASC, qo.OptionOrder ASC
    `)

  // Assemble question objects
  const questions = questionsResult.recordset.map((q) => {
    const qOptions = optionsResult.recordset.filter((o) => o.QuestionId === q.QuestionId)
    const optionsText = qOptions.map((o) => o.OptionText)
    const correctIdx = qOptions.findIndex((o) => o.IsCorrect === true || o.IsCorrect === 1)

    const qObj = {
      _id: q.QuestionId,
      id: q.QuestionId,
      QuestionId: q.QuestionId,
      question: q.QuestionText,
      options: optionsText,
      rawOptions: qOptions.map((o) => ({
        optionId: o.OptionId,
        optionText: o.OptionText,
        optionOrder: o.OptionOrder,
        isCorrect: o.IsCorrect,
      })),
    }

    if (includeCorrectAnswer) {
      qObj.correctAnswer = correctIdx >= 0 ? correctIdx : 0
    }
    return qObj
  })

  return formatTest(testRow, questions)
}

// Delete test
exports.deleteTest = async (testId) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('TestId', sql.Int, testId)
    .query(`DELETE FROM Tests WHERE TestId = @TestId`)
  return result.rowsAffected[0] > 0
}
