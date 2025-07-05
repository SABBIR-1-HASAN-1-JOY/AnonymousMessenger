// services/entityServices.js
const { getEntityById, getReviewsByEntityId } = require('../queries/entityQueries');

const getEntityDetails = async (entityId) => {
  try {
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
    const reviews = await getReviewsByEntityId(entityId);
    return reviews;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getEntityDetails,
  getEntityReviews
};