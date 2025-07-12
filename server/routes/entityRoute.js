const express = require('express');
const router = express.Router();
const { validateEntityIdParam } = require('../validators/entityValidators');
const { getEntityWithReviews, createEntity } = require('../controllers/entityControllers');
const pool = require('../config/db.js');

// Get entity details
router.get('/:entityId/details', validateEntityIdParam, getEntityWithReviews);
// Create a new entity
router.post('/create', createEntity);

router.get('/', async (req, res) => {
    try {
        const entities = await pool.query(`
            SELECT 
                re.*,
                c.category_name as category,
                COALESCE(COUNT(r.review_id), 0)::integer as reviewcount,
                COALESCE(ROUND(AVG(r.ratingpoint), 2), 0) as overallrating
            FROM reviewable_entity re
            LEFT JOIN category c ON re.category_id = c.category_id
            LEFT JOIN review r ON re.item_id = r.item_id
            GROUP BY re.item_id, c.category_name
            ORDER BY re.item_id
        `);
        
        res.status(200).json(entities.rows);
    } catch (error) {
        console.error('Error fetching entities:', error);
        res.status(500).json({ message: 'Failed to fetch entities' });
    }
});

// Get reviews

module.exports = router;
