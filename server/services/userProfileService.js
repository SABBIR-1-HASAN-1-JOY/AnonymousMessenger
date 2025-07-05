// services/userService.js
const userQueries = require('../queries/userProfileQueries.js');

exports.getUserProfileWithCounts = async (userId) => {
  const user = await userQueries.getUserById(userId);
  if (!user) return null;
  const followerCount = await userQueries.getFollowerCount(userId);
  const followingCount = await userQueries.getFollowingCount(userId);

  return {
    ...user,
    followerCount,
    followingCount
  };
};
