require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const sql = require('mssql/msnodesqlv8')

const server = process.env.DB_SERVER || '.\\SQLEXPRESS'
const targetDbName = process.env.DB_NAME || 'EGS_LMS_HUB'
const odbcDriver = process.env.DB_ODBC_DRIVER || 'ODBC Driver 18 for SQL Server'
const trustCert = process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false' ? 'yes' : 'no'

const getConnString = (database) => {
  let conn = `Driver={${odbcDriver}};Server=${server};Database=${database};TrustServerCertificate=${trustCert};`
  if (process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_PASSWORD !== 'your_sql_password_here') {
    conn += `Uid=${process.env.DB_USER};Pwd=${process.env.DB_PASSWORD};`
  } else {
    conn += `Trusted_Connection=yes;`
  }
  return conn
}

const INITIAL_YEARS = [
  { number: 1, name: 'First Year', code: '1st Year' },
  { number: 2, name: 'Second Year', code: '2nd Year' },
  { number: 3, name: 'Third Year', code: '3rd Year' },
  { number: 4, name: 'Final Year', code: 'Final Year' }
]

async function runMigration() {
  console.log('🔄 Starting Database Schema Redesign for Years & Students table...')
  console.log(`📡 Connecting to [${targetDbName}] on ${server}...`)

  let pool
  try {
    pool = await sql.connect({ connectionString: getConnString(targetDbName) })
    console.log('✅ Connected to database')

    // 1. Create Years Table
    console.log('⚙️ Checking/Creating Years table...')
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Years')
      BEGIN
        CREATE TABLE Years (
            YearId INT IDENTITY(1,1) NOT NULL,
            YearName NVARCHAR(50) NOT NULL,
            YearCode VARCHAR(20) NOT NULL,
            YearNumber INT NOT NULL,
            CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Years_CreatedAt DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Years_UpdatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_Years PRIMARY KEY CLUSTERED (YearId),
            CONSTRAINT UQ_Years_Name UNIQUE (YearName),
            CONSTRAINT UQ_Years_Number UNIQUE (YearNumber)
        );
        PRINT 'Table Years created.';
      END
    `)
    console.log('✅ Years table verified')

    // 2. Seed default Academic Years
    console.log('🌱 Seeding initial academic years...')
    for (const yr of INITIAL_YEARS) {
      await pool.request()
        .input('name', sql.NVarChar(50), yr.name)
        .input('code', sql.VarChar(20), yr.code)
        .input('number', sql.Int, yr.number)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM Years WHERE YearNumber = @number)
          BEGIN
            INSERT INTO Years (YearName, YearCode, YearNumber)
            VALUES (@name, @code, @number);
          END
        `)
    }
    console.log('✅ Academic years seeded: First Year, Second Year, Third Year, Final Year')

    // 3. Add columns to Students table if missing
    console.log('⚙️ Enhancing Students table with requested columns...')
    const studentColsToAdd = [
      { name: 'StudentRefId', type: 'NVARCHAR(50) NULL' },
      { name: 'Name', type: 'NVARCHAR(100) NULL' },
      { name: 'DeptId', type: 'INT NULL' },
      { name: 'Email', type: 'NVARCHAR(255) NULL' },
      { name: 'Password', type: 'NVARCHAR(255) NULL' },
      { name: 'Phone', type: "NVARCHAR(20) NOT NULL CONSTRAINT DF_Students_Phone DEFAULT ''" },
      { name: 'YearId', type: 'INT NULL' }
    ]

    for (const col of studentColsToAdd) {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Students') AND name = '${col.name}')
        BEGIN
          ALTER TABLE Students ADD ${col.name} ${col.type};
          PRINT 'Added column ${col.name} to Students.';
        END
      `)
    }
    console.log('✅ Students table columns verified: StudentId, StudentRefId, Name, Regnum, DeptId, Email, Password, Phone, YearId')

    // 4. Add Foreign Keys for YearId and DeptId
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Students_Years')
      BEGIN
        ALTER TABLE Students
        ADD CONSTRAINT FK_Students_Years FOREIGN KEY (YearId)
            REFERENCES Years (YearId) ON DELETE SET NULL ON UPDATE CASCADE;
        PRINT 'Foreign key FK_Students_Years created.';
      END
    `)

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Students_DeptId')
      BEGIN
        ALTER TABLE Students
        ADD CONSTRAINT FK_Students_DeptId FOREIGN KEY (DeptId)
            REFERENCES Departments (DepartmentId) ON DELETE NO ACTION ON UPDATE NO ACTION;
        PRINT 'Foreign key FK_Students_DeptId created.';
      END
    `)

    // Index on YearId and DeptId
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Students_YearId' AND object_id = OBJECT_ID('Students'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Students_YearId ON Students (YearId);
      END
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Students_DeptId' AND object_id = OBJECT_ID('Students'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Students_DeptId ON Students (DeptId);
      END
    `)

    // 5. Backfill existing Students records from Users & Departments & Years
    console.log('🔄 Backfilling existing students data from Users table...')
    await pool.request().query(`
      UPDATE s
      SET 
        s.StudentRefId = COALESCE(s.StudentRefId, s.StudentUniqueId),
        s.DeptId = COALESCE(s.DeptId, s.DepartmentId),
        s.Name = COALESCE(s.Name, u.Name),
        s.Email = COALESCE(s.Email, u.Email),
        s.Password = COALESCE(s.Password, u.Password),
        s.Phone = COALESCE(s.Phone, u.Phone, '')
      FROM Students s
      JOIN Users u ON s.UserId = u.UserId;
    `)

    // Backfill YearId based on Semester or default to First Year (1)
    const firstYearRes = await pool.request().query(`SELECT YearId FROM Years WHERE YearNumber = 1`)
    const firstYearId = firstYearRes.recordset[0]?.YearId

    await pool.request()
      .input('defaultYearId', sql.Int, firstYearId)
      .query(`
        UPDATE s
        SET s.YearId = COALESCE(
          (SELECT YearId FROM Years WHERE YearNumber = (
            CASE 
              WHEN s.Semester IN (1, 2) THEN 1
              WHEN s.Semester IN (3, 4) THEN 2
              WHEN s.Semester IN (5, 6) THEN 3
              WHEN s.Semester IN (7, 8) THEN 4
              ELSE NULL
            END
          )),
          @defaultYearId
        )
        FROM Students s
        WHERE s.YearId IS NULL;
      `)

    console.log('✅ Data backfill completed successfully')

    // 6. Verify table contents
    const colsResult = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Students'
      ORDER BY ORDINAL_POSITION
    `)
    console.log('\n📋 Current Students Table Schema:')
    console.table(colsResult.recordset)

    const yearsResult = await pool.request().query(`SELECT * FROM Years ORDER BY YearNumber ASC`)
    console.log('\n🎓 Seeded Years Table:')
    console.table(yearsResult.recordset)

    const studentsPreview = await pool.request().query(`
      SELECT s.StudentId, s.StudentRefId, s.Name, s.Regnum, s.DeptId, s.Email, s.Phone, s.YearId, y.YearName
      FROM Students s
      LEFT JOIN Years y ON s.YearId = y.YearId
    `)
    console.log('\n👥 Students with Year and Details:')
    console.table(studentsPreview.recordset)

    console.log('\n🎉 Redesign Migration Completed Successfully!')
    await pool.close()
    return true
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    if (pool) await pool.close()
    throw err
  }
}

if (require.main === module) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = runMigration
