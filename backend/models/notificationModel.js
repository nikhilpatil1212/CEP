const { query } = require('../config/db');

const NotificationModel = {
  async create({ recipientId, senderId, requestId, applicationId, type, title, message }) {
    const id = `notif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const sql = `
      INSERT INTO notifications (
        id, recipient_id, sender_id, request_id, application_id,
        type, title, message, is_read, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW())
      RETURNING *
    `;
    const params = [
      id,
      recipientId,
      senderId || null,
      requestId || null,
      applicationId || null,
      type,
      title,
      message
    ];
    const result = await query(sql, params);
    return result.rows[0];
  },

  async findByRecipientId(recipientId) {
    const sql = `
      SELECT 
        n.*, 
        u.name AS sender_name, 
        u.avatar_url AS sender_avatar, 
        r.title AS request_title
      FROM notifications n
      LEFT JOIN users u ON n.sender_id = u.id
      LEFT JOIN team_requests r ON n.request_id = r.id
      WHERE n.recipient_id = $1
      ORDER BY n.created_at DESC
    `;
    const result = await query(sql, [recipientId]);
    return result.rows;
  },

  async markAsRead(id, recipientId) {
    const sql = `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1 AND recipient_id = $2
      RETURNING *
    `;
    const result = await query(sql, [id, recipientId]);
    return result.rows[0] || null;
  },

  async markAllAsRead(recipientId) {
    const sql = `
      UPDATE notifications
      SET is_read = true
      WHERE recipient_id = $1
      RETURNING *
    `;
    const result = await query(sql, [recipientId]);
    return result.rows;
  }
};

module.exports = NotificationModel;
