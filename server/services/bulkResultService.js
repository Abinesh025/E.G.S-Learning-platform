const XLSX = require('xlsx');
const { getPool, sql } = require('../config/db');

const COLUMN_ALIASES = {
  studentRegnum: ['student regnum', 'regnum', 'reg no', 'register number', 'registration number', 'student reg no', 'reg_num', 'regno'],
  studentId: ['student id', 'studentid', 'roll no', 'student unique id', 'student code', 'unique id'],
  studentName: ['student name', 'studentname', 'name', 'full name'],
  testTitle: ['test title', 'testtitle', 'test name', 'title', 'assessment title', 'exam title'],
  testId: ['test id', 'testid', 'test_id'],
  subject: ['subject', 'course', 'subject name'],
  score: ['score', 'marks', 'marks obtained', 'mark', 'points'],
  totalMarks: ['total marks', 'totalmarks', 'max marks', 'maximum marks', 'total'],
  percentage: ['percentage', 'percent', '%', 'pct'],
  totalQuestions: ['total questions', 'totalquestions', 'questions count', 'questions'],
  smsStatus: ['sms status', 'smsstatus', 'sms', 'sms alert'],
  submissionDate: ['submission date', 'date', 'created at', 'submitted at', 'exam date'],
};

const REQUIRED_COLUMNS = ['testTitle', 'score'];

function normalizeHeader(header) {
  if (!header) return '';
  return String(header).trim().toLowerCase().replace(/[\-_]/g, ' ').replace(/\s+/g, ' ');
}

function matchKey(rawKey) {
  const norm = normalizeHeader(rawKey);
  const stripped = norm.replace(/\s+/g, '');

  for (const [standardKey, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (
      norm === standardKey.toLowerCase() ||
      stripped === standardKey.toLowerCase() ||
      aliases.includes(norm) ||
      aliases.some(a => a.replace(/\s+/g, '') === stripped)
    ) {
      return standardKey;
    }
  }
  return null;
}

function mapRowKeys(row) {
  const mapped = {};
  for (const rawKey of Object.keys(row)) {
    const matchedKey = matchKey(rawKey);
    if (matchedKey) {
      mapped[matchedKey] = row[rawKey];
    } else {
      mapped[normalizeHeader(rawKey)] = row[rawKey];
    }
  }
  return mapped;
}

/**
 * Validates uploaded Excel buffer for results
 */
async function validateResultExcelBuffer(buffer) {
  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch (err) {
    throw new Error('Invalid spreadsheet file. Please upload a valid .xlsx, .xls, or .csv file.');
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('Spreadsheet contains no sheets.');

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('Spreadsheet contains no data rows.');
  }

  // 1. Check Header Row
  const firstRow = rawRows[0];
  const detectedStandardKeys = new Set();
  for (const rawKey of Object.keys(firstRow)) {
    const matched = matchKey(rawKey);
    if (matched) detectedStandardKeys.add(matched);
  }

  // At least StudentRegnum or StudentId must be present
  const hasStudentIdent = detectedStandardKeys.has('studentRegnum') || detectedStandardKeys.has('studentId');
  if (!hasStudentIdent) {
    throw new Error('Spreadsheet must contain either "StudentRegnum" or "StudentId" column to identify students.');
  }

  const missingColumns = REQUIRED_COLUMNS.filter(col => !detectedStandardKeys.has(col));
  if (missingColumns.length > 0) {
    const missingFormatted = missingColumns.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ');
    throw new Error(`Spreadsheet is missing required column(s): [${missingFormatted}]. Required headers: StudentRegnum / StudentId, TestTitle, Score.`);
  }

  // 2. Preload Students and Tests
  const pool = await getPool();

  const studentsRes = await pool.request().query('SELECT StudentId, Regnum, Name, DepartmentId FROM Students');
  const students = studentsRes.recordset;
  const studentMap = new Map();
  for (const s of students) {
    if (s.StudentId) studentMap.set(String(s.StudentId).trim().toUpperCase(), s);
    if (s.Regnum) studentMap.set(String(s.Regnum).trim().toUpperCase(), s);
  }

  const testsRes = await pool.request().query('SELECT TestId, Title, Subject, Department FROM Tests');
  const tests = testsRes.recordset;
  const testMap = new Map();
  for (const t of tests) {
    if (t.TestId) testMap.set(String(t.TestId).trim(), t);
    if (t.Title) testMap.set(String(t.Title).trim().toLowerCase(), t);
  }

  const validResults = [];
  const errors = [];

  for (let idx = 0; idx < rawRows.length; idx++) {
    const rowNumber = idx + 2;
    const row = mapRowKeys(rawRows[idx]);
    const rowErrors = [];

    // 1. Resolve Student
    const rawStudentId = String(row.studentId || '').trim().toUpperCase();
    const rawStudentReg = String(row.studentRegnum || '').trim().toUpperCase();
    let resolvedStudent = null;

    if (rawStudentReg && studentMap.has(rawStudentReg)) {
      resolvedStudent = studentMap.get(rawStudentReg);
    } else if (rawStudentId && studentMap.has(rawStudentId)) {
      resolvedStudent = studentMap.get(rawStudentId);
    }

    if (!resolvedStudent) {
      rowErrors.push(`Student with Regnum/Id '${rawStudentReg || rawStudentId}' was not found in Students database.`);
    }

    // 2. Resolve Test
    const rawTestId = String(row.testId || '').trim();
    const rawTestTitle = String(row.testTitle || '').trim();
    let resolvedTest = null;

    if (rawTestId && testMap.has(rawTestId)) {
      resolvedTest = testMap.get(rawTestId);
    } else if (rawTestTitle && testMap.has(rawTestTitle.toLowerCase())) {
      resolvedTest = testMap.get(rawTestTitle.toLowerCase());
    }

    if (!resolvedTest) {
      if (!rawTestTitle) {
        rowErrors.push('Test title is required');
      } else {
        // We can create test dynamically or track it
        resolvedTest = {
          TestId: null, // will create if needed
          Title: rawTestTitle,
          Subject: String(row.subject || 'General Assessment').trim(),
          Department: '',
        };
      }
    }

    // 3. Resolve Scores
    const scoreVal = Number(row.score);
    if (isNaN(scoreVal) || scoreVal < 0) {
      rowErrors.push('Score must be a non-negative number');
    }

    let totalMarks = Number(row.totalMarks);
    if (isNaN(totalMarks) || totalMarks <= 0) {
      totalMarks = scoreVal > 0 ? (scoreVal <= 20 ? 20 : scoreVal <= 30 ? 30 : 100) : 100;
    }

    if (scoreVal > totalMarks) {
      rowErrors.push(`Score (${scoreVal}) cannot exceed Total Marks (${totalMarks})`);
    }

    let percentage = Number(row.percentage);
    if (isNaN(percentage) || percentage <= 0) {
      percentage = totalMarks > 0 ? Number(((scoreVal / totalMarks) * 100).toFixed(2)) : 0;
    }

    const totalQuestions = Number(row.totalQuestions) > 0 ? Number(row.totalQuestions) : Math.round(totalMarks);
    const smsStatus = String(row.smsStatus || 'not_sent').toLowerCase().trim();

    if (rowErrors.length > 0) {
      errors.push({
        row: rowNumber,
        student: rawStudentReg || rawStudentId || 'N/A',
        test: rawTestTitle || 'N/A',
        errors: rowErrors,
      });
    } else {
      validResults.push({
        studentId: resolvedStudent.StudentId,
        studentRegnum: resolvedStudent.Regnum,
        studentName: resolvedStudent.Name,
        testId: resolvedTest.TestId,
        testTitle: resolvedTest.Title,
        subject: resolvedTest.Subject || String(row.subject || 'General Assessment').trim(),
        score: scoreVal,
        totalMarks,
        percentage,
        totalQuestions,
        smsStatus: smsStatus === 'sent' ? 'sent' : 'not_sent',
        submissionDate: row.submissionDate || new Date().toISOString(),
      });
    }
  }

  return {
    valid: errors.length === 0,
    totalRows: rawRows.length,
    validCount: validResults.length,
    errorCount: errors.length,
    errors,
    validResults,
    preview: validResults.slice(0, 10),
  };
}

/**
 * Inserts pre-validated results and submissions into SQL Server
 */
async function insertBulkResults(validResults) {
  if (!validResults || validResults.length === 0) {
    return { insertedCount: 0, results: [] };
  }

  const pool = await getPool();
  const insertedResults = [];

  // Pre-load or create tests that are referenced by title but not in DB yet
  const testMap = new Map();
  const existingTests = (await pool.request().query('SELECT TestId, Title FROM Tests')).recordset;
  for (const t of existingTests) {
    testMap.set(t.Title.toLowerCase().trim(), t.TestId);
  }

  for (const r of validResults) {
    let testId = r.testId;

    if (!testId && r.testTitle) {
      const lowerTitle = r.testTitle.toLowerCase().trim();
      if (testMap.has(lowerTitle)) {
        testId = testMap.get(lowerTitle);
      } else {
        // Create the test header on the fly
        const newTestRes = await pool.request()
          .input('Title', sql.NVarChar(200), r.testTitle)
          .input('Subject', sql.NVarChar(100), r.subject || 'Assessment')
          .input('Department', sql.NVarChar(100), '')
          .input('Duration', sql.Int, 30)
          .input('CreatedBy', sql.Int, 1)
          .query(`
            INSERT INTO Tests (Title, Subject, Department, Duration, CreatedBy)
            OUTPUT INSERTED.TestId
            VALUES (@Title, @Subject, @Department, @Duration, @CreatedBy)
          `);
        testId = newTestRes.recordset[0].TestId;
        testMap.set(lowerTitle, testId);
      }
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Insert or update Result
      const resReq = new sql.Request(transaction);
      const resResult = await resReq
        .input('StudentId', sql.NVarChar(50), String(r.studentId))
        .input('TestId', sql.Int, testId)
        .input('Score', sql.Decimal(5, 2), r.score)
        .input('TotalMarks', sql.Decimal(5, 2), r.totalMarks)
        .input('Percentage', sql.Decimal(5, 2), r.percentage)
        .query(`
          INSERT INTO Results (StudentId, TestId, Score, TotalMarks, Percentage)
          OUTPUT INSERTED.*
          VALUES (@StudentId, @TestId, @Score, @TotalMarks, @Percentage)
        `);
      const createdResult = resResult.recordset[0];

      // 2. Insert TestSubmission
      const subReq = new sql.Request(transaction);
      await subReq
        .input('StudentId', sql.NVarChar(50), String(r.studentId))
        .input('TestId', sql.Int, testId)
        .input('Score', sql.Int, Math.round(r.score))
        .input('TotalQuestions', sql.Int, r.totalQuestions || 20)
        .input('SmsStatus', sql.VarChar(20), r.smsStatus || 'not_sent')
        .input('SmsSentAt', sql.DateTime2, r.smsStatus === 'sent' ? new Date() : null)
        .query(`
          INSERT INTO TestSubmissions (StudentId, TestId, Score, TotalQuestions, SmsStatus, SmsSentAt)
          VALUES (@StudentId, @TestId, @Score, @TotalQuestions, @SmsStatus, @SmsSentAt)
        `);

      await transaction.commit();
      insertedResults.push(createdResult);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  return {
    insertedCount: insertedResults.length,
    results: insertedResults,
  };
}

/**
 * Generates sample Excel buffer for results
 */
function generateSampleResultExcelTemplate() {
  const sampleData = [
    {
      StudentRegnum: '8208E26ADR061',
      StudentId: 'ADR001',
      StudentName: 'Vaishnavi Nair',
      TestTitle: 'Computer Networks Unit 1 Assessment',
      Subject: 'Computer Networks',
      Score: 27.0,
      TotalMarks: 30.0,
      Percentage: 90.0,
      TotalQuestions: 30,
      SmsStatus: 'sent',
      SubmissionDate: '2026-11-18 14:15:00',
    },
    {
      StudentRegnum: '8208E26CSR001',
      StudentId: 'CSR001',
      StudentName: 'Aravind Swaminathan',
      TestTitle: 'Computer Networks Unit 1 Assessment',
      Subject: 'Computer Networks',
      Score: 24.0,
      TotalMarks: 30.0,
      Percentage: 80.0,
      TotalQuestions: 30,
      SmsStatus: 'sent',
      SubmissionDate: '2026-11-18 14:20:00',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Results');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
  validateResultExcelBuffer,
  insertBulkResults,
  generateSampleResultExcelTemplate,
};
