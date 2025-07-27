// server-diagnostic.js - Diagnose server issues
const express = require('express');
const cors = require('cors');

console.log('🔍 Starting server diagnostic...');

// Test if basic modules load
try {
    console.log('✅ Express loaded');
    console.log('✅ CORS loaded');
} catch (error) {
    console.error('❌ Module loading failed:', error);
    process.exit(1);
}

// Test database connection
try {
    console.log('🔌 Testing database connection...');
    const pool = require('./config/db.js');
    
    // Simple query test
    pool.query('SELECT NOW() as current_time', (err, result) => {
        if (err) {
            console.error('❌ Database connection failed:', err.message);
        } else {
            console.log('✅ Database connected successfully');
            console.log('📅 Current time:', result.rows[0].current_time);
            
            // Test if we can query posts table
            pool.query('SELECT COUNT(*) as post_count FROM post', (err2, result2) => {
                if (err2) {
                    console.error('❌ Posts table query failed:', err2.message);
                } else {
                    console.log('✅ Posts table accessible');
                    console.log('📊 Total posts:', result2.rows[0].post_count);
                }
                
                // Test the specific deletePost controller
                console.log('\n🧪 Testing deletePost function...');
                testDeleteController();
            });
        }
    });
    
} catch (error) {
    console.error('❌ Database connection error:', error.message);
}

function testDeleteController() {
    try {
        // Load the controller
        const { deletePost } = require('./controllers/postControllers.js');
        console.log('✅ deletePost controller loaded successfully');
        
        // Create mock request/response objects
        const mockReq = {
            params: { postId: '11' },
            headers: { 'user-id': '1' },
            body: {}
        };
        
        const mockRes = {
            status: (code) => {
                console.log(`📤 Response status: ${code}`);
                return {
                    json: (data) => {
                        console.log('📤 Response data:', data);
                        if (code === 200) {
                            console.log('✅ Delete controller test passed');
                        } else {
                            console.log('❌ Delete controller returned error');
                        }
                    }
                };
            }
        };
        
        // Test the controller
        console.log('🎯 Calling deletePost controller...');
        deletePost(mockReq, mockRes);
        
    } catch (error) {
        console.error('❌ deletePost controller test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Keep the script running for a moment
setTimeout(() => {
    console.log('\n✅ Diagnostic complete');
    process.exit(0);
}, 5000);
