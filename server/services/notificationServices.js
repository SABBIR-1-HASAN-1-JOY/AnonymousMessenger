// services/notificationServices.js
const {
  getNotificationsByUserId,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  deleteNotificationById
} = require('../queries/notificationQueries');

// Get all notifications for a user
const getUserNotifications = async (userId) => {
  try {
    console.log('Fetching notifications for user:', userId);
    const notifications = await getNotificationsByUserId(userId);
    const unreadCount = await getUnreadNotificationCount(userId);
    
    return {
      success: true,
      notifications,
      unreadCount
    };
  } catch (error) {
    console.error('Error in getUserNotifications service:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch notifications'
    };
  }
};

// Mark notification as read
const markAsRead = async (notificationId) => {
  try {
    console.log('Marking notification as read:', notificationId);
    await markNotificationAsRead(notificationId);
    
    return {
      success: true,
      message: 'Notification marked as read'
    };
  } catch (error) {
    console.error('Error in markAsRead service:', error);
    return {
      success: false,
      error: error.message || 'Failed to mark notification as read'
    };
  }
};

// Mark all notifications as read for a user
const markAllAsRead = async (userId) => {
  try {
    console.log('Marking all notifications as read for user:', userId);
    await markAllNotificationsAsRead(userId);
    
    return {
      success: true,
      message: 'All notifications marked as read'
    };
  } catch (error) {
    console.error('Error in markAllAsRead service:', error);
    return {
      success: false,
      error: error.message || 'Failed to mark notifications as read'
    };
  }
};

// Get unread notification count
const getUnreadCount = async (userId) => {
  try {
    console.log('Getting unread count for user:', userId);
    const count = await getUnreadNotificationCount(userId);
    
    return {
      success: true,
      count
    };
  } catch (error) {
    console.error('Error in getUnreadCount service:', error);
    return {
      success: false,
      error: error.message || 'Failed to get unread count'
    };
  }
};

// Delete notification
const deleteNotification = async (notificationId) => {
  try {
    console.log('Deleting notification:', notificationId);
    await deleteNotificationById(notificationId);
    
    return {
      success: true,
      message: 'Notification deleted'
    };
  } catch (error) {
    console.error('Error in deleteNotification service:', error);
    return {
      success: false,
      error: error.message || 'Failed to delete notification'
    };
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification
};
