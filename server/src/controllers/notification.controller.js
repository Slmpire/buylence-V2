const prisma = require('../utils/prisma')
const { sendPreferencesUpdatedEmail } = require('../services/emailService')

/**
 * GET /api/notifications
 * Get user's notifications and unread count
 */
async function getNotifications(req, res) {
  try {
    const userId = req.user.id

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.notification.count({
        where: { userId, read: false },
      }),
    ])

    res.json({ notifications, unreadCount })
  } catch (err) {
    console.error('Error fetching notifications:', err)
    res.status(500).json({ error: 'Failed to fetch notifications.' })
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification or all notifications as read
 */
async function markAsRead(req, res) {
  try {
    const userId = req.user.id
    const { id } = req.params

    if (id === 'all') {
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      })
      return res.json({ message: 'All notifications marked as read.' })
    }

    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    })

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' })
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    })

    res.json(updated)
  } catch (err) {
    console.error('Error marking notification as read:', err)
    res.status(500).json({ error: 'Failed to mark notification as read.' })
  }
}

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
async function deleteNotification(req, res) {
  try {
    const userId = req.user.id
    const { id } = req.params

    const notification = await prisma.notification.findFirst({
      where: { id, userId },
    })

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' })
    }

    await prisma.notification.delete({ where: { id } })

    res.json({ message: 'Notification deleted successfully.' })
  } catch (err) {
    console.error('Error deleting notification:', err)
    res.status(500).json({ error: 'Failed to delete notification.' })
  }
}

/**
 * GET /api/notifications/preferences
 * Fetch or initialize user notification preferences
 */
async function getPreferences(req, res) {
  try {
    const userId = req.user.id

    let prefs = await prisma.notificationPreference.findUnique({
      where: { userId },
    })

    if (!prefs) {
      prefs = await prisma.notificationPreference.create({
        data: {
          userId,
          orderUpdates: true,
          flashDeals: true,
          vendorMessages: false,
          weeklyDigest: true,
          marketingEmails: false,
        },
      })
    }

    res.json(prefs)
  } catch (err) {
    console.error('Error fetching notification preferences:', err)
    res.status(500).json({ error: 'Failed to fetch notification preferences.' })
  }
}

/**
 * PUT /api/notifications/preferences
 * Update notification preferences
 */
async function updatePreferences(req, res) {
  try {
    const userId = req.user.id
    const { orderUpdates, flashDeals, vendorMessages, weeklyDigest, marketingEmails } = req.body

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId },
      update: {
        ...(typeof orderUpdates === 'boolean' && { orderUpdates }),
        ...(typeof flashDeals === 'boolean' && { flashDeals }),
        ...(typeof vendorMessages === 'boolean' && { vendorMessages }),
        ...(typeof weeklyDigest === 'boolean' && { weeklyDigest }),
        ...(typeof marketingEmails === 'boolean' && { marketingEmails }),
      },
      create: {
        userId,
        orderUpdates: orderUpdates ?? true,
        flashDeals: flashDeals ?? true,
        vendorMessages: vendorMessages ?? false,
        weeklyDigest: weeklyDigest ?? true,
        marketingEmails: marketingEmails ?? false,
      },
    })

    // Send confirmation email asynchronously
    if (req.user.email) {
      sendPreferencesUpdatedEmail(req.user.email, prefs).catch(err =>
        console.error('Failed sending preference email:', err.message)
      )
    }

    res.json({ message: 'Preferences updated successfully', preferences: prefs })
  } catch (err) {
    console.error('Error updating notification preferences:', err)
    res.status(500).json({ error: 'Failed to update notification preferences.' })
  }
}

/**
 * Helper to create an in-app notification & conditionally send an email
 */
async function notifyUser(userId, { title, message, type = 'INFO', link, category = 'orderUpdates' }) {
  try {
    const notif = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    })

    // Check user preference before sending email
    const prefs = await prisma.notificationPreference.findUnique({ where: { userId } })
    const user = await prisma.user.findUnique({ where: { id: userId } })

    const shouldSendEmail = !prefs || prefs[category] !== false

    if (user?.email && shouldSendEmail) {
      const { sendOrderStatusEmail } = require('../services/emailService')
      sendOrderStatusEmail(user.email, title, message, link).catch(err =>
        console.error('Failed sending order email:', err.message)
      )
    }

    return notif
  } catch (err) {
    console.error('Error creating notification:', err)
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
  notifyUser,
}
