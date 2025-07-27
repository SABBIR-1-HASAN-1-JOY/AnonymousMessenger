// setup/setup-post-ratings.js
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Use the same database configuration as your main app
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function setupPostRatings() {
  console.log('🚀 Setting up post ratings system...');
  
  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'add_post_ratings_simple.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📄 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        await pool.query(statement + ';');
        console.log(`✅ Statement ${i + 1} executed successfully`);
      } catch (error) {
        console.log(`⚠️  Statement ${i + 1} failed (might already exist): ${error.message}`);
        // Continue with other statements
      }
    }
    
    // Verify the setup
    console.log('🔍 Verifying setup...');
    
    // Check if post_ratings table exists
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'post_ratings'
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ post_ratings table created successfully');
    } else {
      console.log('❌ post_ratings table not found');
    }
    
    // Check if new columns exist in post table
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'post' AND column_name IN ('average_rating', 'total_ratings')
    `);
    
    console.log(`✅ Found ${columnCheck.rows.length}/2 new columns in post table`);
    columnCheck.rows.forEach(row => {
      console.log(`   - ${row.column_name}`);
    });
    
    // Check if functions exist
    const functionCheck = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name IN ('calculate_post_average_rating', 'update_post_rating_trigger')
    `);
    
    console.log(`✅ Found ${functionCheck.rows.length}/2 functions`);
    functionCheck.rows.forEach(row => {
      console.log(`   - ${row.routine_name}()`);
    });
    
    // Test the trigger functionality
    console.log('🧪 Testing trigger functionality...');
    
    // Create a test post if none exists
    const testPostQuery = `
      INSERT INTO post (user_id, post_text, is_rate_enabled, created_at)
      SELECT 1, 'Test post for rating system', true, NOW()
      WHERE NOT EXISTS (SELECT 1 FROM post WHERE is_rate_enabled = true LIMIT 1)
      RETURNING post_id
    `;
    
    const testPostResult = await pool.query(testPostQuery);
    let testPostId;
    
    if (testPostResult.rows.length > 0) {
      testPostId = testPostResult.rows[0].post_id;
      console.log(`✅ Created test post with ID: ${testPostId}`);
    } else {
      // Use existing post
      const existingPost = await pool.query(`
        SELECT post_id FROM post WHERE is_rate_enabled = true LIMIT 1
      `);
      if (existingPost.rows.length > 0) {
        testPostId = existingPost.rows[0].post_id;
        console.log(`✅ Using existing test post with ID: ${testPostId}`);
      }
    }
    
    if (testPostId) {
      // Test rating insertion
      try {
        await pool.query(`
          INSERT INTO post_ratings (post_id, user_id, rating)
          VALUES ($1, 1, 4.5)
          ON CONFLICT (user_id, post_id) DO UPDATE SET rating = EXCLUDED.rating
        `, [testPostId]);
        
        // Check if average was calculated
        const avgCheck = await pool.query(`
          SELECT average_rating, total_ratings 
          FROM post 
          WHERE post_id = $1
        `, [testPostId]);
        
        if (avgCheck.rows.length > 0) {
          const { average_rating, total_ratings } = avgCheck.rows[0];
          console.log(`✅ Trigger test successful: avg=${average_rating}, total=${total_ratings}`);
        }
      } catch (error) {
        console.log(`⚠️  Trigger test failed: ${error.message}`);
      }
    }
    
    console.log('🎉 Post ratings system setup completed!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Update your database columns manually if they were not added automatically');
    console.log('2. Test the new rating endpoints:');
    console.log('   - POST /api/posts/:id/rate');
    console.log('   - GET /api/posts/:id/ratings');
    console.log('   - GET /api/posts/top-rated');
    console.log('3. Update your frontend to use the new rating system');
    
  } catch (error) {
    console.error('❌ Error setting up post ratings system:', error);
  } finally {
    await pool.end();
  }
}

// Run the setup
setupPostRatings();
