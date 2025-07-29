// Test script to verify entity photo integration
const pool = require('./config/db.js');

async function testEntityPhotos() {
  try {
    console.log('Testing entity photos integration...');
    
    // Test the main entity query
    const result = await pool.query(`
      SELECT 
        re.*,
        c.category_name as category,
        ph.photo_name as entity_photo_name,
        CASE 
          WHEN ph.photo_name IS NOT NULL THEN CONCAT('http://localhost:3000/api/photos/file/', ph.photo_name)
          ELSE re.picture
        END as picture
      FROM reviewable_entity re
      LEFT JOIN category c ON re.category_id = c.category_id
      LEFT JOIN photos ph ON ph.source_id = re.item_id AND ph.type = 'entities'
      ORDER BY re.item_name
      LIMIT 5
    `);
    
    console.log('\n=== Entity Photos Test Results ===');
    console.log(`Found ${result.rows.length} entities`);
    
    result.rows.forEach((entity, index) => {
      console.log(`\nEntity ${index + 1}:`);
      console.log(`  Name: ${entity.item_name}`);
      console.log(`  Category: ${entity.category}`);
      console.log(`  Original Picture: ${entity.picture}`);
      console.log(`  Photo Name: ${entity.entity_photo_name || 'No photo in photos table'}`);
      console.log(`  Final Picture URL: ${entity.picture}`);
    });
    
    // Test photos table
    const photosResult = await pool.query(`
      SELECT * FROM photos WHERE type = 'entities' LIMIT 5
    `);
    
    console.log(`\n=== Photos Table (entities) ===`);
    console.log(`Found ${photosResult.rows.length} entity photos in photos table`);
    
    photosResult.rows.forEach((photo, index) => {
      console.log(`\nPhoto ${index + 1}:`);
      console.log(`  Photo ID: ${photo.photo_id}`);
      console.log(`  File Name: ${photo.photo_name}`);
      console.log(`  Source ID (Entity ID): ${photo.source_id}`);
      console.log(`  Upload Date: ${photo.upload_date}`);
    });
    
  } catch (error) {
    console.error('Error testing entity photos:', error);
  } finally {
    await pool.end();
  }
}

testEntityPhotos();
