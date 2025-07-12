// services/followingServices.js
const { 
  followUser, 
  unfollowUser, 
  isFollowing, 
  getFollowers, 
  getFollowing 
} = require('../queries/followingQueries');

const createFollowing = async (followerId, followedId) => {
  try {
    const result = await followUser(followerId, followedId);
    return result;
  } catch (error) {
    throw error;
  }
};

const removeFollowing = async (followerId, followedId) => {
  try {
    const result = await unfollowUser(followerId, followedId);
    return result;
  } catch (error) {
    throw error;
  }
};

const checkIsFollowing = async (followerId, followedId) => {
  try {
    const result = await isFollowing(followerId, followedId);
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
