// Quick database connection test
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://demo_owner:npg_FXUnhG86jcYw@ep-silent-heart-a85851wo-pooler.eastus2.azure.neon.tech:5432/demo?sslmode=require',
  ssl: { rejectUnauthorized: false },
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await pool.query('SELECT NOW(), current_database(), current_user');
    console.log('✅ Connection successful!');
    console.log('Database:', result.rows[0].current_database);
    console.log('User:', result.rows[0].current_user);
    console.log('Time:', result.rows[0].now);
    
    // Test if post table exists
    const postTable = await pool.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_name = 'post' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Post table columns:');
    postTable.rows.forEach(row => {
      console.log(`  • ${row.column_name}`);
    });
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();
