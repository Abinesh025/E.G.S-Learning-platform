require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const sql = require('mssql/msnodesqlv8');

const server = process.env.DB_SERVER || '.\\SQLEXPRESS';
const targetDbName = process.env.DB_NAME || 'EGS_LMS_HUB';
const odbcDriver = process.env.DB_ODBC_DRIVER || 'ODBC Driver 18 for SQL Server';
const trustCert = process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false' ? 'yes' : 'no';

const getConnString = (database) => {
  let conn = `Driver={${odbcDriver}};Server=${server};Database=${database};TrustServerCertificate=${trustCert};`;
  if (process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_PASSWORD !== 'your_sql_password_here') {
    conn += `Uid=${process.env.DB_USER};Pwd=${process.env.DB_PASSWORD};`;
  } else {
    conn += `Trusted_Connection=yes;`;
  }
  return conn;
};

async function migrateStudentId() {
  console.log('🔄 Starting Migration: StudentId becomes UniqueId (Removing StudentRefId & StudentUniqueId)...');
  const pool = await sql.connect({ connectionString: getConnString(targetDbName) });
  console.log('✅ Connected to database');

  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  try {
    const req = new sql.Request(transaction);

    console.log('⚙️ Step 1: Dropping Foreign Key and Unique constraints referencing Students(StudentId)...');
    await req.query(`
      IF OBJECT_ID('FK_TestSubmissions_Students', 'F') IS NOT NULL
        ALTER TABLE TestSubmissions DROP CONSTRAINT FK_TestSubmissions_Students;
      IF OBJECT_ID('FK_Results_Students', 'F') IS NOT NULL
        ALTER TABLE Results DROP CONSTRAINT FK_Results_Students;
      IF OBJECT_ID('FK_TestSubmissions_Student', 'F') IS NOT NULL
        ALTER TABLE TestSubmissions DROP CONSTRAINT FK_TestSubmissions_Student;
      IF OBJECT_ID('FK_Results_Student', 'F') IS NOT NULL
        ALTER TABLE Results DROP CONSTRAINT FK_Results_Student;

      IF OBJECT_ID('UQ_Results_Student_Test', 'UQ') IS NOT NULL
        ALTER TABLE Results DROP CONSTRAINT UQ_Results_Student_Test;
    `);

    console.log('⚙️ Step 2: Altering TestSubmissions and Results to support NVARCHAR(50) StudentId...');
    await req.query(`
      ALTER TABLE TestSubmissions ALTER COLUMN StudentId NVARCHAR(50) NOT NULL;
      ALTER TABLE Results ALTER COLUMN StudentId NVARCHAR(50) NOT NULL;
      ALTER TABLE Results ADD CONSTRAINT UQ_Results_Student_Test UNIQUE (StudentId, TestId);
    `);

    console.log('⚙️ Step 3: Altering Messages and Notifications to support alphanumeric SenderId / ReceiverId...');
    await req.query(`
      IF OBJECT_ID('CK_Messages_Target', 'C') IS NOT NULL
        ALTER TABLE Messages DROP CONSTRAINT CK_Messages_Target;

      ALTER TABLE Messages ALTER COLUMN SenderId NVARCHAR(50) NOT NULL;
      ALTER TABLE Messages ALTER COLUMN ReceiverId NVARCHAR(50) NULL;

      ALTER TABLE Messages ADD CONSTRAINT CK_Messages_Target CHECK (ReceiverId IS NOT NULL OR Room <> '');

      ALTER TABLE Notifications ALTER COLUMN SenderId NVARCHAR(50) NOT NULL;
      ALTER TABLE Notifications ALTER COLUMN ReceiverId NVARCHAR(50) NOT NULL;
    `);

    console.log('⚙️ Step 4: Creating new Students table where StudentId is the unique identifier string...');
    await req.query(`
      IF OBJECT_ID('Students_New', 'U') IS NOT NULL
        DROP TABLE Students_New;

      CREATE TABLE Students_New (
          -- 1. IDs First (StudentId stores the unique ID e.g. CSR001, BSR001)
          StudentId NVARCHAR(50) NOT NULL,
          DeptId INT NOT NULL,
          DepartmentId INT NOT NULL,
          YearId INT NULL,

          -- 2. Personal Details Second
          Name NVARCHAR(100) NOT NULL,
          Regnum NVARCHAR(50) NOT NULL,
          Email NVARCHAR(255) NOT NULL,
          Phone NVARCHAR(20) NOT NULL CONSTRAINT DF_Students_New_Phone DEFAULT '',
          Password NVARCHAR(255) NOT NULL,

          -- 3. Academic Details Third
          Batch NVARCHAR(20) NOT NULL CONSTRAINT DF_Students_New_Batch DEFAULT '',
          Semester TINYINT NULL,

          -- 4. Timestamps
          CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Students_New_CreatedAt DEFAULT SYSUTCDATETIME(),
          UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Students_New_UpdatedAt DEFAULT SYSUTCDATETIME(),

          -- 5. Status & Security
          Avatar NVARCHAR(500) NOT NULL CONSTRAINT DF_Students_New_Avatar DEFAULT '',
          IsActive BIT NOT NULL CONSTRAINT DF_Students_New_IsActive DEFAULT 1,
          OtpHash NVARCHAR(255) NULL,
          OtpExpiresAt DATETIME2 NULL,
          OtpPurpose VARCHAR(20) NULL,
          OtpVerified BIT NOT NULL CONSTRAINT DF_Students_New_OtpVerified DEFAULT 0,

          CONSTRAINT PK_Students_New PRIMARY KEY CLUSTERED (StudentId),
          CONSTRAINT UQ_Students_New_Email UNIQUE (Email),
          CONSTRAINT UQ_Students_New_Regnum UNIQUE (Regnum),
          CONSTRAINT CK_Students_New_Semester CHECK (Semester IS NULL OR Semester BETWEEN 1 AND 8)
      );
    `);

    console.log('⚙️ Step 5: Transferring existing students data (StudentId populated with StudentUniqueId)...');
    await req.query(`
      INSERT INTO Students_New (
          StudentId, DeptId, DepartmentId, YearId,
          Name, Regnum, Email, Phone, Password,
          Batch, Semester, CreatedAt, UpdatedAt,
          Avatar, IsActive, OtpHash, OtpExpiresAt, OtpPurpose, OtpVerified
      )
      SELECT 
          COALESCE(NULLIF(LTRIM(RTRIM(StudentUniqueId)), ''), NULLIF(LTRIM(RTRIM(StudentRefId)), ''), 'STD' + CAST(StudentId AS VARCHAR)) AS StudentId,
          DeptId, DepartmentId, YearId,
          Name, Regnum, Email, Phone, Password,
          Batch, Semester, CreatedAt, UpdatedAt,
          Avatar, IsActive, OtpHash, OtpExpiresAt, OtpPurpose, OtpVerified
      FROM Students;
    `);

    console.log('⚙️ Step 6: Swapping old Students table with new Students table...');
    await req.query(`
      DROP TABLE Students;
      EXEC sp_rename 'Students_New', 'Students';
      EXEC sp_rename 'PK_Students_New', 'PK_Students', 'OBJECT';
      EXEC sp_rename 'UQ_Students_New_Email', 'UQ_Students_Email', 'OBJECT';
      EXEC sp_rename 'UQ_Students_New_Regnum', 'UQ_Students_Regnum', 'OBJECT';
      EXEC sp_rename 'CK_Students_New_Semester', 'CK_Students_Semester', 'OBJECT';
      EXEC sp_rename 'DF_Students_New_Phone', 'DF_Students_Phone', 'OBJECT';
      EXEC sp_rename 'DF_Students_New_Batch', 'DF_Students_Batch', 'OBJECT';
      EXEC sp_rename 'DF_Students_New_CreatedAt', 'DF_Students_CreatedAt', 'OBJECT';
      EXEC sp_rename 'DF_Students_New_UpdatedAt', 'DF_Students_UpdatedAt', 'OBJECT';
      EXEC sp_rename 'DF_Students_New_Avatar', 'DF_Students_Avatar', 'OBJECT';
      EXEC sp_rename 'DF_Students_New_IsActive', 'DF_Students_IsActive', 'OBJECT';
      EXEC sp_rename 'DF_Students_New_OtpVerified', 'DF_Students_OtpVerified', 'OBJECT';
    `);

    console.log('⚙️ Step 7: Recreating Foreign Keys and Indexes...');
    await req.query(`
      ALTER TABLE Students
        ADD CONSTRAINT FK_Students_Departments FOREIGN KEY (DepartmentId)
            REFERENCES Departments (DepartmentId) ON DELETE NO ACTION ON UPDATE CASCADE;

      ALTER TABLE Students
        ADD CONSTRAINT FK_Students_DeptId FOREIGN KEY (DeptId)
            REFERENCES Departments (DepartmentId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE Students
        ADD CONSTRAINT FK_Students_Years FOREIGN KEY (YearId)
            REFERENCES Years (YearId) ON DELETE SET NULL ON UPDATE CASCADE;

      ALTER TABLE TestSubmissions
        ADD CONSTRAINT FK_TestSubmissions_Students FOREIGN KEY (StudentId)
            REFERENCES Students (StudentId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE Results
        ADD CONSTRAINT FK_Results_Students FOREIGN KEY (StudentId)
            REFERENCES Students (StudentId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      CREATE NONCLUSTERED INDEX IX_Students_DepartmentId ON Students (DepartmentId);
      CREATE NONCLUSTERED INDEX IX_Students_YearId ON Students (YearId);
    `);

    await transaction.commit();
    console.log('🎉 Migration committed successfully!');

    // Verify Final Schema
    const verifyCols = await pool.request().query(`
      SELECT ORDINAL_POSITION AS Pos, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Students'
      ORDER BY ORDINAL_POSITION;
    `);
    console.log('\n📋 FINAL STUDENTS TABLE SCHEMA:');
    console.table(verifyCols.recordset);

    const studentRows = await pool.request().query(`SELECT StudentId, Name, Regnum, Email, DeptId, YearId FROM Students`);
    console.log('\n📋 CURRENT STUDENTS IN DB:');
    console.table(studentRows.recordset);

    await pool.close();
  } catch (err) {
    await transaction.rollback();
    console.error('❌ Migration failed:', err);
    await pool.close();
    process.exit(1);
  }
}

migrateStudentId();
