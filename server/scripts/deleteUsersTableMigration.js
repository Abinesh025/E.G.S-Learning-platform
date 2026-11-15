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

async function runDeleteUsersMigration() {
  console.log('🔄 Starting Migration to DELETE Users table and all its references...')
  console.log(`📡 Connecting to [${targetDbName}] on ${server}...`)

  let pool
  try {
    pool = await sql.connect({ connectionString: getConnString(targetDbName) })
    console.log('✅ Connected to database\n')

    // 1. Ensure Staff table has independent user credentials & details
    console.log('⚙️ Step 1: Upgrading Staff table to independent entity...')
    const staffCols = [
      { name: 'Name', type: 'NVARCHAR(100) NULL' },
      { name: 'Email', type: 'NVARCHAR(255) NULL' },
      { name: 'Phone', type: "NVARCHAR(20) NOT NULL CONSTRAINT DF_Staff_Phone DEFAULT ''" },
      { name: 'Password', type: 'NVARCHAR(255) NULL' },
      { name: 'Avatar', type: "NVARCHAR(500) NOT NULL CONSTRAINT DF_Staff_Avatar DEFAULT ''" },
      { name: 'IsActive', type: 'BIT NOT NULL CONSTRAINT DF_Staff_IsActive DEFAULT 1' },
      { name: 'OtpHash', type: 'NVARCHAR(255) NULL' },
      { name: 'OtpExpiresAt', type: 'DATETIME2 NULL' },
      { name: 'OtpPurpose', type: 'VARCHAR(20) NULL' },
      { name: 'OtpVerified', type: 'BIT NOT NULL CONSTRAINT DF_Staff_OtpVerified DEFAULT 0' }
    ]

    for (const c of staffCols) {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Staff') AND name = '${c.name}')
          ALTER TABLE Staff ADD ${c.name} ${c.type};
      `)
    }

    // Populate Staff from Users if Users table exists
    const usersTableCheck = await pool.request().query(`SELECT OBJECT_ID('Users', 'U') AS UsersTableExists`)
    if (usersTableCheck.recordset[0].UsersTableExists) {
      await pool.request().query(`
        UPDATE st
        SET 
          st.Name = COALESCE(st.Name, u.Name),
          st.Email = COALESCE(st.Email, u.Email),
          st.Phone = COALESCE(st.Phone, u.Phone, ''),
          st.Password = COALESCE(st.Password, u.Password),
          st.Avatar = COALESCE(st.Avatar, u.Avatar, ''),
          st.IsActive = COALESCE(st.IsActive, u.IsActive, 1),
          st.OtpHash = COALESCE(st.OtpHash, u.OtpHash),
          st.OtpExpiresAt = COALESCE(st.OtpExpiresAt, u.OtpExpiresAt),
          st.OtpPurpose = COALESCE(st.OtpPurpose, u.OtpPurpose),
          st.OtpVerified = COALESCE(st.OtpVerified, u.OtpVerified, 0)
        FROM Staff st
        JOIN Users u ON st.UserId = u.UserId;
      `)
    }
    console.log('✅ Staff table upgraded and populated')

    // 2. Ensure Admins table has independent user credentials & details
    console.log('\n⚙️ Step 2: Upgrading Admins table to independent entity...')
    const adminCols = [
      { name: 'Name', type: 'NVARCHAR(100) NULL' },
      { name: 'Email', type: 'NVARCHAR(255) NULL' },
      { name: 'Phone', type: "NVARCHAR(20) NOT NULL CONSTRAINT DF_Admins_Phone DEFAULT ''" },
      { name: 'Password', type: 'NVARCHAR(255) NULL' },
      { name: 'Avatar', type: "NVARCHAR(500) NOT NULL CONSTRAINT DF_Admins_Avatar DEFAULT ''" },
      { name: 'IsActive', type: 'BIT NOT NULL CONSTRAINT DF_Admins_IsActive DEFAULT 1' }
    ]

    for (const c of adminCols) {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Admins') AND name = '${c.name}')
          ALTER TABLE Admins ADD ${c.name} ${c.type};
      `)
    }

    if (usersTableCheck.recordset[0].UsersTableExists) {
      await pool.request().query(`
        UPDATE a
        SET 
          a.Name = COALESCE(a.Name, u.Name),
          a.Email = COALESCE(a.Email, u.Email),
          a.Phone = COALESCE(a.Phone, u.Phone, ''),
          a.Password = COALESCE(a.Password, u.Password),
          a.Avatar = COALESCE(a.Avatar, u.Avatar, ''),
          a.IsActive = COALESCE(a.IsActive, u.IsActive, 1)
        FROM Admins a
        JOIN Users u ON a.UserId = u.UserId;
      `)
    }
    console.log('✅ Admins table upgraded and populated')

    // 3. Ensure Students table has Avatar, IsActive, Otp columns if missing
    console.log('\n⚙️ Step 3: Upgrading Students table with security & status attributes...')
    const studentCols = [
      { name: 'Avatar', type: "NVARCHAR(500) NOT NULL CONSTRAINT DF_Students_Avatar DEFAULT ''" },
      { name: 'IsActive', type: 'BIT NOT NULL CONSTRAINT DF_Students_IsActive DEFAULT 1' },
      { name: 'OtpHash', type: 'NVARCHAR(255) NULL' },
      { name: 'OtpExpiresAt', type: 'DATETIME2 NULL' },
      { name: 'OtpPurpose', type: 'VARCHAR(20) NULL' },
      { name: 'OtpVerified', type: 'BIT NOT NULL CONSTRAINT DF_Students_OtpVerified DEFAULT 0' }
    ]

    for (const c of studentCols) {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Students') AND name = '${c.name}')
          ALTER TABLE Students ADD ${c.name} ${c.type};
      `)
    }
    console.log('✅ Students table upgraded')

    // 4. Drop all Foreign Key Constraints referencing Users table
    console.log('\n⚙️ Step 4: Dropping all Foreign Key constraints referencing Users table...')
    const fksToDrop = [
      { table: 'Students', fk: 'FK_Students_Users' },
      { table: 'Staff', fk: 'FK_Staff_Users' },
      { table: 'Admins', fk: 'FK_Admins_Users' },
      { table: 'Materials', fk: 'FK_Materials_Users' },
      { table: 'Tests', fk: 'FK_Tests_Users' },
      { table: 'TestSubmissions', fk: 'FK_TestSubmissions_Student' },
      { table: 'Results', fk: 'FK_Results_Student' },
      { table: 'Messages', fk: 'FK_Messages_Sender' },
      { table: 'Messages', fk: 'FK_Messages_Receiver' },
      { table: 'Notifications', fk: 'FK_Notifications_Sender' },
      { table: 'Notifications', fk: 'FK_Notifications_Receiver' }
    ]

    for (const item of fksToDrop) {
      await pool.request().query(`
        IF OBJECT_ID('${item.fk}', 'F') IS NOT NULL
        BEGIN
          ALTER TABLE [${item.table}] DROP CONSTRAINT [${item.fk}];
          PRINT 'Dropped ${item.fk}';
        END
      `)
    }
    console.log('✅ All FKs referencing Users dropped')

    // 5. Drop UserId column from Students, Staff, and Admins
    console.log('\n⚙️ Step 5: Dropping UserId column from entity tables...')
    // Drop Unique constraints on UserId if present
    await pool.request().query(`
      IF OBJECT_ID('UQ_Students_UserId', 'UQ') IS NOT NULL
        ALTER TABLE Students DROP CONSTRAINT UQ_Students_UserId;
      IF OBJECT_ID('UQ_Staff_UserId', 'UQ') IS NOT NULL
        ALTER TABLE Staff DROP CONSTRAINT UQ_Staff_UserId;
      IF OBJECT_ID('UQ_Admins_UserId', 'UQ') IS NOT NULL
        ALTER TABLE Admins DROP CONSTRAINT UQ_Admins_UserId;

      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Students') AND name = 'UserId')
        ALTER TABLE Students DROP COLUMN UserId;
      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Staff') AND name = 'UserId')
        ALTER TABLE Staff DROP COLUMN UserId;
      IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Admins') AND name = 'UserId')
        ALTER TABLE Admins DROP COLUMN UserId;
    `)
    console.log('✅ UserId column removed from Students, Staff, and Admins')

    // 6. Connect Materials and Tests directly to Staff, and Submissions/Results to Students
    console.log('\n⚙️ Step 6: Directing domain table foreign keys to Staff and Students...')
    await pool.request().query(`
      IF OBJECT_ID('FK_Materials_Staff', 'F') IS NULL
      BEGIN
        ALTER TABLE Materials
        ADD CONSTRAINT FK_Materials_Staff FOREIGN KEY (UploadedBy)
            REFERENCES Staff (StaffId) ON DELETE NO ACTION ON UPDATE NO ACTION;
      END

      IF OBJECT_ID('FK_Tests_Staff', 'F') IS NULL
      BEGIN
        ALTER TABLE Tests
        ADD CONSTRAINT FK_Tests_Staff FOREIGN KEY (CreatedBy)
            REFERENCES Staff (StaffId) ON DELETE NO ACTION ON UPDATE NO ACTION;
      END

      IF OBJECT_ID('FK_TestSubmissions_Students', 'F') IS NULL
      BEGIN
        ALTER TABLE TestSubmissions
        ADD CONSTRAINT FK_TestSubmissions_Students FOREIGN KEY (StudentId)
            REFERENCES Students (StudentId) ON DELETE NO ACTION ON UPDATE NO ACTION;
      END

      IF OBJECT_ID('FK_Results_Students', 'F') IS NULL
      BEGIN
        ALTER TABLE Results
        ADD CONSTRAINT FK_Results_Students FOREIGN KEY (StudentId)
            REFERENCES Students (StudentId) ON DELETE NO ACTION ON UPDATE NO ACTION;
      END
    `)
    console.log('✅ Domain FKs connected to Staff & Students directly')

    // 7. DROP THE USERS TABLE PERMANENTLY
    console.log('\n⚙️ Step 7: Dropping Users table permanently...')
    await pool.request().query(`
      IF OBJECT_ID('Users', 'U') IS NOT NULL
      BEGIN
        DROP TABLE Users;
        PRINT 'Table Users successfully dropped.';
      END
    `)
    console.log('✅ Users table permanently deleted!')

    // 8. Reorder Staff columns in priority order
    console.log('\n⚙️ Step 8: Reordering Staff table columns in priority order...')
    await pool.request().query(`
      IF OBJECT_ID('Staff_New', 'U') IS NOT NULL DROP TABLE Staff_New;

      CREATE TABLE Staff_New (
          -- 1. IDs First
          StaffId INT IDENTITY(1,1) NOT NULL,
          DepartmentId INT NULL,

          -- 2. Personal Details Second
          Name NVARCHAR(100) NOT NULL,
          Email NVARCHAR(255) NOT NULL,
          Phone NVARCHAR(20) NOT NULL CONSTRAINT DF_Staff_New_Phone DEFAULT '',
          Password NVARCHAR(255) NOT NULL,
          Avatar NVARCHAR(500) NOT NULL CONSTRAINT DF_Staff_New_Avatar DEFAULT '',
          Regnum NVARCHAR(50) NOT NULL,
          Designation NVARCHAR(100) NOT NULL CONSTRAINT DF_Staff_New_Designation DEFAULT 'Staff',
          IsActive BIT NOT NULL CONSTRAINT DF_Staff_New_IsActive DEFAULT 1,

          -- 3. Security / OTP
          OtpHash NVARCHAR(255) NULL,
          OtpExpiresAt DATETIME2 NULL,
          OtpPurpose VARCHAR(20) NULL,
          OtpVerified BIT NOT NULL CONSTRAINT DF_Staff_New_OtpVerified DEFAULT 0,

          -- 4. Timestamps Last
          CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Staff_New_CreatedAt DEFAULT SYSUTCDATETIME(),
          UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Staff_New_UpdatedAt DEFAULT SYSUTCDATETIME(),

          CONSTRAINT PK_Staff_New PRIMARY KEY CLUSTERED (StaffId),
          CONSTRAINT UQ_Staff_New_Email UNIQUE (Email),
          CONSTRAINT UQ_Staff_New_Regnum UNIQUE (Regnum)
      );

      SET IDENTITY_INSERT Staff_New ON;
      INSERT INTO Staff_New (
          StaffId, DepartmentId, Name, Email, Phone, Password, Avatar, Regnum, Designation, IsActive,
          OtpHash, OtpExpiresAt, OtpPurpose, OtpVerified, CreatedAt, UpdatedAt
      )
      SELECT 
          StaffId, DepartmentId, Name, Email, Phone, Password, Avatar, Regnum, Designation, IsActive,
          OtpHash, OtpExpiresAt, OtpPurpose, OtpVerified, CreatedAt, UpdatedAt
      FROM Staff;
      SET IDENTITY_INSERT Staff_New OFF;

      -- Drop referencing FKs to Staff temporarily
      IF OBJECT_ID('FK_Materials_Staff', 'F') IS NOT NULL ALTER TABLE Materials DROP CONSTRAINT FK_Materials_Staff;
      IF OBJECT_ID('FK_Tests_Staff', 'F') IS NOT NULL ALTER TABLE Tests DROP CONSTRAINT FK_Tests_Staff;

      DROP TABLE Staff;
      EXEC sp_rename 'Staff_New', 'Staff';
      EXEC sp_rename 'PK_Staff_New', 'PK_Staff', 'OBJECT';
      EXEC sp_rename 'UQ_Staff_New_Email', 'UQ_Staff_Email', 'OBJECT';
      EXEC sp_rename 'UQ_Staff_New_Regnum', 'UQ_Staff_Regnum', 'OBJECT';
      EXEC sp_rename 'DF_Staff_New_Phone', 'DF_Staff_Phone', 'OBJECT';
      EXEC sp_rename 'DF_Staff_New_Avatar', 'DF_Staff_Avatar', 'OBJECT';
      EXEC sp_rename 'DF_Staff_New_Designation', 'DF_Staff_Designation', 'OBJECT';
      EXEC sp_rename 'DF_Staff_New_IsActive', 'DF_Staff_IsActive', 'OBJECT';
      EXEC sp_rename 'DF_Staff_New_OtpVerified', 'DF_Staff_OtpVerified', 'OBJECT';
      EXEC sp_rename 'DF_Staff_New_CreatedAt', 'DF_Staff_CreatedAt', 'OBJECT';
      EXEC sp_rename 'DF_Staff_New_UpdatedAt', 'DF_Staff_UpdatedAt', 'OBJECT';

      ALTER TABLE Staff
      ADD CONSTRAINT FK_Staff_Departments FOREIGN KEY (DepartmentId)
          REFERENCES Departments (DepartmentId) ON DELETE NO ACTION ON UPDATE CASCADE;

      ALTER TABLE Materials
      ADD CONSTRAINT FK_Materials_Staff FOREIGN KEY (UploadedBy)
          REFERENCES Staff (StaffId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE Tests
      ADD CONSTRAINT FK_Tests_Staff FOREIGN KEY (CreatedBy)
          REFERENCES Staff (StaffId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      CREATE NONCLUSTERED INDEX IX_Staff_DepartmentId ON Staff (DepartmentId);
    `)
    console.log('✅ Staff table reordered in priority order')

    // 9. Reorder Admins columns in priority order
    console.log('\n⚙️ Step 9: Reordering Admins table columns in priority order...')
    await pool.request().query(`
      IF OBJECT_ID('Admins_New', 'U') IS NOT NULL DROP TABLE Admins_New;

      CREATE TABLE Admins_New (
          -- 1. IDs First
          AdminId INT IDENTITY(1,1) NOT NULL,

          -- 2. Personal Details Second
          Name NVARCHAR(100) NOT NULL,
          Email NVARCHAR(255) NOT NULL,
          Phone NVARCHAR(20) NOT NULL CONSTRAINT DF_Admins_New_Phone DEFAULT '',
          Password NVARCHAR(255) NOT NULL,
          Avatar NVARCHAR(500) NOT NULL CONSTRAINT DF_Admins_New_Avatar DEFAULT '',
          AdminLevel NVARCHAR(50) NOT NULL CONSTRAINT DF_Admins_New_AdminLevel DEFAULT 'superadmin',
          IsActive BIT NOT NULL CONSTRAINT DF_Admins_New_IsActive DEFAULT 1,

          -- 3. Timestamps Last
          CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_Admins_New_CreatedAt DEFAULT SYSUTCDATETIME(),
          UpdatedAt DATETIME2 NOT NULL CONSTRAINT DF_Admins_New_UpdatedAt DEFAULT SYSUTCDATETIME(),

          CONSTRAINT PK_Admins_New PRIMARY KEY CLUSTERED (AdminId),
          CONSTRAINT UQ_Admins_New_Email UNIQUE (Email)
      );

      SET IDENTITY_INSERT Admins_New ON;
      INSERT INTO Admins_New (
          AdminId, Name, Email, Phone, Password, Avatar, AdminLevel, IsActive, CreatedAt, UpdatedAt
      )
      SELECT 
          AdminId, Name, Email, Phone, Password, Avatar, AdminLevel, IsActive, CreatedAt, UpdatedAt
      FROM Admins;
      SET IDENTITY_INSERT Admins_New OFF;

      DROP TABLE Admins;
      EXEC sp_rename 'Admins_New', 'Admins';
      EXEC sp_rename 'PK_Admins_New', 'PK_Admins', 'OBJECT';
      EXEC sp_rename 'UQ_Admins_New_Email', 'UQ_Admins_Email', 'OBJECT';
      EXEC sp_rename 'DF_Admins_New_Phone', 'DF_Admins_Phone', 'OBJECT';
      EXEC sp_rename 'DF_Admins_New_Avatar', 'DF_Admins_Avatar', 'OBJECT';
      EXEC sp_rename 'DF_Admins_New_AdminLevel', 'DF_Admins_AdminLevel', 'OBJECT';
      EXEC sp_rename 'DF_Admins_New_IsActive', 'DF_Admins_IsActive', 'OBJECT';
      EXEC sp_rename 'DF_Admins_New_CreatedAt', 'DF_Admins_CreatedAt', 'OBJECT';
      EXEC sp_rename 'DF_Admins_New_UpdatedAt', 'DF_Admins_UpdatedAt', 'OBJECT';
    `)
    console.log('✅ Admins table reordered in priority order')

    // 10. Display Final Schemas of Students, Staff, and Admins
    console.log('\n📋 VERIFYING FINAL SCHEMAS (WITHOUT USERS TABLE):')
    const finalTables = ['Students', 'Staff', 'Admins']
    for (const t of finalTables) {
      const colRes = await pool.request().query(`
        SELECT ORDINAL_POSITION AS Pos, COLUMN_NAME, DATA_TYPE, IS_NULLABLE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = '${t}'
        ORDER BY ORDINAL_POSITION
      `)
      console.log(`\nTable: [${t}]`)
      console.table(colRes.recordset)
    }

    // Verify Users table is indeed gone
    const checkUsers = await pool.request().query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users'
    `)
    if (checkUsers.recordset.length === 0) {
      console.log('\n🗑️ CONFIRMED: Table [Users] has been completely removed from the database.')
    } else {
      throw new Error('Table Users still exists!')
    }

    // Print all remaining tables in database
    const allTables = await pool.request().query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME
    `)
    console.log('\n📦 Remaining Base Tables in Database:')
    console.table(allTables.recordset)

    console.log('\n🎉 Users Table and All References Successfully Removed!')
    await pool.close()
    return true
  } catch (err) {
    console.error('❌ Migration error:', err.message)
    if (pool) await pool.close()
    throw err
  }
}

if (require.main === module) {
  runDeleteUsersMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = runDeleteUsersMigration
