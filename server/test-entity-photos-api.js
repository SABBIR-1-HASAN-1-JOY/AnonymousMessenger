// Test script to verify entity photos integration
const fetch = require('node-fetch');

async function testEntityPhotos() {
  try {
    console.log('Testing entity photos endpoints...\n');
    
    // Test 1: Check if entities API includes photos
    console.log('1. Testing /api/entities endpoint...');
    const entitiesResponse = await fetch('http://localhost:3000/api/entities');
    if (entitiesResponse.ok) {
      const entities = await entitiesResponse.json();
      console.log(`Found ${entities.length} entities`);
      
      // Check first few entities for picture field
      entities.slice(0, 3).forEach((entity, index) => {
        console.log(`Entity ${index + 1}: ${entity.item_name}`);
        console.log(`  Picture: ${entity.picture || 'No picture'}`);
        console.log(`  Entity Photo Name: ${entity.entity_photo_name || 'No entity photo'}`);
      });
    } else {
      console.log('Failed to fetch entities');
    }
    
    console.log('\n2. Testing /api/photos/entities/{id} endpoint...');
    
    // Test entity photo endpoints for entities that should have photos
    const testEntityIds = [1, 2, 3, 8]; // Based on the photos table data
    
    for (const entityId of testEntityIds) {
      try {
        const photosResponse = await fetch(`http://localhost:3000/api/photos/entities/${entityId}`);
        if (photosResponse.ok) {
          const photos = await photosResponse.json();
          console.log(`Entity ${entityId}: Found ${photos.length} photos`);
          photos.forEach((photo, index) => {
            console.log(`  Photo ${index + 1}: ${photo.filename} -> ${photo.url}`);
          });
        } else {
          console.log(`Entity ${entityId}: No photos found`);
        }
      } catch (error) {
        console.log(`Entity ${entityId}: Error - ${error.message}`);
      }
    }
    
    console.log('\n3. Testing specific entity details endpoint...');
    
    // Test entity details endpoint
    const entityDetailResponse = await fetch('http://localhost:3000/api/entities/8/details');
    if (entityDetailResponse.ok) {
      const entityDetail = await entityDetailResponse.json();
      const actualEntity = entityDetail.entity ? entityDetail.entity[0] : entityDetail;
      console.log('Entity 8 details:');
      console.log(`  Name: ${actualEntity.item_name}`);
      console.log(`  Picture: ${actualEntity.picture || 'No picture'}`);
      console.log(`  Category: ${actualEntity.category_name || actualEntity.category}`);
    } else {
      console.log('Failed to fetch entity details');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Only run if called directly
if (require.main === module) {
  testEntityPhotos();
}

module.exports = { testEntityPhotos };
