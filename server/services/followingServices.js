// services/followingServices.js
const { 
  followUser, 
  unfollowUser, 
  isFollowing, 
  getFollowers, 
  getFollowing 
} = require('../queries/followingQueries');

const createFollowing = async (followerId, followingId) => {
  try {
    const result = await followUser(followerId, followingId);
    return result;
  } catch (error) {
    throw error;
  }
};

const removeFollowing = async (followerId, followingId) => {
  try {
    const result = await unfollowUser(followerId, followingId);
    return result;
  } catch (error) {
    throw error;
  }
};

const checkIsFollowing = async (followerId, followingId) => {
  try {
    const result = await isFollowing(followerId, followingId);
    return result;
  } catch (error) {
    throw error;
  }
};

const fetchFollowers = async (userId) => {
  try {
    const followers = await getFollowers(userId);
    return followers;
  } catch (error) {
    throw error;
  }
};

const fetchFollowing = async (userId) => {
  try {
    const following = await getFollowing(userId);
    return following;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createFollowing,
  removeFollowing,
  checkIsFollowing,
  fetchFollowers,
  fetchFollowing
};
