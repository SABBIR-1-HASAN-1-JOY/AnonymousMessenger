// controllers/notificationControllers.js
const notificationServices = require('../services/notificationServices');

// Get all notifications for a user
const getUserNotifications = async (req, res) => {
  try {
    console.log('=== GET USER NOTIFICATIONS CONTROLLER ===');
    const { userId } = req.params;
    console.log('Getting notifications for user:', userId);

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    const result = await notificationServices.getUserNotifications(parseInt(userId));
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to fetch notifications'
      });
    }

    console.log(`Found ${result.notifications.length} notifications`);

    res.status(200).json({
      success: true,
      notifications: result.notifications,
      unreadCount: result.unreadCount
    });

  } catch (error) {
    console.error('Error in getUserNotifications controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch notifications'
    });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    console.log('=== MARK NOTIFICATION AS READ CONTROLLER ===');
    const { notificationId } = req.params;
    console.log('Marking notification as read:', notificationId);

    if (!notificationId) {
      return res.status(400).json({
        error: 'Notification ID is required'
      });
    }

    const result = await notificationServices.markAsRead(parseInt(notificationId));
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to mark notification as read'
      });
    }

    console.log('Notification marked as read successfully');

    res.status(200).json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Error in markNotificationAsRead controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read for a user
const markAllNotificationsAsRead = async (req, res) => {
  try {
    console.log('=== MARK ALL NOTIFICATIONS AS READ CONTROLLER ===');
    const { userId } = req.params;
    console.log('Marking all notifications as read for user:', userId);

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    const result = await notificationServices.markAllAsRead(parseInt(userId));
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to mark notifications as read'
      });
    }

    console.log('All notifications marked as read successfully');

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Error in markAllNotificationsAsRead controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to mark notifications as read'
    });
  }
};

// Get unread notification count
const getUnreadCount = async (req, res) => {
  try {
    console.log('=== GET UNREAD COUNT CONTROLLER ===');
    const { userId } = req.params;
    console.log('Getting unread count for user:', userId);

    if (!userId) {
      return res.status(400).json({
        error: 'User ID is required'
      });
    }

    const result = await notificationServices.getUnreadCount(parseInt(userId));
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to fetch unread count'
      });
    }

    console.log('Unread count:', result.count);

    res.status(200).json({
      success: true,
      unreadCount: result.count
    });

  } catch (error) {
    console.error('Error in getUnreadCount controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch unread count'
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    console.log('=== DELETE NOTIFICATION CONTROLLER ===');
    const { notificationId } = req.params;
    console.log('Deleting notification:', notificationId);

    if (!notificationId) {
      return res.status(400).json({
        error: 'Notification ID is required'
      });
    }

    const result = await notificationServices.deleteNotification(parseInt(notificationId));
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to delete notification'
      });
    }

    console.log('Notification deleted successfully');

    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (error) {
    console.error('Error in deleteNotification controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete notification'
    });
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  deleteNotification
};
