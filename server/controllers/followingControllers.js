// controllers/followingControllers.js
const { 
  createFollowing, 
  removeFollowing, 
  checkIsFollowing, 
  fetchFollowers, 
  fetchFollowing 
} = require('../services/followingServices');

const followUser = async (req, res) => {
  try {
    console.log('=== FOLLOW USER ENDPOINT HIT ===');
    const { userId } = req.params; // The user to follow (following_id)
    const { followerId } = req.body; // The user who is following (follower_id)
    
    console.log('Following request:', { followerId, followingId: userId });
    
    if (!followerId || !userId) {
      return res.status(400).json({ error: 'Follower ID and User ID are required' });
    }
    
    if (followerId === userId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    const result = await createFollowing(followerId, userId);
    
    console.log('User followed successfully:', result);
    res.status(201).json({ 
      message: 'Successfully followed user',
      following: result 
    });
  } catch (error) {
    console.error('Error following user:', error);
    if (error.message === 'Already following this user') {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

const unfollowUser = async (req, res) => {
  try {
    console.log('=== UNFOLLOW USER ENDPOINT HIT ===');
    const { userId } = req.params; // The user to unfollow (following_id)
    const { followerId } = req.body; // The user who is unfollowing (follower_id)
    
    console.log('Unfollowing request:', { followerId, followingId: userId });
    
    if (!followerId || !userId) {
      return res.status(400).json({ error: 'Follower ID and User ID are required' });
    }
    
    const result = await removeFollowing(followerId, userId);
    
    console.log('User unfollowed successfully:', result);
    res.status(200).json({ 
      message: 'Successfully unfollowed user',
      unfollowed: result 
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    if (error.message === 'Not following this user') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

const checkFollowStatus = async (req, res) => {
  try {
    console.log('=== CHECK FOLLOW STATUS ENDPOINT HIT ===');
    const { userId } = req.params; // The user being checked (following_id)
    const { followerId } = req.query; // The user who might be following (follower_id)
    
    console.log('Checking follow status:', { followerId, followingId: userId });
    
    if (!followerId || !userId) {
      return res.status(400).json({ error: 'Follower ID and User ID are required' });
    }
    
    const isFollowing = await checkIsFollowing(followerId, userId);
    
    console.log('Follow status:', isFollowing);
    res.status(200).json({ isFollowing });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUserFollowers = async (req, res) => {
  try {
    console.log('=== GET USER FOLLOWERS ENDPOINT HIT ===');
    const { userId } = req.params;
    
    console.log('Getting followers for user:', userId);
    
    const followers = await fetchFollowers(userId);
    
    const responseData = followers.map(follower => ({
      id: follower.user_id.toString(),
      user_id: follower.user_id,
      username: follower.username,
      displayName: follower.username,
      profilePicture: follower.profile_picture,
      bio: follower.bio,
      followedAt: follower.followed_at
    }));
    
    console.log(`Found ${responseData.length} followers`);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error getting followers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getUserFollowing = async (req, res) => {
  try {
    console.log('=== GET USER FOLLOWING ENDPOINT HIT ===');
    const { userId } = req.params;
    
    console.log('Getting following for user:', userId);
    
    const following = await fetchFollowing(userId);
    
    const responseData = following.map(user => ({
      id: user.user_id.toString(),
      user_id: user.user_id,
      username: user.username,
      displayName: user.username,
      profilePicture: user.profile_picture,
      bio: user.bio,
      followedAt: user.followed_at
    }));
    
    console.log(`Found ${responseData.length} following`);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error getting following:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  followUser,
  unfollowUser,
  checkFollowStatus,
  getUserFollowers,
  getUserFollowing
};
