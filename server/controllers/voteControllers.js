const voteServices = require('../services/voteServices');

const voteControllers = {
  // Cast vote (upvote/downvote)
  castVote: async (req, res) => {
    try {
      const { entityType, entityId, voteType } = req.body;
      const userId = req.user.id;

      if (!entityType || !entityId || !voteType) {
        return res.status(400).json({
          error: 'Missing required fields: entityType, entityId, voteType'
        });
      }

      const result = await voteServices.castVote(userId, entityType, entityId, voteType);
      
      // Get updated vote counts
      const voteCounts = await voteServices.getVoteCounts(entityType, entityId);

      res.status(200).json({
        message: `Vote ${result.action} successfully`,
        vote: result.vote,
        voteCounts
      });
    } catch (error) {
      console.error('Error casting vote:', error);
      res.status(500).json({
        error: 'Failed to cast vote',
        details: error.message
      });
    }
  },

  // Note: ratePost function removed since vote table has no rating column
  // Posts will only support upvote/downvote functionality

  // Get vote counts for an entity
  getVoteCounts: async (req, res) => {
    try {
      const { entityType, entityId } = req.params;

      const voteCounts = await voteServices.getVoteCounts(entityType, entityId);

      res.status(200).json(voteCounts);
    } catch (error) {
      console.error('Error getting vote counts:', error);
      res.status(500).json({
        error: 'Failed to get vote counts',
        details: error.message
      });
    }
  },

  // Get user's vote for an entity
  getUserVote: async (req, res) => {
    try {
      const { entityType, entityId } = req.params;
      const userId = req.user.id;

      const userVote = await voteServices.getUserVote(userId, entityType, entityId);

      res.status(200).json(userVote || null);
    } catch (error) {
      console.error('Error getting user vote:', error);
      res.status(500).json({
        error: 'Failed to get user vote',
        details: error.message
      });
    }
  }
};

module.exports = voteControllers;
