const express = require('express');
const router = express.Router();
const { validateEntityIdParam } = require('../validators/entityValidators');
const { getEntityWithReviews } = require('../controllers/entityControllers');
const pool = require('../config/db.js');

// Get entity details
router.get('/:entityId/details', validateEntityIdParam, getEntityWithReviews);

router.get('/', async (req, res) => {
    try {
        const entities = await pool.query('SELECT * FROM reviewable_entity');
        res.status(200).json(entities.rows);
    } catch (error) {
        console.error('Error fetching entities:', error);
        res.status(500).json({ message: 'Failed to fetch entities' });
    }
});

// Get reviews

module.exports = router;
