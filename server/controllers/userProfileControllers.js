// controllers/userController.js
const userService = require('../services/userProfileService.js');

exports.getUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const userData = await userService.getUserProfileWithCounts(userId);

    if (!userData) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(userData);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
