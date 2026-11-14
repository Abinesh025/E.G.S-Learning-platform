require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const sql = require('mssql/msnodesqlv8')

const server = process.env.DB_SERVER || '.\\SQLEXPRESS'
const targetDbName = process.env.DB_NAME || 'EGS_LMS_HUB'
const odbcDriver = process.env.DB_ODBC_DRIVER || 'ODBC Driver 18 for SQL Server'
const trustCert = process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false' ? 'yes' : 'no'

const getConnString = (database) => {
  let conn = `Driver={${odbcDriver}};Server=${server};Database=${database};TrustServerCertificate=${trustCert};`
  if (process.env.DB_USER && process.env.DB_PASSWORD) {
    conn += `Uid=${process.env.DB_USER};Pwd=${process.env.DB_PASSWORD};`
  } else {
    conn += `Trusted_Connection=yes;`
  }
  return conn
}

const DEPARTMENTS = [
  { name: 'Computer Science and Engineering', code: 'CSE', prefix: 'CSR' },
  { name: 'Computer Science and Business Systems', code: 'CSBS', prefix: 'BSR' },
  { name: 'Artificial Intelligence and Data Science', code: 'AIDS', prefix: 'ADR' },
  { name: 'Information Technology', code: 'IT', prefix: 'ITR' },
  { name: 'Biomedical Engineering', code: 'BME', prefix: 'BMR' },
  { name: 'Civil Engineering', code: 'CIVIL', prefix: 'CER' },
  { name: 'Electronics and Communication Engineering', code: 'ECE', prefix: 'ECR' },
  { name: 'Electrical and Electronics Engineering', code: 'EEE', prefix: 'EER' },
  { name: 'Mechanical Engineering', code: 'MECH', prefix: 'MER' },
  { name: 'Master of Business Administration', code: 'MBA', prefix: 'MBAR' },
  { name: 'Master of Computer Applications', code: 'MCA', prefix: 'MCAR' }
]

async function runMigration() {
  console.log('🔄 Starting Database Schema Redesign Migration...')
  console.log(`📡 Connecting to [${targetDbName}] on ${server}...`)

  let pool
  try {
    pool = await sql.connect({ connectionString: getConnString(targetDbName) })
    console.log('✅ Connected to database')

    // 1. Create Departments Table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Departments')
      BEGIN
        CREATE TABLE Departments (
          DepartmentId INT IDENTITY(1,1) NOT NULL,
          DepartmentName NVARCHAR(100) NOT NULL,
          DepartmentCode VARCHAR(10) NOT NULL,
          PrefixCode VARCHAR(10) NOT NULL,
          CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Departments_CreatedAt DEFAULT SYSUTCDATETIME(),
          UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Departments_UpdatedAt DEFAULT SYSUTCDATETIME(),

          CONSTRAINT PK_Departments PRIMARY KEY CLUSTERED (DepartmentId),
          CONSTRAINT UQ_Departments_Name UNIQUE (DepartmentName),
          CONSTRAINT UQ_Departments_Code UNIQUE (DepartmentCode)
        );
        PRINT 'Table Departments created.';
      END
    `)

    // Seed Departments
    for (const dept of DEPARTMENTS) {
      await pool.request()
        .input('name', sql.NVarChar(100), dept.name)
        .input('code', sql.VarChar(10), dept.code)
        .input('prefix', sql.VarChar(10), dept.prefix)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM Departments WHERE DepartmentName = @name)
          BEGIN
            INSERT INTO Departments (DepartmentName, DepartmentCode, PrefixCode)
            VALUES (@name, @code, @prefix);
          END
        `)
    }
    console.log('✅ Departments seeded successfully')

    // 2. Create Students Table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Students')
      BEGIN
        CREATE TABLE Students (
          StudentId INT IDENTITY(1,1) NOT NULL,
          UserId INT NOT NULL,
          DepartmentId INT NOT NULL,
          Regnum NVARCHAR(50) NOT NULL,
          StudentUniqueId NVARCHAR(50) NOT NULL,
          Batch NVARCHAR(20) NOT NULL CONSTRAINT DF_Students_Batch DEFAULT '',
          Semester TINYINT NULL,
          CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Students_CreatedAt DEFAULT SYSUTCDATETIME(),
          UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Students_UpdatedAt DEFAULT SYSUTCDATETIME(),

          CONSTRAINT PK_Students PRIMARY KEY CLUSTERED (StudentId),
          CONSTRAINT FK_Students_Users FOREIGN KEY (UserId)
            REFERENCES Users (UserId) ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT FK_Students_Departments FOREIGN KEY (DepartmentId)
            REFERENCES Departments (DepartmentId) ON DELETE NO ACTION ON UPDATE CASCADE,
          CONSTRAINT UQ_Students_UserId UNIQUE (UserId),
          CONSTRAINT UQ_Students_Regnum UNIQUE (Regnum),
          CONSTRAINT UQ_Students_StudentUniqueId UNIQUE (StudentUniqueId),
          CONSTRAINT CK_Students_Semester CHECK (Semester IS NULL OR Semester BETWEEN 1 AND 8)
        );
        PRINT 'Table Students created.';
      END
    `)

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Students_DepartmentId' AND object_id = OBJECT_ID('Students'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Students_DepartmentId ON Students (DepartmentId);
      END
    `)

    // 3. Create Staff Table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Staff')
      BEGIN
        CREATE TABLE Staff (
          StaffId INT IDENTITY(1,1) NOT NULL,
          UserId INT NOT NULL,
          DepartmentId INT NULL,
          Regnum NVARCHAR(50) NOT NULL,
          Designation NVARCHAR(100) NOT NULL CONSTRAINT DF_Staff_Designation DEFAULT 'Staff',
          CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Staff_CreatedAt DEFAULT SYSUTCDATETIME(),
          UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Staff_UpdatedAt DEFAULT SYSUTCDATETIME(),

          CONSTRAINT PK_Staff PRIMARY KEY CLUSTERED (StaffId),
          CONSTRAINT FK_Staff_Users FOREIGN KEY (UserId)
            REFERENCES Users (UserId) ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT FK_Staff_Departments FOREIGN KEY (DepartmentId)
            REFERENCES Departments (DepartmentId) ON DELETE NO ACTION ON UPDATE CASCADE,
          CONSTRAINT UQ_Staff_UserId UNIQUE (UserId),
          CONSTRAINT UQ_Staff_Regnum UNIQUE (Regnum)
        );
        PRINT 'Table Staff created.';
      END
    `)

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Staff_DepartmentId' AND object_id = OBJECT_ID('Staff'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Staff_DepartmentId ON Staff (DepartmentId);
      END
    `)

    // 4. Create Admins Table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Admins')
      BEGIN
        CREATE TABLE Admins (
          AdminId INT IDENTITY(1,1) NOT NULL,
          UserId INT NOT NULL,
          AdminLevel NVARCHAR(50) NOT NULL CONSTRAINT DF_Admins_AdminLevel DEFAULT 'superadmin',
          CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Admins_CreatedAt DEFAULT SYSUTCDATETIME(),
          UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Admins_UpdatedAt DEFAULT SYSUTCDATETIME(),

          CONSTRAINT PK_Admins PRIMARY KEY CLUSTERED (AdminId),
          CONSTRAINT FK_Admins_Users FOREIGN KEY (UserId)
            REFERENCES Users (UserId) ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT UQ_Admins_UserId UNIQUE (UserId)
        );
        PRINT 'Table Admins created.';
      END
    `)

    // 5. Migrate existing data from Users table if present
    const existingUsers = await pool.request().query(`SELECT * FROM Users`)
    console.log(`ℹ️ Found ${existingUsers.recordset.length} users to check for role migration...`)

    const deptsResult = await pool.request().query(`SELECT * FROM Departments`)
    const deptMap = {}
    for (const d of deptsResult.recordset) {
      deptMap[d.DepartmentName.toLowerCase()] = d
    }

    for (const u of existingUsers.recordset) {
      const role = u.Role.toLowerCase()
      if (role === 'student') {
        const studentExists = await pool.request()
          .input('UserId', sql.Int, u.UserId)
          .query(`SELECT 1 FROM Students WHERE UserId = @UserId`)

        if (studentExists.recordset.length === 0) {
          // Find department
          const dept = deptMap[(u.Department || '').toLowerCase()] || deptsResult.recordset[0]
          const prefix = dept.PrefixCode

          // Generate next unique student id for this prefix
          const seqResult = await pool.request()
            .input('prefixPattern', sql.VarChar(15), prefix + '%')
            .input('prefixLen', sql.Int, prefix.length)
            .query(`
              SELECT MAX(CAST(SUBSTRING(StudentUniqueId, @prefixLen + 1, 10) AS INT)) AS MaxSeq
              FROM Students
              WHERE StudentUniqueId LIKE @prefixPattern
                AND ISNUMERIC(SUBSTRING(StudentUniqueId, @prefixLen + 1, 10)) = 1
            `)

          const nextSeq = (seqResult.recordset[0].MaxSeq || 0) + 1
          const studentUniqueId = `${prefix}${String(nextSeq).padStart(3, '0')}`
          const regnum = u.Regnum || `REG-${u.UserId}`

          await pool.request()
            .input('UserId', sql.Int, u.UserId)
            .input('DepartmentId', sql.Int, dept.DepartmentId)
            .input('Regnum', sql.NVarChar(50), regnum)
            .input('StudentUniqueId', sql.NVarChar(50), studentUniqueId)
            .input('Batch', sql.NVarChar(20), u.Batch || '')
            .input('Semester', sql.TinyInt, u.Semester || null)
            .query(`
              INSERT INTO Students (UserId, DepartmentId, Regnum, StudentUniqueId, Batch, Semester)
              VALUES (@UserId, @DepartmentId, @Regnum, @StudentUniqueId, @Batch, @Semester)
            `)
          console.log(`✅ Migrated student user ${u.Email} -> StudentUniqueId: ${studentUniqueId}`)
        }
      } else if (role === 'staff') {
        const staffExists = await pool.request()
          .input('UserId', sql.Int, u.UserId)
          .query(`SELECT 1 FROM Staff WHERE UserId = @UserId`)

        if (staffExists.recordset.length === 0) {
          const dept = deptMap[(u.Department || '').toLowerCase()] || null
          const regnum = u.Regnum || `EGSP${String(u.UserId).padStart(3, '0')}`

          await pool.request()
            .input('UserId', sql.Int, u.UserId)
            .input('DepartmentId', sql.Int, dept ? dept.DepartmentId : null)
            .input('Regnum', sql.NVarChar(50), regnum)
            .input('Designation', sql.NVarChar(100), 'Staff')
            .query(`
              INSERT INTO Staff (UserId, DepartmentId, Regnum, Designation)
              VALUES (@UserId, @DepartmentId, @Regnum, @Designation)
            `)
          console.log(`✅ Migrated staff user ${u.Email} -> Regnum: ${regnum}`)
        }
      } else if (role === 'admin') {
        const adminExists = await pool.request()
          .input('UserId', sql.Int, u.UserId)
          .query(`SELECT 1 FROM Admins WHERE UserId = @UserId`)

        if (adminExists.recordset.length === 0) {
          await pool.request()
            .input('UserId', sql.Int, u.UserId)
            .input('AdminLevel', sql.NVarChar(50), 'superadmin')
            .query(`
              INSERT INTO Admins (UserId, AdminLevel)
              VALUES (@UserId, @AdminLevel)
            `)
          console.log(`✅ Migrated admin user ${u.Email}`)
        }
      }
    }

    console.log('🎉 Database Schema Redesign Migration completed successfully!')
    await pool.close()
  } catch (err) {
    console.error('❌ Migration Error:', err.message)
    if (pool) await pool.close()
    process.exit(1)
  }
}

if (require.main === module) {
  runMigration()
}

module.exports = runMigration
