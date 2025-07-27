// Fix trigger for photos table with correct schema
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixPhotosTableTrigger() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing trigger for photos table with correct schema...\n');
    
    // Drop existing and create corrected trigger
    await client.query('DROP FUNCTION IF EXISTS handle_post_deletion() CASCADE;');
    
    const correctedTrigger = `
      CREATE OR REPLACE FUNCTION handle_post_deletion()
      RETURNS TRIGGER AS $$
      DECLARE
          comments_count INTEGER;
          votes_count INTEGER;
          photos_count INTEGER;
          deleted_comments INTEGER;
          deleted_votes INTEGER;
          deleted_photos INTEGER;
      BEGIN
          RAISE NOTICE 'TRIGGER STARTED: Deleting post with ID: %', OLD.post_id;
          
          -- Count existing records before deletion
          SELECT COUNT(*) INTO comments_count 
          FROM comments 
          WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          RAISE NOTICE 'Found % comments to delete for post %', comments_count, OLD.post_id;
          
          SELECT COUNT(*) INTO votes_count 
          FROM vote 
          WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          RAISE NOTICE 'Found % votes to delete for post %', votes_count, OLD.post_id;
          
          SELECT COUNT(*) INTO photos_count 
          FROM photos 
          WHERE source_id = OLD.post_id;
          RAISE NOTICE 'Found % photos to delete for post %', photos_count, OLD.post_id;
          
          -- Delete comments
          DELETE FROM comments 
          WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          GET DIAGNOSTICS deleted_comments = ROW_COUNT;
          RAISE NOTICE 'DELETED % comments for post %', deleted_comments, OLD.post_id;
          
          -- Delete votes
          DELETE FROM vote 
          WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          GET DIAGNOSTICS deleted_votes = ROW_COUNT;
          RAISE NOTICE 'DELETED % votes for post %', deleted_votes, OLD.post_id;
          
          -- Delete photos (using only source_id, no source_type column)
          DELETE FROM photos 
          WHERE source_id = OLD.post_id;
          GET DIAGNOSTICS deleted_photos = ROW_COUNT;
          RAISE NOTICE 'DELETED % photos for post %', deleted_photos, OLD.post_id;
          
          -- Delete ratings if this is a rate_my_work post
          IF OLD.is_rate_enabled = true THEN
              DELETE FROM post_ratings WHERE post_id = OLD.post_id;
              RAISE NOTICE 'Deleted ratings for rate_my_work post %', OLD.post_id;
          END IF;
          
          RAISE NOTICE 'TRIGGER COMPLETED for post %', OLD.post_id;
          
          RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client.query(correctedTrigger);
    console.log('✅ Corrected trigger function created');
    
    await client.query(`
      CREATE TRIGGER post_deletion_cascade
          BEFORE DELETE ON post
          FOR EACH ROW
          EXECUTE FUNCTION handle_post_deletion();
    `);
    
    console.log('✅ Corrected trigger created');
    console.log('📋 Now deletes from:');
    console.log('   ✅ comments (using entity_type=post, entity_id)');
    console.log('   ✅ vote (using entity_type=post, entity_id)');
    console.log('   ✅ photos (using source_id only)');
    console.log('   ✅ post_ratings (using post_id)');
    console.log('🚀 Try deleting a post now!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixPhotosTableTrigger();
