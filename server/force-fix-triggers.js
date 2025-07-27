// Force fix for post deletion triggers - use CASCADE to drop everything
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function forceFixTriggers() {
  const client = await pool.connect();
  
  try {
    console.log('🚨 FORCE FIX: Using CASCADE to drop all dependencies...');
    
    // Force drop with CASCADE to remove all dependencies
    await client.query('DROP FUNCTION IF EXISTS handle_post_deletion() CASCADE;');
    console.log('✅ Force dropped function and all its dependencies');
    
    // Create corrected function using "comments" table
    const correctedFunction = `
      CREATE OR REPLACE FUNCTION handle_post_deletion()
      RETURNS TRIGGER AS $$
      BEGIN
          RAISE NOTICE 'Deleting post with ID: %', OLD.post_id;
          
          -- Delete from COMMENTS table (with s) - THIS IS THE FIX
          DELETE FROM comments WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          RAISE NOTICE 'Deleted comments for post %', OLD.post_id;
          
          -- Delete from VOTE table (without s)
          DELETE FROM vote WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          RAISE NOTICE 'Deleted votes for post %', OLD.post_id;
          
          -- Delete notifications
          DELETE FROM notifications WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          
          -- Delete photos
          DELETE FROM photos WHERE source_type = 'post' AND source_id = OLD.post_id;
          
          -- Delete reports
          DELETE FROM reports WHERE reported_item_type = 'post' AND reported_item_id = OLD.post_id;
          
          -- Delete ratings for rate_my_work posts
          IF OLD.post_type = 'rate_my_work' THEN
              DELETE FROM post_ratings WHERE post_id = OLD.post_id;
          END IF;
          
          RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client.query(correctedFunction);
    console.log('✅ Created corrected function using "comments" table (with s)');
    
    // Create new trigger
    await client.query(`
      CREATE TRIGGER post_deletion_cascade
          BEFORE DELETE ON posts
          FOR EACH ROW
          EXECUTE FUNCTION handle_post_deletion();
    `);
    
    console.log('✅ FIXED! New trigger created');
    console.log('📋 Table names now correct:');
    console.log('   ✅ "comments" (with s)');
    console.log('   ✅ "vote" (without s)');
    console.log('🚀 Try deleting a post now!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

forceFixTriggers();
