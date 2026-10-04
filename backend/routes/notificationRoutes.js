const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

// All notification routes require authentication
router.use(authenticateToken);

// GET /api/notifications - Get all notifications for authenticated user
router.get('/', NotificationController.getMyNotifications);

// PATCH /api/notifications/read-all - Mark all notifications as read
router.patch('/read-all', NotificationController.markAllAsRead);

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', NotificationController.markAsRead);

module.exports = router;
