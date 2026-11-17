const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const { getPool, sql } = require('../config/db');
const { validateName } = require('../utils/nameValidator');
const { validateRegNum } = require('../utils/regNumValidator');
const { validatePassword } = require('../utils/passwordValidator');
const { STATUS } = require('../common');

// Column mapping aliases for flexible header parsing
const COLUMN_ALIASES = {
  name: ['name', 'staff name', 'staffname', 'faculty name', 'faculty', 'teacher name', 'full name', 'fullname'],
  regnum: ['regnum', 'reg num', 'reg_num', 'regno', 'reg no', 'staff regnum', 'staff id', 'staffid', 'register number', 'registration number', 'register no', 'employee id', 'empid'],
  email: ['email', 'email id', 'emailid', 'email address', 'mail'],
  department: ['department', 'dept', 'department name', 'dept name', 'department code', 'dept code'],
  designation: ['designation', 'role', 'post', 'position', 'title'],
  phone: ['phone', 'phone number', 'mobile', 'mobile number', 'contact'],
  password: ['password', 'pass'],
};

// Required columns that MUST be present in the spreadsheet header
const REQUIRED_COLUMNS = ['name', 'regnum', 'email', 'department'];

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
 * Parses and validates an uploaded Excel buffer for Staff
 * @param {Buffer} buffer - Excel file buffer
 * @returns {Promise<{ valid: boolean, totalRows: number, validCount: number, errorCount: number, errors: Array, validStaff: Array, preview: Array }>}
 */
async function validateStaffExcelBuffer(buffer) {
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
    throw new Error(`Spreadsheet is missing required column(s): [${missingFormatted}]. Required headers: Name, Regnum, Email, Department.`);
  }

  // 2. Preload Database references for fast validation
  const pool = await getPool();

  // Load departments
  const deptResult = await pool.request().query('SELECT DepartmentId, DepartmentName, DepartmentCode, PrefixCode FROM Departments');
  const departments = deptResult.recordset;

  // Load existing emails
  const emailsResult = await pool.request().query(`
    SELECT LOWER(Email) AS Email FROM Students
    UNION
    SELECT LOWER(Email) FROM Staff
    UNION
    SELECT LOWER(Email) FROM Admins
  `);
  const existingEmails = new Set(emailsResult.recordset.map(r => r.Email));

  // Load existing regnums
  const regnumsResult = await pool.request().query(`
    SELECT UPPER(Regnum) AS Regnum FROM Students
    UNION
    SELECT UPPER(Regnum) FROM Staff
  `);
  const existingRegnums = new Set(regnumsResult.recordset.map(r => r.Regnum));

  // 3. Validate Each Row
  const errors = [];
  const validStaff = [];
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
      const regVal = validateRegNum(rawRegnum, 'staff');
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

    // ── Optional Field: Designation ──
    const designation = String(mapped.designation || '').trim() || 'Staff';

    // ── Optional Field: Phone ──
    const phone = String(mapped.phone || '').trim();
    if (phone && !/^[0-9+\-\s]{7,20}$/.test(phone)) {
      rowErrors.push({ field: 'phone', message: `Invalid phone number '${phone}'` });
    }

    // ── Optional Field: Password ──
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
      validStaff.push({
        rowNumber: rowNum,
        name,
        email,
        regnum: rawRegnum,
        departmentId: matchedDept.DepartmentId,
        departmentName: matchedDept.DepartmentName,
        designation,
        phone: phone || '',
        password: password || `Egspec@${rawRegnum}`,
      });
    }
  }

  const totalRows = rawRows.length;
  const validCount = validStaff.length;
  const errorCount = errors.length;

  return {
    valid: errorCount === 0,
    totalRows,
    validCount,
    errorCount,
    errors,
    validStaff,
    preview: validStaff.slice(0, 10),
  };
}

/**
 * Inserts validated staff into the Staff table in a single atomic transaction
 * @param {Array} validStaff - Array of validated staff objects
 * @returns {Promise<{ insertedCount: number, staff: Array }>}
 */
async function insertBulkStaff(validStaff) {
  if (!validStaff || validStaff.length === 0) {
    return { insertedCount: 0, staff: [] };
  }

  const pool = await getPool();
  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const insertedStaff = [];

    for (const member of validStaff) {
      const hashedPassword = await bcrypt.hash(member.password, 10);

      const insReq = new sql.Request(transaction);
      const res = await insReq
        .input('DepartmentId', sql.Int, member.departmentId)
        .input('Name', sql.NVarChar(100), member.name)
        .input('Email', sql.NVarChar(255), member.email)
        .input('Phone', sql.NVarChar(20), member.phone || '')
        .input('Password', sql.NVarChar(255), hashedPassword)
        .input('Avatar', sql.NVarChar(500), '')
        .input('Regnum', sql.NVarChar(50), member.regnum)
        .input('Designation', sql.NVarChar(100), member.designation || 'Staff')
        .query(`
          INSERT INTO Staff (
            DepartmentId, Name, Email, Phone, Password, Avatar, Regnum, Designation, IsActive
          )
          OUTPUT INSERTED.StaffId
          VALUES (
            @DepartmentId, @Name, @Email, @Phone, @Password, @Avatar, @Regnum, @Designation, 1
          )
        `);

      const createdStaffId = res.recordset[0]?.StaffId;

      insertedStaff.push({
        staffId: createdStaffId,
        name: member.name,
        email: member.email,
        regnum: member.regnum,
        department: member.departmentName,
        designation: member.designation,
        isActive: STATUS.ACTIVE,
      });
    }

    await transaction.commit();
    return {
      insertedCount: insertedStaff.length,
      staff: insertedStaff,
    };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}

/**
 * Generates an Excel workbook template with sample staff records and instructions
 * @returns {Buffer} - Excel workbook buffer (.xlsx)
 */
function generateSampleStaffExcelTemplate() {
  const sampleData = [
    {
      'Name': 'K Ramesh',
      'Regnum': 'EGSP001',
      'Email': 'ramesh.cse@egspec.org',
      'Department': 'Computer Science and Engineering',
      'Designation': 'Professor and HOD',
      'Phone': '9876543210',
      'Password': 'Staff@2026#',
    },
    {
      'Name': 'Priya M',
      'Regnum': 'EGSP002',
      'Email': 'priya.it@egspec.org',
      'Department': 'Information Technology',
      'Designation': 'Assistant Professor',
      'Phone': '9876543211',
      'Password': 'Staff@2026#',
    },
    {
      'Name': 'Anand S',
      'Regnum': 'EGSPE003',
      'Email': 'anand.aids@egspec.org',
      'Department': 'Artificial Intelligence and Data Science',
      'Designation': 'Associate Professor',
      'Phone': '9876543212',
      'Password': 'Staff@2026#',
    },
    {
      'Name': 'Rajesh V',
      'Regnum': 'EGSP004',
      'Email': 'rajesh.mech@egspec.org',
      'Department': 'Mechanical Engineering',
      'Designation': 'Professor',
      'Phone': '9876543213',
      'Password': 'Staff@2026#',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths for readability
  ws['!cols'] = [
    { wch: 22 }, // Name
    { wch: 16 }, // Regnum
    { wch: 28 }, // Email
    { wch: 42 }, // Department
    { wch: 24 }, // Designation
    { wch: 16 }, // Phone
    { wch: 16 }, // Password
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Staff_Template');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
  REQUIRED_COLUMNS,
  validateStaffExcelBuffer,
  insertBulkStaff,
  generateSampleStaffExcelTemplate,
};
