// setup/notificationSetup.js
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

const setupNotificationSystem = async () => {
  console.log('=== NOTIFICATION SYSTEM SETUP ===');
  
  try {
    // Read and execute the notification table creation script
    const sqlScript = fs.readFileSync(
      path.join(__dirname, 'create_notifications_simple.sql'),
      'utf8'
    );
    
    console.log('Creating notifications table and triggers...');
    await pool.query(sqlScript);
    
    console.log('✅ Notification system setup completed successfully');
    return { success: true, message: 'Notification system setup completed' };
    
  } catch (error) {
    console.error('❌ Error setting up notification system:', error);
    return { success: false, error: error.message };
  }
};

const addSampleNotifications = async () => {
  console.log('=== ADDING SAMPLE NOTIFICATIONS ===');
  
  try {
    // Add some sample notifications
    await pool.query(`
      INSERT INTO notifications (recipient_user_id, actor_user_id, notification_type, entity_type, entity_id, message)
      VALUES 
      (1, 2, 'comment', 'post', 1, 'bob commented on your post: "Not doing this again."'),
      (1, 3, 'vote', 'post', 1, 'admin upvoted your post: "Not doing this again."'),
      (2, 1, 'follow', 'user', 1, 'Alice started following you'),
      (1, 2, 'rating', 'post', 1, 'bob rated your work (4 stars): "Not doing this again."')
      ON CONFLICT DO NOTHING;
    `);
    
    console.log('✅ Sample notifications added successfully');
    return { success: true, message: 'Sample notifications added' };
    
  } catch (error) {
    console.error('❌ Error adding sample notifications:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  setupNotificationSystem,
  addSampleNotifications
};
