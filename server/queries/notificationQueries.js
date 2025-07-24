// queries/notificationQueries.js
const pool = require('../config/db');

// Get all notifications for a user
exports.getNotificationsByUserId = async (userId) => {
  const query = `
    SELECT 
      n.notification_id,
      n.recipient_user_id,
      n.actor_user_id,
      n.notification_type,
      n.entity_type,
      n.entity_id,
      n.message,
      n.is_read,
      n.created_at,
      n.updated_at,
      u.username as actor_username,
      u.profile_picture as actor_profile_picture
    FROM notifications n
    LEFT JOIN "user" u ON n.actor_user_id = u.user_id
    WHERE n.recipient_user_id = $1
    ORDER BY n.created_at DESC
    LIMIT 50
  `;
  
  const result = await pool.query(query, [userId]);
  return result.rows;
};

// Mark notification as read
exports.markNotificationAsRead = async (notificationId) => {
  const query = `
    UPDATE notifications 
    SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
    WHERE notification_id = $1
  `;
  
  const result = await pool.query(query, [notificationId]);
  return result.rowCount > 0;
};

// Mark all notifications as read for a user
exports.markAllNotificationsAsRead = async (userId) => {
  const query = `
    UPDATE notifications 
    SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
    WHERE recipient_user_id = $1 AND is_read = FALSE
  `;
  
  const result = await pool.query(query, [userId]);
  return result.rowCount;
};

// Get unread notification count for a user
exports.getUnreadNotificationCount = async (userId) => {
  const query = `
    SELECT COUNT(*) as count
    FROM notifications
    WHERE recipient_user_id = $1 AND is_read = FALSE
  `;
  
  const result = await pool.query(query, [userId]);
  return parseInt(result.rows[0].count);
};

// Delete notification by ID
exports.deleteNotificationById = async (notificationId) => {
  const query = `
    DELETE FROM notifications
    WHERE notification_id = $1
  `;
  
  const result = await pool.query(query, [notificationId]);
  return result.rowCount > 0;
};

// Get notifications by type
exports.getNotificationsByType = async (userId, notificationType) => {
  const query = `
    SELECT 
      n.notification_id,
      n.recipient_user_id,
      n.actor_user_id,
      n.notification_type,
      n.entity_type,
      n.entity_id,
      n.message,
      n.is_read,
      n.created_at,
      n.updated_at,
      u.username as actor_username,
      u.profile_picture as actor_profile_picture
    FROM notifications n
    LEFT JOIN "user" u ON n.actor_user_id = u.user_id
    WHERE n.recipient_user_id = $1 AND n.notification_type = $2
    ORDER BY n.created_at DESC
  `;
  
  const result = await pool.query(query, [userId, notificationType]);
  return result.rows;
};

// Clean up old notifications (older than 30 days)
exports.cleanupOldNotifications = async () => {
  const query = `
    DELETE FROM notifications
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
  `;
  
  const result = await pool.query(query);
  return result.rowCount;
};
