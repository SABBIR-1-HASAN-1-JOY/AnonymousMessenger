// Check database schema for comments and vote tables
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkSchema() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking database schema for comments and vote tables...\n');
    
    // Check comments table structure
    console.log('📋 COMMENTS TABLE STRUCTURE:');
    const commentsSchema = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'comments' 
      ORDER BY ordinal_position
    `);
    
    commentsSchema.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    console.log('\n📋 VOTE TABLE STRUCTURE:');
    const voteSchema = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'vote' 
      ORDER BY ordinal_position
    `);
    
    voteSchema.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check sample data to understand the relationship
    console.log('\n📋 SAMPLE COMMENTS DATA:');
    const sampleComments = await client.query('SELECT * FROM comments LIMIT 3');
    console.log(sampleComments.rows);
    
    console.log('\n📋 SAMPLE VOTE DATA:');
    const sampleVotes = await client.query('SELECT * FROM vote LIMIT 3');
    console.log(sampleVotes.rows);
    
    // Check if there are foreign key constraints
    console.log('\n📋 FOREIGN KEY CONSTRAINTS:');
    const fkConstraints = await client.query(`
      SELECT 
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM 
        information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND (tc.table_name = 'comments' OR tc.table_name = 'vote');
    `);
    
    fkConstraints.rows.forEach(row => {
      console.log(`  ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();
