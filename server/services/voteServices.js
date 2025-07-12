const voteQueries = require('../queries/voteQueries');

const voteServices = {
  // Cast a vote (upvote/downvote for posts and reviews)
  castVote: async (userId, entityType, entityId, voteType) => {
    try {
      if (!['up', 'down'].includes(voteType)) {
        throw new Error('Invalid vote type. Must be "up" or "down"');
      }

      if (!['post', 'review'].includes(entityType)) {
        throw new Error('Invalid entity type. Must be "post" or "review"');
      }

      // Check if user already voted
      const existingVote = await voteQueries.getUserVote(userId, entityType, entityId);
      
      if (existingVote && existingVote.vote_type === voteType) {
        // If same vote type, remove the vote (toggle off)
        await voteQueries.removeVote(userId, entityType, entityId);
        return { action: 'removed', vote: null };
      } else {
        // Cast or update the vote
        const vote = await voteQueries.castVote(userId, entityType, entityId, voteType);
        return { action: existingVote ? 'updated' : 'added', vote };
      }
    } catch (error) {
      throw error;
    }
  },

  // Note: Rating functionality removed since vote table has no rating column
  // Posts will only support upvote/downvote like reviews

  // Get vote counts for an entity
  getVoteCounts: async (entityType, entityId) => {
    try {
      const counts = await voteQueries.getVoteCounts(entityType, entityId);
      return {
        upvotes: parseInt(counts.upvotes) || 0,
        downvotes: parseInt(counts.downvotes) || 0,
        averageRating: parseFloat(counts.average_rating) || 0,
        ratingCount: parseInt(counts.rating_count) || 0
      };
    } catch (error) {
      throw error;
    }
  },

  // Get user's vote for an entity
  getUserVote: async (userId, entityType, entityId) => {
    try {
      return await voteQueries.getUserVote(userId, entityType, entityId);
    } catch (error) {
      throw error;
    }
  },

  // Get enriched entities with vote data
  enrichEntitiesWithVotes: async (entities, entityType, userId = null) => {
    try {
      if (!entities || entities.length === 0) return [];

      const entityIds = entities.map(entity => entity.id || entity.item_id);
      
      // Get vote counts for all entities
      const voteCounts = await voteQueries.getVoteCountsForEntities(entityType, entityIds);
      const voteCountsMap = voteCounts.reduce((acc, count) => {
        acc[count.entity_id] = count;
        return acc;
      }, {});

      // Get user's votes if userId provided
      let userVotesMap = {};
      if (userId) {
        const userVotes = await voteQueries.getUserVotesForEntities(userId, entityType, entityIds);
        userVotesMap = userVotes.reduce((acc, vote) => {
          acc[vote.entity_id] = vote;
          return acc;
        }, {});
      }

      // Enrich entities with vote data
      return entities.map(entity => {
        const entityId = entity.id || entity.item_id;
        const counts = voteCountsMap[entityId] || { upvotes: 0, downvotes: 0, average_rating: 0, rating_count: 0 };
        const userVote = userVotesMap[entityId] || null;

        return {
          ...entity,
          upvotes: parseInt(counts.upvotes) || 0,
          downvotes: parseInt(counts.downvotes) || 0,
          averageRating: parseFloat(counts.average_rating) || 0,
          ratingCount: parseInt(counts.rating_count) || 0,
          userVote: userVote ? {
            voteType: userVote.vote_type,
            rating: userVote.rating
          } : null
        };
      });
    } catch (error) {
      throw error;
    }
  }
};

module.exports = voteServices;
