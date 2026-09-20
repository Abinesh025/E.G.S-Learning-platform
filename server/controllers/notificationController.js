const notificationRepository = require('../repositories/notificationRepository')
const { getPool, sql } = require('../config/db')

const getNotifications = async (req, res) => {
  try {
    const notifications = await notificationRepository.getNotificationsByUser(req.user._id)
    res.status(200).json({ success: true, data: notifications })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const markAsRead = async (req, res) => {
  try {
    await notificationRepository.markAsRead(Number(req.params.id), req.user._id)
    res.status(200).json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const markAllAsRead = async (req, res) => {
  try {
    const pool = await getPool()
    await pool.request()
      .input('ReceiverId', sql.Int, req.user._id)
      .query(`
        UPDATE Notifications 
        SET IsRead = 1, UpdatedAt = SYSUTCDATETIME() 
        WHERE ReceiverId = @ReceiverId AND IsRead = 0
      `)
    res.status(200).json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const deleteNotification = async (req, res) => {
  try {
    const success = await notificationRepository.deleteNotification(Number(req.params.id), req.user._id)
    if (!success) {
      return res.status(404).json({ success: false, message: 'Notification not found or unauthorized' })
    }
    return res.status(200).json({ success: true, message: 'Notification Deleted Successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const deleteAllNotification = async (req, res) => {
  try {
    const pool = await getPool()
    await pool.request()
      .input('ReceiverId', sql.Int, req.user._id)
      .query(`DELETE FROM Notifications WHERE ReceiverId = @ReceiverId`)

    return res.status(200).json({ success: true, message: 'All the Notification are Deleted Successfully' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotification,
}
