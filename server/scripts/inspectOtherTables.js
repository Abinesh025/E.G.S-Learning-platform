const { sql, getPool } = require('../config/db');

async function main() {
  const pool = await getPool();
  const staff = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Staff' ORDER BY ORDINAL_POSITION");
  console.log('--- STAFF COLUMNS ---');
  console.table(staff.recordset);
  const admins = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Admins' ORDER BY ORDINAL_POSITION");
  console.log('--- ADMINS COLUMNS ---');
  console.table(admins.recordset);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
