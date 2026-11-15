require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const { getPool, sql } = require('../config/db')
const bcrypt = require('bcryptjs')

async function cleanDatabase(mode = 'data') {
  console.log(`🧹 Starting database cleanup [Mode: ${mode}]...`)
  const pool = await getPool()
  const transaction = new sql.Transaction(pool)
  await transaction.begin()

  try {
    const req = new sql.Request(transaction)

    console.log('⚙️ Deleting domain data (results, tests, materials, notifications, messages)...')
    await req.query(`
      DELETE FROM StudentAnswers;
      DELETE FROM Results;
      DELETE FROM TestSubmissions;
      DELETE FROM Notifications;
      DELETE FROM Messages;
      DELETE FROM QuestionOptions;
      DELETE FROM TestQuestions;
      DELETE FROM Tests;
      DELETE FROM Materials;
    `)

    if (mode === 'all') {
      console.log('⚙️ Deleting all Students and Staff...')
      await req.query(`
        DELETE FROM Students;
        DELETE FROM Staff;
        DELETE FROM Admins WHERE Email <> 'admin@egspec.edu';
      `)

      console.log('⚙️ Reseeding identity values...')
      await req.query(`
        DBCC CHECKIDENT ('Staff', RESEED, 5000);
        DBCC CHECKIDENT ('Admins', RESEED, 9000);
      `)
    }

    console.log('⚙️ Reseeding domain tables...')
    await req.query(`
      DBCC CHECKIDENT ('Materials', RESEED, 0);
      DBCC CHECKIDENT ('Tests', RESEED, 0);
      DBCC CHECKIDENT ('TestQuestions', RESEED, 0);
      DBCC CHECKIDENT ('QuestionOptions', RESEED, 0);
      DBCC CHECKIDENT ('TestSubmissions', RESEED, 0);
      DBCC CHECKIDENT ('Results', RESEED, 0);
      DBCC CHECKIDENT ('StudentAnswers', RESEED, 0);
      DBCC CHECKIDENT ('Messages', RESEED, 0);
      DBCC CHECKIDENT ('Notifications', RESEED, 0);
    `)

    await transaction.commit()
    console.log('🎉 Database cleanup completed successfully!')
  } catch (err) {
    await transaction.rollback()
    console.error('❌ Error during cleanup:', err.message)
    throw err
  }
}

if (require.main === module) {
  const mode = process.argv[2] === '--all' ? 'all' : 'data'
  cleanDatabase(mode)
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

module.exports = cleanDatabase
