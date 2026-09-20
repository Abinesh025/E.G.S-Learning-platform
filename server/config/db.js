const sql = require('mssql/msnodesqlv8')

const server = process.env.DB_SERVER || '.\\SQLEXPRESS'
const database = process.env.DB_NAME || 'EGS_LMS_HUB'
const odbcDriver = process.env.DB_ODBC_DRIVER || 'ODBC Driver 18 for SQL Server'
const trustServerCertificate = process.env.DB_TRUST_SERVER_CERTIFICATE !== 'false' ? 'yes' : 'no'

// Construct ODBC connection string for msnodesqlv8
let connectionString = `Driver={${odbcDriver}};Server=${server};Database=${database};TrustServerCertificate=${trustServerCertificate};`

if (process.env.DB_USER && process.env.DB_PASSWORD) {
  connectionString += `Uid=${process.env.DB_USER};Pwd=${process.env.DB_PASSWORD};`
} else {
  connectionString += `Trusted_Connection=yes;`
}

const config = {
  connectionString,
  pool: {
    max: 15,
    min: 0,
    idleTimeoutMillis: 30000,
  },
}

let pool = null

const connectDB = async () => {
  try {
    if (!pool) {
      pool = await sql.connect(config)
      console.log(`✅ Microsoft SQL Server Connected via msnodesqlv8: ${server} / Database: ${database}`)
    }
    return pool
  } catch (error) {
    console.error(`❌ SQL Server Connection Error: ${error.message}`)
    throw error
  }
}

const getPool = async () => {
  if (!pool) {
    return await connectDB()
  }
  return pool
}

const closeDB = async () => {
  try {
    if (pool) {
      await pool.close()
      pool = null
      console.log('🔌 SQL Server connection pool closed')
    }
  } catch (error) {
    console.error(`Error closing SQL connection: ${error.message}`)
  }
}

module.exports = connectDB
module.exports.connectDB = connectDB
module.exports.getPool = getPool
module.exports.closeDB = closeDB
module.exports.sql = sql