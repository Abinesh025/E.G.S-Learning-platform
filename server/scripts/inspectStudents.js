const { sql, getPool } = require('../config/db');

async function inspect() {
  try {
    const pool = await getPool();
    const cols = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, ORDINAL_POSITION, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'Students'
      ORDER BY ORDINAL_POSITION
    `);
    console.log('--- COLUMNS ---');
    console.table(cols.recordset);

    const constraints = await pool.request().query(`
      SELECT 
        tc.CONSTRAINT_NAME, 
        tc.CONSTRAINT_TYPE,
        kcu.COLUMN_NAME
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
      LEFT JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu 
        ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
      WHERE tc.TABLE_NAME = 'Students'
    `);
    console.log('--- CONSTRAINTS ---');
    console.table(constraints.recordset);

    const defaultConstraints = await pool.request().query(`
      SELECT 
        dc.name AS CONSTRAINT_NAME,
        c.name AS COLUMN_NAME,
        dc.definition
      FROM sys.default_constraints dc
      JOIN sys.columns c ON dc.parent_column_id = c.column_id AND dc.parent_object_id = c.object_id
      JOIN sys.tables t ON dc.parent_object_id = t.object_id
      WHERE t.name = 'Students'
    `);
    console.log('--- DEFAULT CONSTRAINTS ---');
    console.table(defaultConstraints.recordset);

    const fks = await pool.request().query(`
      SELECT 
        fk.name AS FK_NAME,
        c.name AS COLUMN_NAME,
        rt.name AS REFERENCED_TABLE,
        rc.name AS REFERENCED_COLUMN
      FROM sys.foreign_keys fk
      JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
      JOIN sys.tables t ON fkc.parent_object_id = t.object_id
      JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
      JOIN sys.tables rt ON fkc.referenced_object_id = rt.object_id
      JOIN sys.columns rc ON fkc.referenced_object_id = rc.object_id AND fkc.referenced_column_id = rc.column_id
      WHERE t.name = 'Students'
    `);
    console.log('--- FOREIGN KEYS ---');
    console.table(fks.recordset);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

inspect();
