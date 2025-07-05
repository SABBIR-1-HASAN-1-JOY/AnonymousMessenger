const express =require('express') ;
const pool =require('../config/db.js'); // renamed from 'sql' to 'pool' to match your actual export

const router = express.Router();

// This is now responding to /api/categories/:categoryId
router.get('/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;

    const entities = await pool.query(
      `SELECT * FROM reviewable_entity WHERE category_id = $1`,
      [categoryId]
    );

    res.json(entities.rows);
  } catch (err) {
    console.error("Error fetching entities:", err.message);
    res.status(500).json({ error: err.message });
  }
});




module.exports = router;
