// quick-server-test.js - Quick test to see if server is responding
const axios = require('axios');

async function testServer() {
    try {
        console.log('🧪 Testing server endpoints...');
        
        // Test if server is running
        console.log('1. Testing server health...');
        const healthResponse = await axios.get('http://localhost:3000/');
        console.log('✅ Server is running:', healthResponse.status);
        
        // Test getting posts
        console.log('2. Testing posts endpoint...');
        const postsResponse = await axios.get('http://localhost:3000/api/posts');
        console.log('✅ Posts endpoint working:', postsResponse.status);
        console.log('📝 Found posts:', postsResponse.data.posts?.length || 0);
        
        if (postsResponse.data.posts && postsResponse.data.posts.length > 0) {
            const testPost = postsResponse.data.posts[0];
            console.log(`📋 Test post details:`, {
                post_id: testPost.post_id,
                user_id: testPost.user_id,
                post_text: testPost.post_text?.substring(0, 50) + '...'
            });
            
            // Test delete endpoint with proper headers
            console.log(`3. Testing DELETE endpoint for post ${testPost.post_id}...`);
            try {
                const deleteResponse = await axios.delete(`http://localhost:3000/api/posts/${testPost.post_id}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'user-id': testPost.user_id.toString()
                    }
                });
                console.log('✅ Delete successful:', deleteResponse.data);
            } catch (deleteError) {
                console.log('❌ Delete failed:');
                if (deleteError.response) {
                    console.log('Status:', deleteError.response.status);
                    console.log('Data:', deleteError.response.data);
                } else {
                    console.log('Error:', deleteError.message);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Server test failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        } else {
            console.error('Error:', error.message);
        }
    }
}

testServer();
