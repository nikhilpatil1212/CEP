const NotificationModel = require('../models/notificationModel');

const NotificationController = {
  async getMyNotifications(req, res, next) {
    try {
      const recipientId = req.user.id;
      const notifications = await NotificationModel.findByRecipientId(recipientId);
      const unreadCount = notifications.filter(n => !n.is_read).length;
      res.json({
        count: notifications.length,
        unreadCount,
        notifications
      });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const notification = await NotificationModel.markAsRead(id, req.user.id);
      if (!notification) {
        return res.status(404).json({ error: 'Notification not found or unauthorized' });
      }
      res.json({
        message: 'Notification marked as read',
        notification
      });
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      const notifications = await NotificationModel.markAllAsRead(req.user.id);
      res.json({
        message: 'All notifications marked as read',
        count: notifications.length
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = NotificationController;
