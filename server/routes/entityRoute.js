const express = require('express');
const router = express.Router();
const { validateEntityIdParam } = require('../validators/entityValidators');
const { getEntityWithReviews, createEntity, deleteEntity } = require('../controllers/entityControllers');
const pool = require('../config/db.js');

// Get entity details
router.get('/:entityId/details', validateEntityIdParam, getEntityWithReviews);
// Create a new entity
router.post('/create', createEntity);
// Delete an entity (admin only)
router.delete('/:entityId', validateEntityIdParam, deleteEntity);

router.get('/', async (req, res) => {
    try {
        const entities = await pool.query(`
            SELECT 
                re.*,
                c.category_name as category,
                COALESCE(COUNT(DISTINCT r.review_id), 0)::integer as reviewcount,
                COALESCE(ROUND(AVG(r.ratingpoint), 2), 0) as overallrating,
                latest_photo.photo_name as entity_photo_name,
                CASE 
                  WHEN latest_photo.photo_name IS NOT NULL THEN CONCAT('http://localhost:3000/api/photos/file/', latest_photo.photo_name)
                  ELSE re.picture
                END as picture
            FROM reviewable_entity re
            LEFT JOIN category c ON re.category_id = c.category_id
            LEFT JOIN review r ON re.item_id = r.item_id
            LEFT JOIN (
                SELECT DISTINCT ON (source_id) 
                  source_id, 
                  photo_name 
                FROM photos 
                WHERE type = 'entities' 
                ORDER BY source_id, upload_date DESC
            ) latest_photo ON latest_photo.source_id = re.item_id
            GROUP BY re.item_id, c.category_name, latest_photo.photo_name, re.picture
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
