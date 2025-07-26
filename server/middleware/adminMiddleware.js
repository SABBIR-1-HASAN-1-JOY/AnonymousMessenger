const pool = require('../config/db');

// Middleware to verify if user is admin
const verifyAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.userId; // Assuming you have user authentication middleware
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is admin
    const result = await pool.query(
      'SELECT "isAdmin" FROM "user" WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!result.rows[0].isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.adminUser = { userId, isAdmin: true };
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(500).json({ error: 'Server error during admin verification' });
  }
};

// Simple admin check without middleware pattern
const checkAdminPermission = async (userId) => {
  try {
    const result = await pool.query(
      'SELECT isAdmin FROM "user" WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    return result.rows[0].isadmin === true;
  } catch (error) {
    console.error('Admin permission check error:', error);
    return false;
  }
};

module.exports = {
  verifyAdmin,
  checkAdminPermission
};
