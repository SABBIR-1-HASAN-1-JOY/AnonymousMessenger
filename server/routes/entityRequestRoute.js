// routes/entityRequestRoute.js
const express = require('express');
const router = express.Router();
const {
  createEntityRequest,
  getAllEntityRequests,
  getEntityRequestsByUser,
  getEntityRequestById,
  approveEntityRequest,
  rejectEntityRequest,
  deleteEntityRequest,
  getEntityRequestStats
} = require('../controllers/entityRequestControllers');

// Create a new entity request
router.post('/', createEntityRequest);

// Get all entity requests (admin only)
router.get('/', getAllEntityRequests);

// Get entity request statistics (admin only)
router.get('/stats', getEntityRequestStats);

// Get entity requests by user
router.get('/user/:userId', getEntityRequestsByUser);

// Get a specific entity request by ID
router.get('/:requestId', getEntityRequestById);

// Approve entity request (admin only)
router.put('/:requestId/approve', approveEntityRequest);

// Reject entity request (admin only)
router.put('/:requestId/reject', rejectEntityRequest);

// Delete entity request (admin only)
router.delete('/:requestId', deleteEntityRequest);

module.exports = router;
