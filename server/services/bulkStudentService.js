const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/db');
const { validateName } = require('../utils/nameValidator');
const { validateRegNum } = require('../utils/regNumValidator');
const { validatePassword } = require('../utils/passwordValidator');
const yearRepository = require('../repositories/yearRepository');
const { STATUS, MIGRATED_STATUS } = require('../common');

// Column mapping aliases for flexible header parsing
const COLUMN_ALIASES = {
  name: ['name', 'student name', 'studentname', 'full name', 'fullname'],
  regnum: ['regnum', 'reg num', 'reg_num', 'regno', 'reg no', 'registernumber', 'register number', 'registration number', 'register no'],
  email: ['email', 'email id', 'emailid', 'email address', 'mail'],
  department: ['department', 'dept', 'department name', 'dept name', 'department code', 'dept code'],
  year: ['year', 'academic year', 'year name', 'yearid', 'year id'],
  batch: ['batch', 'academic batch', 'batch year'],
  semester: ['semester', 'sem'],
  phone: ['phone', 'phone number', 'mobile', 'mobile number', 'contact'],
  password: ['password', 'pass'],
};

// Required columns that MUST be present in the spreadsheet header
const REQUIRED_COLUMNS = ['name', 'regnum', 'email', 'department', 'year'];

/**
 * Normalizes header string: removes extra spaces, punctuation, lowercase
 */
function normalizeHeader(header) {
  if (!header) return '';
  return String(header).trim().toLowerCase().replace(/[\-_]/g, ' ').replace(/\s+/g, ' ');
}

/**
 * Maps Excel row headers to standardized keys
 */
function mapRowKeys(row) {
  const mapped = {};
  for (const rawKey of Object.keys(row)) {
    const norm = normalizeHeader(rawKey);
    let matchedStandardKey = null;

    for (const [standardKey, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (norm === standardKey || aliases.includes(norm)) {
        matchedStandardKey = standardKey;
        break;
      }
    }

    if (matchedStandardKey) {
      mapped[matchedStandardKey] = row[rawKey];
    } else {
      mapped[norm] = row[rawKey];
    }
  }
  return mapped;
}

/**
 * Parses and validates an uploaded Excel buffer
 * @param {Buffer} buffer - Excel file buffer
 * @returns {Promise<{ valid: boolean, totalRows: number, validCount: number, errorCount: number, errors: Array, validStudents: Array, preview: Array }>}
 */
async function validateStudentExcelBuffer(buffer) {
  let workbook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer' });
  } catch (err) {
    throw new Error('Invalid spreadsheet file. Please upload a valid .xlsx, .xls, or .csv file.');
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Spreadsheet contains no sheets.');
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('Spreadsheet contains no data rows.');
  }

  // 1. Check Header Row for Required Columns
  const firstRow = rawRows[0];
  const detectedHeaders = Object.keys(firstRow).map(normalizeHeader);
  const detectedStandardKeys = new Set();

  for (const rawKey of Object.keys(firstRow)) {
    const norm = normalizeHeader(rawKey);
    for (const [standardKey, aliases] of Object.entries(COLUMN_ALIASES)) {
      if (norm === standardKey || aliases.includes(norm)) {
        detectedStandardKeys.add(standardKey);
      }
    }
  }

  const missingColumns = REQUIRED_COLUMNS.filter(col => !detectedStandardKeys.has(col));
  if (missingColumns.length > 0) {
    const missingFormatted = missingColumns.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ');
    throw new Error(`Spreadsheet is missing required column(s): [${missingFormatted}]. Required headers: Name, Regnum, Email, Department, Year.`);
  }

  // 2. Preload Database references for fast validation
  const pool = await getPool();

  // Load departments
  const deptResult = await pool.request().query('SELECT DepartmentId, DepartmentName, DepartmentCode, PrefixCode FROM Departments');
  const departments = deptResult.recordset;

  // Load existing emails & regnums
  const emailsResult = await pool.request().query(`
    SELECT LOWER(Email) AS Email FROM Students
    UNION
    SELECT LOWER(Email) FROM Staff
    UNION
    SELECT LOWER(Email) FROM Admins
  `);
  const existingEmails = new Set(emailsResult.recordset.map(r => r.Email));

  const regnumsResult = await pool.request().query(`
    SELECT UPPER(Regnum) AS Regnum FROM Students
    UNION
    SELECT UPPER(Regnum) FROM Staff
  `);
  const existingRegnums = new Set(regnumsResult.recordset.map(r => r.Regnum));

  // 3. Validate Each Row
  const errors = [];
  const validStudents = [];
  const seenEmailsInFile = new Map(); // email -> rowNumber
  const seenRegnumsInFile = new Map(); // regnum -> rowNumber

  for (let idx = 0; idx < rawRows.length; idx++) {
    const rowNum = idx + 2; // Row 1 is header in Excel
    const mapped = mapRowKeys(rawRows[idx]);

    // Check if entire row is blank
    const allValuesEmpty = Object.values(mapped).every(v => v === '' || v === null || v === undefined);
    if (allValuesEmpty) continue;

    const rowErrors = [];

    // ── Field 1: Name ──
    const name = String(mapped.name || '').trim();
    if (!name) {
      rowErrors.push({ field: 'name', message: 'Name is required' });
    } else {
      const nameVal = validateName(name);
      if (!nameVal.valid) {
        rowErrors.push({ field: 'name', message: nameVal.message });
      }
    }

    // ── Field 2: Email ──
    const email = String(mapped.email || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      rowErrors.push({ field: 'email', message: 'Email is required' });
    } else if (!emailRegex.test(email)) {
      rowErrors.push({ field: 'email', message: `Invalid email format: '${email}'` });
    } else if (seenEmailsInFile.has(email)) {
      rowErrors.push({ field: 'email', message: `Duplicate email '${email}' in row ${rowNum} (already seen in row ${seenEmailsInFile.get(email)})` });
    } else if (existingEmails.has(email)) {
      rowErrors.push({ field: 'email', message: `Email '${email}' is already registered in the system` });
    } else {
      seenEmailsInFile.set(email, rowNum);
    }

    // ── Field 3: Department ──
    const deptInput = String(mapped.department || '').trim();
    let matchedDept = null;
    if (!deptInput) {
      rowErrors.push({ field: 'department', message: 'Department is required' });
    } else {
      const normDept = deptInput.toLowerCase();
      matchedDept = departments.find(d => 
        d.DepartmentName.toLowerCase() === normDept ||
        d.DepartmentCode.toLowerCase() === normDept ||
        d.PrefixCode.toLowerCase() === normDept
      );

      if (!matchedDept) {
        rowErrors.push({ field: 'department', message: `Unknown department '${deptInput}'. Must match a valid college department (e.g. CSE, IT, AIDS, ECE, Mech).` });
      }
    }

    // ── Field 4: Registration Number ──
    const rawRegnum = String(mapped.regnum || '').trim().toUpperCase();
    if (!rawRegnum) {
      rowErrors.push({ field: 'regnum', message: 'Registration number is required' });
    } else {
      // Validate format & department match
      const deptNameForVal = matchedDept ? matchedDept.DepartmentName : undefined;
      const regVal = validateRegNum(rawRegnum, 'student', deptNameForVal);
      if (!regVal.valid) {
        rowErrors.push({ field: 'regnum', message: regVal.message });
      } else if (seenRegnumsInFile.has(rawRegnum)) {
        rowErrors.push({ field: 'regnum', message: `Duplicate registration number '${rawRegnum}' in row ${rowNum} (already seen in row ${seenRegnumsInFile.get(rawRegnum)})` });
      } else if (existingRegnums.has(rawRegnum)) {
        rowErrors.push({ field: 'regnum', message: `Registration number '${rawRegnum}' is already registered in the system` });
      } else {
        seenRegnumsInFile.set(rawRegnum, rowNum);
      }
    }

    // ── Field 5: Year ──
    const yearInput = mapped.year;
    let resolvedYearId = null;
    if (!yearInput && yearInput !== 0) {
      rowErrors.push({ field: 'year', message: 'Academic Year is required' });
    } else {
      resolvedYearId = await yearRepository.resolveYearId(yearInput);
      if (!resolvedYearId) {
        rowErrors.push({ field: 'year', message: `Invalid academic year '${yearInput}'. Valid values: First Year, Second Year, Third Year, Final Year (or 1, 2, 3, 4).` });
      }
    }

    // ── Optional Fields ──
    const phone = String(mapped.phone || '').trim();
    if (phone && !/^[0-9+\-\s]{7,20}$/.test(phone)) {
      rowErrors.push({ field: 'phone', message: `Invalid phone number '${phone}'` });
    }

    let semester = mapped.semester !== '' && mapped.semester !== undefined ? Number(mapped.semester) : null;
    if (semester !== null) {
      if (isNaN(semester) || semester < 1 || semester > 8) {
        rowErrors.push({ field: 'semester', message: `Semester must be an integer between 1 and 8` });
      }
    } else if (resolvedYearId) {
      // Default semester based on year if omitted
      semester = resolvedYearId === 1 ? 1 : resolvedYearId === 2 ? 3 : resolvedYearId === 3 ? 5 : 7;
    }

    let batch = String(mapped.batch || '').trim();
    if (!batch && resolvedYearId) {
      // Default batch based on year
      const currentYear = new Date().getFullYear();
      if (resolvedYearId === 1) batch = `${currentYear}-${currentYear + 4}`;
      else if (resolvedYearId === 2) batch = `${currentYear - 1}-${currentYear + 3}`;
      else if (resolvedYearId === 3) batch = `${currentYear - 2}-${currentYear + 2}`;
      else if (resolvedYearId === 4) batch = `${currentYear - 3}-${currentYear + 1}`;
    }

    const password = String(mapped.password || '').trim();
    if (password) {
      const passVal = validatePassword(password);
      if (!passVal.valid) {
        rowErrors.push({ field: 'password', message: passVal.message });
      }
    }

    if (rowErrors.length > 0) {
      errors.push({
        rowNumber: rowNum,
        name: name || `Row ${rowNum}`,
        regnum: rawRegnum || '—',
        email: email || '—',
        issues: rowErrors,
      });
    } else {
      validStudents.push({
        rowNumber: rowNum,
        name,
        email,
        regnum: rawRegnum,
        departmentId: matchedDept.DepartmentId,
        departmentName: matchedDept.DepartmentName,
        prefixCode: matchedDept.PrefixCode,
        yearId: resolvedYearId,
        batch: batch || '',
        semester: semester || null,
        phone: phone || '',
        password: password || `Egspec@${rawRegnum}`,
      });
    }
  }

  const totalRows = rawRows.length;
  const validCount = validStudents.length;
  const errorCount = errors.length;

  return {
    valid: errorCount === 0,
    totalRows,
    validCount,
    errorCount,
    errors,
    validStudents,
    preview: validStudents.slice(0, 10),
  };
}

/**
 * Inserts validated students into the Students table in a single atomic transaction
 * @param {Array} validStudents - Array of validated student objects
 * @returns {Promise<{ insertedCount: number, students: Array }>}
 */
async function insertBulkStudents(validStudents) {
  if (!validStudents || validStudents.length === 0) {
    return { insertedCount: 0, students: [] };
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    // 1. Group students by Department PrefixCode to manage sequential StudentId generation
    const prefixSeqMap = {};

    // Get current max sequences for all prefixes needed
    for (const stu of validStudents) {
      const prefix = stu.prefixCode;
      if (prefixSeqMap[prefix] === undefined) {
        const seqReq = new sql.Request(transaction)
          .input('PrefixPattern', sql.VarChar(15), `${prefix}%`)
          .input('PrefixLen', sql.Int, prefix.length);

        const seqResult = await seqReq.query(`
          SELECT MAX(CAST(SUBSTRING(StudentId, @PrefixLen + 1, 10) AS INT)) AS MaxSeq
          FROM Students
          WHERE StudentId LIKE @PrefixPattern
            AND ISNUMERIC(SUBSTRING(StudentId, @PrefixLen + 1, 10)) = 1
        `);

        prefixSeqMap[prefix] = seqResult.recordset[0]?.MaxSeq || 0;
      }
    }

    const insertedStudents = [];

    // 2. Insert each student
    for (const stu of validStudents) {
      const prefix = stu.prefixCode;
      prefixSeqMap[prefix] += 1;
      const nextSeq = prefixSeqMap[prefix];
      const studentId = `${prefix}${String(nextSeq).padStart(3, '0')}`;

      const hashedPassword = await bcrypt.hash(stu.password, 10);

      const insReq = new sql.Request(transaction);
      await insReq
        .input('StudentId', sql.NVarChar(50), studentId)
        .input('DepartmentId', sql.Int, stu.departmentId)
        .input('YearId', sql.Int, stu.yearId)
        .input('Name', sql.NVarChar(100), stu.name)
        .input('Regnum', sql.NVarChar(50), stu.regnum)
        .input('Email', sql.NVarChar(255), stu.email)
        .input('Phone', sql.NVarChar(20), stu.phone || '')
        .input('Password', sql.NVarChar(255), hashedPassword)
        .input('Batch', sql.NVarChar(20), stu.batch || '')
        .input('Semester', sql.TinyInt, stu.semester)
        .query(`
          INSERT INTO Students (
            StudentId, DepartmentId, YearId,
            Name, Regnum, Email, Phone, Password, Batch, Semester, IsActive, IsMigrated
          )
          VALUES (
            @StudentId, @DepartmentId, @YearId,
            @Name, @Regnum, @Email, @Phone, @Password, @Batch, @Semester, 1, 1
          )
        `);

      insertedStudents.push({
        studentId,
        name: stu.name,
        email: stu.email,
        regnum: stu.regnum,
        department: stu.departmentName,
        isActive: STATUS.ACTIVE,
        isMigrated: MIGRATED_STATUS.MIGRATED,
      });
    }

    await transaction.commit();
    return {
      insertedCount: insertedStudents.length,
      students: insertedStudents,
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/**
 * Generates an Excel workbook template with sample student records and instructions
 * @returns {Buffer} - Excel workbook buffer (.xlsx)
 */
function generateSampleExcelTemplate() {
  const sampleData = [
    {
      'Name': 'Abinesh R',
      'Regnum': '8208E24CSR001',
      'Email': 'abinesh.cse@egspec.edu',
      'Department': 'Computer Science and Engineering',
      'Year': 'First Year',
      'Batch': '2024-2028',
      'Semester': 1,
      'Phone': '9876543210',
      'Password': 'Student@123',
    },
    {
      'Name': 'Sneha K',
      'Regnum': '8208E23ITR001',
      'Email': 'sneha.it@egspec.edu',
      'Department': 'Information Technology',
      'Year': 'Second Year',
      'Batch': '2023-2027',
      'Semester': 3,
      'Phone': '9876543211',
      'Password': 'Student@123',
    },
    {
      'Name': 'Karthik V',
      'Regnum': '8208E23ADR001',
      'Email': 'karthik.ai@egspec.edu',
      'Department': 'Artificial Intelligence and Data Science',
      'Year': 'Third Year',
      'Batch': '2022-2026',
      'Semester': 5,
      'Phone': '9876543212',
      'Password': 'Student@123',
    },
    {
      'Name': 'Pooja M',
      'Regnum': '8208E23BSR002',
      'Email': 'pooja.bs@egspec.edu',
      'Department': 'Computer Science and Business Systems',
      'Year': 'Final Year',
      'Batch': '2021-2025',
      'Semester': 7,
      'Phone': '9876543213',
      'Password': 'Student@123',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths for readability
  ws['!cols'] = [
    { wch: 20 }, // Name
    { wch: 18 }, // Regnum
    { wch: 28 }, // Email
    { wch: 42 }, // Department
    { wch: 15 }, // Year
    { wch: 14 }, // Batch
    { wch: 10 }, // Semester
    { wch: 16 }, // Phone
    { wch: 16 }, // Password
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students_Template');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
  REQUIRED_COLUMNS,
  validateStudentExcelBuffer,
  insertBulkStudents,
  generateSampleExcelTemplate,
};
