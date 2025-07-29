// controllers/postControllers.js
const { 
  createNewPost, 
  fetchAllPosts, 
  fetchPostsByUserId, 
  voteOnPost 
} = require('../services/postServices');

const {
  getPostRatingInfo,
  getUserRatingForPost,
  removeUserRating,
  getTopRatedPostsService,
  getPostsWithUserRatings
} = require('../services/postRatingServices');

const createPost = async (req, res) => {
  try {
    console.log('=== CREATE POST ENDPOINT HIT ===');
    console.log('Request body:', req.body);
    
    const { userId, content, is_rate_enabled } = req.body;
    
    // Validate required fields
    if (!userId || !content) {
      return res.status(400).json({ error: 'User ID and content are required' });
    }
    
    const postData = {
      userId,
      content,
      is_rated_enabled: is_rate_enabled || false
    };
    
    const newPost = await createNewPost(postData);
    
    // Format response to match frontend expectations
    const responseData = {
      id: newPost.post_id.toString(),
      post_id: newPost.post_id,
      userId: newPost.user_id.toString(),
      user_id: newPost.user_id,
      userName: newPost.user_name || 'Unknown User',
      userProfilePicture: newPost.user_profile_picture ? `http://localhost:3000/api/photos/file/${newPost.user_profile_picture}` : null,
      type: newPost.is_rate_enabled ? 'rate-my-work' : 'simple',
      content: newPost.post_text,
      description: newPost.is_rate_enabled ? newPost.post_text : undefined,
      upvotes: 0,
      downvotes: 0,
      createdAt: newPost.created_at,
      created_at: newPost.created_at,
      ratings: [],
      comments: []
    };
    
    console.log('Post created successfully:', responseData);
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllPosts = async (req, res) => {
  try {
    console.log('=== GET ALL POSTS ENDPOINT HIT ===');
    
    const posts = await fetchAllPosts();
    
        // Format response to match frontend expectations
    const responseData = posts.map(post => ({
      id: post.post_id.toString(),
      post_id: post.post_id,
      userId: post.user_id.toString(),
      user_id: post.user_id,
      userName: post.user_name,
      userProfilePicture: post.user_profile_picture ? `http://localhost:3000/api/photos/file/${post.user_profile_picture}` : null,
      type: post.is_rate_enabled ? 'rate-my-work' : 'simple',
      content: post.post_text,
      upvotes: 0,
      downvotes: 0,
      createdAt: post.created_at,
      created_at: post.created_at,
      ratings: [] // Will be populated when rating system is implemented
    }));
    
    console.log(`Found ${responseData.length} posts`);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPostsByUser = async (req, res) => {
  try {
    console.log('=== GET POSTS BY USER ENDPOINT HIT ===');
    const { userId } = req.params;
    console.log('User ID:', userId);
    
    const posts = await fetchPostsByUserId(userId);
    
    // Format response to match frontend expectations
    const responseData = posts.map(post => {
      // Parse the post_text to extract title and description for rate-my-work posts
      let parsedContent = {};
      if (post.is_rate_enabled && post.post_text.includes('Title:')) {
        const lines = post.post_text.split('\n');
        const titleLine = lines.find(line => line.startsWith('Title:'));
        const descIndex = lines.findIndex(line => line.startsWith('Description:'));
        
        if (titleLine) {
          parsedContent.title = titleLine.replace('Title:', '').trim();
        }
        if (descIndex !== -1) {
          parsedContent.description = lines.slice(descIndex + 1).join('\n').trim();
        }
      }
      
      return {
        id: post.post_id.toString(),
        post_id: post.post_id,
        userId: post.user_id.toString(),
        user_id: post.user_id,
        userName: post.user_name,
        userProfilePicture: post.user_profile_picture ? `http://localhost:3000/api/photos/file/${post.user_profile_picture}` : null,
        type: post.is_rate_enabled ? 'rate-my-work' : 'simple',
        content: post.is_rate_enabled ? undefined : post.post_text,
        title: parsedContent.title,
        description: parsedContent.description,
        image: undefined, // Not supported in current schema
        upvotes: 0, // Not supported in current schema
        downvotes: 0, // Not supported in current schema
        createdAt: post.created_at,
        created_at: post.created_at,
        ratings: [], // Will be populated when rating system is implemented
        comments: [] // Will be populated when comment system is implemented
      };
    });
    
    console.log(`Found ${responseData.length} posts for user ${userId}`);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getPostById = async (req, res) => {
  try {
    const { postId } = req.params;
    console.log('Fetching post by ID:', postId);
    
    const pool = require('../config/db.js');
    const result = await pool.query(`
      SELECT 
        p.post_id,
        p.user_id,
        p.post_text,
        p.created_at,
        p.is_rate_enabled,
        p.ratingpoint,
        u.username as user_name,
        ph.photo_name as user_profile_picture
      FROM post p
      LEFT JOIN "user" u ON p.user_id = u.user_id
      LEFT JOIN photos ph ON ph.user_id = u.user_id AND ph.type = 'profile'
      WHERE p.post_id = $1
    `, [postId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const post = result.rows[0];
    
    // Parse the post_text to extract title and description for rate-my-work posts
    let parsedContent = {};
    if (post.is_rate_enabled && post.post_text.includes('Title:')) {
      const lines = post.post_text.split('\n');
      const titleLine = lines.find(line => line.startsWith('Title:'));
      const descIndex = lines.findIndex(line => line.startsWith('Description:'));
      
      if (titleLine) {
        parsedContent.title = titleLine.replace('Title:', '').trim();
      }
      if (descIndex !== -1) {
        parsedContent.description = lines.slice(descIndex + 1).join('\n').trim();
      }
    }
    
    const responseData = {
      id: post.post_id.toString(),
      post_id: post.post_id,
      userId: post.user_id.toString(),
      user_id: post.user_id,
      userName: post.user_name,
      userProfilePicture: post.user_profile_picture ? `http://localhost:3000/api/photos/file/${post.user_profile_picture}` : null,
      user_profile_picture: post.user_profile_picture ? `http://localhost:3000/api/photos/file/${post.user_profile_picture}` : null,
      type: post.is_rate_enabled ? 'rate-my-work' : 'simple',
      content: post.is_rate_enabled ? undefined : post.post_text,
      post_text: post.post_text,
      title: parsedContent.title,
      description: parsedContent.description,
      createdAt: post.created_at,
      created_at: post.created_at,
      isRatedEnabled: post.is_rate_enabled,
      ratingpoint: post.ratingpoint || 0,
      averageRating: post.ratingpoint || 0, // For now, same as ratingpoint since we only store one rating
      totalRatings: post.ratingpoint ? 1 : 0, // Simple approach - if there's a rating, count it as 1
      userRating: 0 // Would need user context to determine this
    };
    
    console.log('Returning post data:', responseData);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const votePost = async (req, res) => {
  try {
    console.log('=== VOTE POST ENDPOINT HIT ===');
    const { postId } = req.params;
    const { voteType } = req.body;
    console.log('Post ID:', postId, 'Vote type:', voteType);
    
    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({ error: 'Invalid vote type. Must be "up" or "down"' });
    }
    
    const updatedPost = await voteOnPost(postId, voteType);
    
    if (!updatedPost) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Format response (note: actual vote counts not persisted due to schema limitations)
    const responseData = {
      id: updatedPost.post_id.toString(),
      upvotes: 0, // Would need separate table to track votes
      downvotes: 0, // Would need separate table to track votes
      message: `Vote ${voteType} recorded for post ${postId} (not persisted due to schema limitations)`
    };
    
    console.log('Post voted successfully:', responseData);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error voting on post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const ratePost = async (req, res) => {
  try {
    console.log('=== RATE POST ENDPOINT HIT ===');
    const { postId } = req.params;
    const { userId, rating } = req.body;
    console.log('Post ID:', postId, 'User ID:', userId, 'Rating:', rating);
    
    // Validate input
    if (!userId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'User ID and rating (1-5) are required' });
    }

    // Use the new rating service
    const { ratePost: ratePostService } = require('../services/postRatingServices');
    
    const result = await ratePostService(postId, userId, rating);
    
    console.log('Rating submitted successfully:', result);
    res.status(200).json({
      success: true,
      message: 'Rating submitted successfully',
      post: result.post,
      rating: parseFloat(rating),
      averageRating: parseFloat(result.averageRating) || 0,
      totalRatings: parseInt(result.totalRatings) || 0,
      ratingBreakdown: {
        oneStar: parseInt(result.stats.one_star) || 0,
        twoStar: parseInt(result.stats.two_star) || 0,
        threeStar: parseInt(result.stats.three_star) || 0,
        fourStar: parseInt(result.stats.four_star) || 0,
        fiveStar: parseInt(result.stats.five_star) || 0
      }
    });
  } catch (error) {
    console.error('Error rating post:', error);
    
    // Handle specific error types
    if (error.message === 'Post not found') {
      return res.status(404).json({ error: error.message });
    } else if (error.message === 'You cannot rate your own post' || 
               error.message === 'This post does not allow ratings') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updatePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, title } = req.body;
    
    // Note: In a real application, you should verify the user owns this post
    // For now, we'll assume authorization is handled elsewhere
    
    const query = `
      UPDATE post 
      SET post_text = $1
      WHERE post_id = $2
      RETURNING *
    `;
    
    const pool = require('../config/db.js');
    
    const result = await pool.query(query, [content, postId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get detailed rating information for a post
const getPostRatingDetails = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.query; // Optional - to get user's specific rating
    
    const ratingInfo = await getPostRatingInfo(postId, userId);
    
    res.status(200).json({
      success: true,
      postId: parseInt(postId),
      averageRating: parseFloat(ratingInfo.stats.average_rating) || 0,
      totalRatings: parseInt(ratingInfo.stats.total_ratings) || 0,
      ratingBreakdown: {
        oneStar: parseInt(ratingInfo.stats.one_star) || 0,
        twoStar: parseInt(ratingInfo.stats.two_star) || 0,
        threeStar: parseInt(ratingInfo.stats.three_star) || 0,
        fourStar: parseInt(ratingInfo.stats.four_star) || 0,
        fiveStar: parseInt(ratingInfo.stats.five_star) || 0
      },
      userRating: ratingInfo.userRating,
      userRatingDate: ratingInfo.userRatingDate,
      recentRatings: ratingInfo.recentRatings
    });
  } catch (error) {
    console.error('Error getting post rating details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's rating for a specific post
const getUserPostRating = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const rating = await getUserRatingForPost(postId, userId);
    
    res.status(200).json({
      success: true,
      postId: parseInt(postId),
      userId: parseInt(userId),
      rating: rating ? parseFloat(rating.rating) : null,
      ratingDate: rating ? rating.updated_at : null
    });
  } catch (error) {
    console.error('Error getting user post rating:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove user's rating for a post
const removePostRating = async (req, res) => {
  try {
    const { postId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const result = await removeUserRating(postId, userId);
    
    res.status(200).json({
      success: true,
      message: 'Rating removed successfully',
      postId: parseInt(postId),
      averageRating: parseFloat(result.averageRating) || 0,
      totalRatings: parseInt(result.totalRatings) || 0
    });
  } catch (error) {
    console.error('Error removing post rating:', error);
    
    if (error.message === 'You have not rated this post') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get top rated posts
const getTopRatedPosts = async (req, res) => {
  try {
    const { limit = 10, minRatings = 3 } = req.query;
    
    const posts = await getTopRatedPostsService(parseInt(limit), parseInt(minRatings));
    
    // Format posts to match frontend expectations
    const formattedPosts = posts.map(post => ({
      id: post.post_id.toString(),
      post_id: post.post_id,
      userId: post.user_id.toString(),
      user_id: post.user_id,
      userName: post.username,
      userProfilePicture: post.user_profile_picture ? `http://localhost:3000/api/photos/file/${post.user_profile_picture}` : null,
      type: 'rate-my-work',
      content: post.post_text,
      description: post.post_text,
      averageRating: parseFloat(post.average_rating) || 0,
      totalRatings: parseInt(post.total_ratings) || 0,
      ratingpoint: parseFloat(post.average_rating) || 0,
      createdAt: post.created_at,
      isRatedEnabled: true,
      upvotes: 0,
      downvotes: 0,
      comments: []
    }));
    
    res.status(200).json({
      success: true,
      posts: formattedPosts,
      totalCount: formattedPosts.length
    });
  } catch (error) {
    console.error('Error getting top rated posts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deletePost = async (req, res) => {
  try {
    console.log('=== DELETE POST ENDPOINT HIT ===');
    const { postId } = req.params;
    const userId = req.headers['user-id'] || req.body.userId;
    
    console.log('Delete post request:', { 
      postId, 
      postIdType: typeof postId,
      userId, 
      userIdType: typeof userId,
      allHeaders: req.headers 
    });
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    
    if (!postId) {
      console.log('❌ Missing postId');
      return res.status(400).json({ error: 'Post ID is required' });
    }

    if (!userId) {
      console.log('❌ Missing userId');
      return res.status(400).json({ error: 'User ID is required' });
    }

    const pool = require('../config/db.js');
    console.log('🔌 Database pool acquired');
    
    // Check if post exists and user owns it
    console.log('📝 Checking if post exists...');
    const postCheck = await pool.query(
      'SELECT post_id, user_id, post_text, is_rate_enabled FROM post WHERE post_id = $1',
      [postId]
    );
    
    console.log('Post check result:', postCheck.rows);
    
    if (postCheck.rows.length === 0) {
      console.log('❌ Post not found');
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const post = postCheck.rows[0];
    console.log('Found post:', post);
    
    // Check if user owns the post (only post owner can delete their own posts)
    console.log('🔒 Checking ownership:', { 
      postUserId: post.user_id, 
      postUserIdType: typeof post.user_id,
      requestUserId: userId,
      requestUserIdType: typeof userId,
      postUserIdString: post.user_id.toString(),
      requestUserIdString: userId.toString(),
      areEqual: post.user_id.toString() === userId.toString()
    });
    
    if (post.user_id.toString() !== userId.toString()) {
      console.log('❌ User does not own this post');
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }
    
    // Delete the post - the triggers will handle cascading deletions
    console.log('🗑️  Attempting to delete post...');
    const deleteResult = await pool.query(
      'DELETE FROM post WHERE post_id = $1 RETURNING post_id, post_text, is_rate_enabled',
      [postId]
    );
    
    console.log('Delete result:', deleteResult.rows);
    
    if (deleteResult.rows.length === 0) {
      console.log('❌ Failed to delete post');
      return res.status(500).json({ error: 'Failed to delete post' });
    }
    
    const deletedPost = deleteResult.rows[0];
    console.log('✅ Post deleted successfully:', deletedPost);
    
    res.status(200).json({
      success: true,
      message: 'Post deleted successfully',
      deletedPost: {
        post_id: deletedPost.post_id,
        post_text: deletedPost.post_text,
        is_rate_enabled: deletedPost.is_rate_enabled
      }
    });
  } catch (error) {
    console.error('❌ Error deleting post:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostsByUser,
  getPostById,
  votePost,
  ratePost,
  updatePost,
  deletePost,
  getPostRatingDetails,
  getUserPostRating,
  removePostRating,
  getTopRatedPosts
};
