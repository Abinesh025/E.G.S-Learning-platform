const { sql, getPool } = require('../config/db');

async function checkReferences() {
  try {
    const pool = await getPool();
    const referencingFKs = await pool.request().query(`
      SELECT 
        fk.name AS FK_NAME,
        tp.name AS PARENT_TABLE,
        cp.name AS PARENT_COLUMN,
        tr.name AS REFERENCED_TABLE,
        cr.name AS REFERENCED_COLUMN
      FROM sys.foreign_keys fk
      JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      JOIN sys.tables tp ON fkc.parent_object_id = tp.object_id
      JOIN sys.columns cp ON fkc.parent_object_id = cp.object_id AND fkc.parent_column_id = cp.column_id
      JOIN sys.tables tr ON fkc.referenced_object_id = tr.object_id
      JOIN sys.columns cr ON fkc.referenced_object_id = cr.object_id AND fkc.referenced_column_id = cr.column_id
      WHERE tr.name = 'Students'
    `);
    console.log('--- REFERENCING FOREIGN KEYS TO STUDENTS ---');
    console.table(referencingFKs.recordset);

    const studentRows = await pool.request().query(`SELECT * FROM Students`);
    console.log('--- CURRENT STUDENTS ROWS ---');
    console.table(studentRows.recordset);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkReferences();
