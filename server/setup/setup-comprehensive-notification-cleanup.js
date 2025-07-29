// setup-comprehensive-notification-cleanup.js
// Script to set up comprehensive notification cleanup triggers for all entity deletions

const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function setupComprehensiveNotificationCleanup() {
  const client = await pool.connect();
  
  try {
    console.log('Setting up comprehensive notification cleanup triggers...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '../migrations/CREATE_COMPREHENSIVE_NOTIFICATION_CLEANUP_TRIGGERS.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    await client.query(sql);
    
    console.log('✅ Comprehensive notification cleanup triggers created successfully!');
    
    // Verify that all functions were created
    const functions = [
      'cleanup_post_notifications',
      'cleanup_review_notifications', 
      'cleanup_comment_notifications',
      'cleanup_vote_notifications',
      'cleanup_follow_notifications',
      'cleanup_orphaned_notifications'
    ];
    
    for (const functionName of functions) {
      const functionCheck = await client.query(`
        SELECT routine_name 
        FROM information_schema.routines 
        WHERE routine_type = 'FUNCTION' 
        AND routine_name = $1
      `, [functionName]);
      
      if (functionCheck.rows.length > 0) {
        console.log(`✅ Function ${functionName}() exists and is ready`);
      } else {
        console.log(`❌ Function ${functionName}() was not created properly`);
      }
    }
    
    // Verify that all triggers were created
    const triggers = [
      'cleanup_post_notifications_trigger',
      'cleanup_review_notifications_trigger',
      'cleanup_comment_notifications_trigger', 
      'cleanup_vote_notifications_trigger',
      'cleanup_follow_notifications_trigger'
    ];
    
    for (const triggerName of triggers) {
      const triggerCheck = await client.query(`
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE trigger_name = $1
      `, [triggerName]);
      
      if (triggerCheck.rows.length > 0) {
        console.log(`✅ Trigger ${triggerName} exists and is ready`);
      } else {
        console.log(`❌ Trigger ${triggerName} was not created properly`);
      }
    }
    
    console.log('\n📋 Summary of notification cleanup coverage:');
    console.log('   🗑️  Post deletions → Clean up all post-related notifications');
    console.log('   🗑️  Review deletions → Clean up all review-related notifications');
    console.log('   🗑️  Comment deletions → Clean up comment and reply notifications');
    console.log('   🗑️  Vote deletions → Clean up vote notifications');
    console.log('   🗑️  Follow deletions → Clean up follow notifications');
    console.log('   🧹 Manual cleanup function available for orphaned notifications');
    
    // Optional: Run orphaned notification cleanup
    console.log('\n🧹 Running initial cleanup of orphaned notifications...');
    const cleanupResult = await client.query('SELECT cleanup_orphaned_notifications()');
    const deletedCount = cleanupResult.rows[0].cleanup_orphaned_notifications;
    console.log(`✅ Initial cleanup completed. Removed ${deletedCount} orphaned notifications.`);
    
  } catch (error) {
    console.error('❌ Error setting up comprehensive notification cleanup:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupComprehensiveNotificationCleanup()
    .then(() => {
      console.log('\n🎉 Comprehensive notification cleanup setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupComprehensiveNotificationCleanup };
