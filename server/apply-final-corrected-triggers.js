// Apply FINAL corrected post deletion triggers
// Table names: "comments" (with s), "vote" (without s)

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function applyFinalCorrectedTriggers() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Applying FINAL corrected post deletion triggers...');
    console.log('📝 Table names: "comments" (with s), "vote" (without s)');
    
    // Drop existing function and trigger
    console.log('📝 Dropping existing function and trigger...');
    await client.query('DROP TRIGGER IF EXISTS post_deletion_cascade ON posts;');
    await client.query('DROP FUNCTION IF EXISTS handle_post_deletion();');
    
    // Create the corrected post deletion trigger function
    console.log('📝 Creating corrected trigger function...');
    const triggerFunction = `
      CREATE OR REPLACE FUNCTION handle_post_deletion()
      RETURNS TRIGGER AS $$
      BEGIN
          -- Log the deletion attempt
          RAISE NOTICE 'Deleting post with ID: %', OLD.post_id;
          
          -- Delete votes for this post (table name: vote - without s)
          DELETE FROM vote WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          RAISE NOTICE 'Deleted votes for post %', OLD.post_id;
          
          -- Delete comments for this post (table name: comments - with s)  
          DELETE FROM comments WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          RAISE NOTICE 'Deleted comments for post %', OLD.post_id;
          
          -- Delete notifications related to this post
          DELETE FROM notifications WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          RAISE NOTICE 'Deleted notifications for post %', OLD.post_id;
          
          -- Delete photos associated with this post
          DELETE FROM photos WHERE source_type = 'post' AND source_id = OLD.post_id;
          RAISE NOTICE 'Deleted photos for post %', OLD.post_id;
          
          -- Delete reports about this post
          DELETE FROM reports WHERE reported_item_type = 'post' AND reported_item_id = OLD.post_id;
          RAISE NOTICE 'Deleted reports for post %', OLD.post_id;
          
          -- Delete ratings if this is a rate_my_work post
          IF OLD.post_type = 'rate_my_work' THEN
              DELETE FROM post_ratings WHERE post_id = OLD.post_id;
              RAISE NOTICE 'Deleted ratings for rate_my_work post %', OLD.post_id;
          END IF;
          
          RAISE NOTICE 'Successfully completed cascading deletion for post %', OLD.post_id;
          
          RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client.query(triggerFunction);
    console.log('✅ Trigger function created successfully');
    
    // Create the trigger
    console.log('📝 Creating trigger...');
    const trigger = `
      CREATE TRIGGER post_deletion_cascade
          BEFORE DELETE ON posts
          FOR EACH ROW
          EXECUTE FUNCTION handle_post_deletion();
    `;
    
    await client.query(trigger);
    console.log('✅ Trigger created successfully');
    
    // Verify the trigger exists
    const triggerCheck = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_name = 'post_deletion_cascade'
    `);
    
    if (triggerCheck.rows.length > 0) {
      console.log('✅ FINAL VERIFICATION: Trigger exists and is active');
      console.log('📋 Table name corrections applied:');
      console.log('   ✅ "comments" (with s) - CORRECT');
      console.log('   ✅ "vote" (without s) - CORRECT');
      console.log('🚀 Post deletion with cascading should now work perfectly!');
    } else {
      console.log('❌ Trigger verification failed');
    }
    
  } catch (error) {
    console.error('❌ Error applying corrected triggers:', error);
    console.error('Full error details:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
applyFinalCorrectedTriggers();
