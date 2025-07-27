// test-delete-endpoint.js - Test the delete endpoint directly
const axios = require('axios');

async function testDeleteEndpoint() {
    try {
        console.log('🧪 Testing delete endpoint...');
        
        // First, let's get a list of posts to find one to test with
        console.log('📝 Fetching posts to find a test post...');
        const postsResponse = await axios.get('http://localhost:3000/api/posts');
        
        if (postsResponse.data.posts && postsResponse.data.posts.length > 0) {
            const testPost = postsResponse.data.posts[0];
            console.log(`Found test post: ${testPost.post_id} by user ${testPost.user_id}`);
            console.log(`Content: "${testPost.post_text}"`);
            
            // Try to delete this post (using the post owner's user_id)
            console.log(`\n🗑️  Attempting to delete post ${testPost.post_id}...`);
            
            const deleteResponse = await axios.delete(`http://localhost:3000/api/posts/${testPost.post_id}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'user-id': testPost.user_id.toString()
                }
            });
            
            console.log('✅ Delete successful!');
            console.log('Response:', deleteResponse.data);
            
        } else {
            console.log('❌ No posts found to test with');
        }
        
    } catch (error) {
        console.error('❌ Error testing delete endpoint:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            console.error('Headers:', error.response.headers);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testDeleteEndpoint();
