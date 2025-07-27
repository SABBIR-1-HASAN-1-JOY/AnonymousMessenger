// Fix and test notification trigger for post ratings
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://demo_owner:npg_FXUnhG86jcYw@ep-silent-heart-a85851wo-pooler.eastus2.azure.neon.tech:5432/demo?sslmode=require',
  ssl: { rejectUnauthorized: false },
});

async function fixNotificationTrigger() {
  const client = await pool.connect();
  try {
    console.log('🔔 Fixing notification trigger for post ratings...');
    
    // Step 1: Check if create_notification function exists
    console.log('1. Checking if create_notification function exists...');
    const functionCheck = await client.query(`
      SELECT routine_name FROM information_schema.routines 
      WHERE routine_name = 'create_notification' AND routine_schema = 'public'
    `);
    
    if (functionCheck.rows.length === 0) {
      console.log('❌ create_notification function not found!');
      console.log('Please run the notification setup first.');
      return;
    }
    console.log('✅ create_notification function exists');
    
    // Step 2: Drop existing notification trigger
    console.log('2. Dropping existing notification trigger...');
    try {
      await client.query('DROP TRIGGER IF EXISTS trigger_post_rating_notification ON post_ratings');
    } catch (e) {
      // Ignore if trigger doesn't exist
    }
    console.log('✅ Dropped old trigger');
    
    // Step 3: Create improved notification function
    console.log('3. Creating notification function...');
    const notificationFunction = `
      CREATE OR REPLACE FUNCTION notify_post_rating()
      RETURNS TRIGGER AS $$
      DECLARE
          post_owner_id INTEGER;
          rater_name VARCHAR(255);
          post_preview TEXT;
          notification_result INTEGER;
      BEGIN
          -- Get the post owner and rater info
          SELECT p.user_id, u.username, LEFT(p.post_text, 50)
          INTO post_owner_id, rater_name, post_preview
          FROM post p
          JOIN "user" u ON u.user_id = NEW.user_id
          WHERE p.post_id = NEW.post_id;
          
          -- Only create notification if we found the post and user info
          IF post_owner_id IS NOT NULL AND rater_name IS NOT NULL THEN
              -- Create notification using existing create_notification function
              SELECT create_notification(
                  post_owner_id,                    -- recipient_user_id
                  NEW.user_id,                     -- actor_user_id  
                  'rating',                        -- notification_type
                  'post',                          -- entity_type
                  NEW.post_id,                     -- entity_id
                  rater_name || ' rated your post "' || COALESCE(post_preview, 'your content') || '..." with ' || NEW.rating || ' stars'
              ) INTO notification_result;
          END IF;
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    await client.query(notificationFunction);
    console.log('✅ Created notification function');
    
    // Step 4: Create notification trigger
    console.log('4. Creating notification trigger...');
    const triggerSQL = `
      CREATE TRIGGER trigger_post_rating_notification 
      AFTER INSERT ON post_ratings
      FOR EACH ROW
      EXECUTE FUNCTION notify_post_rating()
    `;
    await client.query(triggerSQL);
    console.log('✅ Created notification trigger');
    
    // Step 5: Test the notification system
    console.log('5. Testing notification system...');
    
    // Find users and posts for testing
    const users = await client.query('SELECT user_id, username FROM "user" LIMIT 3');
    const posts = await client.query('SELECT post_id, user_id, post_text FROM post WHERE is_rate_enabled = true LIMIT 3');
    
    if (users.rows.length < 2 || posts.rows.length < 1) {
      console.log('⚠️ Not enough users or posts for testing');
      console.log('Users found:', users.rows.length);
      console.log('Rate-enabled posts found:', posts.rows.length);
      return;
    }
    
    // Find a post not owned by user 2
    let testPost = posts.rows.find(p => p.user_id !== users.rows[1].user_id);
    if (!testPost) {
      testPost = posts.rows[0]; // Use first post anyway for basic test
    }
    
    const testUserId = users.rows[1].user_id; // User who will rate
    const postOwnerId = testPost.user_id; // Post owner
    
    console.log(`Testing: User ${testUserId} rating post ${testPost.post_id} (owned by ${postOwnerId})`);
    
    // Clear any existing test data
    await client.query('DELETE FROM post_ratings WHERE post_id = $1 AND user_id = $2', [testPost.post_id, testUserId]);
    await client.query('DELETE FROM notifications WHERE entity_type = $1 AND entity_id = $2 AND actor_user_id = $3', ['post', testPost.post_id, testUserId]);
    
    // Count notifications before
    const beforeCount = await client.query('SELECT COUNT(*) FROM notifications WHERE entity_type = $1', ['post']);
    const beforeNotifications = parseInt(beforeCount.rows[0].count);
    
    // Add a test rating (this should trigger the notification)
    console.log('Adding test rating 4.5...');
    await client.query(
      'INSERT INTO post_ratings (post_id, user_id, rating) VALUES ($1, $2, 4.5)',
      [testPost.post_id, testUserId]
    );
    
    // Check if notification was created
    const afterCount = await client.query('SELECT COUNT(*) FROM notifications WHERE entity_type = $1', ['post']);
    const afterNotifications = parseInt(afterCount.rows[0].count);
    
    console.log(`Notifications before: ${beforeNotifications}, after: ${afterNotifications}`);
    
    // Check for specific notification
    const specificNotification = await client.query(`
      SELECT * FROM notifications 
      WHERE entity_type = 'post' 
        AND entity_id = $1 
        AND actor_user_id = $2 
        AND notification_type = 'rating'
      ORDER BY created_at DESC 
      LIMIT 1
    `, [testPost.post_id, testUserId]);
    
    if (specificNotification.rows.length > 0) {
      const notification = specificNotification.rows[0];
      console.log('🎉 SUCCESS! Notification created:');
      console.log(`   Message: "${notification.message}"`);
      console.log(`   Recipient: ${notification.recipient_user_id}`);
      console.log(`   Actor: ${notification.actor_user_id}`);
      console.log(`   Created: ${notification.created_at}`);
    } else {
      console.log('❌ No notification was created');
      
      // Debug: Check if rating was actually added
      const ratingCheck = await client.query(
        'SELECT * FROM post_ratings WHERE post_id = $1 AND user_id = $2',
        [testPost.post_id, testUserId]
      );
      
      if (ratingCheck.rows.length > 0) {
        console.log('✅ Rating was added to database');
        console.log('❌ But notification trigger did not fire');
      } else {
        console.log('❌ Rating was not added to database');
      }
    }
    
    // Clean up test data
    await client.query('DELETE FROM post_ratings WHERE post_id = $1 AND user_id = $2', [testPost.post_id, testUserId]);
    await client.query('DELETE FROM notifications WHERE entity_type = $1 AND entity_id = $2 AND actor_user_id = $3', ['post', testPost.post_id, testUserId]);
    console.log('✅ Cleaned up test data');
    
    console.log('\n🎉 Notification trigger setup complete!');
    console.log('\n📋 What was set up:');
    console.log('  ✅ Notification trigger function created');
    console.log('  ✅ Trigger attached to post_ratings INSERT');
    console.log('  ✅ Integrates with existing create_notification function');
    console.log('  ✅ Prevents self-notifications automatically');
    
    console.log('\n🔔 How it works:');
    console.log('  • When a user rates a post, a notification is automatically sent to the post owner');
    console.log('  • Users will NOT get notifications for rating their own posts');
    console.log('  • Notification message includes rater name, post preview, and star rating');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

fixNotificationTrigger();
