const { getPool, sql } = require('../config/db')

const formatMessage = (row) => {
  if (!row) return null
  return {
    _id: row.MessageId,
    id: row.MessageId,
    MessageId: row.MessageId,
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
    receiver: row.ReceiverId
      ? {
          _id: row.ReceiverId,
          id: row.ReceiverId,
          name: row.ReceiverName,
          email: row.ReceiverEmail,
          avatar: row.ReceiverAvatar,
          role: row.ReceiverRole,
        }
      : null,
    room: row.Room,
    message: row.Message,
    messageType: row.MessageType,
    audioUrl: row.AudioUrl,
    fileUrl: row.FileUrl,
    isRead: Boolean(row.IsRead),
    createdAt: row.CreatedAt,
    updatedAt: row.UpdatedAt,
  }
}

exports.createMessage = async ({
  senderId,
  receiverId = null,
  room = '',
  message = '',
  messageType = 'text',
  audioUrl = '',
  fileUrl = '',
}) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('SenderId', sql.Int, senderId)
    .input('ReceiverId', sql.Int, receiverId || null)
    .input('Room', sql.NVarChar(100), room || '')
    .input('Message', sql.NVarChar(sql.MAX), message || '')
    .input('MessageType', sql.VarChar(10), messageType || 'text')
    .input('AudioUrl', sql.NVarChar(1000), audioUrl || '')
    .input('FileUrl', sql.NVarChar(1000), fileUrl || '')
    .query(`
      INSERT INTO Messages (SenderId, ReceiverId, Room, Message, MessageType, AudioUrl, FileUrl)
      OUTPUT INSERTED.*
      VALUES (@SenderId, @ReceiverId, @Room, @Message, @MessageType, @AudioUrl, @FileUrl)
    `)

  const inserted = result.recordset[0]
  // Fetch with user details for full client presentation
  return await exports.getMessageById(inserted.MessageId)
}

exports.getMessageById = async (messageId) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('MessageId', sql.Int, messageId)
    .query(`
      SELECT 
        m.*,
        s.Name AS SenderName, s.Email AS SenderEmail, s.Avatar AS SenderAvatar, s.Role AS SenderRole,
        r.Name AS ReceiverName, r.Email AS ReceiverEmail, r.Avatar AS ReceiverAvatar, r.Role AS ReceiverRole
      FROM Messages m
      LEFT JOIN Users s ON m.SenderId = s.UserId
      LEFT JOIN Users r ON m.ReceiverId = r.UserId
      WHERE m.MessageId = @MessageId
    `)
  return formatMessage(result.recordset[0])
}

exports.getDirectMessages = async (userId1, userId2) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('User1', sql.Int, userId1)
    .input('User2', sql.Int, userId2)
    .query(`
      SELECT 
        m.*,
        s.Name AS SenderName, s.Email AS SenderEmail, s.Avatar AS SenderAvatar, s.Role AS SenderRole,
        r.Name AS ReceiverName, r.Email AS ReceiverEmail, r.Avatar AS ReceiverAvatar, r.Role AS ReceiverRole
      FROM Messages m
      LEFT JOIN Users s ON m.SenderId = s.UserId
      LEFT JOIN Users r ON m.ReceiverId = r.UserId
      WHERE (m.SenderId = @User1 AND m.ReceiverId = @User2)
         OR (m.SenderId = @User2 AND m.ReceiverId = @User1)
      ORDER BY m.CreatedAt ASC
    `)
  return result.recordset.map(formatMessage)
}

exports.getRoomMessages = async (room) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('Room', sql.NVarChar(100), room)
    .query(`
      SELECT 
        m.*,
        s.Name AS SenderName, s.Email AS SenderEmail, s.Avatar AS SenderAvatar, s.Role AS SenderRole
      FROM Messages m
      LEFT JOIN Users s ON m.SenderId = s.UserId
      WHERE m.Room = @Room
      ORDER BY m.CreatedAt ASC
    `)
  return result.recordset.map(formatMessage)
}

exports.markMessagesAsRead = async (senderId, receiverId) => {
  const pool = await getPool()
  const result = await pool.request()
    .input('SenderId', sql.Int, senderId)
    .input('ReceiverId', sql.Int, receiverId)
    .query(`
      UPDATE Messages
      SET IsRead = 1, UpdatedAt = SYSUTCDATETIME()
      WHERE SenderId = @SenderId AND ReceiverId = @ReceiverId AND IsRead = 0
    `)
  return result.rowsAffected[0]
}
