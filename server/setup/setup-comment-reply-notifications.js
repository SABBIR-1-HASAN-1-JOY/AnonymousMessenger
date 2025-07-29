// setup-comment-reply-notifications.js
// Script to set up comment reply notification triggers

const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function setupCommentReplyNotificationTriggers() {
  const client = await pool.connect();
  
  try {
    console.log('Setting up comment reply notification triggers...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../migrations/CREATE_COMMENT_REPLY_NOTIFICATION_TRIGGER.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    await client.query(sql);
    
    console.log('✅ Comment reply notification triggers created successfully!');
    
    // Test that the function exists
    const functionCheck = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_type = 'FUNCTION' 
      AND routine_name = 'notify_comment_reply'
    `);
    
    if (functionCheck.rows.length > 0) {
      console.log('✅ Function notify_comment_reply() exists and is ready');
    } else {
      console.log('❌ Function notify_comment_reply() was not created properly');
    }
    
    // Test that the trigger exists
    const triggerCheck = await client.query(`
      SELECT trigger_name 
      FROM information_schema.triggers 
      WHERE trigger_name = 'comment_reply_notification_trigger'
    `);
    
    if (triggerCheck.rows.length > 0) {
      console.log('✅ Trigger comment_reply_notification_trigger exists and is ready');
    } else {
      console.log('❌ Trigger comment_reply_notification_trigger was not created properly');
    }
    
  } catch (error) {
    console.error('❌ Error setting up comment reply notification triggers:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupCommentReplyNotificationTriggers()
    .then(() => {
      console.log('Setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupCommentReplyNotificationTriggers };
