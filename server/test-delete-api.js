// test-delete-api.js
// Script to test the delete post API endpoint

const fetch = require('node-fetch');

async function testDeleteAPI() {
  try {
    console.log('🧪 Testing Delete Post API...\n');
    
    // Step 1: Get existing posts
    console.log('📋 Step 1: Fetching existing posts...');
    const postsResponse = await fetch('http://localhost:3000/api/posts');
    const posts = await postsResponse.json();
    
    console.log(`Found ${posts.length} posts`);
    if (posts.length === 0) {
      console.log('❌ No posts found to test deletion');
      return;
    }
    
    // Find a post to test (preferably one we can delete)
    const testPost = posts[0];
    console.log(`Selected post for testing: ID ${testPost.post_id} - "${testPost.post_text?.substring(0, 50)}..."`);
    
    // Step 2: Try to delete the post
    console.log('\n📋 Step 2: Attempting to delete post...');
    const deleteResponse = await fetch(`http://localhost:3000/api/posts/${testPost.post_id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'user-id': testPost.user_id.toString()
      }
    });
    
    const deleteResult = await deleteResponse.json();
    
    if (deleteResponse.ok) {
      console.log('✅ Post deleted successfully:', deleteResult);
    } else {
      console.log('❌ Delete failed:', deleteResult);
    }
    
    // Step 3: Verify the post is gone
    console.log('\n📋 Step 3: Verifying deletion...');
    const verifyResponse = await fetch(`http://localhost:3000/api/posts/${testPost.post_id}`);
    
    if (verifyResponse.status === 404) {
      console.log('✅ Post successfully removed from database');
    } else {
      console.log('⚠️ Post might still exist in database');
    }
    
    console.log('\n🎉 Delete API test completed!');
    
  } catch (error) {
    console.error('❌ Error testing delete API:', error);
  }
}

testDeleteAPI();
