// services/userService.js
const userQueries = require('../queries/userProfileQueries.js');

exports.getUserProfileWithCounts = async (userId) => {
  const user = await userQueries.getUserById(userId);
  if (!user) return null;
  const followerCount = await userQueries.getFollowerCount(userId);
  const followingCount = await userQueries.getFollowingCount(userId);
  const reviewCount = await userQueries.getReviewCount(userId);
  const postCount = await userQueries.getPostCount(userId);
  // If you need to fetch all reviews and posts, you can do it here
  const reviews = await userQueries.getAllReviews(userId);
  const posts = await userQueries.getAllPosts(userId);

  return {
    ...user,
    followerCount,
    followingCount,
    reviewCount,
    postCount,
    reviews,
    posts
  };
};

exports.updateUserProfile = async (userId, userData) => {
  const updatedUser = await userQueries.updateUser(userId, userData);
  if (!updatedUser) return null;
  
  // Return the updated user with counts
  return exports.getUserProfileWithCounts(userId);
};
