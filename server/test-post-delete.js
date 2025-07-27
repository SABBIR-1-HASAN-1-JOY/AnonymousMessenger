// test-post-delete.js
// Simple test script for post deletion functionality

const pool = require('./config/db.js');

async function testPostDeletion() {
  const client = await pool.connect();
  
  try {
    console.log('🗃️ Testing post deletion system...\n');
    
    // Test 1: Check if post table exists
    console.log('📋 Step 1: Checking post table...');
    const postTableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'post' AND table_schema = 'public'
    `);
    
    if (postTableCheck.rows.length > 0) {
      console.log('✅ Post table exists');
    } else {
      console.log('❌ Post table not found');
      return;
    }
    
    // Test 2: Check existing posts
    const existingPosts = await client.query('SELECT post_id, post_text, user_id FROM post LIMIT 3');
    console.log(`\n📋 Found ${existingPosts.rows.length} existing posts:`);
    existingPosts.rows.forEach(post => {
      console.log(`  • Post ID: ${post.post_id} - "${post.post_text.substring(0, 50)}..."`);
    });
    
    // Test 3: Create a test post for deletion
    console.log('\n📋 Step 2: Creating test post...');
    const testPost = await client.query(`
      INSERT INTO post (user_id, post_text, is_rate_enabled, created_at)
      VALUES (1, 'TEST POST FOR DELETION - This will be deleted', true, NOW())
      RETURNING post_id, post_text
    `);
    
    console.log(`✅ Created test post with ID: ${testPost.rows[0].post_id}`);
    
    // Test 4: Add some related data (if tables exist)
    const testPostId = testPost.rows[0].post_id;
    
    // Try to add a rating if post_ratings table exists
    try {
      await client.query(`
        INSERT INTO post_ratings (post_id, user_id, rating, created_at)
        VALUES ($1, 2, 4.5, NOW())
      `, [testPostId]);
      console.log('✅ Added test rating');
    } catch (error) {
      console.log('⚠️ Could not add test rating:', error.message);
    }
    
    // Try to add a notification if notifications table exists
    try {
      await client.query(`
        INSERT INTO notifications (user_id, entity_type, entity_id, message, created_at)
        VALUES (1, 'post', $1, 'Test notification for post deletion', NOW())
      `, [testPostId]);
      console.log('✅ Added test notification');
    } catch (error) {
      console.log('⚠️ Could not add test notification:', error.message);
    }
    
    // Test 5: Check what related data exists before deletion
    console.log('\n📋 Step 3: Checking related data before deletion...');
    
    try {
      const ratingCount = await client.query('SELECT COUNT(*) FROM post_ratings WHERE post_id = $1', [testPostId]);
      console.log(`  • Ratings: ${ratingCount.rows[0].count}`);
    } catch (error) {
      console.log('  • Ratings table not found');
    }
    
    try {
      const notificationCount = await client.query('SELECT COUNT(*) FROM notifications WHERE entity_type = $1 AND entity_id = $2', ['post', testPostId]);
      console.log(`  • Notifications: ${notificationCount.rows[0].count}`);
    } catch (error) {
      console.log('  • Notifications table not found');
    }
    
    // Test 6: Delete the post
    console.log('\n📋 Step 4: Deleting test post...');
    const deleteResult = await client.query('DELETE FROM post WHERE post_id = $1 RETURNING post_id', [testPostId]);
    
    if (deleteResult.rows.length > 0) {
      console.log(`✅ Successfully deleted post ${deleteResult.rows[0].post_id}`);
    } else {
      console.log('❌ Failed to delete post');
    }
    
    // Test 7: Check related data after deletion
    console.log('\n📋 Step 5: Checking related data after deletion...');
    
    try {
      const ratingCountAfter = await client.query('SELECT COUNT(*) FROM post_ratings WHERE post_id = $1', [testPostId]);
      console.log(`  • Ratings remaining: ${ratingCountAfter.rows[0].count}`);
    } catch (error) {
      console.log('  • Could not check ratings after deletion');
    }
    
    try {
      const notificationCountAfter = await client.query('SELECT COUNT(*) FROM notifications WHERE entity_type = $1 AND entity_id = $2', ['post', testPostId]);
      console.log(`  • Notifications remaining: ${notificationCountAfter.rows[0].count}`);
    } catch (error) {
      console.log('  • Could not check notifications after deletion');
    }
    
    console.log('\n🎉 Post deletion test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. If related data was not automatically deleted, you need to set up cascade triggers');
    console.log('2. Run the MANUAL_POST_DELETE_SETUP.sql file in your database client');
    console.log('3. Test the delete functionality in the Profile component');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testPostDeletion().catch(console.error);
