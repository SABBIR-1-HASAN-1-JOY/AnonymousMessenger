const express = require('express');
const router = express.Router();
const { validateHierarchyQuery } = require('../validators/hierarchyValidators');
const { getHierarchy } = require('../controllers/hierarchyControllers');

// Get complete hierarchy
router.get('/', validateHierarchyQuery, getHierarchy);

module.exports = router;
