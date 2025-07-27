// setup-post-delete-triggers.js
// Node.js script to set up cascading deletion triggers for posts

const pool = require('./config/db.js'); // Use existing database configuration

async function setupPostDeletionTriggers() {
  const client = await pool.connect();
  
  try {
    console.log('🗃️ Setting up post deletion triggers...\n');
    
    // Step 1: Create the cascading deletion function
    console.log('📋 Step 1: Creating cascading deletion function...');
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
    console.log('✅ Created cascading deletion function');
    
    // Step 2: Create the trigger
    console.log('\n📋 Step 2: Creating deletion trigger...');
    await client.query(`
      DROP TRIGGER IF EXISTS "trigger_handle_post_deletion" ON "public"."post";
    `);
    
    await client.query(`
      CREATE TRIGGER "trigger_handle_post_deletion"
          AFTER DELETE ON "public"."post"
          FOR EACH ROW
          EXECUTE FUNCTION "public"."handle_post_deletion"();
    `);
    console.log('✅ Created post deletion trigger');
    
    // Step 3: Ensure foreign key constraints have CASCADE option
    console.log('\n📋 Step 3: Setting up CASCADE foreign key constraints...');
    
    // Check and update post_ratings foreign key constraint
    try {
      // First, try to drop existing constraint if it exists
      await client.query(`
        ALTER TABLE "public"."post_ratings" 
        DROP CONSTRAINT IF EXISTS "fk_post_ratings_post_id";
      `);
      
      // Add constraint with CASCADE
      await client.query(`
        ALTER TABLE "public"."post_ratings" 
        ADD CONSTRAINT "fk_post_ratings_post_id" 
        FOREIGN KEY ("post_id") 
        REFERENCES "public"."post" ("post_id") 
        ON DELETE CASCADE ON UPDATE NO ACTION;
      `);
      console.log('✅ Updated post_ratings foreign key with CASCADE');
    } catch (error) {
      console.log('⚠️ Could not update post_ratings foreign key:', error.message);
    }
    
    // Step 4: Create cleanup function for orphaned data
    console.log('\n📋 Step 4: Creating cleanup function...');
    await client.query(`
      DROP FUNCTION IF EXISTS "public"."cleanup_orphaned_post_data"() CASCADE;
    `);
    
    await client.query(`
      CREATE OR REPLACE FUNCTION "public"."cleanup_orphaned_post_data"()
        RETURNS INTEGER AS $$
      DECLARE
          deleted_count INTEGER := 0;
          temp_count INTEGER;
      BEGIN
          -- Clean up orphaned post_ratings
          DELETE FROM post_ratings WHERE post_id NOT IN (SELECT post_id FROM post);
          GET DIAGNOSTICS temp_count = ROW_COUNT;
          deleted_count := deleted_count + temp_count;
          RAISE NOTICE 'Deleted % orphaned post_ratings', temp_count;
          
          -- Clean up orphaned comments for posts (using entity_id)
          DELETE FROM comments 
          WHERE entity_type = 'post' 
          AND entity_id NOT IN (SELECT post_id FROM post);
          GET DIAGNOSTICS temp_count = ROW_COUNT;
          deleted_count := deleted_count + temp_count;
          RAISE NOTICE 'Deleted % orphaned comments', temp_count;
          
          -- Clean up orphaned votes for posts (using entity_id)
          DELETE FROM votes 
          WHERE entity_type = 'post' 
          AND entity_id NOT IN (SELECT post_id FROM post);
          GET DIAGNOSTICS temp_count = ROW_COUNT;
          deleted_count := deleted_count + temp_count;
          RAISE NOTICE 'Deleted % orphaned votes', temp_count;
          
          -- Clean up orphaned notifications for posts
          DELETE FROM notifications 
          WHERE entity_type = 'post' 
          AND entity_id NOT IN (SELECT post_id FROM post);
          GET DIAGNOSTICS temp_count = ROW_COUNT;
          deleted_count := deleted_count + temp_count;
          RAISE NOTICE 'Deleted % orphaned notifications', temp_count;
          
          -- Clean up orphaned photos for posts
          DELETE FROM photos 
          WHERE type = 'post' 
          AND source_id NOT IN (SELECT post_id FROM post);
          GET DIAGNOSTICS temp_count = ROW_COUNT;
          deleted_count := deleted_count + temp_count;
          RAISE NOTICE 'Deleted % orphaned photos', temp_count;
          
          -- Clean up orphaned reports for posts
          DELETE FROM reports 
          WHERE reported_item_type = 'post' 
          AND reported_item_id NOT IN (SELECT post_id FROM post);
          GET DIAGNOSTICS temp_count = ROW_COUNT;
          deleted_count := deleted_count + temp_count;
          RAISE NOTICE 'Deleted % orphaned reports', temp_count;
          
          RETURN deleted_count;
      END;
      $$ LANGUAGE plpgsql VOLATILE COST 100;
    `);
    console.log('✅ Created cleanup function');
    
    // Step 5: Create test function
    console.log('\n📋 Step 5: Creating test function...');
    await client.query(`
      DROP FUNCTION IF EXISTS "public"."test_post_deletion_cascade"() CASCADE;
    `);
    
    await client.query(`
      CREATE OR REPLACE FUNCTION "public"."test_post_deletion_cascade"()
        RETURNS TEXT AS $$
      DECLARE
          test_post_id INTEGER;
          test_user_id INTEGER := 999; -- Using a test user ID
          result_text TEXT := '';
          rating_count INTEGER := 0;
          notification_count INTEGER := 0;
          rating_count_after INTEGER := 0;
          notification_count_after INTEGER := 0;
      BEGIN
          -- Create a test post
          INSERT INTO post (user_id, post_text, is_rate_enabled, created_at)
          VALUES (test_user_id, 'Test post for deletion cascade test', true, NOW())
          RETURNING post_id INTO test_post_id;
          
          result_text := result_text || 'Created test post with ID: ' || test_post_id || E'\\n';
          
          -- Add a test rating (if post_ratings table exists)
          BEGIN
              INSERT INTO post_ratings (post_id, user_id, rating)
              VALUES (test_post_id, test_user_id + 1, 4.5);
              result_text := result_text || 'Added test rating' || E'\\n';
          EXCEPTION
              WHEN OTHERS THEN
                  result_text := result_text || 'Could not add test rating: ' || SQLERRM || E'\\n';
          END;
          
          -- Add a test notification (if notifications table exists)
          BEGIN
              INSERT INTO notifications (user_id, entity_type, entity_id, message, created_at)
              VALUES (test_user_id, 'post', test_post_id, 'Test notification', NOW());
              result_text := result_text || 'Added test notification' || E'\\n';
          EXCEPTION
              WHEN OTHERS THEN
                  result_text := result_text || 'Could not add test notification: ' || SQLERRM || E'\\n';
          END;
          
          -- Count related records before deletion
          SELECT COUNT(*) INTO rating_count FROM post_ratings WHERE post_id = test_post_id;
          SELECT COUNT(*) INTO notification_count FROM notifications WHERE entity_type = 'post' AND entity_id = test_post_id;
          
          result_text := result_text || 'Before deletion - Ratings: ' || rating_count || ', Notifications: ' || notification_count || E'\\n';
          
          -- Delete the test post (this should trigger cascading deletions)
          DELETE FROM post WHERE post_id = test_post_id;
          result_text := result_text || 'Deleted test post' || E'\\n';
          
          -- Count related records after deletion
          SELECT COUNT(*) INTO rating_count_after FROM post_ratings WHERE post_id = test_post_id;
          SELECT COUNT(*) INTO notification_count_after FROM notifications WHERE entity_type = 'post' AND entity_id = test_post_id;
          
          result_text := result_text || 'After deletion - Ratings: ' || rating_count_after || ', Notifications: ' || notification_count_after || E'\\n';
          
          IF rating_count_after = 0 AND notification_count_after = 0 THEN
              result_text := result_text || 'SUCCESS: All related records were properly deleted!' || E'\\n';
          ELSE
              result_text := result_text || 'WARNING: Some related records were not deleted' || E'\\n';
          END IF;
          
          RETURN result_text;
      END;
      $$ LANGUAGE plpgsql VOLATILE COST 100;
    `);
    console.log('✅ Created test function');
    
    // Step 6: Test the setup
    console.log('\n📋 Step 6: Testing the deletion cascade...');
    try {
      const testResult = await client.query('SELECT test_post_deletion_cascade()');
      console.log('\n🧪 Test Results:');
      console.log(testResult.rows[0].test_post_deletion_cascade);
    } catch (error) {
      console.log('⚠️ Test failed:', error.message);
    }
    
    // Step 7: Clean up any existing orphaned data
    console.log('\n📋 Step 7: Cleaning up orphaned data...');
    try {
      const cleanupResult = await client.query('SELECT cleanup_orphaned_post_data()');
      console.log(`✅ Cleaned up ${cleanupResult.rows[0].cleanup_orphaned_post_data} orphaned records`);
    } catch (error) {
      console.log('⚠️ Cleanup failed:', error.message);
    }
    
    console.log('\n🎉 Post deletion triggers setup completed successfully!');
    console.log('\n📝 Summary:');
    console.log('  • Created handle_post_deletion() function');
    console.log('  • Created trigger_handle_post_deletion trigger');
    console.log('  • Updated foreign key constraints with CASCADE');
    console.log('  • Created cleanup_orphaned_post_data() function');
    console.log('  • Created test_post_deletion_cascade() function');
    console.log('\n🚀 When a post is deleted, the following will be automatically removed:');
    console.log('  • Post ratings (post_ratings table)');
    console.log('  • Comments on the post (comments table)');
    console.log('  • Votes on the post (votes table)');
    console.log('  • Notifications about the post (notifications table)');
    console.log('  • Photos attached to the post (photos table)');
    console.log('  • Reports about the post (reports table)');
    
  } catch (error) {
    console.error('❌ Error setting up post deletion triggers:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the setup
async function main() {
  try {
    await setupPostDeletionTriggers();
    console.log('\n✅ Setup completed successfully');
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { setupPostDeletionTriggers };
