// fix-comment-notification-trigger.js
// Script to fix the existing comment notification trigger to exclude replies

const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function fixCommentNotificationTrigger() {
  const client = await pool.connect();
  
  try {
    console.log('Fixing comment notification trigger to exclude replies...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../migrations/FIX_COMMENT_NOTIFICATION_TRIGGER.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    await client.query(sql);
    
    console.log('✅ Comment notification trigger updated successfully!');
    console.log('📝 Now only top-level comments will notify the post/review owner.');
    console.log('📝 Replies will only notify the parent comment author (via the reply trigger).');
    
    // Test that the function exists and was updated
    const functionCheck = await client.query(`
      SELECT pg_get_functiondef(f.oid)
      FROM pg_proc f 
      INNER JOIN pg_namespace n ON f.pronamespace = n.oid 
      WHERE n.nspname = 'public' AND f.proname = 'notify_comment'
    `);
    
    if (functionCheck.rows.length > 0) {
      const functionDef = functionCheck.rows[0].pg_get_functiondef;
      if (functionDef.includes('parent_comment_id IS NULL')) {
        console.log('✅ Function notify_comment() has been updated with parent_comment_id check');
      } else {
        console.log('⚠️  Function exists but may not have the parent_comment_id check');
      }
    } else {
      console.log('❌ Function notify_comment() was not found');
    }
    
  } catch (error) {
    console.error('❌ Error fixing comment notification trigger:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the fix if this file is executed directly
if (require.main === module) {
  fixCommentNotificationTrigger()
    .then(() => {
      console.log('Fix completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixCommentNotificationTrigger };
