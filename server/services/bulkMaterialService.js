const XLSX = require('xlsx');
const { getPool, sql } = require('../config/db');

const COLUMN_ALIASES = {
  title: ['title', 'material title', 'name', 'topic title', 'heading'],
  subject: ['subject', 'course title', 'subject code'],
  subjectName: ['subject name', 'subjectname', 'full subject name', 'subject title'],
  unit: ['unit', 'unit number', 'unit no', 'unitname'],
  fileType: ['file type', 'filetype', 'type', 'format', 'ext'],
  fileUrl: ['file url', 'fileurl', 'url', 'link', 'download url', 'path'],
  department: ['department', 'dept', 'department name', 'dept name', 'department code', 'dept code'],
  semester: ['semester', 'sem', 'semester no', 'term'],
  course: ['course', 'course code', 'course id', 'subject code'],
  staffRegnum: ['staff regnum', 'staff id', 'staffregnum', 'staffid', 'faculty id', 'uploaded by', 'faculty regnum'],
  staffName: ['staff name', 'staffname', 'faculty name', 'faculty', 'uploader name', 'teacher name'],
};

const REQUIRED_COLUMNS = ['title', 'subject', 'unit', 'department'];

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
 * Validates uploaded Excel buffer for materials
 */
async function validateMaterialExcelBuffer(buffer) {
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
    throw new Error(`Spreadsheet is missing required column(s): [${missingFormatted}]. Required headers: Title, Subject, Unit, Department.`);
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

  const validMaterials = [];
  const errors = [];

  for (let idx = 0; idx < rawRows.length; idx++) {
    const rowNumber = idx + 2; // Row index in Excel (1-based, plus header)
    const row = mapRowKeys(rawRows[idx]);
    const rowErrors = [];

    // Title
    const title = String(row.title || '').trim();
    if (!title) {
      rowErrors.push('Title is required');
    }

    // Subject
    const subject = String(row.subject || '').trim();
    if (!subject) {
      rowErrors.push('Subject is required');
    }

    // Unit
    const unit = String(row.unit || '').trim();
    if (!unit) {
      rowErrors.push('Unit is required');
    }

    // Department matching
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
        rowErrors.push(`Department '${rawDept}' is not recognized. Valid: CSE, CSBS, AIDS, IT, ECE, EEE, MECH, CIVIL, BME, MBA, MCA`);
      }
    }

    // Semester
    let semester = null;
    if (row.semester !== '' && row.semester !== null && row.semester !== undefined) {
      const semNum = Number(row.semester);
      if (isNaN(semNum) || semNum < 1 || semNum > 8) {
        rowErrors.push('Semester must be an integer between 1 and 8');
      } else {
        semester = semNum;
      }
    }

    // Staff resolution
    let uploadedBy = defaultStaff.StaffId;
    let staffName = String(row.staffName || '').trim() || defaultStaff.Name;
    const rawStaffReg = String(row.staffRegnum || '').trim().toUpperCase();
    if (rawStaffReg && staffMap.has(rawStaffReg)) {
      const foundStaff = staffMap.get(rawStaffReg);
      uploadedBy = foundStaff.StaffId;
      staffName = foundStaff.Name;
    }

    // File URL and type
    const fileType = String(row.fileType || 'pdf').toLowerCase().trim() || 'pdf';
    const fileUrl = String(row.fileUrl || '').trim() ||
      'https://res.cloudinary.com/dwuhpjbux/raw/upload/v1794941931/egs-materials/sample-notes.pdf';

    const course = String(row.course || row.subject || '').trim();
    const subjectName = String(row.subjectName || subject).trim();

    if (rowErrors.length > 0) {
      errors.push({
        row: rowNumber,
        title: title || 'N/A',
        errors: rowErrors,
      });
    } else {
      validMaterials.push({
        title,
        subject,
        subjectName,
        unit,
        fileType,
        fileUrl,
        department: matchedDept ? matchedDept.DepartmentName : rawDept,
        semester,
        course,
        uploadedBy: Number(uploadedBy) || 1,
        staffName,
      });
    }
  }

  return {
    valid: errors.length === 0,
    totalRows: rawRows.length,
    validCount: validMaterials.length,
    errorCount: errors.length,
    errors,
    validMaterials,
    preview: validMaterials.slice(0, 10),
  };
}

/**
 * Inserts pre-validated materials into SQL Server
 */
async function insertBulkMaterials(validMaterials) {
  if (!validMaterials || validMaterials.length === 0) {
    return { insertedCount: 0, materials: [] };
  }

  const pool = await getPool();
  const insertedMaterials = [];

  for (const m of validMaterials) {
    const result = await pool.request()
      .input('Title', sql.NVarChar(200), m.title)
      .input('Subject', sql.NVarChar(100), m.subject)
      .input('SubjectName', sql.NVarChar(200), m.subjectName || null)
      .input('Unit', sql.NVarChar(50), m.unit)
      .input('FileType', sql.VarChar(20), m.fileType || 'pdf')
      .input('FileUrl', sql.NVarChar(1000), m.fileUrl)
      .input('Department', sql.NVarChar(100), m.department)
      .input('Semester', sql.TinyInt, m.semester || null)
      .input('Course', sql.NVarChar(100), m.course || '')
      .input('UploadedBy', sql.Int, m.uploadedBy || 1)
      .input('StaffName', sql.NVarChar(100), m.staffName || null)
      .query(`
        INSERT INTO Materials (Title, Subject, SubjectName, Unit, FileType, FileUrl, Department, Semester, Course, UploadedBy, StaffName)
        OUTPUT INSERTED.*
        VALUES (@Title, @Subject, @SubjectName, @Unit, @FileType, @FileUrl, @Department, @Semester, @Course, @UploadedBy, @StaffName)
      `);

    insertedMaterials.push(result.recordset[0]);
  }

  return {
    insertedCount: insertedMaterials.length,
    materials: insertedMaterials,
  };
}

/**
 * Generates sample Excel buffer for materials
 */
function generateSampleMaterialExcelTemplate() {
  const sampleData = [
    {
      Title: 'TCP/IP Protocol Suite & Layer Architecture',
      Subject: 'Computer Networks',
      SubjectName: 'Advanced Computer Networks',
      Unit: 'Unit 1',
      FileType: 'pdf',
      FileUrl: 'https://res.cloudinary.com/dwuhpjbux/raw/upload/v1794941931/egs-materials/tcp-ip-unit1.pdf',
      Department: 'Computer Science and Engineering',
      Semester: 5,
      Course: 'CS3501',
      StaffRegnum: 'EGSP001',
      StaffName: 'Praveen Kumar',
    },
    {
      Title: 'Relational Algebra & Normalization',
      Subject: 'Database Management Systems',
      SubjectName: 'Database Management Systems',
      Unit: 'Unit 2',
      FileType: 'pdf',
      FileUrl: 'https://res.cloudinary.com/dwuhpjbux/raw/upload/v1794941931/egs-materials/dbms-unit2.pdf',
      Department: 'Computer Science and Business Systems',
      Semester: 4,
      Course: 'CB3402',
      StaffRegnum: 'EGSP001',
      StaffName: 'Praveen Kumar',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Materials');
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
  validateMaterialExcelBuffer,
  insertBulkMaterials,
  generateSampleMaterialExcelTemplate,
};
