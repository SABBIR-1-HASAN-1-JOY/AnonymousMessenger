// services/entityServices.js
const { getEntityById, getReviewsByEntityId, insertEntity } = require('../queries/entityQueries');

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
      const newEntity = await insertEntity(entityData);
      return newEntity;
    } catch (error) {
      throw error;
    }
  }
};