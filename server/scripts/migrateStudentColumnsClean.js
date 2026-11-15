const { sql, getPool } = require('../config/db');

async function migrate() {
  console.log('🚀 Starting clean migration of Students table...');
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    const req = new sql.Request(tx);

    // 1. Copy existing student data into a temporary table
    console.log('1. Copying existing student data into #Students_Backup...');
    await req.query(`
      IF OBJECT_ID('tempdb..#Students_Backup') IS NOT NULL
        DROP TABLE #Students_Backup;

      SELECT 
        StudentId,
        COALESCE(DepartmentId, DeptId) AS DepartmentId,
        YearId,
        Name,
        Regnum,
        Email,
        ISNULL(Phone, '') AS Phone,
        Password,
        ISNULL(Batch, '') AS Batch,
        Semester,
        CAST(CASE WHEN IsActive = 0 THEN 0 ELSE 1 END AS BIT) AS IsActive,
        CAST(1 AS BIT) AS IsMigrated,
        ISNULL(CreatedAt, SYSUTCDATETIME()) AS CreatedAt,
        ISNULL(UpdatedAt, SYSUTCDATETIME()) AS UpdatedAt
      INTO #Students_Backup
      FROM Students;
    `);

    // 2. Drop referencing foreign keys if they exist
    console.log('2. Dropping referencing foreign keys...');
    await req.query(`
      IF OBJECT_ID('FK_TestSubmissions_Students', 'F') IS NOT NULL
        ALTER TABLE TestSubmissions DROP CONSTRAINT FK_TestSubmissions_Students;
      
      IF OBJECT_ID('FK_Results_Students', 'F') IS NOT NULL
        ALTER TABLE Results DROP CONSTRAINT FK_Results_Students;
    `);

    // 3. Drop old Students table
    console.log('3. Dropping old Students table...');
    await req.query(`DROP TABLE Students;`);

    // 4. Create Students with exact priority ordering
    console.log('4. Creating Students table with priority column ordering...');
    await req.query(`
      CREATE TABLE Students (
        -- 1. IDs First
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
    `);

    // 5. Restore rows from backup
    console.log('5. Restoring rows from #Students_Backup into Students...');
    await req.query(`
      INSERT INTO Students (
        StudentId, DepartmentId, YearId,
        Name, Regnum, Email, Phone, Password,
        Batch, Semester,
        IsActive, IsMigrated,
        CreatedAt, UpdatedAt
      )
      SELECT 
        StudentId, DepartmentId, YearId,
        Name, Regnum, Email, Phone, Password,
        Batch, Semester,
        IsActive, IsMigrated,
        CreatedAt, UpdatedAt
      FROM #Students_Backup;
    `);

    // 6. Create indexes
    console.log('6. Creating non-clustered indexes...');
    await req.query(`
      CREATE NONCLUSTERED INDEX IX_Students_DepartmentId ON Students (DepartmentId);
      CREATE NONCLUSTERED INDEX IX_Students_YearId ON Students (YearId);
    `);

    // 7. Recreate referencing foreign keys
    console.log('7. Recreating referencing foreign keys on TestSubmissions & Results...');
    await req.query(`
      ALTER TABLE TestSubmissions
        ADD CONSTRAINT FK_TestSubmissions_Students FOREIGN KEY (StudentId)
        REFERENCES Students (StudentId) ON DELETE NO ACTION ON UPDATE NO ACTION;

      ALTER TABLE Results
        ADD CONSTRAINT FK_Results_Students FOREIGN KEY (StudentId)
        REFERENCES Students (StudentId) ON DELETE NO ACTION ON UPDATE NO ACTION;
    `);

    await tx.commit();
    console.log('✅ Migration committed successfully!');

    // Verify columns of new Students table
    const verifyCols = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, ORDINAL_POSITION, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Students'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('--- NEW STUDENTS COLUMNS ---');
    console.table(verifyCols.recordset);

    const verifyRows = await pool.request().query(`SELECT * FROM Students`);
    console.log('--- STUDENTS ROWS ---');
    console.table(verifyRows.recordset);

    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    await tx.rollback();
    process.exit(1);
  }
}

migrate();
