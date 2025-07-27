// Check photos table schema and fix trigger
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkPhotosSchemaAndFix() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking photos table schema...\n');
    
    // Check photos table structure
    const photosSchema = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'photos' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 PHOTOS TABLE STRUCTURE:');
    photosSchema.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check sample data
    console.log('\n📋 SAMPLE PHOTOS DATA:');
    const samplePhotos = await client.query('SELECT * FROM photos LIMIT 3');
    console.log(samplePhotos.rows);
    
    // Check reports table too
    console.log('\n📋 REPORTS TABLE STRUCTURE:');
    const reportsSchema = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'reports' 
      ORDER BY ordinal_position
    `);
    
    reportsSchema.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Check notifications table
    console.log('\n📋 NOTIFICATIONS TABLE STRUCTURE:');
    const notificationsSchema = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' 
      ORDER BY ordinal_position
    `);
    
    notificationsSchema.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    console.log('\n🔧 Creating fixed trigger without problematic tables...');
    
    // Drop existing and create minimal working trigger
    await client.query('DROP FUNCTION IF EXISTS handle_post_deletion() CASCADE;');
    
    const fixedTrigger = `
      CREATE OR REPLACE FUNCTION handle_post_deletion()
      RETURNS TRIGGER AS $$
      DECLARE
          comments_count INTEGER;
          votes_count INTEGER;
          deleted_comments INTEGER;
          deleted_votes INTEGER;
      BEGIN
          RAISE NOTICE 'TRIGGER STARTED: Deleting post with ID: %', OLD.post_id;
          
          -- Count existing comments before deletion
          SELECT COUNT(*) INTO comments_count 
          FROM comments 
          WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          RAISE NOTICE 'Found % comments to delete for post %', comments_count, OLD.post_id;
          
          -- Count existing votes before deletion
          SELECT COUNT(*) INTO votes_count 
          FROM vote 
          WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          RAISE NOTICE 'Found % votes to delete for post %', votes_count, OLD.post_id;
          
          -- Delete comments and count deleted rows
          DELETE FROM comments 
          WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          GET DIAGNOSTICS deleted_comments = ROW_COUNT;
          RAISE NOTICE 'DELETED % comments for post %', deleted_comments, OLD.post_id;
          
          -- Delete votes and count deleted rows
          DELETE FROM vote 
          WHERE entity_type = 'post' AND entity_id = OLD.post_id;
          GET DIAGNOSTICS deleted_votes = ROW_COUNT;
          RAISE NOTICE 'DELETED % votes for post %', deleted_votes, OLD.post_id;
          
          -- Only delete from tables that actually have the correct columns
          -- Skip photos, reports, notifications for now until we know their schema
          
          -- Delete ratings if this is a rate_my_work post
          IF OLD.is_rate_enabled = true THEN
              DELETE FROM post_ratings WHERE post_id = OLD.post_id;
              RAISE NOTICE 'Deleted ratings for rate_my_work post %', OLD.post_id;
          END IF;
          
          RAISE NOTICE 'TRIGGER COMPLETED for post %', OLD.post_id;
          
          RETURN OLD;
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    await client.query(fixedTrigger);
    console.log('✅ Fixed trigger function created (comments and votes only)');
    
    await client.query(`
      CREATE TRIGGER post_deletion_cascade
          BEFORE DELETE ON post
          FOR EACH ROW
          EXECUTE FUNCTION handle_post_deletion();
    `);
    
    console.log('✅ Fixed trigger created - will only delete comments and votes');
    console.log('🚀 Try deleting a post now!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkPhotosSchemaAndFix();
