const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/auth')
const {
  getNotifications,
  markAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
} = require('../controllers/notification.controller')

// Require authentication for all notification routes
router.use(authenticate)

// Notification list and operations
router.get('/', getNotifications)
router.patch('/read-all', (req, res, next) => {
  req.params.id = 'all'
  markAsRead(req, res, next)
})
router.patch('/:id/read', markAsRead)
router.delete('/:id', deleteNotification)

// Notification preferences
router.get('/preferences', getPreferences)
router.put('/preferences', updatePreferences)

module.exports = router
