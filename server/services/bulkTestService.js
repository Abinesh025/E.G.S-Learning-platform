const XLSX = require('xlsx');
const { getPool, sql } = require('../config/db');

const COLUMN_ALIASES = {
  testTitle: ['test title', 'testtitle', 'title', 'test name', 'exam title', 'test'],
  subject: ['subject', 'course', 'subject name'],
  department: ['department', 'dept', 'department name', 'dept name', 'department code', 'dept code'],
  durationMinutes: ['duration', 'duration minutes', 'duration min', 'time', 'exam duration', 'duration (minutes)'],
  staffRegnum: ['staff regnum', 'staff id', 'created by', 'faculty id', 'staffregnum'],
  questionOrder: ['question order', 'question no', 'qno', 'no', 'order'],
  questionText: ['question text', 'question', 'questiontext', 'problem'],
  optionA: ['option a', 'option 1', 'optiona', 'a', 'choice a', 'choice 1'],
  optionB: ['option b', 'option 2', 'optionb', 'b', 'choice b', 'choice 2'],
  optionC: ['option c', 'option 3', 'optionc', 'c', 'choice c', 'choice 3'],
  optionD: ['option d', 'option 4', 'optiond', 'd', 'choice d', 'choice 4'],
  correctOption: ['correct option', 'correctoption', 'correct answer', 'correctanswer', 'answer', 'ans', 'correct', 'key'],
};

const REQUIRED_COLUMNS = ['testTitle', 'subject', 'department', 'questionText', 'optionA', 'optionB', 'correctOption'];

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
 * Validates uploaded Excel buffer for tests
 */
async function validateTestExcelBuffer(buffer) {
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

  const missingColumns = REQUIRED_COLUMNS.filter(col => !detectedStandardKeys.has(col));
  if (missingColumns.length > 0) {
    const missingFormatted = missingColumns.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ');
    throw new Error(`Spreadsheet is missing required column(s): [${missingFormatted}]. Required headers: TestTitle, Subject, Department, QuestionText, OptionA, OptionB, CorrectOption.`);
  }

  // 2. Preload Departments & Staff
  const pool = await getPool();
  const deptResult = await pool.request().query('SELECT DepartmentId, DepartmentName, DepartmentCode, PrefixCode FROM Departments');
  const departments = deptResult.recordset;

  const staffResult = await pool.request().query('SELECT StaffId, Regnum, Name FROM Staff');
  const staffMembers = staffResult.recordset;
  const staffMap = new Map();
  for (const s of staffMembers) {
    if (s.Regnum) staffMap.set(String(s.Regnum).trim().toUpperCase(), s);
    if (s.StaffId) staffMap.set(String(s.StaffId).trim(), s);
  }
  const defaultStaff = staffMembers[0] || { StaffId: 1, Name: 'Faculty' };

  // 3. Group and validate rows
  const testGroups = new Map(); // testKey -> { title, subject, department, duration, createdBy, questions: [] }
  const errors = [];

  for (let idx = 0; idx < rawRows.length; idx++) {
    const rowNumber = idx + 2;
    const row = mapRowKeys(rawRows[idx]);
    const rowErrors = [];

    const testTitle = String(row.testTitle || '').trim();
    if (!testTitle) rowErrors.push('Test title is required');

    const subject = String(row.subject || '').trim();
    if (!subject) rowErrors.push('Subject is required');

    const rawDept = String(row.department || '').trim();
    let matchedDept = null;
    if (!rawDept) {
      rowErrors.push('Department is required');
    } else {
      const lowerDept = rawDept.toLowerCase();
      matchedDept = departments.find(d =>
        d.DepartmentName.toLowerCase() === lowerDept ||
        d.DepartmentCode.toLowerCase() === lowerDept ||
        (d.PrefixCode && d.PrefixCode.toLowerCase() === lowerDept)
      );
      if (!matchedDept) {
        rowErrors.push(`Department '${rawDept}' is not recognized.`);
      }
    }

    const questionText = String(row.questionText || '').trim();
    if (!questionText) rowErrors.push('Question text is required');

    const optionA = String(row.optionA || '').trim();
    const optionB = String(row.optionB || '').trim();
    const optionC = String(row.optionC || '').trim();
    const optionD = String(row.optionD || '').trim();

    if (!optionA || !optionB) {
      rowErrors.push('At least Option A and Option B are required');
    }

    const options = [optionA, optionB];
    if (optionC) options.push(optionC);
    if (optionD) options.push(optionD);

    // Resolve Correct Option Index (0-based)
    const rawCorrect = String(row.correctOption || '').trim().toUpperCase();
    let correctIndex = -1;
    if (rawCorrect === 'A' || rawCorrect === '1' || rawCorrect === '0') correctIndex = 0;
    else if (rawCorrect === 'B' || rawCorrect === '2') correctIndex = 1;
    else if (rawCorrect === 'C' || rawCorrect === '3') correctIndex = 2;
    else if (rawCorrect === 'D' || rawCorrect === '4') correctIndex = 3;
    else {
      // Check if it matches option text directly
      const foundIdx = options.findIndex(o => o.toLowerCase() === rawCorrect.toLowerCase());
      if (foundIdx !== -1) correctIndex = foundIdx;
    }

    if (correctIndex === -1 || correctIndex >= options.length) {
      rowErrors.push(`Correct option '${rawCorrect}' is invalid. Must be 'A', 'B', 'C', or 'D'`);
    }

    const duration = Number(row.durationMinutes) > 0 ? Number(row.durationMinutes) : 30;

    // Staff resolution
    let createdBy = defaultStaff.StaffId;
    const rawStaffReg = String(row.staffRegnum || '').trim().toUpperCase();
    if (rawStaffReg && staffMap.has(rawStaffReg)) {
      createdBy = staffMap.get(rawStaffReg).StaffId;
    }

    if (rowErrors.length > 0) {
      errors.push({
        row: rowNumber,
        testTitle: testTitle || 'N/A',
        errors: rowErrors,
      });
    } else {
      const groupKey = `${testTitle}:::${subject}:::${matchedDept ? matchedDept.DepartmentName : rawDept}`;
      if (!testGroups.has(groupKey)) {
        testGroups.set(groupKey, {
          title: testTitle,
          subject,
          department: matchedDept ? matchedDept.DepartmentName : rawDept,
          duration,
          createdBy: Number(createdBy) || 1,
          questions: [],
        });
      }

      const group = testGroups.get(groupKey);
      group.questions.push({
        question: questionText,
        options,
        correctAnswer: correctIndex,
        questionOrder: group.questions.length + 1,
      });
    }
  }

  const validTestList = Array.from(testGroups.values());
  const totalQuestions = validTestList.reduce((acc, t) => acc + t.questions.length, 0);

  return {
    valid: errors.length === 0,
    totalRows: rawRows.length,
    validCount: totalQuestions,
    testCount: validTestList.length,
    errorCount: errors.length,
    errors,
    validTests: validTestList,
    preview: validTestList.map(t => ({
      title: t.title,
      subject: t.subject,
      department: t.department,
      duration: t.duration,
      questionsCount: t.questions.length,
    })),
  };
}

/**
 * Inserts pre-validated tests, questions, and options into SQL Server
 */
async function insertBulkTests(validTests) {
  if (!validTests || validTests.length === 0) {
    return { insertedTestsCount: 0, insertedQuestionsCount: 0, tests: [] };
  }

  const pool = await getPool();
  const createdTests = [];
  let totalQuestionsCount = 0;

  for (const t of validTests) {
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      // 1. Insert Test
      const testRequest = new sql.Request(transaction);
      const testResult = await testRequest
        .input('Title', sql.NVarChar(200), t.title)
        .input('Subject', sql.NVarChar(100), t.subject)
        .input('Department', sql.NVarChar(100), t.department || '')
        .input('Duration', sql.Int, t.duration || 30)
        .input('CreatedBy', sql.Int, t.createdBy || 1)
        .query(`
          INSERT INTO Tests (Title, Subject, Department, Duration, CreatedBy)
          OUTPUT INSERTED.*
          VALUES (@Title, @Subject, @Department, @Duration, @CreatedBy)
        `);

      const createdTest = testResult.recordset[0];
      const testId = createdTest.TestId;

      // 2. Insert Questions & Options
      for (let qIdx = 0; qIdx < t.questions.length; qIdx++) {
        const q = t.questions[qIdx];
        const qReq = new sql.Request(transaction);
        const qRes = await qReq
          .input('TestId', sql.Int, testId)
          .input('QuestionText', sql.NVarChar(sql.MAX), q.question)
          .input('QuestionOrder', sql.Int, qIdx + 1)
          .query(`
            INSERT INTO TestQuestions (TestId, QuestionText, QuestionOrder)
            OUTPUT INSERTED.*
            VALUES (@TestId, @QuestionText, @QuestionOrder)
          `);

        const createdQuestion = qRes.recordset[0];
        const questionId = createdQuestion.QuestionId;
        totalQuestionsCount++;

        for (let oIdx = 0; oIdx < q.options.length; oIdx++) {
          const optText = q.options[oIdx];
          const isCorrect = oIdx === Number(q.correctAnswer);

          const optReq = new sql.Request(transaction);
          await optReq
            .input('QuestionId', sql.Int, questionId)
            .input('OptionText', sql.NVarChar(1000), optText)
            .input('OptionOrder', sql.Int, oIdx + 1)
            .input('IsCorrect', sql.Bit, isCorrect ? 1 : 0)
            .query(`
              INSERT INTO QuestionOptions (QuestionId, OptionText, OptionOrder, IsCorrect)
              VALUES (@QuestionId, @OptionText, @OptionOrder, @IsCorrect)
            `);
        }
      }

      await transaction.commit();
      createdTests.push(createdTest);
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  return {
    insertedTestsCount: createdTests.length,
    insertedQuestionsCount: totalQuestionsCount,
    tests: createdTests,
  };
}

/**
 * Generates sample Excel buffer for tests
 */
function generateSampleTestExcelTemplate() {
  const sampleData = [
    {
      TestTitle: 'Computer Networks Unit 1 Assessment',
      Subject: 'Computer Networks',
      Department: 'Computer Science and Engineering',
      DurationMinutes: 30,
      StaffRegnum: 'EGSP001',
      QuestionOrder: 1,
      QuestionText: 'Which layer in the OSI model is responsible for port addressing?',
      OptionA: 'Physical Layer',
      OptionB: 'Data Link Layer',
      OptionC: 'Network Layer',
      OptionD: 'Transport Layer',
      CorrectOption: 'D',
    },
    {
      TestTitle: 'Computer Networks Unit 1 Assessment',
      Subject: 'Computer Networks',
      Department: 'Computer Science and Engineering',
      DurationMinutes: 30,
      StaffRegnum: 'EGSP001',
      QuestionOrder: 2,
      QuestionText: 'What is the standard port number for HTTPS?',
      OptionA: '80',
      OptionB: '443',
      OptionC: '8080',
      OptionD: '22',
      CorrectOption: 'B',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tests');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
  validateTestExcelBuffer,
  insertBulkTests,
  generateSampleTestExcelTemplate,
};
