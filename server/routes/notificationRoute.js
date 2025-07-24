// routes/notificationRoute.js
const express = require('express');
const router = express.Router();
const notificationControllers = require('../controllers/notificationControllers');

// =====================================
// NOTIFICATION ROUTES
// =====================================

// GET /api/notifications/user/:userId - Get all notifications for a user
router.get('/user/:userId', notificationControllers.getUserNotifications);

// GET /api/notifications/user/:userId/unread-count - Get unread notification count
router.get('/user/:userId/unread-count', notificationControllers.getUnreadCount);

// PUT /api/notifications/:notificationId/read - Mark notification as read
router.put('/:notificationId/read', notificationControllers.markNotificationAsRead);

// PUT /api/notifications/user/:userId/read-all - Mark all notifications as read for a user
router.put('/user/:userId/read-all', notificationControllers.markAllNotificationsAsRead);

// DELETE /api/notifications/:notificationId - Delete notification
router.delete('/:notificationId', notificationControllers.deleteNotification);

module.exports = router;
