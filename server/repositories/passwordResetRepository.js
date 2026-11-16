const { getPool, sql } = require('../config/db');

/**
 * Creates a new password reset request record
 * @param {string} email
 * @param {string} otpHash
 * @param {Date} expiresAt
 */
async function createResetRecord(email, otpHash, expiresAt) {
  const pool = await getPool();

  // First clear old unverified or expired records for this email
  await pool.request()
    .input('Email', sql.NVarChar(255), email.trim().toLowerCase())
    .query(`DELETE FROM PasswordResets WHERE LOWER(email) = @Email`);

  const result = await pool.request()
    .input('Email', sql.NVarChar(255), email.trim().toLowerCase())
    .input('OtpHash', sql.NVarChar(255), otpHash)
    .input('ExpiresAt', sql.DateTime2, expiresAt)
    .query(`
      INSERT INTO PasswordResets (email, otpHash, expiresAt, verified)
      OUTPUT INSERTED.id, INSERTED.email, INSERTED.expiresAt
      VALUES (@Email, @OtpHash, @ExpiresAt, 0)
    `);

  return result.recordset[0];
}

/**
 * Finds the latest active reset record for the email
 * @param {string} email
 */
async function findActiveRecord(email) {
  const pool = await getPool();
  const result = await pool.request()
    .input('Email', sql.NVarChar(255), email.trim().toLowerCase())
    .query(`
      SELECT TOP 1 id, email, otpHash, expiresAt, verified, resetToken, createdAt, updatedAt
      FROM PasswordResets
      WHERE LOWER(email) = @Email
      ORDER BY createdAt DESC
    `);

  return result.recordset[0] || null;
}

/**
 * Marks a reset record as verified and attaches a temporary reset token
 * @param {number} id
 * @param {string} resetToken
 */
async function markVerified(id, resetToken) {
  const pool = await getPool();
  const result = await pool.request()
    .input('Id', sql.Int, id)
    .input('ResetToken', sql.NVarChar(500), resetToken)
    .query(`
      UPDATE PasswordResets
      SET verified = 1,
          resetToken = @ResetToken,
          updatedAt = SYSUTCDATETIME()
      OUTPUT INSERTED.id, INSERTED.email, INSERTED.verified, INSERTED.resetToken
      WHERE id = @Id
    `);
  return result.recordset[0] || null;
}

/**
 * Finds a verified reset record with valid token
 * @param {string} email
 * @param {string} resetToken
 */
async function findValidTokenRecord(email, resetToken) {
  const pool = await getPool();
  const result = await pool.request()
    .input('Email', sql.NVarChar(255), email.trim().toLowerCase())
    .input('ResetToken', sql.NVarChar(500), resetToken)
    .query(`
      SELECT TOP 1 id, email, expiresAt, verified, resetToken
      FROM PasswordResets
      WHERE LOWER(email) = @Email
        AND resetToken = @ResetToken
        AND verified = 1
        AND expiresAt > SYSUTCDATETIME()
      ORDER BY createdAt DESC
    `);

  return result.recordset[0] || null;
}

/**
 * Consumes/removes reset records after successful password reset
 * @param {string} email
 */
async function consumeResetRecords(email) {
  const pool = await getPool();
  await pool.request()
    .input('Email', sql.NVarChar(255), email.trim().toLowerCase())
    .query(`DELETE FROM PasswordResets WHERE LOWER(email) = @Email`);
}

module.exports = {
  createResetRecord,
  findActiveRecord,
  markVerified,
  findValidTokenRecord,
  consumeResetRecords,
};
