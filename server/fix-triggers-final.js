// Quick fix for the trigger issue
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://demo_owner:npg_FXUnhG86jcYw@ep-silent-heart-a85851wo-pooler.eastus2.azure.neon.tech:5432/demo?sslmode=require',
  ssl: { rejectUnauthorized: false },
});

async function fixTriggers() {
  const client = await pool.connect();
  try {
    console.log('🔧 Fixing triggers for ratingpoint updates...');
    
    // Step 1: Drop existing broken triggers
    console.log('1. Dropping existing triggers...');
    const dropCommands = [
      'DROP TRIGGER IF EXISTS trigger_calculate_rating_on_insert ON post_ratings',
      'DROP TRIGGER IF EXISTS trigger_calculate_rating_on_update ON post_ratings', 
      'DROP TRIGGER IF EXISTS trigger_calculate_rating_on_delete ON post_ratings'
    ];
    
    for (const cmd of dropCommands) {
      try {
        await client.query(cmd);
      } catch (e) {
        // Ignore if trigger doesn't exist
      }
    }
    console.log('✅ Dropped old triggers');
    
    // Step 2: Create proper trigger function
    console.log('2. Creating trigger function...');
    const functionSQL = `
      CREATE OR REPLACE FUNCTION update_post_rating_average()
      RETURNS TRIGGER AS $$
      DECLARE
          avg_rating NUMERIC(3,2);
          rating_count INTEGER;
          target_post_id INTEGER;
      BEGIN
          -- Get the post_id to update
          IF TG_OP = 'DELETE' THEN
              target_post_id := OLD.post_id;
          ELSE
              target_post_id := NEW.post_id;
          END IF;
          
          -- Calculate new average and count
          SELECT AVG(rating), COUNT(rating)
          INTO avg_rating, rating_count
          FROM post_ratings
          WHERE post_id = target_post_id;
          
          -- Update the post table
          UPDATE post 
          SET 
              average_rating = ROUND(COALESCE(avg_rating, 0), 2),
              total_ratings = COALESCE(rating_count, 0),
              ratingpoint = ROUND(COALESCE(avg_rating, 0), 1)
          WHERE post_id = target_post_id;
          
          -- Return appropriate record
          IF TG_OP = 'DELETE' THEN
              RETURN OLD;
          ELSE
              RETURN NEW;
          END IF;
      END;
      $$ LANGUAGE plpgsql;
    `;
    await client.query(functionSQL);
    console.log('✅ Created trigger function');
    
    // Step 3: Create working triggers
    console.log('3. Creating new triggers...');
    const triggers = [
      `CREATE TRIGGER update_rating_on_insert 
       AFTER INSERT ON post_ratings
       FOR EACH ROW
       EXECUTE FUNCTION update_post_rating_average()`,
       
      `CREATE TRIGGER update_rating_on_update 
       AFTER UPDATE ON post_ratings
       FOR EACH ROW
       EXECUTE FUNCTION update_post_rating_average()`,
       
      `CREATE TRIGGER update_rating_on_delete 
       AFTER DELETE ON post_ratings
       FOR EACH ROW
       EXECUTE FUNCTION update_post_rating_average()`
    ];
    
    for (const triggerSQL of triggers) {
      await client.query(triggerSQL);
    }
    console.log('✅ Created new triggers');
    
    // Step 4: Test the fix
    console.log('4. Testing the fix...');
    
    // Find a post to test with
    const postResult = await client.query('SELECT post_id FROM post LIMIT 1');
    if (postResult.rows.length === 0) {
      console.log('❌ No posts found for testing');
      return;
    }
    
    const testPostId = postResult.rows[0].post_id;
    console.log(`Testing with post_id: ${testPostId}`);
    
    // Clear any test data
    await client.query('DELETE FROM post_ratings WHERE post_id = $1 AND user_id = 999', [testPostId]);
    await client.query('UPDATE post SET ratingpoint = NULL, average_rating = NULL, total_ratings = 0 WHERE post_id = $1', [testPostId]);
    
    // Insert test rating
    console.log('Inserting test rating 4.5...');
    await client.query(
      'INSERT INTO post_ratings (post_id, user_id, rating) VALUES ($1, 999, 4.5)',
      [testPostId]
    );
    
    // Check if post was updated
    const checkResult = await client.query(
      'SELECT post_id, ratingpoint, average_rating, total_ratings FROM post WHERE post_id = $1',
      [testPostId]
    );
    
    const result = checkResult.rows[0];
    console.log(`Result: ratingpoint=${result.ratingpoint}, average_rating=${result.average_rating}, total_ratings=${result.total_ratings}`);
    
    if (parseFloat(result.ratingpoint) === 4.5) {
      console.log('🎉 SUCCESS! Triggers are now working correctly!');
    } else {
      console.log('❌ Still not working. ratingpoint should be 4.5');
    }
    
    // Test with another rating
    console.log('Adding second rating 3.5...');
    await client.query(
      'INSERT INTO post_ratings (post_id, user_id, rating) VALUES ($1, 998, 3.5)',
      [testPostId]
    );
    
    const checkResult2 = await client.query(
      'SELECT post_id, ratingpoint, average_rating, total_ratings FROM post WHERE post_id = $1',
      [testPostId]
    );
    
    const result2 = checkResult2.rows[0];
    console.log(`After 2nd rating: ratingpoint=${result2.ratingpoint}, average_rating=${result2.average_rating}, total_ratings=${result2.total_ratings}`);
    
    // Expected: (4.5 + 3.5) / 2 = 4.0
    if (parseFloat(result2.ratingpoint) === 4.0 && parseInt(result2.total_ratings) === 2) {
      console.log('🎉 PERFECT! Averaging is working correctly!');
    } else {
      console.log('⚠️ Averaging might need adjustment');
    }
    
    // Clean up test data
    await client.query('DELETE FROM post_ratings WHERE post_id = $1 AND user_id IN (998, 999)', [testPostId]);
    await client.query('UPDATE post SET ratingpoint = NULL, average_rating = NULL, total_ratings = 0 WHERE post_id = $1', [testPostId]);
    console.log('✅ Cleaned up test data');
    
    console.log('\n🎉 Trigger fix complete! Your ratingpoint should now update automatically.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixTriggers();
