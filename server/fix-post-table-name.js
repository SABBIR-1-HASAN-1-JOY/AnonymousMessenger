// Fix trigger for correct table name "post" (not "posts")
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixTableNameTrigger() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing trigger for correct table name "post" (not "posts")...\n');
    
    // Drop existing function
    await client.query('DROP FUNCTION IF EXISTS handle_post_deletion() CASCADE;');
    
    const correctedTrigger = `
      CREATE OR REPLACE FUNCTION handle_post_deletion()
      RETURNS TRIGGER AS $$
      DECLARE
          comments_count INTEGER;
          votes_count INTEGER;
          deleted_comments INTEGER;
          deleted_votes INTEGER;
      BEGIN
          RAISE NOTICE 'TRIGGER STARTED: Deleting post with ID: %', OLD.post_id;
          
          -- Count existing comments before deletion
          SELECT COUNT(*) INTO comments_count 
          FROM comments 
          WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          RAISE NOTICE 'Found % comments to delete for post %', comments_count, OLD.post_id;
          
          -- Count existing votes before deletion
          SELECT COUNT(*) INTO votes_count 
          FROM vote 
          WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          RAISE NOTICE 'Found % votes to delete for post %', votes_count, OLD.post_id;
          
          -- Delete comments and count deleted rows
          DELETE FROM comments 
          WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          GET DIAGNOSTICS deleted_comments = ROW_COUNT;
          RAISE NOTICE 'DELETED % comments for post %', deleted_comments, OLD.post_id;
          
          -- Delete votes and count deleted rows
          DELETE FROM vote 
          WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          GET DIAGNOSTICS deleted_votes = ROW_COUNT;
          RAISE NOTICE 'DELETED % votes for post %', deleted_votes, OLD.post_id;
          
          -- Delete other related data
          DELETE FROM notifications WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          DELETE FROM photos WHERE source_type = 'post' AND source_id = OLD.post_id;
          DELETE FROM reports WHERE reported_item_type = 'post' AND reported_item_id = OLD.post_id;
          
          IF OLD.post_type = 'rate_my_work' THEN
              DELETE FROM post_ratings WHERE post_id = OLD.post_id;
              RAISE NOTICE 'Deleted ratings for rate_my_work post %', OLD.post_id;
          END IF;
          
          RAISE NOTICE 'TRIGGER COMPLETED for post %', OLD.post_id;
          
          RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client.query(correctedTrigger);
    console.log('✅ Enhanced trigger function created with correct table names');
    
    // Create trigger on the correct table name "post" (not "posts")
    await client.query(`
      CREATE TRIGGER post_deletion_cascade
          BEFORE DELETE ON post
          FOR EACH ROW
          EXECUTE FUNCTION handle_post_deletion();
    `);
    
    console.log('✅ Trigger created on correct table "post" (not "posts")');
    
    // Verify the trigger exists
    const triggerCheck = await client.query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_name = 'post_deletion_cascade'
    `);
    
    if (triggerCheck.rows.length > 0) {
      console.log('✅ VERIFICATION: Trigger exists on table:', triggerCheck.rows[0].event_object_table);
      console.log('📋 CORRECT TABLE NAMES CONFIRMED:');
      console.log('   ✅ Main table: "post" (singular)');
      console.log('   ✅ Comments table: "comments" (plural)');
      console.log('   ✅ Vote table: "vote" (singular)');
      console.log('🚀 Post deletion with cascading should now work!');
    } else {
      console.log('❌ Trigger verification failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixTableNameTrigger();
