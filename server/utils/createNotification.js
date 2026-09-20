const notificationRepository = require('../repositories/notificationRepository')
const { getIo } = require('../socket/chatSocket')

/**
 * Creates notifications for multiple receivers and emits Socket.IO events.
 * 
 * @param {Object} params
 * @param {number|string} params.senderId - The ID of the user triggering the notification
 * @param {Array<number|string|Object>} params.receivers - Array of User IDs or User objects to receive the notification
 * @param {string} params.receiverRole - The role of the receivers ('student', 'staff', etc.)
 * @param {string} params.department - The department for the notification
 * @param {string} params.type - The notification type ('material_upload', 'test_upload', 'test_submission')
 * @param {string} params.title - The notification title
 * @param {string} params.message - The notification message content
 * @param {number|string} [params.relatedId] - The ID of the related model document
 * @param {string} [params.relatedModel] - The name of the related model ('Material', 'Test', 'TestSubmission')
 * @param {number} [params.materialId]
 * @param {number} [params.testId]
 * @param {number} [params.submissionId]
 */
const createNotifications = async ({
  senderId,
  receivers,
  receiverRole,
  department,
  type,
  title,
  message,
  relatedId,
  relatedModel,
  materialId,
  testId,
  submissionId,
}) => {
  try {
    if (!receivers || receivers.length === 0) {
      return []
    }

    // Determine exclusive arc foreign keys
    let mId = materialId || null
    let tId = testId || null
    let sId = submissionId || null

    if (relatedModel === 'Material' || type === 'material_upload') {
      mId = mId || relatedId
    } else if (relatedModel === 'Test' || type === 'test_upload') {
      tId = tId || relatedId
    } else if (relatedModel === 'TestSubmission' || type === 'test_submission') {
      sId = sId || relatedId
    }

    const notificationsData = receivers.map((receiver) => {
      const receiverId = receiver._id || receiver.UserId || receiver
      return {
        senderId: Number(senderId),
        receiverId: Number(receiverId),
        receiverRole,
        department,
        type,
        title,
        message,
        materialId: mId ? Number(mId) : null,
        testId: tId ? Number(tId) : null,
        submissionId: sId ? Number(sId) : null,
      }
    })

    const createdNotifications = await notificationRepository.createBatchNotifications(notificationsData)

    // Emit Socket.IO real-time notification
    const io = getIo()
    if (io) {
      createdNotifications.forEach((notif) => {
        const receiverRoom = `user:${notif.receiver}`
        io.to(receiverRoom).emit('new_notification', {
          id: notif._id,
          _id: notif._id,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          createdAt: notif.createdAt,
        })
      })
    }

    return createdNotifications
  } catch (error) {
    console.error('Error creating notifications:', error.message)
    throw error
  }
}

module.exports = createNotifications
