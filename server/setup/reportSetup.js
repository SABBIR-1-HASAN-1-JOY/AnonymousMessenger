// setup/reportSetup.js
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

const setupReportSystem = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up Report System...');
    
    // Read and execute the SQL file
    const sqlFile = path.join(__dirname, 'create_reports_table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    await client.query(sql);
    
    console.log('✅ Report system setup completed successfully!');
    console.log('📊 Reports table created');
    console.log('📋 Report reasons table created with default reasons');
    
    return {
      success: true,
      message: 'Report system setup completed successfully'
    };
    
  } catch (error) {
    console.error('❌ Error setting up report system:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    client.release();
  }
};

const addSampleReports = async () => {
  const client = await pool.connect();
  
  try {
    console.log('📊 Adding sample reports...');
    
    // Check if users exist first
    const usersResult = await client.query('SELECT user_id FROM users LIMIT 5');
    const users = usersResult.rows;
    
    if (users.length < 2) {
      return {
        success: false,
        error: 'Need at least 2 users to create sample reports'
      };
    }
    
    // Check if posts exist
    const postsResult = await client.query('SELECT post_id, user_id FROM posts LIMIT 3');
    const posts = postsResult.rows;
    
    if (posts.length > 0) {
      // Add sample reports for posts
      await client.query(`
        INSERT INTO reports (reporter_user_id, reported_item_type, reported_item_id, reported_user_id, reason, description)
        VALUES 
          ($1, 'post', $2, $3, 'Spam', 'This post appears to be promotional spam'),
          ($4, 'post', $2, $3, 'Inappropriate Content', 'Content violates community guidelines')
        ON CONFLICT (reporter_user_id, reported_item_type, reported_item_id) DO NOTHING
      `, [users[0].user_id, posts[0].post_id, posts[0].user_id, users[1].user_id]);
    }
    
    // Check if comments exist
    const commentsResult = await client.query('SELECT comment_id, user_id FROM comments LIMIT 2');
    const comments = commentsResult.rows;
    
    if (comments.length > 0) {
      // Add sample reports for comments
      await client.query(`
        INSERT INTO reports (reporter_user_id, reported_item_type, reported_item_id, reported_user_id, reason, description)
        VALUES 
          ($1, 'comment', $2, $3, 'Harassment', 'This comment contains personal attacks')
        ON CONFLICT (reporter_user_id, reported_item_type, reported_item_id) DO NOTHING
      `, [users[0].user_id, comments[0].comment_id, comments[0].user_id]);
    }
    
    // Check if reviews exist
    const reviewsResult = await client.query('SELECT review_id, user_id FROM reviews LIMIT 2');
    const reviews = reviewsResult.rows;
    
    if (reviews.length > 0) {
      // Add sample reports for reviews
      await client.query(`
        INSERT INTO reports (reporter_user_id, reported_item_type, reported_item_id, reported_user_id, reason, description)
        VALUES 
          ($1, 'review', $2, $3, 'False Information', 'This review contains misleading information')
        ON CONFLICT (reporter_user_id, reported_item_type, reported_item_id) DO NOTHING
      `, [users[1].user_id, reviews[0].review_id, reviews[0].user_id]);
    }
    
    console.log('✅ Sample reports added successfully!');
    
    return {
      success: true,
      message: 'Sample reports added successfully'
    };
    
  } catch (error) {
    console.error('❌ Error adding sample reports:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    client.release();
  }
};

module.exports = {
  setupReportSystem,
  addSampleReports
};
