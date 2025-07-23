// controllers/postControllers.js
const { 
  createNewPost, 
  fetchAllPosts, 
  fetchPostsByUserId, 
  voteOnPost 
} = require('../services/postServices');

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
    const responseData = posts.map(post => {
      return {
        id: post.post_id.toString(),
        post_id: post.post_id,
        userId: post.user_id.toString(),
        user_id: post.user_id,
        userName: post.user_name,
        type: post.is_rate_enabled ? 'rate-my-work' : 'simple',
        content: post.post_text,
        description: post.is_rate_enabled ? post.post_text : undefined,
        upvotes: 0,
        downvotes: 0,
        createdAt: post.created_at,
        created_at: post.created_at,
        ratings: [],
        comments: [],
        // Rating information for rate-my-work posts
        isRatedEnabled: post.is_rate_enabled,
        averageRating: post.ratingpoint || 0,
        totalRatings: post.ratingpoint ? 1 : 0, // Simple approach - just indicates if rated
        userRating: 0 // Would need separate table to track individual user ratings
      };
    });
    
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
    
    // Check if post exists and is rate-enabled
    const pool = require('../config/db.js');
    const postCheck = await pool.query(
      'SELECT post_id, is_rate_enabled, user_id FROM post WHERE post_id = $1',
      [postId]
    );
    
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    if (!postCheck.rows[0].is_rate_enabled) {
      return res.status(400).json({ error: 'This post does not allow ratings' });
    }
    
    // Don't allow users to rate their own posts
    if (postCheck.rows[0].user_id.toString() === userId.toString()) {
      return res.status(400).json({ error: 'You cannot rate your own post' });
    }
    
    // Update the post's rating point (simple approach - stores latest rating)
    // In a more complex system, you might want a separate ratings table to store all ratings
    const updateResult = await pool.query(
      'UPDATE post SET ratingpoint = $1 WHERE post_id = $2 RETURNING *',
      [rating, postId]
    );
    
    const updatedPost = updateResult.rows[0];
    
    console.log('Rating submitted successfully');
    res.status(200).json({
      success: true,
      message: 'Rating submitted successfully',
      post: updatedPost,
      rating: rating
    });
  } catch (error) {
    console.error('Error rating post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostsByUser,
  votePost,
  ratePost
};
