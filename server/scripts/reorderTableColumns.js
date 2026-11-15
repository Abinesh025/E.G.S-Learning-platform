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

async function reorderColumns() {
  console.log('🔄 Starting Database Table Column Reordering in Priority Order...')
  console.log(`📡 Connecting to [${targetDbName}] on ${server}...`)

  let pool
  try {
    pool = await sql.connect({ connectionString: getConnString(targetDbName) })
    console.log('✅ Connected to database\n')

    // ========================================================
    // 1. REORDER STUDENTS TABLE
    // Priority:
    // 1) IDs first: StudentId, StudentRefId, StudentUniqueId, UserId, DeptId, DepartmentId, YearId
    // 2) Personal details second: Name, Regnum, Email, Phone, Password
    // 3) Academic details third: Batch, Semester
    // 4) Timestamps last: CreatedAt, UpdatedAt
    // ========================================================
    console.log('--- REORDERING TABLE: Students ---')

    await pool.request().query(`
      -- Drop old temporary table if exists
      IF OBJECT_ID('Students_New', 'U') IS NOT NULL DROP TABLE Students_New;

      -- Create new table with exact priority order
      CREATE TABLE Students_New (
          -- 1. IDs First
          StudentId INT IDENTITY(1,1) NOT NULL,
          StudentRefId NVARCHAR(50) NOT NULL,
          StudentUniqueId NVARCHAR(50) NOT NULL,
          UserId INT NOT NULL,
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

          -- 4. Timestamps Last
          CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Students_New_CreatedAt DEFAULT SYSUTCDATETIME(),
          UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Students_New_UpdatedAt DEFAULT SYSUTCDATETIME(),

          CONSTRAINT PK_Students_New PRIMARY KEY CLUSTERED (StudentId),
          CONSTRAINT UQ_Students_New_UserId UNIQUE (UserId),
          CONSTRAINT UQ_Students_New_Regnum UNIQUE (Regnum),
          CONSTRAINT UQ_Students_New_StudentUniqueId UNIQUE (StudentUniqueId),
          CONSTRAINT CK_Students_New_Semester CHECK (Semester IS NULL OR Semester BETWEEN 1 AND 8)
      );
    `)

    // Copy data from Students to Students_New
    await pool.request().query(`
      SET IDENTITY_INSERT Students_New ON;
      INSERT INTO Students_New (
          StudentId, StudentRefId, StudentUniqueId, UserId, DeptId, DepartmentId, YearId,
          Name, Regnum, Email, Phone, Password, Batch, Semester, CreatedAt, UpdatedAt
      )
      SELECT 
          s.StudentId, 
          COALESCE(s.StudentRefId, s.StudentUniqueId) AS StudentRefId,
          s.StudentUniqueId,
          s.UserId,
          COALESCE(s.DeptId, s.DepartmentId) AS DeptId,
          s.DepartmentId,
          s.YearId,
          COALESCE(s.Name, u.Name) AS Name,
          s.Regnum,
          COALESCE(s.Email, u.Email) AS Email,
          COALESCE(s.Phone, u.Phone, '') AS Phone,
          COALESCE(s.Password, u.Password) AS Password,
          s.Batch,
          s.Semester,
          s.CreatedAt,
          s.UpdatedAt
      FROM Students s
      LEFT JOIN Users u ON s.UserId = u.UserId;
      SET IDENTITY_INSERT Students_New OFF;
    `)

    // Drop old table and rename new table
    await pool.request().query(`
      DROP TABLE Students;
      EXEC sp_rename 'Students_New', 'Students';
      EXEC sp_rename 'PK_Students_New', 'PK_Students', 'OBJECT';
      EXEC sp_rename 'UQ_Students_New_UserId', 'UQ_Students_UserId', 'OBJECT';
      EXEC sp_rename 'UQ_Students_New_Regnum', 'UQ_Students_Regnum', 'OBJECT';
      EXEC sp_rename 'UQ_Students_New_StudentUniqueId', 'UQ_Students_StudentUniqueId', 'OBJECT';
      EXEC sp_rename 'CK_Students_New_Semester', 'CK_Students_Semester', 'OBJECT';
      EXEC sp_rename 'DF_Students_New_Phone', 'DF_Students_Phone', 'OBJECT';
      EXEC sp_rename 'DF_Students_New_Batch', 'DF_Students_Batch', 'OBJECT';
      EXEC sp_rename 'DF_Students_New_CreatedAt', 'DF_Students_CreatedAt', 'OBJECT';
      EXEC sp_rename 'DF_Students_New_UpdatedAt', 'DF_Students_UpdatedAt', 'OBJECT';

      -- Add Foreign Keys
      ALTER TABLE Students
      ADD CONSTRAINT FK_Students_Users FOREIGN KEY (UserId)
          REFERENCES Users (UserId) ON DELETE CASCADE ON UPDATE CASCADE;

      ALTER TABLE Students
      ADD CONSTRAINT FK_Students_Departments FOREIGN KEY (DepartmentId)
          REFERENCES Departments (DepartmentId) ON DELETE NO ACTION ON UPDATE CASCADE;

      ALTER TABLE Students
      ADD CONSTRAINT FK_Students_DeptId FOREIGN KEY (DeptId)
          REFERENCES Departments (DepartmentId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE Students
      ADD CONSTRAINT FK_Students_Years FOREIGN KEY (YearId)
          REFERENCES Years (YearId) ON DELETE SET NULL ON UPDATE CASCADE;

      -- Add Indexes
      CREATE NONCLUSTERED INDEX IX_Students_DepartmentId ON Students (DepartmentId);
      CREATE NONCLUSTERED INDEX IX_Students_DeptId ON Students (DeptId);
      CREATE NONCLUSTERED INDEX IX_Students_YearId ON Students (YearId);
    `)
    console.log('✅ Students table successfully restructured in priority order')

    // ========================================================
    // 2. REORDER MATERIALS TABLE
    // Priority:
    // 1) IDs first: MaterialId, UploadedBy
    // 2) Content details: Title, Subject, SubjectName, Unit, FileType, FileUrl
    // 3) Context: Department, Semester, Course, StaffName
    // 4) Timestamps: CreatedAt, UpdatedAt
    // ========================================================
    console.log('\n--- REORDERING TABLE: Materials ---')

    await pool.request().query(`
      IF OBJECT_ID('FK_Notifications_Material', 'F') IS NOT NULL
        ALTER TABLE Notifications DROP CONSTRAINT FK_Notifications_Material;

      IF OBJECT_ID('Materials_New', 'U') IS NOT NULL DROP TABLE Materials_New;

      CREATE TABLE Materials_New (
          -- 1. IDs First
          MaterialId INT IDENTITY(1,1) NOT NULL,
          UploadedBy INT NOT NULL,

          -- 2. Material Content Details
          Title NVARCHAR(200) NOT NULL,
          Subject NVARCHAR(100) NOT NULL,
          SubjectName NVARCHAR(200) NULL,
          Unit NVARCHAR(50) NOT NULL,
          FileType VARCHAR(20) NOT NULL,
          FileUrl NVARCHAR(1000) NOT NULL,

          -- 3. Academic Context
          Department NVARCHAR(100) NOT NULL CONSTRAINT DF_Materials_New_Department DEFAULT '',
          Semester TINYINT NULL,
          Course NVARCHAR(100) NOT NULL CONSTRAINT DF_Materials_New_Course DEFAULT '',
          StaffName NVARCHAR(100) NULL,

          -- 4. Timestamps Last
          CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Materials_New_CreatedAt DEFAULT SYSUTCDATETIME(),
          UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Materials_New_UpdatedAt DEFAULT SYSUTCDATETIME(),

          CONSTRAINT PK_Materials_New PRIMARY KEY CLUSTERED (MaterialId),
          CONSTRAINT CK_Materials_New_Semester CHECK (Semester IS NULL OR Semester BETWEEN 1 AND 8)
      );

      SET IDENTITY_INSERT Materials_New ON;
      INSERT INTO Materials_New (
          MaterialId, UploadedBy, Title, Subject, SubjectName, Unit, FileType, FileUrl,
          Department, Semester, Course, StaffName, CreatedAt, UpdatedAt
      )
      SELECT 
          MaterialId, UploadedBy, Title, Subject, SubjectName, Unit, FileType, FileUrl,
          Department, Semester, Course, StaffName, CreatedAt, UpdatedAt
      FROM Materials;
      SET IDENTITY_INSERT Materials_New OFF;

      DROP TABLE Materials;
      EXEC sp_rename 'Materials_New', 'Materials';
      EXEC sp_rename 'PK_Materials_New', 'PK_Materials', 'OBJECT';
      EXEC sp_rename 'CK_Materials_New_Semester', 'CK_Materials_Semester', 'OBJECT';
      EXEC sp_rename 'DF_Materials_New_Department', 'DF_Materials_Department', 'OBJECT';
      EXEC sp_rename 'DF_Materials_New_Course', 'DF_Materials_Course', 'OBJECT';
      EXEC sp_rename 'DF_Materials_New_CreatedAt', 'DF_Materials_CreatedAt', 'OBJECT';
      EXEC sp_rename 'DF_Materials_New_UpdatedAt', 'DF_Materials_UpdatedAt', 'OBJECT';

      ALTER TABLE Materials
      ADD CONSTRAINT FK_Materials_Users FOREIGN KEY (UploadedBy)
          REFERENCES Users (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE Notifications
      ADD CONSTRAINT FK_Notifications_Material FOREIGN KEY (MaterialId)
          REFERENCES Materials (MaterialId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      CREATE NONCLUSTERED INDEX IX_Materials_Subject_Semester_Department ON Materials (Subject, Semester, Department);
      CREATE NONCLUSTERED INDEX IX_Materials_UploadedBy ON Materials (UploadedBy);
    `)
    console.log('✅ Materials table successfully restructured in priority order')

    // ========================================================
    // 3. REORDER TESTS TABLE
    // Priority:
    // 1) IDs first: TestId, CreatedBy
    // 2) Test details: Title, Subject, Department, Duration
    // 3) Timestamps: CreatedAt, UpdatedAt
    // ========================================================
    console.log('\n--- REORDERING TABLE: Tests ---')

    await pool.request().query(`
      IF OBJECT_ID('FK_Notifications_Test', 'F') IS NOT NULL
        ALTER TABLE Notifications DROP CONSTRAINT FK_Notifications_Test;
      IF OBJECT_ID('FK_Results_Test', 'F') IS NOT NULL
        ALTER TABLE Results DROP CONSTRAINT FK_Results_Test;
      IF OBJECT_ID('FK_TestQuestions_Tests', 'F') IS NOT NULL
        ALTER TABLE TestQuestions DROP CONSTRAINT FK_TestQuestions_Tests;
      IF OBJECT_ID('FK_TestSubmissions_Test', 'F') IS NOT NULL
        ALTER TABLE TestSubmissions DROP CONSTRAINT FK_TestSubmissions_Test;

      IF OBJECT_ID('Tests_New', 'U') IS NOT NULL DROP TABLE Tests_New;

      CREATE TABLE Tests_New (
          -- 1. IDs First
          TestId INT IDENTITY(1,1) NOT NULL,
          CreatedBy INT NOT NULL,

          -- 2. Test Details
          Title NVARCHAR(200) NOT NULL,
          Subject NVARCHAR(100) NOT NULL,
          Department NVARCHAR(100) NOT NULL CONSTRAINT DF_Tests_New_Department DEFAULT '',
          Duration INT NOT NULL,

          -- 3. Timestamps Last
          CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Tests_New_CreatedAt DEFAULT SYSUTCDATETIME(),
          UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Tests_New_UpdatedAt DEFAULT SYSUTCDATETIME(),

          CONSTRAINT PK_Tests_New PRIMARY KEY CLUSTERED (TestId),
          CONSTRAINT CK_Tests_New_Duration CHECK (Duration >= 1)
      );

      SET IDENTITY_INSERT Tests_New ON;
      INSERT INTO Tests_New (
          TestId, CreatedBy, Title, Subject, Department, Duration, CreatedAt, UpdatedAt
      )
      SELECT 
          TestId, CreatedBy, Title, Subject, Department, Duration, CreatedAt, UpdatedAt
      FROM Tests;
      SET IDENTITY_INSERT Tests_New OFF;

      DROP TABLE Tests;
      EXEC sp_rename 'Tests_New', 'Tests';
      EXEC sp_rename 'PK_Tests_New', 'PK_Tests', 'OBJECT';
      EXEC sp_rename 'CK_Tests_New_Duration', 'CK_Tests_Duration', 'OBJECT';
      EXEC sp_rename 'DF_Tests_New_Department', 'DF_Tests_Department', 'OBJECT';
      EXEC sp_rename 'DF_Tests_New_CreatedAt', 'DF_Tests_CreatedAt', 'OBJECT';
      EXEC sp_rename 'DF_Tests_New_UpdatedAt', 'DF_Tests_UpdatedAt', 'OBJECT';

      ALTER TABLE Tests
      ADD CONSTRAINT FK_Tests_Users FOREIGN KEY (CreatedBy)
          REFERENCES Users (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE Notifications
      ADD CONSTRAINT FK_Notifications_Test FOREIGN KEY (TestId)
          REFERENCES Tests (TestId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE Results
      ADD CONSTRAINT FK_Results_Test FOREIGN KEY (TestId)
          REFERENCES Tests (TestId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE TestQuestions
      ADD CONSTRAINT FK_TestQuestions_Tests FOREIGN KEY (TestId)
          REFERENCES Tests (TestId) ON DELETE CASCADE ON UPDATE NO ACTION;

      ALTER TABLE TestSubmissions
      ADD CONSTRAINT FK_TestSubmissions_Test FOREIGN KEY (TestId)
          REFERENCES Tests (TestId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      CREATE NONCLUSTERED INDEX IX_Tests_CreatedBy ON Tests (CreatedBy);
    `)
    console.log('✅ Tests table successfully restructured in priority order')

    // ========================================================
    // 4. REORDER NOTIFICATIONS TABLE
    // Priority:
    // 1) IDs first: NotificationId, SenderId, ReceiverId, MaterialId, TestId, SubmissionId
    // 2) Notification details: ReceiverRole, Department, Type, Title, Message, IsRead
    // 3) Timestamps: CreatedAt, UpdatedAt
    // ========================================================
    console.log('\n--- REORDERING TABLE: Notifications ---')

    await pool.request().query(`
      IF OBJECT_ID('Notifications_New', 'U') IS NOT NULL DROP TABLE Notifications_New;

      CREATE TABLE Notifications_New (
          -- 1. IDs First
          NotificationId INT IDENTITY(1,1) NOT NULL,
          SenderId INT NOT NULL,
          ReceiverId INT NOT NULL,
          MaterialId INT NULL,
          TestId INT NULL,
          SubmissionId INT NULL,

          -- 2. Notification Details
          ReceiverRole VARCHAR(10) NOT NULL,
          Department NVARCHAR(100) NOT NULL,
          Type VARCHAR(30) NOT NULL,
          Title NVARCHAR(255) NOT NULL,
          Message NVARCHAR(MAX) NOT NULL,
          IsRead BIT NOT NULL CONSTRAINT DF_Notifications_New_IsRead DEFAULT 0,

          -- 3. Timestamps Last
          CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Notifications_New_CreatedAt DEFAULT SYSUTCDATETIME(),
          UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Notifications_New_UpdatedAt DEFAULT SYSUTCDATETIME(),

          CONSTRAINT PK_Notifications_New PRIMARY KEY CLUSTERED (NotificationId),
          CONSTRAINT CK_Notifications_New_ReceiverRole CHECK (ReceiverRole IN ('student', 'staff', 'admin')),
          CONSTRAINT CK_Notifications_New_Type CHECK (Type IN ('material_upload', 'test_upload', 'test_submission')),
          CONSTRAINT CK_Notifications_New_ExclusiveArc CHECK (
              (Type = 'material_upload' AND MaterialId IS NOT NULL AND TestId IS NULL AND SubmissionId IS NULL) OR
              (Type = 'test_upload' AND TestId IS NOT NULL AND MaterialId IS NULL AND SubmissionId IS NULL) OR
              (Type = 'test_submission' AND SubmissionId IS NOT NULL AND MaterialId IS NULL AND TestId IS NULL)
          )
      );

      SET IDENTITY_INSERT Notifications_New ON;
      INSERT INTO Notifications_New (
          NotificationId, SenderId, ReceiverId, MaterialId, TestId, SubmissionId,
          ReceiverRole, Department, Type, Title, Message, IsRead, CreatedAt, UpdatedAt
      )
      SELECT 
          NotificationId, SenderId, ReceiverId, MaterialId, TestId, SubmissionId,
          ReceiverRole, Department, Type, Title, Message, IsRead, CreatedAt, UpdatedAt
      FROM Notifications;
      SET IDENTITY_INSERT Notifications_New OFF;

      DROP TABLE Notifications;
      EXEC sp_rename 'Notifications_New', 'Notifications';
      EXEC sp_rename 'PK_Notifications_New', 'PK_Notifications', 'OBJECT';
      EXEC sp_rename 'CK_Notifications_New_ReceiverRole', 'CK_Notifications_ReceiverRole', 'OBJECT';
      EXEC sp_rename 'CK_Notifications_New_Type', 'CK_Notifications_Type', 'OBJECT';
      EXEC sp_rename 'CK_Notifications_New_ExclusiveArc', 'CK_Notifications_ExclusiveArc', 'OBJECT';
      EXEC sp_rename 'DF_Notifications_New_IsRead', 'DF_Notifications_IsRead', 'OBJECT';
      EXEC sp_rename 'DF_Notifications_New_CreatedAt', 'DF_Notifications_CreatedAt', 'OBJECT';
      EXEC sp_rename 'DF_Notifications_New_UpdatedAt', 'DF_Notifications_UpdatedAt', 'OBJECT';

      ALTER TABLE Notifications
      ADD CONSTRAINT FK_Notifications_Sender FOREIGN KEY (SenderId)
          REFERENCES Users (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE Notifications
      ADD CONSTRAINT FK_Notifications_Receiver FOREIGN KEY (ReceiverId)
          REFERENCES Users (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE Notifications
      ADD CONSTRAINT FK_Notifications_Material FOREIGN KEY (MaterialId)
          REFERENCES Materials (MaterialId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE Notifications
      ADD CONSTRAINT FK_Notifications_Test FOREIGN KEY (TestId)
          REFERENCES Tests (TestId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE Notifications
      ADD CONSTRAINT FK_Notifications_Submission FOREIGN KEY (SubmissionId)
          REFERENCES TestSubmissions (SubmissionId) ON DELETE NO ACTION ON UPDATE NO ACTION;
    `)
    console.log('✅ Notifications table successfully restructured in priority order')

    // ========================================================
    // 5. REORDER USERS TABLE
    // Priority:
    // 1) IDs first: UserId
    // 2) Personal details second: Name, Email, Phone, Password, Avatar
    // 3) Account/Role details third: Role, IsActive
    // 4) Academic details (compatibility): Regnum, Department, Batch, Semester
    // 5) Security/OTP details: OtpHash, OtpExpiresAt, OtpPurpose, OtpVerified
    // 6) Timestamps: CreatedAt, UpdatedAt
    // ========================================================
    console.log('\n--- REORDERING TABLE: Users ---')

    // Drop referencing FKs to Users temporarily
    await pool.request().query(`
      IF OBJECT_ID('FK_Admins_Users', 'F') IS NOT NULL ALTER TABLE Admins DROP CONSTRAINT FK_Admins_Users;
      IF OBJECT_ID('FK_Materials_Users', 'F') IS NOT NULL ALTER TABLE Materials DROP CONSTRAINT FK_Materials_Users;
      IF OBJECT_ID('FK_Messages_Sender', 'F') IS NOT NULL ALTER TABLE Messages DROP CONSTRAINT FK_Messages_Sender;
      IF OBJECT_ID('FK_Messages_Receiver', 'F') IS NOT NULL ALTER TABLE Messages DROP CONSTRAINT FK_Messages_Receiver;
      IF OBJECT_ID('FK_Notifications_Sender', 'F') IS NOT NULL ALTER TABLE Notifications DROP CONSTRAINT FK_Notifications_Sender;
      IF OBJECT_ID('FK_Notifications_Receiver', 'F') IS NOT NULL ALTER TABLE Notifications DROP CONSTRAINT FK_Notifications_Receiver;
      IF OBJECT_ID('FK_Results_Student', 'F') IS NOT NULL ALTER TABLE Results DROP CONSTRAINT FK_Results_Student;
      IF OBJECT_ID('FK_Staff_Users', 'F') IS NOT NULL ALTER TABLE Staff DROP CONSTRAINT FK_Staff_Users;
      IF OBJECT_ID('FK_Students_Users', 'F') IS NOT NULL ALTER TABLE Students DROP CONSTRAINT FK_Students_Users;
      IF OBJECT_ID('FK_Tests_Users', 'F') IS NOT NULL ALTER TABLE Tests DROP CONSTRAINT FK_Tests_Users;
      IF OBJECT_ID('FK_TestSubmissions_Student', 'F') IS NOT NULL ALTER TABLE TestSubmissions DROP CONSTRAINT FK_TestSubmissions_Student;

      IF OBJECT_ID('Users_New', 'U') IS NOT NULL DROP TABLE Users_New;

      CREATE TABLE Users_New (
          -- 1. IDs First
          UserId INT IDENTITY(1,1) NOT NULL,

          -- 2. Personal Details Second
          Name NVARCHAR(100) NOT NULL,
          Email NVARCHAR(255) NOT NULL,
          Phone NVARCHAR(20) NOT NULL CONSTRAINT DF_Users_New_Phone DEFAULT '',
          Password NVARCHAR(255) NOT NULL,
          Avatar NVARCHAR(500) NOT NULL CONSTRAINT DF_Users_New_Avatar DEFAULT '',

          -- 3. Role & Account Status
          Role VARCHAR(10) NOT NULL,
          IsActive BIT NOT NULL CONSTRAINT DF_Users_New_IsActive DEFAULT 1,

          -- 4. Academic Details (Compatibility)
          Regnum NVARCHAR(50) NULL,
          Department NVARCHAR(100) NOT NULL CONSTRAINT DF_Users_New_Department DEFAULT '',
          Batch NVARCHAR(20) NOT NULL CONSTRAINT DF_Users_New_Batch DEFAULT '',
          Semester TINYINT NULL,

          -- 5. Security & OTP
          OtpHash NVARCHAR(255) NULL,
          OtpExpiresAt DATETIME2 NULL,
          OtpPurpose VARCHAR(20) NULL,
          OtpVerified BIT NOT NULL CONSTRAINT DF_Users_New_OtpVerified DEFAULT 0,

          -- 6. Timestamps Last
          CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_New_CreatedAt DEFAULT SYSUTCDATETIME(),
          UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_New_UpdatedAt DEFAULT SYSUTCDATETIME(),

          CONSTRAINT PK_Users_New PRIMARY KEY CLUSTERED (UserId),
          CONSTRAINT UQ_Users_New_Email UNIQUE (Email),
          CONSTRAINT CK_Users_New_Role CHECK (Role IN ('student', 'staff', 'admin')),
          CONSTRAINT CK_Users_New_Semester CHECK (Semester IS NULL OR Semester BETWEEN 1 AND 8),
          CONSTRAINT CK_Users_New_OtpPurpose CHECK (OtpPurpose IS NULL OR OtpPurpose IN ('staff_login', 'password_change'))
      );

      SET IDENTITY_INSERT Users_New ON;
      INSERT INTO Users_New (
          UserId, Name, Email, Phone, Password, Avatar, Role, IsActive,
          Regnum, Department, Batch, Semester,
          OtpHash, OtpExpiresAt, OtpPurpose, OtpVerified, CreatedAt, UpdatedAt
      )
      SELECT 
          UserId, Name, Email, Phone, Password, Avatar, Role, IsActive,
          Regnum, Department, Batch, Semester,
          OtpHash, OtpExpiresAt, OtpPurpose, OtpVerified, CreatedAt, UpdatedAt
      FROM Users;
      SET IDENTITY_INSERT Users_New OFF;

      DROP TABLE Users;
      EXEC sp_rename 'Users_New', 'Users';
      EXEC sp_rename 'PK_Users_New', 'PK_Users', 'OBJECT';
      EXEC sp_rename 'UQ_Users_New_Email', 'UQ_Users_Email', 'OBJECT';
      EXEC sp_rename 'CK_Users_New_Role', 'CK_Users_Role', 'OBJECT';
      EXEC sp_rename 'CK_Users_New_Semester', 'CK_Users_Semester', 'OBJECT';
      EXEC sp_rename 'CK_Users_New_OtpPurpose', 'CK_Users_OtpPurpose', 'OBJECT';
      EXEC sp_rename 'DF_Users_New_Phone', 'DF_Users_Phone', 'OBJECT';
      EXEC sp_rename 'DF_Users_New_Avatar', 'DF_Users_Avatar', 'OBJECT';
      EXEC sp_rename 'DF_Users_New_IsActive', 'DF_Users_IsActive', 'OBJECT';
      EXEC sp_rename 'DF_Users_New_Department', 'DF_Users_Department', 'OBJECT';
      EXEC sp_rename 'DF_Users_New_Batch', 'DF_Users_Batch', 'OBJECT';
      EXEC sp_rename 'DF_Users_New_OtpVerified', 'DF_Users_OtpVerified', 'OBJECT';
      EXEC sp_rename 'DF_Users_New_CreatedAt', 'DF_Users_CreatedAt', 'OBJECT';
      EXEC sp_rename 'DF_Users_New_UpdatedAt', 'DF_Users_UpdatedAt', 'OBJECT';

      -- Reconnect all Foreign Keys to Users
      ALTER TABLE Admins
      ADD CONSTRAINT FK_Admins_Users FOREIGN KEY (UserId)
          REFERENCES Users (UserId) ON DELETE CASCADE ON UPDATE CASCADE;

      ALTER TABLE Materials
      ADD CONSTRAINT FK_Materials_Users FOREIGN KEY (UploadedBy)
          REFERENCES Users (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE Messages
      ADD CONSTRAINT FK_Messages_Sender FOREIGN KEY (SenderId)
          REFERENCES Users (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE Messages
      ADD CONSTRAINT FK_Messages_Receiver FOREIGN KEY (ReceiverId)
          REFERENCES Users (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE Notifications
      ADD CONSTRAINT FK_Notifications_Sender FOREIGN KEY (SenderId)
          REFERENCES Users (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE Notifications
      ADD CONSTRAINT FK_Notifications_Receiver FOREIGN KEY (ReceiverId)
          REFERENCES Users (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE Results
      ADD CONSTRAINT FK_Results_Student FOREIGN KEY (StudentId)
          REFERENCES Users (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE Staff
      ADD CONSTRAINT FK_Staff_Users FOREIGN KEY (UserId)
          REFERENCES Users (UserId) ON DELETE CASCADE ON UPDATE CASCADE;

      ALTER TABLE Students
      ADD CONSTRAINT FK_Students_Users FOREIGN KEY (UserId)
          REFERENCES Users (UserId) ON DELETE CASCADE ON UPDATE CASCADE;

      ALTER TABLE Tests
      ADD CONSTRAINT FK_Tests_Users FOREIGN KEY (CreatedBy)
          REFERENCES Users (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE TestSubmissions
      ADD CONSTRAINT FK_TestSubmissions_Student FOREIGN KEY (StudentId)
          REFERENCES Users (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION;
    `)
    console.log('✅ Users table successfully restructured in priority order')

    // ========================================================
    // 6. PRINT VERIFICATION TABLE COLUMN ORDERS
    // ========================================================
    console.log('\n📋 VERIFYING ALL REORDERED TABLE SCHEMAS:\n')
    const verifyTables = ['Students', 'Users', 'Staff', 'Admins', 'Materials', 'Tests', 'Notifications']
    for (const t of verifyTables) {
      const colRes = await pool.request().query(`
        SELECT ORDINAL_POSITION AS Pos, COLUMN_NAME, DATA_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${t}'
        ORDER BY ORDINAL_POSITION
      `)
      console.log(`Table: [${t}]`)
      console.table(colRes.recordset)
    }

    console.log('\n🎉 ALL TABLES SUCCESSFULLY REORDERED IN PRIORITY ORDER!')
    await pool.close()
    return true
  } catch (err) {
    console.error('❌ Reordering failed:', err.message)
    if (pool) await pool.close()
    throw err
  }
}

if (require.main === module) {
  reorderColumns()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = reorderColumns
