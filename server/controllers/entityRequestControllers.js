// controllers/entityRequestControllers.js
const entityRequestServices = require('../services/entityRequestServices');

// Create a new entity request
const createEntityRequest = async (req, res) => {
  try {
    console.log('=== CREATE ENTITY REQUEST CONTROLLER ===');
    console.log('Request body:', req.body);
    
    const { userId, itemName, description, category, sector, picture } = req.body;

    // Validate required fields
    if (!userId || !itemName || !description || !category) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'User ID, item name, description, and category are required'
      });
    }

    const requestData = {
      userId: parseInt(userId),
      itemName: itemName.trim(),
      description: description.trim(),
      category: category.trim(),
      sector: sector ? sector.trim() : null,
      picture: picture || null
    };

    console.log('Creating entity request with data:', requestData);

    const result = await entityRequestServices.createEntityRequest(requestData);
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to create entity request'
      });
    }

    console.log('Entity request created successfully:', result.request);

    res.status(201).json({
      success: true,
      message: 'Entity request submitted successfully. It will be reviewed by an admin.',
      request: result.request
    });

  } catch (error) {
    console.error('Error in createEntityRequest controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create entity request'
    });
  }
};

// Get all entity requests (admin only)
const getAllEntityRequests = async (req, res) => {
  try {
    console.log('=== GET ALL ENTITY REQUESTS CONTROLLER ===');
    
    const { status } = req.query;
    console.log('Filter by status:', status);

    const result = await entityRequestServices.getAllEntityRequests(status);
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to fetch entity requests'
      });
    }

    console.log(`Found ${result.requests.length} entity requests`);

    res.status(200).json({
      success: true,
      requests: result.requests,
      count: result.requests.length
    });

  } catch (error) {
    console.error('Error in getAllEntityRequests controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch entity requests'
    });
  }
};

// Get entity requests by user
const getEntityRequestsByUser = async (req, res) => {
  try {
    console.log('=== GET ENTITY REQUESTS BY USER CONTROLLER ===');
    
    const { userId } = req.params;
    console.log('User ID:', userId);

    const result = await entityRequestServices.getEntityRequestsByUser(parseInt(userId));
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to fetch user entity requests'
      });
    }

    console.log(`Found ${result.requests.length} requests for user ${userId}`);

    res.status(200).json({
      success: true,
      requests: result.requests,
      count: result.requests.length
    });

  } catch (error) {
    console.error('Error in getEntityRequestsByUser controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch user entity requests'
    });
  }
};

// Get a specific entity request by ID
const getEntityRequestById = async (req, res) => {
  try {
    console.log('=== GET ENTITY REQUEST BY ID CONTROLLER ===');
    
    const { requestId } = req.params;
    console.log('Request ID:', requestId);

    const result = await entityRequestServices.getEntityRequestById(parseInt(requestId));
    
    if (!result.success) {
      return res.status(404).json({
        error: result.error || 'Entity request not found'
      });
    }

    console.log('Entity request found:', result.request);

    res.status(200).json({
      success: true,
      request: result.request
    });

  } catch (error) {
    console.error('Error in getEntityRequestById controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch entity request'
    });
  }
};

// Approve entity request (admin only)
const approveEntityRequest = async (req, res) => {
  try {
    console.log('=== APPROVE ENTITY REQUEST CONTROLLER ===');
    
    const { requestId } = req.params;
    const { adminId, adminNotes } = req.body;
    
    console.log('Approving request:', requestId, 'by admin:', adminId);

    if (!adminId) {
      return res.status(400).json({
        error: 'Admin ID is required'
      });
    }

    const result = await entityRequestServices.approveEntityRequest(
      parseInt(requestId), 
      parseInt(adminId), 
      adminNotes
    );
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to approve entity request'
      });
    }

    console.log('Entity request approved and entity created');

    res.status(200).json({
      success: true,
      message: 'Entity request approved and entity created successfully',
      request: result.request,
      entity: result.entity
    });

  } catch (error) {
    console.error('Error in approveEntityRequest controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to approve entity request'
    });
  }
};

// Reject entity request (admin only)
const rejectEntityRequest = async (req, res) => {
  try {
    console.log('=== REJECT ENTITY REQUEST CONTROLLER ===');
    
    const { requestId } = req.params;
    const { adminId, adminNotes } = req.body;
    
    console.log('Rejecting request:', requestId, 'by admin:', adminId);

    if (!adminId) {
      return res.status(400).json({
        error: 'Admin ID is required'
      });
    }

    const result = await entityRequestServices.rejectEntityRequest(
      parseInt(requestId), 
      parseInt(adminId), 
      adminNotes
    );
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to reject entity request'
      });
    }

    console.log('Entity request rejected');

    res.status(200).json({
      success: true,
      message: 'Entity request rejected',
      request: result.request
    });

  } catch (error) {
    console.error('Error in rejectEntityRequest controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to reject entity request'
    });
  }
};

// Delete entity request (admin only)
const deleteEntityRequest = async (req, res) => {
  try {
    console.log('=== DELETE ENTITY REQUEST CONTROLLER ===');
    
    const { requestId } = req.params;
    console.log('Deleting request:', requestId);

    const result = await entityRequestServices.deleteEntityRequest(parseInt(requestId));
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to delete entity request'
      });
    }

    console.log('Entity request deleted');

    res.status(200).json({
      success: true,
      message: 'Entity request deleted successfully',
      request: result.request
    });

  } catch (error) {
    console.error('Error in deleteEntityRequest controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete entity request'
    });
  }
};

// Get entity request statistics (admin only)
const getEntityRequestStats = async (req, res) => {
  try {
    console.log('=== GET ENTITY REQUEST STATS CONTROLLER ===');

    const result = await entityRequestServices.getEntityRequestStats();
    
    if (!result.success) {
      return res.status(400).json({
        error: result.error || 'Failed to fetch entity request statistics'
      });
    }

    console.log('Entity request stats:', result.stats);

    res.status(200).json({
      success: true,
      stats: result.stats
    });

  } catch (error) {
    console.error('Error in getEntityRequestStats controller:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch entity request statistics'
    });
  }
};

module.exports = {
  createEntityRequest,
  getAllEntityRequests,
  getEntityRequestsByUser,
  getEntityRequestById,
  approveEntityRequest,
  rejectEntityRequest,
  deleteEntityRequest,
  getEntityRequestStats
};
