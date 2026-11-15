const { sql, getPool } = require('../config/db');

async function inspectRoles() {
  const pool = await getPool();
  const cols = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE, ORDINAL_POSITION, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Roles' ORDER BY ORDINAL_POSITION");
  console.log('--- ROLES COLUMNS ---');
  console.table(cols.recordset);

  const constraints = await pool.request().query(`
    SELECT tc.CONSTRAINT_NAME, tc.CONSTRAINT_TYPE, kcu.COLUMN_NAME
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
    LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
    WHERE tc.TABLE_NAME = 'Roles'
  `);
  console.log('--- ROLES CONSTRAINTS ---');
  console.table(constraints.recordset);

  const data = await pool.request().query("SELECT * FROM Roles");
  console.log('--- ROLES DATA ---');
  console.table(data.recordset);

  process.exit(0);
}

inspectRoles().catch(err => {
  console.error(err);
  process.exit(1);
});
