// Simple test script for exact matching search functionality
console.log('🔍 Testing Exact Match Search Functionality\n');

const baseUrl = 'http://localhost:3000';

async function testExactSearch() {
  try {
    // Test with exact entity name (you'll need to use actual entity names from your database)
    console.log('Testing /api/search/all?q=iPhone'); // Use exact entity name
    const response = await fetch(`${baseUrl}/api/search/all?q=iPhone`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Search endpoint working!');
      console.log('Entities found:', data.entities?.length || 0);
      console.log('Users found:', data.users?.length || 0);
      
      if (data.entities?.length > 0) {
        console.log('\nEntity match:');
        console.log('- ID:', data.entities[0].id);
        console.log('- Name:', data.entities[0].name);
        console.log('- Category:', data.entities[0].category);
      }
      
      if (data.users?.length > 0) {
        console.log('\nUser match:');
        console.log('- ID:', data.users[0].id);
        console.log('- Username:', data.users[0].username);
        console.log('- Display Name:', data.users[0].displayName);
      }
      
      if (data.entities?.length === 0 && data.users?.length === 0) {
        console.log('\n⚠️  No exact matches found. Try with exact entity names or usernames from your database.');
        console.log('Examples: "iPhone", "Samsung Galaxy", or exact usernames like "john_doe"');
      }
    } else {
      console.log('❌ Search failed with status:', response.status);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run in browser console or Node.js
if (typeof window !== 'undefined') {
  // Browser environment
  window.testExactSearch = testExactSearch;
  console.log('Run testExactSearch() in console to test');
} else {
  // Node.js environment
  const fetch = require('node-fetch');
  testExactSearch();
}
