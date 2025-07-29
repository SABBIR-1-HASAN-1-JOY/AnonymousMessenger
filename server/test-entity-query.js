// Test entity query to debug photo issues
const pool = require('./config/db.js');

async function testEntityQuery() {
  try {
    console.log('Testing entity query with photos...');
    
    // First, check what entities have photos
    const photosResult = await pool.query(`
      SELECT source_id, photo_name, upload_date 
      FROM photos 
      WHERE type = 'entities' 
      ORDER BY source_id
    `);
    
    console.log('\n=== Entity Photos in Database ===');
    photosResult.rows.forEach(photo => {
      console.log(`Entity ${photo.source_id}: ${photo.photo_name} (${photo.upload_date})`);
    });
    
    // Test the entity query for a specific entity that has photos
    const entityId = 8; // From the photos table, entity 8 has a photo
    console.log(`\n=== Testing Entity Query for Entity ${entityId} ===`);
    
    const result = await pool.query(`
      SELECT 
        re.*,
        c.category_name,
        s.sector_name,
        COALESCE(ROUND(AVG(r.ratingpoint), 2), 0) as average_rating,
        COALESCE(COUNT(r.review_id), 0) as review_count,
        ph.photo_name as entity_photo_name,
        CASE 
          WHEN ph.photo_name IS NOT NULL THEN CONCAT('http://localhost:3000/api/photos/file/', ph.photo_name)
          ELSE re.picture
        END as picture
      FROM reviewable_entity re
      LEFT JOIN category c ON re.category_id = c.category_id
      LEFT JOIN sector s ON c.sector_id = s.sector_id
      LEFT JOIN review r ON re.item_id = r.item_id
      LEFT JOIN photos ph ON ph.source_id = re.item_id AND ph.type = 'entities'
      WHERE re.item_id = $1
      GROUP BY re.item_id, c.category_name, s.sector_name, ph.photo_name, re.picture
    `, [entityId]);
    
    console.log('\nQuery Result:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    // Also test the entity list query
    console.log('\n=== Testing Entity List Query ===');
    const listResult = await pool.query(`
      SELECT 
          re.*,
          c.category_name as category,
          COALESCE(COUNT(r.review_id), 0)::integer as reviewcount,
          COALESCE(ROUND(AVG(r.ratingpoint), 2), 0) as overallrating,
          ph.photo_name as entity_photo_name,
          CASE 
            WHEN ph.photo_name IS NOT NULL THEN CONCAT('http://localhost:3000/api/photos/file/', ph.photo_name)
            ELSE re.picture
          END as picture
      FROM reviewable_entity re
      LEFT JOIN category c ON re.category_id = c.category_id
      LEFT JOIN review r ON re.item_id = r.item_id
      LEFT JOIN photos ph ON ph.source_id = re.item_id AND ph.type = 'entities'
      GROUP BY re.item_id, c.category_name, ph.photo_name, re.picture
      ORDER BY re.item_id
      LIMIT 5
    `);
    
    console.log('\nEntity List Results:');
    listResult.rows.forEach(entity => {
      console.log(`Entity ${entity.item_id}: ${entity.item_name}`);
      console.log(`  Photo Name: ${entity.entity_photo_name || 'No photo'}`);
      console.log(`  Picture URL: ${entity.picture}`);
      console.log(`  Category: ${entity.category}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error testing entity query:', error);
  } finally {
    await pool.end();
  }
}

testEntityQuery();
