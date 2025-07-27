// Simple database trigger test
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://demo_owner:npg_FXUnhG86jcYw@ep-silent-heart-a85851wo-pooler.eastus2.azure.neon.tech:5432/demo?sslmode=require',
  ssl: { rejectUnauthorized: false },
});

async function quickTest() {
  const client = await pool.connect();
  try {
    console.log('🔧 Quick Trigger Test...');
    
    // Check if post_ratings table exists
    const tableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'post_ratings' AND table_schema = 'public'
    `);
    
    if (tableCheck.rows.length === 0) {
      console.log('❌ post_ratings table does not exist!');
      return;
    }
    console.log('✅ post_ratings table exists');
    
    // Check if triggers exist
    const triggerCheck = await client.query(`
      SELECT trigger_name, event_manipulation
      FROM information_schema.triggers 
      WHERE event_object_table = 'post_ratings'
    `);
    
    console.log(`📋 Found ${triggerCheck.rows.length} triggers:`);
    triggerCheck.rows.forEach(row => {
      console.log(`  • ${row.trigger_name} (${row.event_manipulation})`);
    });
    
    // Manual test - insert a rating and check if post.ratingpoint updates
    console.log('\n🧪 Manual trigger test:');
    
    // Find a post to test with
    const postResult = await client.query('SELECT post_id FROM post LIMIT 1');
    if (postResult.rows.length === 0) {
      console.log('❌ No posts found for testing');
      return;
    }
    
    const testPostId = postResult.rows[0].post_id;
    console.log(`Using post_id: ${testPostId}`);
    
    // Clear existing ratings
    await client.query('DELETE FROM post_ratings WHERE post_id = $1', [testPostId]);
    await client.query('UPDATE post SET ratingpoint = NULL WHERE post_id = $1', [testPostId]);
    
    // Insert a rating
    console.log('Inserting rating 4.5...');
    await client.query(
      'INSERT INTO post_ratings (post_id, user_id, rating) VALUES ($1, 1, 4.5)',
      [testPostId]
    );
    
    // Check if post was updated
    const postCheck = await client.query(
      'SELECT ratingpoint, average_rating, total_ratings FROM post WHERE post_id = $1',
      [testPostId]
    );
    
    const result = postCheck.rows[0];
    console.log(`Result: ratingpoint=${result.ratingpoint}, average_rating=${result.average_rating}, total_ratings=${result.total_ratings}`);
    
    if (result.ratingpoint == 4.5) {
      console.log('✅ Trigger is working!');
    } else {
      console.log('❌ Trigger is NOT working - ratingpoint should be 4.5');
      
      // Try manual calculation
      console.log('Trying manual calculation...');
      await client.query('SELECT calculate_post_average_rating_manual($1)', [testPostId]);
      
      const manualCheck = await client.query(
        'SELECT ratingpoint, average_rating, total_ratings FROM post WHERE post_id = $1',
        [testPostId]
      );
      const manualResult = manualCheck.rows[0];
      console.log(`After manual: ratingpoint=${manualResult.ratingpoint}, average_rating=${manualResult.average_rating}, total_ratings=${manualResult.total_ratings}`);
    }
    
    // Clean up
    await client.query('DELETE FROM post_ratings WHERE post_id = $1', [testPostId]);
    await client.query('UPDATE post SET ratingpoint = NULL, average_rating = NULL, total_ratings = 0 WHERE post_id = $1', [testPostId]);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

quickTest();
