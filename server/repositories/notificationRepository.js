const { getPool, sql } = require('../config/db')

const formatNotification = (row) => {
  if (!row) return null
  const relatedId = row.MaterialId || row.TestId || row.SubmissionId || null
  let relatedModel = null
  if (row.MaterialId) relatedModel = 'Material'
  else if (row.TestId) relatedModel = 'Test'
  else if (row.SubmissionId) relatedModel = 'TestSubmission'

  return {
    _id: row.NotificationId,
    id: row.NotificationId,
    NotificationId: row.NotificationId,
    sender: row.SenderId
      ? {
          _id: row.SenderId,
          id: row.SenderId,
          name: row.SenderName,
          email: row.SenderEmail,
          avatar: row.SenderAvatar,
          role: row.SenderRole,
        }
      : row.SenderId,
    receiver: row.ReceiverId,
    receiverRole: row.ReceiverRole,
    department: row.Department,
    type: row.Type,
    title: row.Title,
    message: row.Message,
    materialId: row.MaterialId,
    testId: row.TestId,
    submissionId: row.SubmissionId,
    relatedId: relatedId,
    relatedModel: relatedModel,
    isRead: Boolean(row.IsRead),
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  }
}

exports.createNotification = async ({
  senderId,
  receiverId,
  receiverRole,
  department,
  type,
  title,
  message,
  materialId = null,
  testId = null,
  submissionId = null,
}) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('SenderId', sql.Int, senderId)
    .input('ReceiverId', sql.Int, receiverId)
    .input('ReceiverRole', sql.VarChar(10), receiverRole)
    .input('Department', sql.NVarChar(100), department)
    .input('Type', sql.VarChar(30), type)
    .input('Title', sql.NVarChar(255), title)
    .input('Message', sql.NVarChar(sql.MAX), message)
    .input('MaterialId', sql.Int, materialId || null)
    .input('TestId', sql.Int, testId || null)
    .input('SubmissionId', sql.Int, submissionId || null)
    .query(`
      INSERT INTO Notifications (SenderId, ReceiverId, ReceiverRole, Department, Type, Title, Message, MaterialId, TestId, SubmissionId)
      OUTPUT INSERTED.*
      VALUES (@SenderId, @ReceiverId, @ReceiverRole, @Department, @Type, @Title, @Message, @MaterialId, @TestId, @SubmissionId)
    `)
  return formatNotification(result.recordset[0])
}

exports.createBatchNotifications = async (notifications = []) => {
  if (!notifications.length) return []
  const pool = await getPool()
  const transaction = new sql.Transaction(pool)
  await transaction.begin()

  try {
    const created = []
    for (const n of notifications) {
      const request = new sql.Request(transaction)
      const result = await request
        .input('SenderId', sql.Int, n.senderId)
        .input('ReceiverId', sql.Int, n.receiverId)
        .input('ReceiverRole', sql.VarChar(10), n.receiverRole)
        .input('Department', sql.NVarChar(100), n.department)
        .input('Type', sql.VarChar(30), n.type)
        .input('Title', sql.NVarChar(255), n.title)
        .input('Message', sql.NVarChar(sql.MAX), n.message)
        .input('MaterialId', sql.Int, n.materialId || null)
        .input('TestId', sql.Int, n.testId || null)
        .input('SubmissionId', sql.Int, n.submissionId || null)
        .query(`
          INSERT INTO Notifications (SenderId, ReceiverId, ReceiverRole, Department, Type, Title, Message, MaterialId, TestId, SubmissionId)
          OUTPUT INSERTED.*
          VALUES (@SenderId, @ReceiverId, @ReceiverRole, @Department, @Type, @Title, @Message, @MaterialId, @TestId, @SubmissionId)
        `)
      created.push(result.recordset[0])
    }
    await transaction.commit()
    return created.map(formatNotification)
  } catch (err) {
    await transaction.rollback()
    throw err
  }
}

exports.getNotificationsByUser = async (userId) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('UserId', sql.Int, userId)
    .query(`
      SELECT 
        n.*,
        s.Name AS SenderName, s.Email AS SenderEmail, s.Avatar AS SenderAvatar, s.Role AS SenderRole
      FROM Notifications n
      LEFT JOIN Users s ON n.SenderId = s.UserId
      WHERE n.ReceiverId = @UserId
      ORDER BY n.CreatedAt DESC
    `)
  return result.recordset.map(formatNotification)
}

exports.markAsRead = async (notificationId, userId) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('NotificationId', sql.Int, notificationId)
    .input('UserId', sql.Int, userId)
    .query(`
      UPDATE Notifications
      SET IsRead = 1, UpdatedAt = SYSUTCDATETIME()
      OUTPUT INSERTED.*
      WHERE NotificationId = @NotificationId AND ReceiverId = @UserId
    `)
  return formatNotification(result.recordset[0])
}

exports.deleteNotification = async (notificationId, userId) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('NotificationId', sql.Int, notificationId)
    .input('UserId', sql.Int, userId)
    .query(`DELETE FROM Notifications WHERE NotificationId = @NotificationId AND ReceiverId = @UserId`)
  return result.rowsAffected[0] > 0
}
