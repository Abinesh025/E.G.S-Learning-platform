const { getPool, sql } = require('../config/db')

const INITIAL_YEARS = [
  { number: 1, name: 'First Year', code: '1st Year' },
  { number: 2, name: 'Second Year', code: '2nd Year' },
  { number: 3, name: 'Third Year', code: '3rd Year' },
  { number: 4, name: 'Final Year', code: 'Final Year' }
]

const formatYear = (row) => {
  if (!row) return null
  return {
    id: row.YearId,
    yearId: row.YearId,
    YearId: row.YearId,
    name: row.YearName,
    yearName: row.YearName,
    YearName: row.YearName,
    code: row.YearCode,
    yearCode: row.YearCode,
    YearCode: row.YearCode,
    number: row.YearNumber,
    yearNumber: row.YearNumber,
    YearNumber: row.YearNumber,
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt
  }
}

/**
 * Retrieve all academic years ordered by year sequence
 */
exports.getAllYears = async () => {
  const pool = await getPool()
  const result = await pool.request().query(`
    SELECT YearId, YearName, YearCode, YearNumber, CreatedAt, UpdatedAt
    FROM Years
    ORDER BY YearNumber ASC
  `)
  return result.recordset.map(formatYear)
}

/**
 * Retrieve single year by YearId
 */
exports.getYearById = async (yearId) => {
  if (!yearId) return null
  const pool = await getPool()
  const result = await pool.request()
    .input('YearId', sql.Int, Number(yearId))
    .query(`
      SELECT YearId, YearName, YearCode, YearNumber, CreatedAt, UpdatedAt
      FROM Years
      WHERE YearId = @YearId
    `)
  return formatYear(result.recordset[0])
}

/**
 * Retrieve single year by year number (1, 2, 3, 4)
 */
exports.getYearByNumber = async (yearNumber) => {
  if (yearNumber === undefined || yearNumber === null) return null
  const pool = await getPool()
  const result = await pool.request()
    .input('YearNumber', sql.Int, Number(yearNumber))
    .query(`
      SELECT YearId, YearName, YearCode, YearNumber, CreatedAt, UpdatedAt
      FROM Years
      WHERE YearNumber = @YearNumber
    `)
  return formatYear(result.recordset[0])
}

/**
 * Flexible helper to resolve yearId from various formats (ID, number, name, aliases like 'last year', '1st year')
 */
exports.resolveYearId = async (input) => {
  if (!input) return null

  // If already an integer ID matching a record
  if (typeof input === 'number' || (!isNaN(input) && Number.isInteger(Number(input)))) {
    const num = Number(input)
    // Check if it's directly YearId
    const byId = await exports.getYearById(num)
    if (byId) return byId.yearId

    // Or YearNumber (1..4)
    const byNum = await exports.getYearByNumber(num)
    if (byNum) return byNum.yearId
  }

  const str = String(input).trim().toLowerCase()

  // Common aliases
  if (str.includes('first') || str === '1' || str === '1st' || str === '1st year' || str === 'fy') {
    const y = await exports.getYearByNumber(1)
    return y?.yearId || null
  }
  if (str.includes('second') || str === '2' || str === '2nd' || str === '2nd year' || str === 'sy') {
    const y = await exports.getYearByNumber(2)
    return y?.yearId || null
  }
  if (str.includes('third') || str === '3' || str === '3rd' || str === '3rd year' || str === 'ty') {
    const y = await exports.getYearByNumber(3)
    return y?.yearId || null
  }
  if (str.includes('final') || str.includes('last') || str.includes('fourth') || str === '4' || str === '4th' || str === '4th year' || str === 'ly') {
    const y = await exports.getYearByNumber(4)
    return y?.yearId || null
  }

  // Fallback DB query matching YearName or YearCode
  const pool = await getPool()
  const result = await pool.request()
    .input('SearchText', sql.NVarChar(50), `%${str}%`)
    .query(`
      SELECT TOP 1 YearId FROM Years 
      WHERE LOWER(YearName) LIKE @SearchText OR LOWER(YearCode) LIKE @SearchText
    `)
  return result.recordset[0]?.YearId || null
}

/**
 * Seed initial years if table is empty
 */
exports.seedDefaultYears = async () => {
  const pool = await getPool()
  for (const year of INITIAL_YEARS) {
    await pool.request()
      .input('name', sql.NVarChar(50), year.name)
      .input('code', sql.VarChar(20), year.code)
      .input('number', sql.Int, year.number)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM Years WHERE YearNumber = @number)
        BEGIN
          INSERT INTO Years (YearName, YearCode, YearNumber)
          VALUES (@name, @code, @number);
        END
      `)
  }
}

exports.INITIAL_YEARS = INITIAL_YEARS
exports.formatYear = formatYear
