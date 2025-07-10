// controllers/entityControllers.js
const { getEntityDetails, getEntityReviews } = require('../services/entityServices');

const getEntityWithReviews = async (req, res) => {
  try {
    console.log('=== ENTITY DETAILS ENDPOINT HIT ===');
    console.log('Received request for entity details:');
    const { entityId } = req.params;
    console.log('Entity ID:', entityId, 'Type:', typeof entityId);
    
    // Get both entity details and reviews in parallel
    const [entityResults, reviews] = await Promise.all([
      getEntityDetails(entityId),
      getEntityReviews(entityId)
    ]);
    
    console.log('Entity query results:', entityResults);
    console.log('Reviews query results:', reviews);
    
    if (!entityResults || entityResults.length === 0) {
      console.log('No entity found with ID:', entityId);
      return res.status(404).json({ error: 'Entity not found' });
    }
    
    // Get the first entity from results
    const entity = entityResults[0];
    console.log('Entity found:', entity);
    
    // Create the response object that matches frontend expectations
    const responseData = {
      id: entity.item_id.toString(),
      item_id: entity.item_id,
      name: entity.item_name,
      item_name: entity.item_name,
      description: entity.description || '',
      category: entity.category_name || entity.category || 'Unknown',
      sector: entity.sector_name || entity.sector || '',
      picture: entity.picture || '',
      images: entity.images || [],
      overallRating: parseFloat(entity.average_rating) || 0,
      reviewCount: parseInt(entity.review_count) || reviews.length,
      followers: entity.followers || [],
      createdAt: entity.created_at || new Date().toISOString(),
      reviews: reviews.map(review => ({
        review_id: review.review_id,
        user_id: review.user_id,
        userName: review.username,
        username: review.username,
        rating: review.rating,
        ratingpoint: review.rating,
        title: review.title || 'Review',
        body: review.body,
        review_text: review.body,
        created_at: review.created_at,
        createdAt: review.created_at,
        upvotes: review.upvotes || 0,
        pictures: review.pictures || []
      }))
    };
    
    console.log('Sending response:', responseData);
    console.log('Number of reviews in response:', responseData.reviews.length);
    
    res.status(200).json(responseData);
  } catch (error) {
    if (error.message === 'Entity not found') {
      console.log('Entity not found error');
      return res.status(404).json({ error: error.message });
    }
    console.error('Error fetching entity data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


module.exports = {
  getEntityWithReviews
};