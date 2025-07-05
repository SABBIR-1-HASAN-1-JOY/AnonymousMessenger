const express =require('express') ;
const pool =require('../config/db.js');
const router = express.Router();

router.get('/', async (req, res) => {
  const sectors = await pool.query(`SELECT * FROM "sector"`);
  res.json(sectors.rows);
  console.log("sector");
});


module.exports = router;
