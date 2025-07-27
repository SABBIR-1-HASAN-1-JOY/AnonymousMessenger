// Simple post ratings setup script
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://demo_owner:npg_FXUnhG86jcYw@ep-silent-heart-a85851wo-pooler.eastus2.azure.neon.tech:5432/demo?sslmode=require',
  ssl: { rejectUnauthorized: false },
});

async function simpleSetup() {
  try {
    console.log('🚀 Starting Simple Post Ratings Setup...');
    
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connected');
    
    // Step 1: Add columns to post table
    console.log('\n📋 Step 1: Adding columns to post table...');
    try {
      await pool.query('ALTER TABLE post ADD COLUMN average_rating NUMERIC(3,2) DEFAULT NULL');
      console.log('✅ Added average_rating column');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('ℹ️ average_rating column already exists');
      } else {
        throw e;
      }
    }
    
    try {
      await pool.query('ALTER TABLE post ADD COLUMN total_ratings INTEGER DEFAULT 0');
      console.log('✅ Added total_ratings column');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('ℹ️ total_ratings column already exists');
      } else {
        throw e;
      }
    }
    
    // Step 2: Create post_ratings table
    console.log('\n📋 Step 2: Creating post_ratings table...');
    const createTable = `
      CREATE TABLE IF NOT EXISTS post_ratings (
        rating_id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES post(post_id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
        rating NUMERIC(2,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, post_id)
      )
    `;
    await pool.query(createTable);
    console.log('✅ Created post_ratings table');
    
    // Step 3: Create indexes
    console.log('\n📋 Step 3: Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_post_ratings_post_id ON post_ratings(post_id)',
      'CREATE INDEX IF NOT EXISTS idx_post_ratings_user_id ON post_ratings(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_post_ratings_rating ON post_ratings(rating DESC)'
    ];
    
    for (const indexSQL of indexes) {
      await pool.query(indexSQL);
    }
    console.log('✅ Created indexes');
    
    // Step 4: Create basic function
    console.log('\n📋 Step 4: Creating rating calculation function...');
    const createFunction = `
      CREATE OR REPLACE FUNCTION calculate_post_average_rating(p_post_id INTEGER)
      RETURNS VOID AS $$
      DECLARE
          avg_rating NUMERIC(3,2);
          rating_count INTEGER;
      BEGIN
          SELECT AVG(rating), COUNT(rating)
          INTO avg_rating, rating_count
          FROM post_ratings
          WHERE post_id = p_post_id;
          
          UPDATE post 
          SET 
              average_rating = ROUND(avg_rating, 2),
              total_ratings = rating_count,
              ratingpoint = ROUND(avg_rating, 1)
          WHERE post_id = p_post_id;
      END;
      $$ LANGUAGE plpgsql;
    `;
    await pool.query(createFunction);
    console.log('✅ Created rating calculation function');
    
    // Step 5: Test the setup
    console.log('\n📋 Step 5: Testing setup...');
    const testQuery = `
      SELECT 
        t.table_name,
        COUNT(c.column_name) as column_count
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND c.table_schema = 'public'
      WHERE t.table_name IN ('post_ratings', 'post') 
        AND t.table_schema = 'public'
      GROUP BY t.table_name
      ORDER BY t.table_name
    `;
    const result = await pool.query(testQuery);
    
    console.log('\n📊 Setup Results:');
    result.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}: ${row.column_count} columns`);
    });
    
    // Check if new columns were added to post table
    const postColumns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'post' 
        AND column_name IN ('average_rating', 'total_ratings')
        AND table_schema = 'public'
    `);
    
    console.log('\n📋 New Post Table Columns:');
    postColumns.rows.forEach(row => {
      console.log(`  ✅ ${row.column_name}`);
    });
    
    console.log('\n🎉 Post Ratings System Setup Complete!');
    console.log('\n🚀 Ready to use:');
    console.log('  • post_ratings table created');
    console.log('  • average_rating and total_ratings columns added to post table');
    console.log('  • Rating calculation function available');
    console.log('  • API endpoints are ready for use');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

simpleSetup();
