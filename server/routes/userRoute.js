//This file is not used in the current version of the app, but it is kept for future reference.

const express =require('express') ;
const pool =require('../config/db.js');
const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "USER"');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific user ID from username
router.get('/search/:username', async (req, res) => {
  const { username } = req.params;
  if (!username) {
    // console.error('Username is required');
    return res.status(400).json({ error: 'Username is required' });
  }
  try {
    // console.log(`Fetching user ID for username: ${username}`);
    const result = await pool.query('SELECT user_id FROM "USER" WHERE username = $1', [username]);

    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    console.error('Error fetching user ID:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;