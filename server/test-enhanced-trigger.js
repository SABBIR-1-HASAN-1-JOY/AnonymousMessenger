// Test trigger with detailed logging
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function testTriggerWithLogging() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating enhanced trigger with detailed logging...\n');
    
    // Drop existing and create enhanced version
    await client.query('DROP FUNCTION IF EXISTS handle_post_deletion() CASCADE;');
    
    const enhancedTrigger = `
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
    
    await client.query(enhancedTrigger);
    console.log('✅ Enhanced trigger function created');
    
    await client.query(`
      CREATE TRIGGER post_deletion_cascade
          BEFORE DELETE ON posts
          FOR EACH ROW
          EXECUTE FUNCTION handle_post_deletion();
    `);
    
    console.log('✅ Enhanced trigger created with detailed logging');
    
    // Now let's test by checking if there are any comments/votes for existing posts
    console.log('\n🔍 TESTING: Checking existing data...');
    
    const postsWithComments = await client.query(`
      SELECT p.post_id, p.title, COUNT(c.comment_id) as comment_count
      FROM posts p
      LEFT JOIN comments c ON c.entity_type = 'post' AND c.entity_id = p.post_id
      GROUP BY p.post_id, p.title
      HAVING COUNT(c.comment_id) > 0
      LIMIT 3
    `);
    
    console.log('Posts with comments:');
    postsWithComments.rows.forEach(row => {
      console.log(`  Post ${row.post_id}: "${row.title}" has ${row.comment_count} comments`);
    });
    
    const postsWithVotes = await client.query(`
      SELECT p.post_id, p.title, COUNT(v.vote_id) as vote_count
      FROM posts p
      LEFT JOIN vote v ON v.entity_type = 'post' AND v.entity_id = p.post_id
      GROUP BY p.post_id, p.title
      HAVING COUNT(v.vote_id) > 0
      LIMIT 3
    `);
    
    console.log('\nPosts with votes:');
    postsWithVotes.rows.forEach(row => {
      console.log(`  Post ${row.post_id}: "${row.title}" has ${row.vote_count} votes`);
    });
    
    console.log('\n🚀 Enhanced trigger is ready! When you delete a post, check the server logs for detailed information.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testTriggerWithLogging();
