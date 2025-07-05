const express = require('express');
const router = express.Router();
const { validateEntityIdParam } = require('../validators/entityValidators');
const { getEntityWithReviews } = require('../controllers/entityControllers');

// Get entity details
router.get('/:entityId/details', validateEntityIdParam, getEntityWithReviews);

// Get reviews

module.exports = router;
