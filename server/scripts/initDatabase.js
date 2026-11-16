require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const sql = require('mssql/msnodesqlv8')
const bcrypt = require('bcryptjs')

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

const INITIAL_DEPARTMENTS = [
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

async function initDatabase() {
  console.log('🔄 Starting Microsoft SQL Server Schema Initialization via msnodesqlv8...')
  console.log(`📡 Connecting to server: ${server} using [${odbcDriver}]`)

  let masterPool
  try {
    // 1. Connect to master database first to check/create target database
    masterPool = await sql.connect({ connectionString: getConnString('master') })
    console.log('✅ Connected to master database')

    const dbCheckResult = await masterPool.request()
      .input('dbName', sql.NVarChar, targetDbName)
      .query(`SELECT database_id FROM sys.databases WHERE name = @dbName`)

    if (dbCheckResult.recordset.length === 0) {
      console.log(`⚙️ Database [${targetDbName}] not found. Creating database...`)
      await masterPool.request().query(`CREATE DATABASE [${targetDbName}]`)
      console.log(`✅ Database [${targetDbName}] created successfully`)
    } else {
      console.log(`ℹ️ Database [${targetDbName}] already exists`)
    }
    await masterPool.close()

    // 2. Connect directly to target database
    const dbPool = await sql.connect({ connectionString: getConnString(targetDbName) })
    console.log(`✅ Connected to [${targetDbName}]`)

    // DDL script executing each table creation block safely (NO USERS TABLE)
    const ddlStatements = [
      // 0. Roles Table (System roles for role-based access control)
      `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Roles')
      BEGIN
        CREATE TABLE Roles (
            id INT IDENTITY(1,1) NOT NULL,
            roleName VARCHAR(50) NOT NULL,
            createdAt DATETIME2 NOT NULL CONSTRAINT DF_Roles_CreatedAt DEFAULT SYSUTCDATETIME(),
            updatedAt DATETIME2 NOT NULL CONSTRAINT DF_Roles_UpdatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_Roles PRIMARY KEY CLUSTERED (id)
        );
        PRINT 'Table Roles created.';
      END
      `,

      // 1. Departments Table
      `
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
      `,

      // 2. Years Table (Academic Years dimension)
      `
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
      `,

      // 3. Students Table (Dedicated student entities in Priority Order - StudentId holds unique string ID)
      `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Students')
      BEGIN
        CREATE TABLE Students (
            -- 1. IDs First (StudentId stores unique string ID e.g. CSR001, BSR001)
            StudentId NVARCHAR(50) NOT NULL,
            DepartmentId INT NOT NULL,
            YearId INT NULL,

            -- 2. Personal Details Second
            Name NVARCHAR(100) NOT NULL,
            Regnum NVARCHAR(50) NOT NULL,
            Email NVARCHAR(255) NOT NULL,
            Phone NVARCHAR(20) NOT NULL CONSTRAINT DF_Students_Phone DEFAULT '',
            Password NVARCHAR(255) NOT NULL,

            -- 3. Academic Details Third
            Batch NVARCHAR(20) NOT NULL CONSTRAINT DF_Students_Batch DEFAULT '',
            Semester TINYINT NULL,

            -- 4. Status & Timestamps
            IsActive BIT NOT NULL CONSTRAINT DF_Students_IsActive DEFAULT 1,
            IsMigrated BIT NOT NULL CONSTRAINT DF_Students_IsMigrated DEFAULT 0,
            CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Students_CreatedAt DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Students_UpdatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_Students PRIMARY KEY CLUSTERED (StudentId),
            CONSTRAINT FK_Students_Departments FOREIGN KEY (DepartmentId)
                REFERENCES Departments (DepartmentId) ON DELETE NO ACTION ON UPDATE CASCADE,
            CONSTRAINT FK_Students_Years FOREIGN KEY (YearId)
                REFERENCES Years (YearId) ON DELETE SET NULL ON UPDATE CASCADE,
            CONSTRAINT UQ_Students_Email UNIQUE (Email),
            CONSTRAINT UQ_Students_Regnum UNIQUE (Regnum),
            CONSTRAINT CK_Students_Semester CHECK (Semester IS NULL OR Semester BETWEEN 1 AND 8)
        );
        PRINT 'Table Students created.';
      END
      `,

      `
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Students_DepartmentId' AND object_id = OBJECT_ID('Students'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Students_DepartmentId ON Students (DepartmentId);
      END
      `,
      `
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Students_YearId' AND object_id = OBJECT_ID('Students'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Students_YearId ON Students (YearId);
      END
      `,

      // 4. Staff Table (Dedicated staff entities)
      `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Staff')
      BEGIN
        CREATE TABLE Staff (
            -- 1. IDs First
            StaffId INT IDENTITY(5001,1) NOT NULL,
            DepartmentId INT NULL,

            -- 2. Personal Details Second
            Name NVARCHAR(100) NOT NULL,
            Email NVARCHAR(255) NOT NULL,
            Phone NVARCHAR(20) NOT NULL CONSTRAINT DF_Staff_Phone DEFAULT '',
            Password NVARCHAR(255) NOT NULL,
            Avatar NVARCHAR(500) NOT NULL CONSTRAINT DF_Staff_Avatar DEFAULT '',

            -- 3. Professional Details Third
            Regnum NVARCHAR(50) NOT NULL,
            Designation NVARCHAR(100) NOT NULL CONSTRAINT DF_Staff_Designation DEFAULT 'Staff',
            IsActive BIT NOT NULL CONSTRAINT DF_Staff_IsActive DEFAULT 1,

            -- 4. OTP Security
            OtpHash NVARCHAR(255) NULL,
            OtpExpiresAt DATETIME2 NULL,
            OtpPurpose VARCHAR(20) NULL,
            OtpVerified BIT NOT NULL CONSTRAINT DF_Staff_OtpVerified DEFAULT 0,

            -- 5. Timestamps Last
            CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Staff_CreatedAt DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Staff_UpdatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_Staff PRIMARY KEY CLUSTERED (StaffId),
            CONSTRAINT FK_Staff_Departments FOREIGN KEY (DepartmentId)
                REFERENCES Departments (DepartmentId) ON DELETE NO ACTION ON UPDATE CASCADE,
            CONSTRAINT UQ_Staff_Email UNIQUE (Email),
            CONSTRAINT UQ_Staff_Regnum UNIQUE (Regnum)
        );
        PRINT 'Table Staff created.';
      END
      `,

      `
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Staff_DepartmentId' AND object_id = OBJECT_ID('Staff'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Staff_DepartmentId ON Staff (DepartmentId);
      END
      `,

      // 5. Admins Table (Dedicated admin entities)
      `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Admins')
      BEGIN
        CREATE TABLE Admins (
            -- 1. IDs First
            AdminId INT IDENTITY(9001,1) NOT NULL,

            -- 2. Personal Details Second
            Name NVARCHAR(100) NOT NULL,
            Email NVARCHAR(255) NOT NULL,
            Phone NVARCHAR(20) NOT NULL CONSTRAINT DF_Admins_Phone DEFAULT '',
            Password NVARCHAR(255) NOT NULL,
            Avatar NVARCHAR(500) NOT NULL CONSTRAINT DF_Admins_Avatar DEFAULT '',

            -- 3. Administration Level
            AdminLevel NVARCHAR(50) NOT NULL CONSTRAINT DF_Admins_AdminLevel DEFAULT 'superadmin',
            IsActive BIT NOT NULL CONSTRAINT DF_Admins_IsActive DEFAULT 1,

            -- 4. Timestamps Last
            CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Admins_CreatedAt DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Admins_UpdatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_Admins PRIMARY KEY CLUSTERED (AdminId),
            CONSTRAINT UQ_Admins_Email UNIQUE (Email)
        );
        PRINT 'Table Admins created.';
      END
      `,

      // 6. Materials Table (UploadedBy -> Staff)
      `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Materials')
      BEGIN
        CREATE TABLE Materials (
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
            Department NVARCHAR(100) NOT NULL CONSTRAINT DF_Materials_Department DEFAULT '',
            Semester TINYINT NULL,
            Course NVARCHAR(100) NOT NULL CONSTRAINT DF_Materials_Course DEFAULT '',
            StaffName NVARCHAR(100) NULL,

            -- 4. Timestamps Last
            CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Materials_CreatedAt DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Materials_UpdatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_Materials PRIMARY KEY CLUSTERED (MaterialId),
            CONSTRAINT FK_Materials_Staff FOREIGN KEY (UploadedBy)
                REFERENCES Staff (StaffId) ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT CK_Materials_Semester CHECK (Semester IS NULL OR Semester BETWEEN 1 AND 8)
        );
        PRINT 'Table Materials created.';
      END
      `,

      // Materials Indexes
      `
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Materials_Subject_Semester_Department' AND object_id = OBJECT_ID('Materials'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Materials_Subject_Semester_Department
        ON Materials (Subject, Semester, Department);
      END
      `,
      `
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Materials_UploadedBy' AND object_id = OBJECT_ID('Materials'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Materials_UploadedBy ON Materials (UploadedBy);
      END
      `,

      // 7. Tests Table (CreatedBy -> Staff)
      `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tests')
      BEGIN
        CREATE TABLE Tests (
            -- 1. IDs First
            TestId INT IDENTITY(1,1) NOT NULL,
            CreatedBy INT NOT NULL,

            -- 2. Test Details
            Title NVARCHAR(200) NOT NULL,
            Subject NVARCHAR(100) NOT NULL,
            Department NVARCHAR(100) NOT NULL CONSTRAINT DF_Tests_Department DEFAULT '',
            Duration INT NOT NULL,

            -- 3. Timestamps Last
            CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Tests_CreatedAt DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Tests_UpdatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_Tests PRIMARY KEY CLUSTERED (TestId),
            CONSTRAINT FK_Tests_Staff FOREIGN KEY (CreatedBy)
                REFERENCES Staff (StaffId) ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT CK_Tests_Duration CHECK (Duration >= 1)
        );
        PRINT 'Table Tests created.';
      END
      `,

      // Tests Indexes
      `
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Tests_CreatedBy' AND object_id = OBJECT_ID('Tests'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Tests_CreatedBy ON Tests (CreatedBy);
      END
      `,

      // 8. TestQuestions Table
      `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TestQuestions')
      BEGIN
        CREATE TABLE TestQuestions (
            QuestionId INT IDENTITY(1,1) NOT NULL,
            TestId INT NOT NULL,
            QuestionText NVARCHAR(MAX) NOT NULL,
            QuestionOrder INT NOT NULL CONSTRAINT DF_TestQuestions_QuestionOrder DEFAULT 1,
            CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_TestQuestions_CreatedAt DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_TestQuestions_UpdatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_TestQuestions PRIMARY KEY CLUSTERED (QuestionId),
            CONSTRAINT FK_TestQuestions_Tests FOREIGN KEY (TestId)
                REFERENCES Tests (TestId) ON DELETE CASCADE ON UPDATE NO ACTION
        );
        PRINT 'Table TestQuestions created.';
      END
      `,

      // 9. QuestionOptions Table
      `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'QuestionOptions')
      BEGIN
        CREATE TABLE QuestionOptions (
            OptionId INT IDENTITY(1,1) NOT NULL,
            QuestionId INT NOT NULL,
            OptionText NVARCHAR(1000) NOT NULL,
            OptionOrder INT NOT NULL CONSTRAINT DF_QuestionOptions_OptionOrder DEFAULT 1,
            IsCorrect BIT NOT NULL CONSTRAINT DF_QuestionOptions_IsCorrect DEFAULT 0,
            CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_QuestionOptions_CreatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_QuestionOptions PRIMARY KEY CLUSTERED (OptionId),
            CONSTRAINT FK_QuestionOptions_TestQuestions FOREIGN KEY (QuestionId)
                REFERENCES TestQuestions (QuestionId) ON DELETE CASCADE ON UPDATE NO ACTION
        );
        PRINT 'Table QuestionOptions created.';
      END
      `,

      // 10. TestSubmissions Table (StudentId -> Students)
      `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TestSubmissions')
      BEGIN
        CREATE TABLE TestSubmissions (
            SubmissionId INT IDENTITY(1,1) NOT NULL,
            StudentId NVARCHAR(50) NOT NULL,
            TestId INT NOT NULL,
            Score INT NOT NULL,
            TotalQuestions INT NOT NULL,
            SmsStatus VARCHAR(20) NOT NULL CONSTRAINT DF_TestSubmissions_SmsStatus DEFAULT 'not_sent',
            SmsSentAt DATETIME2 NULL,
            CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_TestSubmissions_CreatedAt DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_TestSubmissions_UpdatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_TestSubmissions PRIMARY KEY CLUSTERED (SubmissionId),
            CONSTRAINT FK_TestSubmissions_Student FOREIGN KEY (StudentId)
                REFERENCES Students (StudentId) ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT FK_TestSubmissions_Test FOREIGN KEY (TestId)
                REFERENCES Tests (TestId) ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT CK_TestSubmissions_SmsStatus CHECK (SmsStatus IN ('not_sent', 'sent', 'failed'))
        );
        PRINT 'Table TestSubmissions created.';
      END
      `,

      // 11. Results Table (StudentId -> Students)
      `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Results')
      BEGIN
        CREATE TABLE Results (
            ResultId INT IDENTITY(1,1) NOT NULL,
            StudentId NVARCHAR(50) NOT NULL,
            TestId INT NOT NULL,
            Score DECIMAL(5,2) NOT NULL,
            TotalMarks DECIMAL(5,2) NOT NULL,
            Percentage DECIMAL(5,2) NOT NULL,
            CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Results_CreatedAt DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Results_UpdatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_Results PRIMARY KEY CLUSTERED (ResultId),
            CONSTRAINT FK_Results_Student FOREIGN KEY (StudentId)
                REFERENCES Students (StudentId) ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT FK_Results_Test FOREIGN KEY (TestId)
                REFERENCES Tests (TestId) ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT UQ_Results_Student_Test UNIQUE (StudentId, TestId),
            CONSTRAINT CK_Results_Percentage CHECK (Percentage >= 0.00 AND Percentage <= 100.00)
        );
        PRINT 'Table Results created.';
      END
      `,

      // 12. StudentAnswers Table
      `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StudentAnswers')
      BEGIN
        CREATE TABLE StudentAnswers (
            AnswerId INT IDENTITY(1,1) NOT NULL,
            ResultId INT NOT NULL,
            QuestionId INT NOT NULL,
            SelectedOptionId INT NULL,
            CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_StudentAnswers_CreatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_StudentAnswers PRIMARY KEY CLUSTERED (AnswerId),
            CONSTRAINT FK_StudentAnswers_Results FOREIGN KEY (ResultId)
                REFERENCES Results (ResultId) ON DELETE CASCADE ON UPDATE NO ACTION,
            CONSTRAINT FK_StudentAnswers_Questions FOREIGN KEY (QuestionId)
                REFERENCES TestQuestions (QuestionId) ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT FK_StudentAnswers_Options FOREIGN KEY (SelectedOptionId)
                REFERENCES QuestionOptions (OptionId) ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT UQ_StudentAnswers_Result_Question UNIQUE (ResultId, QuestionId)
        );
        PRINT 'Table StudentAnswers created.';
      END
      `,

      // 13. Messages Table
      `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Messages')
      BEGIN
        CREATE TABLE Messages (
            MessageId INT IDENTITY(1,1) NOT NULL,
            SenderId NVARCHAR(50) NOT NULL,
            ReceiverId NVARCHAR(50) NULL,
            Room NVARCHAR(100) NOT NULL CONSTRAINT DF_Messages_Room DEFAULT '',
            Message NVARCHAR(MAX) NOT NULL CONSTRAINT DF_Messages_Message DEFAULT '',
            MessageType VARCHAR(10) NOT NULL CONSTRAINT DF_Messages_MessageType DEFAULT 'text',
            AudioUrl NVARCHAR(1000) NOT NULL CONSTRAINT DF_Messages_AudioUrl DEFAULT '',
            FileUrl NVARCHAR(1000) NOT NULL CONSTRAINT DF_Messages_FileUrl DEFAULT '',
            IsRead BIT NOT NULL CONSTRAINT DF_Messages_IsRead DEFAULT 0,
            CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Messages_CreatedAt DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Messages_UpdatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_Messages PRIMARY KEY CLUSTERED (MessageId),
            CONSTRAINT CK_Messages_MessageType CHECK (MessageType IN ('text', 'voice', 'file')),
            CONSTRAINT CK_Messages_Target CHECK (ReceiverId IS NOT NULL OR Room <> '')
        );
        PRINT 'Table Messages created.';
      END
      `,

      // 14. Notifications Table
      `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
      BEGIN
        CREATE TABLE Notifications (
            -- 1. IDs First
            NotificationId INT IDENTITY(1,1) NOT NULL,
            SenderId NVARCHAR(50) NOT NULL,
            ReceiverId NVARCHAR(50) NOT NULL,
            MaterialId INT NULL,
            TestId INT NULL,
            SubmissionId INT NULL,

            -- 2. Notification Details
            ReceiverRole VARCHAR(10) NOT NULL,
            Department NVARCHAR(100) NOT NULL,
            Type VARCHAR(30) NOT NULL,
            Title NVARCHAR(255) NOT NULL,
            Message NVARCHAR(MAX) NOT NULL,
            IsRead BIT NOT NULL CONSTRAINT DF_Notifications_IsRead DEFAULT 0,

            -- 3. Timestamps Last
            CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Notifications_CreatedAt DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Notifications_UpdatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_Notifications PRIMARY KEY CLUSTERED (NotificationId),
            CONSTRAINT FK_Notifications_Material FOREIGN KEY (MaterialId)
                REFERENCES Materials (MaterialId) ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT FK_Notifications_Test FOREIGN KEY (TestId)
                REFERENCES Tests (TestId) ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT FK_Notifications_Submission FOREIGN KEY (SubmissionId)
                REFERENCES TestSubmissions (SubmissionId) ON DELETE NO ACTION ON UPDATE NO ACTION,

            CONSTRAINT CK_Notifications_ReceiverRole CHECK (ReceiverRole IN ('student', 'staff', 'admin')),
            CONSTRAINT CK_Notifications_Type CHECK (Type IN ('material_upload', 'test_upload', 'test_submission')),

            CONSTRAINT CK_Notifications_ExclusiveArc CHECK (
                (Type = 'material_upload' AND MaterialId IS NOT NULL AND TestId IS NULL AND SubmissionId IS NULL) OR
                (Type = 'test_upload' AND TestId IS NOT NULL AND MaterialId IS NULL AND SubmissionId IS NULL) OR
                (Type = 'test_submission' AND SubmissionId IS NOT NULL AND MaterialId IS NULL AND TestId IS NULL)
            )
        );
        PRINT 'Table Notifications created.';
      END
      `,

      // 15. PasswordResets Table (Dedicated for secure password recovery across all user roles)
      `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PasswordResets')
      BEGIN
        CREATE TABLE PasswordResets (
            id INT IDENTITY(1,1) NOT NULL,
            email NVARCHAR(255) NOT NULL,
            otpHash NVARCHAR(255) NOT NULL,
            expiresAt DATETIME2 NOT NULL,
            verified BIT NOT NULL CONSTRAINT DF_PasswordResets_Verified DEFAULT 0,
            resetToken NVARCHAR(500) NULL,
            createdAt DATETIME2 NOT NULL CONSTRAINT DF_PasswordResets_CreatedAt DEFAULT SYSUTCDATETIME(),
            updatedAt DATETIME2 NOT NULL CONSTRAINT DF_PasswordResets_UpdatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_PasswordResets PRIMARY KEY CLUSTERED (id)
        );
        CREATE NONCLUSTERED INDEX IX_PasswordResets_Email ON PasswordResets(email);
        PRINT 'Table PasswordResets created.';
      END
      `
    ]

    for (const ddl of ddlStatements) {
      await dbPool.request().query(ddl)
    }

    // Seed roles
    const INITIAL_ROLES = ['Admin', 'Staff', 'Student']
    for (const roleName of INITIAL_ROLES) {
      await dbPool.request()
        .input('roleName', sql.VarChar(50), roleName)
        .query(`
          IF NOT EXISTS (SELECT 1 FROM Roles WHERE LOWER(roleName) = LOWER(@roleName))
          BEGIN
            INSERT INTO Roles (roleName) VALUES (@roleName);
          END
        `)
    }
    console.log('✅ System Roles successfully initialized and verified')

    // Seed departments
    for (const dept of INITIAL_DEPARTMENTS) {
      await dbPool.request()
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
    console.log('✅ Departments successfully initialized and verified')

    // Seed years
    for (const yr of INITIAL_YEARS) {
      await dbPool.request()
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
    console.log('✅ Academic Years successfully initialized and verified')

    // Seed default administrator directly into Admins table
    const adminEmail = 'admin@egspec.edu'
    const adminCheck = await dbPool.request()
      .input('Email', sql.NVarChar(255), adminEmail)
      .query(`SELECT AdminId FROM Admins WHERE LOWER(Email) = LOWER(@Email)`)

    if (adminCheck.recordset.length === 0) {
      const hashedPassword = await bcrypt.hash('egspec@2026', 10)
      await dbPool.request()
        .input('Name', sql.NVarChar(100), 'System Administrator')
        .input('Email', sql.NVarChar(255), adminEmail)
        .input('Password', sql.NVarChar(255), hashedPassword)
        .input('Phone', sql.NVarChar(20), '9876543210')
        .input('AdminLevel', sql.NVarChar(50), 'superadmin')
        .query(`
          INSERT INTO Admins (Name, Email, Password, Phone, AdminLevel, IsActive)
          VALUES (@Name, @Email, @Password, @Phone, @AdminLevel, 1)
        `)
      console.log('✅ Default Administrator seeded directly in Admins: admin@egspec.edu')
    } else {
      console.log('ℹ️ Administrator already exists in Admins table')
    }

    console.log('🎉 Microsoft SQL Server database & schema successfully verified and initialized!')
    await dbPool.close()
    return true
  } catch (err) {
    console.error('❌ Schema initialization error:', err.message)
    if (masterPool) await masterPool.close()
    throw err
  }
}

if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = initDatabase
