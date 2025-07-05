// controllers/entityControllers.js
const { getEntityDetails, getEntityReviews } = require('../services/entityServices');

const getEntityWithReviews = async (req, res) => {
  try {
    const { entityId } = req.params;
    
    // Get both entity details and reviews in parallel
    const [entity, reviews] = await Promise.all([
      getEntityDetails(entityId),
      getEntityReviews(entityId)
    ]);
    
    res.status(200).json({
      entity: entity,
      reviews: reviews
    });
  } catch (error) {
    if (error.message === 'Entity not found') {
      return res.status(404).json({ error: error.message });
    }
    console.error('Error fetching entity data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getEntityWithReviews
};