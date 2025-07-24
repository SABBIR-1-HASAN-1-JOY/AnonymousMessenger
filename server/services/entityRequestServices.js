// services/entityRequestServices.js
const {
  createEntityRequest,
  getAllEntityRequests,
  getEntityRequestsByUser,
  getEntityRequestById,
  updateEntityRequestStatus,
  deleteEntityRequest,
  getEntityRequestStats
} = require('../queries/entityRequestQueries');

const { createEntity } = require('./entityServices');

// Service to create a new entity request
const createNewEntityRequest = async (requestData) => {
  try {
    console.log('Creating new entity request:', requestData);
    const request = await createEntityRequest(requestData);
    return {
      success: true,
      request: request
    };
  } catch (error) {
    console.error('Error in createNewEntityRequest service:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Service to fetch all entity requests (admin)
const fetchAllEntityRequests = async (status = null) => {
  try {
    console.log('Fetching entity requests with status:', status);
    const requests = await getAllEntityRequests(status);
    return {
      success: true,
      requests: requests
    };
  } catch (error) {
    console.error('Error in fetchAllEntityRequests service:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Service to fetch entity requests by user
const fetchEntityRequestsByUser = async (userId) => {
  try {
    console.log('Fetching entity requests for user:', userId);
    const requests = await getEntityRequestsByUser(userId);
    return {
      success: true,
      requests: requests
    };
  } catch (error) {
    console.error('Error in fetchEntityRequestsByUser service:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Service to get a specific entity request
const fetchEntityRequestById = async (requestId) => {
  try {
    console.log('Fetching entity request by ID:', requestId);
    const request = await getEntityRequestById(requestId);
    if (!request) {
      return {
        success: false,
        error: 'Entity request not found'
      };
    }
    return {
      success: true,
      request: request
    };
  } catch (error) {
    console.error('Error in fetchEntityRequestById service:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Service to approve entity request and create entity
const approveEntityRequest = async (requestId, adminId, adminNotes = null) => {
  try {
    console.log('Approving entity request:', requestId);
    
    // Get the request details
    const request = await getEntityRequestById(requestId);
    if (!request) {
      return {
        success: false,
        error: 'Entity request not found'
      };
    }

    // Create the entity in the main entities table
    const entityData = {
      item_name: request.item_name,
      description: request.description,
      category: request.category,
      sector: request.sector,
      picture: request.picture
    };

    const newEntity = await createEntity(entityData);
    
    // Update request status to approved
    const updatedRequest = await updateEntityRequestStatus(requestId, 'approved', adminId, adminNotes);
    
    return {
      success: true,
      request: updatedRequest,
      entity: newEntity
    };
  } catch (error) {
    console.error('Error in approveEntityRequest service:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Service to reject entity request
const rejectEntityRequest = async (requestId, adminId, adminNotes = null) => {
  try {
    console.log('Rejecting entity request:', requestId);
    const updatedRequest = await updateEntityRequestStatus(requestId, 'rejected', adminId, adminNotes);
    return {
      success: true,
      request: updatedRequest
    };
  } catch (error) {
    console.error('Error in rejectEntityRequest service:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Service to delete entity request
const removeEntityRequest = async (requestId) => {
  try {
    console.log('Deleting entity request:', requestId);
    const deletedRequest = await deleteEntityRequest(requestId);
    return {
      success: true,
      request: deletedRequest
    };
  } catch (error) {
    console.error('Error in removeEntityRequest service:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Service to get entity request statistics
const fetchEntityRequestStats = async () => {
  try {
    console.log('Fetching entity request statistics');
    const stats = await getEntityRequestStats();
    return {
      success: true,
      stats: stats
    };
  } catch (error) {
    console.error('Error in fetchEntityRequestStats service:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  createEntityRequest: createNewEntityRequest,
  getAllEntityRequests: fetchAllEntityRequests,
  getEntityRequestsByUser: fetchEntityRequestsByUser,
  getEntityRequestById: fetchEntityRequestById,
  approveEntityRequest,
  rejectEntityRequest,
  deleteEntityRequest: removeEntityRequest,
  getEntityRequestStats: fetchEntityRequestStats
};
