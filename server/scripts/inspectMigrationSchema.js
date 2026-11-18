const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })
const { getPool } = require('../config/db')

async function inspect() {
  const pool = await getPool()
  const tables = ['Materials', 'Tests', 'TestQuestions', 'QuestionOptions', 'Results', 'TestSubmissions', 'StudentAnswers']
  for (const t of tables) {
    const res = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = '${t}'
      ORDER BY ORDINAL_POSITION
    `)
    console.log('\n========================================')
    console.log('TABLE:', t)
    console.log('========================================')
    console.table(res.recordset)
  }
  process.exit(0)
}

inspect().catch(err => {
  console.error(err)
  process.exit(1)
})
