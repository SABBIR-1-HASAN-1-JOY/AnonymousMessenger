// Test script for search and following functionality
const baseUrl = 'http://localhost:3000';

async function testSearchEndpoints() {
  console.log('🔍 Testing Search Endpoints...\n');

  try {
    // Test search all
    console.log('1. Testing /api/search/all?q=test');
    const searchAllResponse = await fetch(`${baseUrl}/api/search/all?q=test`);
    if (searchAllResponse.ok) {
      const searchData = await searchAllResponse.json();
      console.log('✅ Search all endpoint works');
      console.log('Response:', JSON.stringify(searchData, null, 2));
    } else {
      console.log('❌ Search all endpoint failed');
      console.log('Status:', searchAllResponse.status);
    }

    // Test search entities
    console.log('\n2. Testing /api/search/entities?q=test');
    const searchEntitiesResponse = await fetch(`${baseUrl}/api/search/entities?q=test`);
    if (searchEntitiesResponse.ok) {
      const entitiesData = await searchEntitiesResponse.json();
      console.log('✅ Search entities endpoint works');
      console.log('Response:', JSON.stringify(entitiesData, null, 2));
    } else {
      console.log('❌ Search entities endpoint failed');
      console.log('Status:', searchEntitiesResponse.status);
    }

    // Test search users
    console.log('\n3. Testing /api/search/users?q=test');
    const searchUsersResponse = await fetch(`${baseUrl}/api/search/users?q=test`);
    if (searchUsersResponse.ok) {
      const usersData = await searchUsersResponse.json();
      console.log('✅ Search users endpoint works');
      console.log('Response:', JSON.stringify(usersData, null, 2));
    } else {
      console.log('❌ Search users endpoint failed');
      console.log('Status:', searchUsersResponse.status);
    }

  } catch (error) {
    console.error('❌ Error testing search endpoints:', error);
  }
}

async function testFollowingEndpoints() {
  console.log('\n👥 Testing Following Endpoints...\n');

  try {
    // Test follow status (assuming users with ID 1 and 2 exist)
    console.log('1. Testing follow status /api/users/2/status?followerId=1');
    const statusResponse = await fetch(`${baseUrl}/api/users/2/status?followerId=1`);
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Follow status endpoint works');
      console.log('Response:', JSON.stringify(statusData, null, 2));
    } else {
      console.log('❌ Follow status endpoint failed');
      console.log('Status:', statusResponse.status);
    }

    // Test follow user
    console.log('\n2. Testing follow user /api/users/2/follow');
    const followResponse = await fetch(`${baseUrl}/api/users/2/follow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ followerId: 1 }),
    });
    
    if (followResponse.ok) {
      const followData = await followResponse.json();
      console.log('✅ Follow user endpoint works');
      console.log('Response:', JSON.stringify(followData, null, 2));
    } else {
      console.log('❌ Follow user endpoint failed');
      console.log('Status:', followResponse.status);
      const errorText = await followResponse.text();
      console.log('Error:', errorText);
    }

  } catch (error) {
    console.error('❌ Error testing following endpoints:', error);
  }
}

// Run tests if this is the main module
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  
  async function runTests() {
    console.log('🧪 Starting Backend API Tests\n');
    console.log('Make sure the server is running on http://localhost:3000\n');
    
    await testSearchEndpoints();
    await testFollowingEndpoints();
    
    console.log('\n🏁 Tests completed!');
  }
  
  runTests().catch(console.error);
} else {
  // Browser environment
  window.testSearchEndpoints = testSearchEndpoints;
  window.testFollowingEndpoints = testFollowingEndpoints;
}
