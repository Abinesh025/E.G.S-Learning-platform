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

    // DDL script executing each table creation block safely
    const ddlStatements = [
      // 1. Users Table
      `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
      BEGIN
        CREATE TABLE Users (
            UserId INT IDENTITY(1,1) NOT NULL,
            Name NVARCHAR(100) NOT NULL,
            Email NVARCHAR(255) NOT NULL,
            Regnum NVARCHAR(50) NULL,
            Password NVARCHAR(255) NOT NULL,
            Role VARCHAR(10) NOT NULL,
            Avatar NVARCHAR(500) NOT NULL CONSTRAINT DF_Users_Avatar DEFAULT '',
            Department NVARCHAR(100) NOT NULL CONSTRAINT DF_Users_Department DEFAULT '',
            Phone NVARCHAR(20) NOT NULL CONSTRAINT DF_Users_Phone DEFAULT '',
            Batch NVARCHAR(20) NOT NULL CONSTRAINT DF_Users_Batch DEFAULT '',
            Semester TINYINT NULL,
            IsActive BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT 1,
            OtpHash NVARCHAR(255) NULL,
            OtpExpiresAt DATETIME2 NULL,
            OtpPurpose VARCHAR(20) NULL,
            OtpVerified BIT NOT NULL CONSTRAINT DF_Users_OtpVerified DEFAULT 0,
            CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Users_UpdatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (UserId),
            CONSTRAINT UQ_Users_Email UNIQUE (Email),
            CONSTRAINT CK_Users_Role CHECK (Role IN ('student', 'staff', 'admin')),
            CONSTRAINT CK_Users_Semester CHECK (Semester IS NULL OR Semester BETWEEN 1 AND 8),
            CONSTRAINT CK_Users_OtpPurpose CHECK (OtpPurpose IS NULL OR OtpPurpose IN ('staff_login', 'password_change'))
        );
        PRINT 'Table Users created.';
      END
      `,

      // Filtered Index on Users.Regnum
      `
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Users_Regnum' AND object_id = OBJECT_ID('Users'))
      BEGIN
        CREATE UNIQUE NONCLUSTERED INDEX UQ_Users_Regnum
        ON Users (Regnum)
        WHERE Regnum IS NOT NULL AND Regnum <> '';
        PRINT 'Filtered Index UQ_Users_Regnum created.';
      END
      `,

      // 2. Materials Table
      `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Materials')
      BEGIN
        CREATE TABLE Materials (
            MaterialId INT IDENTITY(1,1) NOT NULL,
            Title NVARCHAR(200) NOT NULL,
            Subject NVARCHAR(100) NOT NULL,
            SubjectName NVARCHAR(200) NULL,
            Unit NVARCHAR(50) NOT NULL,
            FileType VARCHAR(20) NOT NULL,
            FileUrl NVARCHAR(1000) NOT NULL,
            Department NVARCHAR(100) NOT NULL CONSTRAINT DF_Materials_Department DEFAULT '',
            Semester TINYINT NULL,
            Course NVARCHAR(100) NOT NULL CONSTRAINT DF_Materials_Course DEFAULT '',
            UploadedBy INT NOT NULL,
            StaffName NVARCHAR(100) NULL,
            CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Materials_CreatedAt DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Materials_UpdatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_Materials PRIMARY KEY CLUSTERED (MaterialId),
            CONSTRAINT FK_Materials_Users FOREIGN KEY (UploadedBy)
                REFERENCES Users (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION,
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

      // 3. Tests Table
      `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Tests')
      BEGIN
        CREATE TABLE Tests (
            TestId INT IDENTITY(1,1) NOT NULL,
            Title NVARCHAR(200) NOT NULL,
            Subject NVARCHAR(100) NOT NULL,
            Department NVARCHAR(100) NOT NULL CONSTRAINT DF_Tests_Department DEFAULT '',
            Duration INT NOT NULL,
            CreatedBy INT NOT NULL,
            CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Tests_CreatedAt DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Tests_UpdatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_Tests PRIMARY KEY CLUSTERED (TestId),
            CONSTRAINT FK_Tests_Users FOREIGN KEY (CreatedBy)
                REFERENCES Users (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION,
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

      // 4. TestQuestions Table
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

      // 5. QuestionOptions Table
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

      // 6. TestSubmissions Table
      `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TestSubmissions')
      BEGIN
        CREATE TABLE TestSubmissions (
            SubmissionId INT IDENTITY(1,1) NOT NULL,
            StudentId INT NOT NULL,
            TestId INT NOT NULL,
            Score INT NOT NULL,
            TotalQuestions INT NOT NULL,
            SmsStatus VARCHAR(20) NOT NULL CONSTRAINT DF_TestSubmissions_SmsStatus DEFAULT 'not_sent',
            SmsSentAt DATETIME2 NULL,
            CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_TestSubmissions_CreatedAt DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_TestSubmissions_UpdatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_TestSubmissions PRIMARY KEY CLUSTERED (SubmissionId),
            CONSTRAINT FK_TestSubmissions_Student FOREIGN KEY (StudentId)
                REFERENCES Users (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT FK_TestSubmissions_Test FOREIGN KEY (TestId)
                REFERENCES Tests (TestId) ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT CK_TestSubmissions_SmsStatus CHECK (SmsStatus IN ('not_sent', 'sent', 'failed'))
        );
        PRINT 'Table TestSubmissions created.';
      END
      `,

      // 7. Results Table
      `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Results')
      BEGIN
        CREATE TABLE Results (
            ResultId INT IDENTITY(1,1) NOT NULL,
            StudentId INT NOT NULL,
            TestId INT NOT NULL,
            Score DECIMAL(5,2) NOT NULL,
            TotalMarks DECIMAL(5,2) NOT NULL,
            Percentage DECIMAL(5,2) NOT NULL,
            CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Results_CreatedAt DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Results_UpdatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_Results PRIMARY KEY CLUSTERED (ResultId),
            CONSTRAINT FK_Results_Student FOREIGN KEY (StudentId)
                REFERENCES Users (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT FK_Results_Test FOREIGN KEY (TestId)
                REFERENCES Tests (TestId) ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT UQ_Results_Student_Test UNIQUE (StudentId, TestId),
            CONSTRAINT CK_Results_Percentage CHECK (Percentage >= 0.00 AND Percentage <= 100.00)
        );
        PRINT 'Table Results created.';
      END
      `,

      // 8. StudentAnswers Table
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

      // 9. Messages Table
      `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Messages')
      BEGIN
        CREATE TABLE Messages (
            MessageId INT IDENTITY(1,1) NOT NULL,
            SenderId INT NOT NULL,
            ReceiverId INT NULL,
            Room NVARCHAR(100) NOT NULL CONSTRAINT DF_Messages_Room DEFAULT '',
            Message NVARCHAR(MAX) NOT NULL CONSTRAINT DF_Messages_Message DEFAULT '',
            MessageType VARCHAR(10) NOT NULL CONSTRAINT DF_Messages_MessageType DEFAULT 'text',
            AudioUrl NVARCHAR(1000) NOT NULL CONSTRAINT DF_Messages_AudioUrl DEFAULT '',
            FileUrl NVARCHAR(1000) NOT NULL CONSTRAINT DF_Messages_FileUrl DEFAULT '',
            IsRead BIT NOT NULL CONSTRAINT DF_Messages_IsRead DEFAULT 0,
            CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Messages_CreatedAt DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Messages_UpdatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_Messages PRIMARY KEY CLUSTERED (MessageId),
            CONSTRAINT FK_Messages_Sender FOREIGN KEY (SenderId)
                REFERENCES Users (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT FK_Messages_Receiver FOREIGN KEY (ReceiverId)
                REFERENCES Users (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT CK_Messages_MessageType CHECK (MessageType IN ('text', 'voice', 'file')),
            CONSTRAINT CK_Messages_Target CHECK (ReceiverId IS NOT NULL OR Room <> '')
        );
        PRINT 'Table Messages created.';
      END
      `,

      // 10. Notifications Table
      `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
      BEGIN
        CREATE TABLE Notifications (
            NotificationId INT IDENTITY(1,1) NOT NULL,
            SenderId INT NOT NULL,
            ReceiverId INT NOT NULL,
            ReceiverRole VARCHAR(10) NOT NULL,
            Department NVARCHAR(100) NOT NULL,
            Type VARCHAR(30) NOT NULL,
            Title NVARCHAR(255) NOT NULL,
            Message NVARCHAR(MAX) NOT NULL,
            MaterialId INT NULL,
            TestId INT NULL,
            SubmissionId INT NULL,
            IsRead BIT NOT NULL CONSTRAINT DF_Notifications_IsRead DEFAULT 0,
            CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Notifications_CreatedAt DEFAULT SYSUTCDATETIME(),
            UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Notifications_UpdatedAt DEFAULT SYSUTCDATETIME(),

            CONSTRAINT PK_Notifications PRIMARY KEY CLUSTERED (NotificationId),
            CONSTRAINT FK_Notifications_Sender FOREIGN KEY (SenderId)
                REFERENCES Users (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION,
            CONSTRAINT FK_Notifications_Receiver FOREIGN KEY (ReceiverId)
                REFERENCES Users (UserId) ON DELETE NO ACTION ON UPDATE NO ACTION,
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
      `
    ]

    for (const ddl of ddlStatements) {
      await dbPool.request().query(ddl)
    }

    console.log('🎉 Microsoft SQL Server database & schema successfully verified and initialized!')
    await dbPool.close()
    process.exit(0)
  } catch (err) {
    console.error('❌ Schema initialization error:', err.message)
    if (masterPool) await masterPool.close()
    process.exit(1)
  }
}

if (require.main === module) {
  initDatabase()
}

module.exports = initDatabase
