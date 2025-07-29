// controllers/entityControllers.js
const { getEntityDetails, getEntityReviews, createEntity: createEntityService } = require('../services/entityServices');

// Controller to create a new entity
const createEntity = async (req, res) => {
  try {
    console.log('=== CREATE ENTITY ENDPOINT HIT ===');
    console.log('Request body:', req.body);
    const { name, description, category, picture, ownerId } = req.body;
    
    if (!name || !description || !category || !ownerId) {
      console.log('Missing required fields:', { name: !!name, description: !!description, category: !!category, ownerId: !!ownerId });
      return res.status(400).json({ error: 'name, description, category, and ownerId are required' });
    }
    
    // Check if the owner (user) exists
    console.log('Checking if user exists:', ownerId);
    const userResult = await require('../config/db.js').query(
      'SELECT user_id FROM "user" WHERE user_id = $1',
      [ownerId]
    );
    console.log('User lookup result:', userResult.rows);
    
    if (userResult.rows.length === 0) {
      console.log('User not found:', ownerId);
      return res.status(400).json({ error: `User with ID ${ownerId} does not exist` });
    }
    
    // Lookup category_id from category name
    console.log('Looking up category:', category);
    const catResult = await require('../config/db.js').query(
      'SELECT category_id FROM category WHERE LOWER(category_name) = LOWER($1)',
      [category]
    );
    console.log('Category lookup result:', catResult.rows);
    
    if (catResult.rows.length === 0) {
      // If category doesn't exist, create it or use a default
      console.log('Category not found, using default category_id = 1');
      const category_id = 1; // Use default category or create one
      
      const newEntity = await createEntityService({
        category_id,
        item_name: name,
        owner_id: ownerId,
        description,
        picture
      });
      
      console.log('Entity created successfully:', newEntity);
      return res.status(201).json(newEntity);
    }
    
    const category_id = catResult.rows[0].category_id;
    console.log('Found category_id:', category_id);
    
    // Create entity via service
    const newEntity = await createEntityService({
      category_id,
      item_name: name,
      owner_id: ownerId,
      description,
      picture
    });
    
    console.log('Entity created successfully:', newEntity);
    res.status(201).json(newEntity);
  } catch (error) {
    console.error('Error creating entity:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

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
      overallrating: parseFloat(entity.average_rating) || 0, // Lowercase for consistency
      reviewCount: parseInt(entity.review_count) || reviews.length,
      reviewcount: parseInt(entity.review_count) || reviews.length, // Lowercase for consistency
      followers: entity.followers || [],
      createdAt: entity.created_at || new Date().toISOString(),
      reviews: reviews.map(review => ({
        review_id: review.review_id,
        user_id: review.user_id,
        userName: review.username,
        username: review.username,
        userProfilePicture: review.user_profile_picture ? `http://localhost:3000/api/photos/file/${review.user_profile_picture}` : null,
        user_profile_picture: review.user_profile_picture ? `http://localhost:3000/api/photos/file/${review.user_profile_picture}` : null,
        rating: review.rating || review.ratingpoint,
        ratingpoint: review.ratingpoint,
        title: review.title || 'Review',
        body: review.body || review.review_text || review.content || review.description || review.comment,
        review_text: review.review_text || review.body || review.content || review.description || review.comment,
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


// Controller to delete an entity (admin only)
const deleteEntity = async (req, res) => {
  try {
    const { entityId } = req.params;
    const userId = req.headers['user-id'];
    const isAdminMode = req.headers['x-admin-mode'] === 'true';

    console.log('=== DELETE ENTITY ENDPOINT HIT ===');
    console.log('Entity ID:', entityId);
    console.log('User ID:', userId);
    console.log('Admin Mode:', isAdminMode);

    if (!userId) {
      return res.status(401).json({ error: 'User ID is required' });
    }

    if (!isAdminMode) {
      return res.status(403).json({ error: 'Admin access required to delete entities' });
    }

    // Check if entity exists
    const entityCheck = await require('../config/db.js').query(
      'SELECT item_id FROM reviewable_entity WHERE item_id = $1',
      [entityId]
    );

    if (entityCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    // Delete the entity (this should cascade delete related data if properly set up)
    await require('../config/db.js').query(
      'DELETE FROM reviewable_entity WHERE item_id = $1',
      [entityId]
    );

    console.log('Entity deleted successfully:', entityId);
    res.status(200).json({ message: 'Entity deleted successfully' });
  } catch (error) {
    console.error('Error deleting entity:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getEntityWithReviews,
  createEntity,
  deleteEntity
};