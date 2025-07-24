// setup/commentSetup.js
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

const setupCommentSystem = async () => {
  console.log('=== SETTING UP COMMENT SYSTEM ===');
  
  try {
    // Read the SQL setup file
    const sqlFilePath = path.join(__dirname, 'create_comments_table.sql');
    const sqlScript = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Executing comment system setup SQL...');
    
    // Execute the SQL script
    await pool.query(sqlScript);
    
    console.log('✅ Comment system setup completed successfully');
    
    // Verify the table was created
    const tableCheck = await pool.query(`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'comments'
      ORDER BY ordinal_position;
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ Comments table structure:');
      tableCheck.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } else {
      console.log('❌ Comments table was not created');
    }
    
    // Check indexes
    const indexCheck = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'comments';
    `);
    
    if (indexCheck.rows.length > 0) {
      console.log('✅ Comment table indexes:');
      indexCheck.rows.forEach(row => {
        console.log(`  - ${row.indexname}`);
      });
    }
    
    return {
      success: true,
      message: 'Comment system setup completed successfully'
    };
    
  } catch (error) {
    console.error('❌ Error setting up comment system:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to add sample comments for testing
const addSampleComments = async () => {
  console.log('=== ADDING SAMPLE COMMENTS ===');
  
  try {
    // Check if users exist first
    const userCheck = await pool.query('SELECT user_id FROM "user" LIMIT 3');
    if (userCheck.rows.length === 0) {
      console.log('⚠️  No users found. Please create users first before adding sample comments.');
      return {
        success: false,
        error: 'No users found in database'
      };
    }
    
    // Check if posts exist
    // const postCheck = await pool.query('SELECT COUNT(*) as count FROM posts');
    // const postCount = parseInt(postCheck.rows[0].count);
    
    // if (postCount === 0) {
    //   console.log('⚠️  No posts found. Creating sample comments without entity references.');
    // }
    
    const sampleComments = [
      {
        user_id: userCheck.rows[0].user_id,
        comment_text: 'This is a great post! Really informative.',
        entity_type: 'post',
        entity_id: 1,
        parent_comment_id: null
      },
      {
        user_id: userCheck.rows.length > 1 ? userCheck.rows[1].user_id : userCheck.rows[0].user_id,
        comment_text: 'I totally agree with your perspective!',
        entity_type: 'post',
        entity_id: 1,
        parent_comment_id: null
      },
      {
        user_id: userCheck.rows.length > 2 ? userCheck.rows[2].user_id : userCheck.rows[0].user_id,
        comment_text: 'Thanks for sharing this. Very helpful!',
        entity_type: 'review',
        entity_id: 1,
        parent_comment_id: null
      }
    ];
    
    for (const comment of sampleComments) {
      await pool.query(`
        INSERT INTO comments (user_id, comment_text, entity_type, entity_id, parent_comment_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [comment.user_id, comment.comment_text, comment.entity_type, comment.entity_id, comment.parent_comment_id]);
    }
    
    // Add a nested reply
    const firstComment = await pool.query('SELECT comment_id FROM comments LIMIT 1');
    if (firstComment.rows.length > 0) {
      await pool.query(`
        INSERT INTO comments (user_id, comment_text, entity_type, entity_id, parent_comment_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        userCheck.rows[0].user_id,
        'Great point! I hadn\'t thought of it that way.',
        'comment',
        firstComment.rows[0].comment_id,
        firstComment.rows[0].comment_id
      ]);
    }
    
    console.log('✅ Sample comments added successfully');
    
    return {
      success: true,
      message: 'Sample comments added successfully'
    };
    
  } catch (error) {
    console.error('❌ Error adding sample comments:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to verify comment system functionality
const verifyCommentSystem = async () => {
  console.log('=== VERIFYING COMMENT SYSTEM ===');
  
  try {
    // Test basic comment query
    const commentsTest = await pool.query(`
      SELECT c.*, u.username
      FROM comments c
      LEFT JOIN "user" u ON c.user_id = u.user_id
      LIMIT 5
    `);
    
    console.log(`✅ Found ${commentsTest.rows.length} comments in database`);
    
    // Test nested comment query
    const nestedTest = await pool.query(`
      WITH RECURSIVE comment_tree AS (
        -- Base case: top-level comments
        SELECT 
          c.comment_id,
          c.user_id,
          c.comment_text,
          c.entity_type,
          c.entity_id,
          c.parent_comment_id,
          c.created_at,
          c.updated_at,
          u.username,
          0 as depth,
          ARRAY[c.comment_id] as path
        FROM comments c
        LEFT JOIN "user" u ON c.user_id = u.user_id
        WHERE c.parent_comment_id IS NULL
          AND c.entity_type = 'post'
          AND c.entity_id = 1
        
        UNION ALL
        
        -- Recursive case: child comments
        SELECT 
          c.comment_id,
          c.user_id,
          c.comment_text,
          c.entity_type,
          c.entity_id,
          c.parent_comment_id,
          c.created_at,
          c.updated_at,
          u.username,
          ct.depth + 1,
          ct.path || c.comment_id
        FROM comments c
        LEFT JOIN "user" u ON c.user_id = u.user_id
        JOIN comment_tree ct ON c.parent_comment_id = ct.comment_id
        WHERE ct.depth < 10  -- Prevent infinite recursion
      )
      SELECT * FROM comment_tree
      ORDER BY path
      LIMIT 10
    `);
    
    console.log(`✅ Nested comment query returned ${nestedTest.rows.length} results`);
    
    if (nestedTest.rows.length > 0) {
      console.log('Sample nested comment structure:');
      nestedTest.rows.forEach(row => {
        const indent = '  '.repeat(row.depth);
        console.log(`${indent}- Comment ${row.comment_id}: ${row.comment_text.substring(0, 50)}...`);
      });
    }
    
    return {
      success: true,
      message: 'Comment system verification completed successfully'
    };
    
  } catch (error) {
    console.error('❌ Error verifying comment system:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  setupCommentSystem,
  addSampleComments,
  verifyCommentSystem
};
