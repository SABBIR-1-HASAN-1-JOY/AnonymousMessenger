// queries/commentQueries.js
const pool = require('../config/db');

// Create a new comment
exports.createComment = async (commentData) => {
  const { userId, commentText, entityType, entityId, parentCommentId } = commentData;
  const insertQuery = `
    INSERT INTO comments (user_id, comment_text, entity_type, entity_id, parent_comment_id, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING comment_id
  `;
  const insertResult = await pool.query(insertQuery, [userId, commentText, entityType, entityId, parentCommentId]);
  
  // Get the created comment with user information
  const selectQuery = `
    SELECT 
      c.*,
      u.username,
      u.profile_picture
    FROM comments c
    LEFT JOIN "user" u ON c.user_id = u.user_id
    WHERE c.comment_id = $1
  `;
  const selectResult = await pool.query(selectQuery, [insertResult.rows[0].comment_id]);
  return selectResult.rows[0];
};

// Get comments for a specific entity (post, review, etc.)
exports.getCommentsByEntity = async (entityType, entityId) => {
  const query = `
    SELECT 
      c.*,
      u.username,
      u.profile_picture
    FROM comments c
    LEFT JOIN "user" u ON c.user_id = u.user_id
    WHERE c.entity_type = $1 AND c.entity_id = $2
    ORDER BY c.created_at ASC
  `;
  const result = await pool.query(query, [entityType, entityId]);
  return result.rows;
};

// Get replies to a specific comment
exports.getCommentReplies = async (parentCommentId) => {
  const query = `
    SELECT c.*, u.username, u.profile_picture
    FROM comments c
    JOIN "user" u ON c.user_id = u.user_id
    WHERE c.parent_comment_id = $1
    ORDER BY c.created_at ASC
  `;
  const result = await pool.query(query, [parentCommentId]);
  return result.rows;
};

// Get comment by ID
exports.getCommentById = async (commentId) => {
  const query = `
    SELECT c.*, u.username, u.profile_picture
    FROM comments c
    JOIN "user" u ON c.user_id = u.user_id
    WHERE c.comment_id = $1
  `;
  const result = await pool.query(query, [commentId]);
  return result.rows[0];
};

// Update comment
exports.updateComment = async (commentId, commentText) => {
  console.log('=== UPDATE COMMENT QUERY ===');
  console.log('Comment ID:', commentId, 'Type:', typeof commentId);
  console.log('Comment Text:', commentText);
  
  const query = `
    UPDATE comments
    SET comment_text = $1
    WHERE comment_id = $2
    RETURNING *
  `;
  console.log('Executing query:', query);
  console.log('With parameters:', [commentText, commentId]);
  
  const result = await pool.query(query, [commentText, commentId]);
  console.log('Query result:', result.rows);
  console.log('Returned comment:', result.rows[0]);
  
  return result.rows[0];
};

// Delete comment
exports.deleteComment = async (commentId) => {
  const query = `
    DELETE FROM comments
    WHERE comment_id = $1
    RETURNING *
  `;
  const result = await pool.query(query, [commentId]);
  return result.rows[0];
};

// Get comment count for an entity
exports.getCommentCount = async (entityType, entityId) => {
  const query = `
    SELECT COUNT(*) as count
    FROM comments
    WHERE entity_type = $1 AND entity_id = $2
  `;
  const result = await pool.query(query, [entityType, entityId]);
  return parseInt(result.rows[0].count);
};

// Get nested comments structure (top-level comments with their replies)
exports.getNestedComments = async (entityType, entityId) => {
  const query = `
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
        u.username,
        u.profile_picture,
        0 as level,
        ARRAY[c.comment_id] as path
      FROM comments c
      JOIN "user" u ON c.user_id = u.user_id
      WHERE c.entity_type = $1 AND c.entity_id = $2 AND c.parent_comment_id IS NULL
      
      UNION ALL
      
      -- Recursive case: replies to comments
      SELECT 
        c.comment_id,
        c.user_id,
        c.comment_text,
        c.entity_type,
        c.entity_id,
        c.parent_comment_id,
        c.created_at,
        u.username,
        u.profile_picture,
        ct.level + 1,
        ct.path || c.comment_id
      FROM comments c
      JOIN "user" u ON c.user_id = u.user_id
      JOIN comment_tree ct ON c.parent_comment_id = ct.comment_id
      WHERE ct.level < 5  -- Limit nesting depth
    )
    SELECT * FROM comment_tree
    ORDER BY path, created_at ASC
  `;
  const result = await pool.query(query, [entityType, entityId]);
  return result.rows;
};
