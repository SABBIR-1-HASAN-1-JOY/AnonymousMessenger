// simple-notification-cleanup.js
// Simple script to set up notification cleanup triggers

const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function setupSimpleNotificationCleanup() {
  const client = await pool.connect();
  
  try {
    console.log('Setting up simple notification cleanup triggers...');
    
    // Read and execute the simple SQL file
    const sqlFilePath = path.join(__dirname, '../migrations/SIMPLE_NOTIFICATION_CLEANUP_TRIGGERS.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    await client.query(sql);
    
    console.log('✅ Simple notification cleanup triggers created successfully!');
    
    // Quick verification
    const triggerCheck = await client.query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_name LIKE '%cleanup%'
    `);
    
    console.log(`✅ Created ${triggerCheck.rows.length} cleanup triggers:`);
    triggerCheck.rows.forEach(row => {
      console.log(`   - ${row.trigger_name} on ${row.event_object_table}`);
    });
    
  } catch (error) {
    console.error('❌ Error setting up notification cleanup:', error.message);
    // Try to continue with manual commands if the full script fails
    if (error.message.includes('depends on it')) {
      console.log('🔧 Attempting manual cleanup of dependencies...');
      
      try {
        // Try to drop with CASCADE
        await client.query('DROP FUNCTION IF EXISTS cleanup_post_notifications() CASCADE');
        await client.query('DROP FUNCTION IF EXISTS cleanup_review_notifications() CASCADE');
        console.log('✅ Cleaned up existing functions');
        
        // Now try to create new ones step by step
        await client.query(`
          CREATE OR REPLACE FUNCTION cleanup_post_notifications()
          RETURNS TRIGGER AS $$
          BEGIN
              DELETE FROM notifications WHERE entity_type = 'post' AND entity_id = OLD.post_id;
              RETURN OLD;
          END;
          $$ LANGUAGE plpgsql;
        `);
        
        await client.query(`
          CREATE TRIGGER cleanup_post_notifications_trigger
              BEFORE DELETE ON post
              FOR EACH ROW
              EXECUTE FUNCTION cleanup_post_notifications();
        `);
        
        console.log('✅ Successfully created post notification cleanup trigger');
        
      } catch (manualError) {
        console.error('❌ Manual setup also failed:', manualError.message);
      }
    }
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  setupSimpleNotificationCleanup()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { setupSimpleNotificationCleanup };
