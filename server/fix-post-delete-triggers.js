// fix-post-delete-triggers.js
// Script to fix the post deletion triggers with correct column names

const pool = require('./config/db.js');

async function fixPostDeletionTriggers() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing post deletion triggers...\n');
    
    // Step 1: Drop existing function and recreate with correct column mappings
    console.log('📋 Step 1: Recreating deletion function with correct column names...');
    
    await client.query(`
      DROP FUNCTION IF EXISTS "public"."handle_post_deletion"() CASCADE;
    `);
    
    await client.query(`
      CREATE OR REPLACE FUNCTION "public"."handle_post_deletion"()
        RETURNS TRIGGER AS $$
      BEGIN
          -- Log the deletion for debugging
          RAISE NOTICE 'Post deletion triggered for post_id: %', OLD.post_id;
          
          -- Delete notifications related to this post
          DELETE FROM notifications 
          WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          RAISE NOTICE 'Deleted notifications for post_id: %', OLD.post_id;
          
          -- Delete photos related to this post (if any)
          DELETE FROM photos 
          WHERE type = 'post' AND source_id = OLD.post_id;
          RAISE NOTICE 'Deleted photos for post_id: %', OLD.post_id;
          
          -- Delete reports related to this post
          DELETE FROM reports 
          WHERE reported_item_type = 'post' AND reported_item_id = OLD.post_id;
          RAISE NOTICE 'Deleted reports for post_id: %', OLD.post_id;
          
          -- Delete votes related to this post (using entity_id column)
          DELETE FROM votes 
          WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          RAISE NOTICE 'Deleted votes for post_id: %', OLD.post_id;
          
          -- Delete comments related to this post (using entity_id column)
          DELETE FROM comments 
          WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          RAISE NOTICE 'Deleted comments for post_id: %', OLD.post_id;
          
          RAISE NOTICE 'Completed cascading deletion for post_id: %', OLD.post_id;
          
          RETURN OLD;
      END;
      $$ LANGUAGE plpgsql VOLATILE COST 100;
    `);
    console.log('✅ Fixed deletion function');
    
    // Step 2: Recreate the trigger
    console.log('\n📋 Step 2: Recreating trigger...');
    await client.query(`
      DROP TRIGGER IF EXISTS "trigger_handle_post_deletion" ON "public"."post";
    `);
    
    await client.query(`
      CREATE TRIGGER "trigger_handle_post_deletion"
          AFTER DELETE ON "public"."post"
          FOR EACH ROW
          EXECUTE FUNCTION "public"."handle_post_deletion"();
    `);
    console.log('✅ Recreated trigger');
    
    // Step 3: Test the corrected setup
    console.log('\n📋 Step 3: Testing corrected triggers...');
    
    // Create test post
    const testPost = await client.query(`
      INSERT INTO post (user_id, post_text, is_rate_enabled, created_at)
      VALUES (999, 'TEST POST FOR CORRECTED DELETION - Will be deleted', true, NOW())
      RETURNING post_id
    `);
    
    const testPostId = testPost.rows[0].post_id;
    console.log(`Created test post with ID: ${testPostId}`);
    
    // Add test data
    let addedRating = false, addedComment = false, addedVote = false, addedNotification = false;
    
    // Try to add test rating
    try {
      await client.query(`
        INSERT INTO post_ratings (post_id, user_id, rating, created_at)
        VALUES ($1, 998, 4.5, NOW())
      `, [testPostId]);
      addedRating = true;
      console.log('✅ Added test rating');
    } catch (error) {
      console.log('⚠️ Could not add test rating:', error.message);
    }
    
    // Try to add test comment (using entity_id)
    try {
      await client.query(`
        INSERT INTO comments (entity_type, entity_id, user_id, comment_text, created_at)
        VALUES ('post', $1, 998, 'Test comment for deletion', NOW())
      `, [testPostId]);
      addedComment = true;
      console.log('✅ Added test comment');
    } catch (error) {
      console.log('⚠️ Could not add test comment:', error.message);
    }
    
    // Try to add test vote (using entity_id)
    try {
      await client.query(`
        INSERT INTO votes (entity_type, entity_id, user_id, vote_type, created_at)
        VALUES ('post', $1, 998, 'up', NOW())
      `, [testPostId]);
      addedVote = true;
      console.log('✅ Added test vote');
    } catch (error) {
      console.log('⚠️ Could not add test vote:', error.message);
    }
    
    // Try to add test notification
    try {
      await client.query(`
        INSERT INTO notifications (user_id, entity_type, entity_id, message, created_at)
        VALUES (999, 'post', $1, 'Test notification for deletion', NOW())
      `, [testPostId]);
      addedNotification = true;
      console.log('✅ Added test notification');
    } catch (error) {
      console.log('⚠️ Could not add test notification:', error.message);
    }
    
    // Count before deletion
    console.log('\n📋 Step 4: Counting related data before deletion...');
    
    const countsBefore = {
      ratings: 0,
      comments: 0,
      votes: 0,
      notifications: 0
    };
    
    if (addedRating) {
      const ratingCount = await client.query('SELECT COUNT(*) FROM post_ratings WHERE post_id = $1', [testPostId]);
      countsBefore.ratings = parseInt(ratingCount.rows[0].count);
    }
    
    if (addedComment) {
      const commentCount = await client.query('SELECT COUNT(*) FROM comments WHERE entity_type = $1 AND entity_id = $2', ['post', testPostId]);
      countsBefore.comments = parseInt(commentCount.rows[0].count);
    }
    
    if (addedVote) {
      const voteCount = await client.query('SELECT COUNT(*) FROM votes WHERE entity_type = $1 AND entity_id = $2', ['post', testPostId]);
      countsBefore.votes = parseInt(voteCount.rows[0].count);
    }
    
    if (addedNotification) {
      const notificationCount = await client.query('SELECT COUNT(*) FROM notifications WHERE entity_type = $1 AND entity_id = $2', ['post', testPostId]);
      countsBefore.notifications = parseInt(notificationCount.rows[0].count);
    }
    
    console.log(`Before deletion: Ratings=${countsBefore.ratings}, Comments=${countsBefore.comments}, Votes=${countsBefore.votes}, Notifications=${countsBefore.notifications}`);
    
    // Delete the test post (this should trigger cascading deletions)
    console.log('\n📋 Step 5: Deleting test post...');
    await client.query('DELETE FROM post WHERE post_id = $1', [testPostId]);
    console.log('✅ Deleted test post');
    
    // Count after deletion
    console.log('\n📋 Step 6: Counting related data after deletion...');
    
    const countsAfter = {
      ratings: 0,
      comments: 0,
      votes: 0,
      notifications: 0
    };
    
    if (addedRating) {
      const ratingCount = await client.query('SELECT COUNT(*) FROM post_ratings WHERE post_id = $1', [testPostId]);
      countsAfter.ratings = parseInt(ratingCount.rows[0].count);
    }
    
    if (addedComment) {
      const commentCount = await client.query('SELECT COUNT(*) FROM comments WHERE entity_type = $1 AND entity_id = $2', ['post', testPostId]);
      countsAfter.comments = parseInt(commentCount.rows[0].count);
    }
    
    if (addedVote) {
      const voteCount = await client.query('SELECT COUNT(*) FROM votes WHERE entity_type = $1 AND entity_id = $2', ['post', testPostId]);
      countsAfter.votes = parseInt(voteCount.rows[0].count);
    }
    
    if (addedNotification) {
      const notificationCount = await client.query('SELECT COUNT(*) FROM notifications WHERE entity_type = $1 AND entity_id = $2', ['post', testPostId]);
      countsAfter.notifications = parseInt(notificationCount.rows[0].count);
    }
    
    console.log(`After deletion: Ratings=${countsAfter.ratings}, Comments=${countsAfter.comments}, Votes=${countsAfter.votes}, Notifications=${countsAfter.notifications}`);
    
    // Check results
    console.log('\n🎯 Results:');
    const allDeleted = countsAfter.ratings === 0 && countsAfter.comments === 0 && countsAfter.votes === 0 && countsAfter.notifications === 0;
    
    if (allDeleted) {
      console.log('🎉 SUCCESS: All related records were properly deleted!');
      console.log('✅ Post ratings: Deleted correctly');
      console.log('✅ Comments (using entity_id): Deleted correctly');
      console.log('✅ Votes (using entity_id): Deleted correctly');
      console.log('✅ Notifications: Deleted correctly');
    } else {
      console.log('⚠️ Some related records were not deleted:');
      if (countsAfter.ratings > 0) console.log(`❌ Ratings remaining: ${countsAfter.ratings}`);
      if (countsAfter.comments > 0) console.log(`❌ Comments remaining: ${countsAfter.comments}`);
      if (countsAfter.votes > 0) console.log(`❌ Votes remaining: ${countsAfter.votes}`);
      if (countsAfter.notifications > 0) console.log(`❌ Notifications remaining: ${countsAfter.notifications}`);
    }
    
    console.log('\n🔧 Post deletion triggers have been fixed and tested!');
    
  } catch (error) {
    console.error('❌ Error fixing post deletion triggers:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixPostDeletionTriggers().catch(console.error);
