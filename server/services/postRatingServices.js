// services/postRatingServices.js
const pool = require('../config/db');
const {
  upsertPostRating,
  getUserPostRating,
  getPostRatingStats,
  getRecentPostRatings,
  deletePostRating,
  getTopRatedPosts
} = require('../queries/postRatingQueries');

// Service to rate or update rating for a post
const ratePost = async (postId, userId, rating) => {
  try {
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Check if post exists and is rate-enabled
    const postQuery = `
      SELECT post_id, is_rate_enabled, user_id, post_text
      FROM post 
      WHERE post_id = $1
    `;
    const postResult = await pool.query(postQuery, [postId]);
    
    if (postResult.rows.length === 0) {
      throw new Error('Post not found');
    }
    
    const post = postResult.rows[0];
    
    if (!post.is_rate_enabled) {
      throw new Error('This post does not allow ratings');
    }
    
    // Don't allow users to rate their own posts
    if (post.user_id.toString() === userId.toString()) {
      throw new Error('You cannot rate your own post');
    }

    // Add or update the rating
    const ratingResult = await upsertPostRating(pool, postId, userId, rating);
    
    // Get updated stats (this will trigger the database trigger to update post table)
    const stats = await getPostRatingStats(pool, postId);
    
    // Get updated post data
    const updatedPostQuery = `
      SELECT post_id, average_rating, total_ratings, post_text, user_id
      FROM post 
      WHERE post_id = $1
    `;
    const updatedPostResult = await pool.query(updatedPostQuery, [postId]);
    const updatedPost = updatedPostResult.rows[0];
    
    return {
      success: true,
      rating: ratingResult,
      post: updatedPost,
      stats: stats,
      averageRating: stats.average_rating,
      totalRatings: stats.total_ratings
    };
  } catch (error) {
    console.error('Error in ratePost service:', error);
    throw error;
  }
};

// Service to get a user's rating for a post
const getUserRatingForPost = async (postId, userId) => {
  try {
    const rating = await getUserPostRating(pool, postId, userId);
    return rating;
  } catch (error) {
    console.error('Error in getUserRatingForPost service:', error);
    throw error;
  }
};

// Service to get comprehensive post rating information
const getPostRatingInfo = async (postId, userId = null) => {
  try {
    const stats = await getPostRatingStats(pool, postId);
    const recentRatings = await getRecentPostRatings(pool, postId, 5);
    
    let userRating = null;
    if (userId) {
      userRating = await getUserPostRating(pool, postId, userId);
    }
    
    return {
      stats: stats,
      recentRatings: recentRatings,
      userRating: userRating ? userRating.rating : null,
      userRatingDate: userRating ? userRating.updated_at : null
    };
  } catch (error) {
    console.error('Error in getPostRatingInfo service:', error);
    throw error;
  }
};

// Service to remove a user's rating
const removeUserRating = async (postId, userId) => {
  try {
    // Check if user has rated this post
    const existingRating = await getUserPostRating(pool, postId, userId);
    
    if (!existingRating) {
      throw new Error('You have not rated this post');
    }
    
    // Delete the rating
    const deletedRating = await deletePostRating(pool, postId, userId);
    
    // Get updated stats
    const stats = await getPostRatingStats(pool, postId);
    
    return {
      success: true,
      deletedRating: deletedRating,
      stats: stats,
      averageRating: stats.average_rating,
      totalRatings: stats.total_ratings
    };
  } catch (error) {
    console.error('Error in removeUserRating service:', error);
    throw error;
  }
};

// Service to get top rated posts
const getTopRatedPostsService = async (limit = 10, minRatings = 3) => {
  try {
    const posts = await getTopRatedPosts(pool, limit, minRatings);
    return posts;
  } catch (error) {
    console.error('Error in getTopRatedPostsService:', error);
    throw error;
  }
};

// Service to get posts with user's ratings included
const getPostsWithUserRatings = async (userId, postIds) => {
  try {
    if (!postIds || postIds.length === 0) {
      return [];
    }
    
    const placeholders = postIds.map((_, index) => `$${index + 2}`).join(',');
    const query = `
      SELECT 
        pr.post_id,
        pr.rating,
        pr.created_at as rating_date
      FROM post_ratings pr
      WHERE pr.user_id = $1 AND pr.post_id IN (${placeholders})
    `;
    
    const result = await pool.query(query, [userId, ...postIds]);
    
    // Convert to map for easy lookup
    const ratingsMap = {};
    result.rows.forEach(row => {
      ratingsMap[row.post_id] = {
        rating: parseFloat(row.rating),
        ratingDate: row.rating_date
      };
    });
    
    return ratingsMap;
  } catch (error) {
    console.error('Error in getPostsWithUserRatings service:', error);
    throw error;
  }
};

module.exports = {
  ratePost,
  getUserRatingForPost,
  getPostRatingInfo,
  removeUserRating,
  getTopRatedPostsService,
  getPostsWithUserRatings
};
