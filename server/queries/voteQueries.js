const db = require('../config/db');

const voteQueries = {
  // Cast or update a vote
  castVote: async (userId, entityType, entityId, voteType) => {
    // Ensure vote_type is provided for upvote/downvote operations
    if (!voteType) {
      throw new Error('vote_type must be provided');
    }
    
    // First check if vote exists
    const existingVoteQuery = `
      SELECT * FROM vote 
      WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3;
    `;
    const existingResult = await db.query(existingVoteQuery, [userId, entityType, entityId]);
    
    if (existingResult.rows.length > 0) {
      // Update existing vote
      const updateQuery = `
        UPDATE vote 
        SET vote_type = $4, created_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3
        RETURNING *;
      `;
      const result = await db.query(updateQuery, [userId, entityType, entityId, voteType]);
      return result.rows[0];
    } else {
      // Insert new vote
      const insertQuery = `
        INSERT INTO vote (user_id, entity_type, entity_id, vote_type)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      const result = await db.query(insertQuery, [userId, entityType, entityId, voteType]);
      return result.rows[0];
    }
  },

  // Remove a vote
  removeVote: async (userId, entityType, entityId) => {
    const query = `
      DELETE FROM vote 
      WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3
      RETURNING *;
    `;
    const result = await db.query(query, [userId, entityType, entityId]);
    return result.rows[0];
  },

  // Get user's vote for specific entity
  getUserVote: async (userId, entityType, entityId) => {
    const query = `
      SELECT * FROM vote 
      WHERE user_id = $1 AND entity_type = $2 AND entity_id = $3;
    `;
    const result = await db.query(query, [userId, entityType, entityId]);
    return result.rows[0];
  },

  // Get vote counts for an entity
  getVoteCounts: async (entityType, entityId) => {
    const query = `
      SELECT 
        COUNT(CASE WHEN vote_type = 'up' THEN 1 END) as upvotes,
        COUNT(CASE WHEN vote_type = 'down' THEN 1 END) as downvotes,
        0 as average_rating,
        0 as rating_count
      FROM vote 
      WHERE entity_type = $1 AND entity_id = $2;
    `;
    const result = await db.query(query, [entityType, entityId]);
    return result.rows[0];
  },

  // Get votes for multiple entities
  getVoteCountsForEntities: async (entityType, entityIds) => {
    if (!entityIds || entityIds.length === 0) return [];
    
    const query = `
      SELECT 
        entity_id,
        COUNT(CASE WHEN vote_type = 'up' THEN 1 END) as upvotes,
        COUNT(CASE WHEN vote_type = 'down' THEN 1 END) as downvotes,
        0 as average_rating,
        0 as rating_count
      FROM vote 
      WHERE entity_type = $1 AND entity_id = ANY($2)
      GROUP BY entity_id;
    `;
    const result = await db.query(query, [entityType, entityIds]);
    return result.rows;
  },

  // Get user's votes for multiple entities
  getUserVotesForEntities: async (userId, entityType, entityIds) => {
    if (!entityIds || entityIds.length === 0) return [];
    
    const query = `
      SELECT entity_id, vote_type
      FROM vote 
      WHERE user_id = $1 AND entity_type = $2 AND entity_id = ANY($3);
    `;
    const result = await db.query(query, [userId, entityType, entityIds]);
    return result.rows;
  }
};

module.exports = voteQueries;
