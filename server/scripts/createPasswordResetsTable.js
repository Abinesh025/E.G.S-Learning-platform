const { sql, getPool } = require('../config/db');

async function createTable() {
  console.log('🔄 Creating PasswordResets table in database...');
  const pool = await getPool();

  await pool.request().query(`
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
      PRINT 'Table PasswordResets created successfully.';
    END
    ELSE
    BEGIN
      PRINT 'Table PasswordResets already exists.';
    END
  `);

  const cols = await pool.request().query(`
    SELECT COLUMN_NAME, DATA_TYPE, ORDINAL_POSITION
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'PasswordResets'
    ORDER BY ORDINAL_POSITION
  `);
  console.log('--- PASSWORD RESETS COLUMNS ---');
  console.table(cols.recordset);
  process.exit(0);
}

createTable().catch(err => {
  console.error('❌ Error creating PasswordResets table:', err);
  process.exit(1);
});
