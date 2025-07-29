// services/entityServices.js
const { getEntityById, getReviewsByEntityId, insertEntity, getCategoryIdByName } = require('../queries/entityQueries');

const getEntityDetails = async (entityId) => {
  try {
    console.log('Fetching entity details for ID:', entityId);
    const entity = await getEntityById(entityId);
    if (entity.length === 0) {
      throw new Error('Entity not found');
    }
    return entity;
  } catch (error) {
    throw error;
  }
};

const getEntityReviews = async (entityId) => {
  try {
    console.log('Fetching reviews for entity ID:', entityId);
    const reviews = await getReviewsByEntityId(entityId);
    return reviews;
  } catch (error) {
    throw error;
  }
};


module.exports = {
  getEntityDetails,
  getEntityReviews
  ,
  // Service to create a new entity
  createEntity: async (entityData) => {
    try {
      // If category is provided as a name, convert it to category_id
      if (entityData.category && !entityData.category_id) {
        console.log('Converting category name to category_id:', entityData.category);
        const categoryId = await getCategoryIdByName(entityData.category);
        entityData.category_id = categoryId;
        delete entityData.category; // Remove the category name since we now have category_id
      }
      
      console.log('Creating entity with data:', entityData);
      const newEntity = await insertEntity(entityData);
      return newEntity;
    } catch (error) {
      console.error('Error in createEntity service:', error);
      throw error;
    }
  }
};