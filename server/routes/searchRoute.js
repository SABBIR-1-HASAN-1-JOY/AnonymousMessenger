// routes/searchRoute.js
const express = require('express');
const router = express.Router();
const { 
  searchEntities, 
  searchUsers, 
  searchAll 
} = require('../controllers/searchControllers');


// Search all (entities + users)
router.get('/all', searchAll);

// Search entities only
router.get('/entities', searchEntities);

// Search users only
router.get('/users', searchUsers);

// Default search endpoint status
router.get('/', (req, res) => {
  res.status(200).json({ message: 'Search API is running' });
});

module.exports = router;
