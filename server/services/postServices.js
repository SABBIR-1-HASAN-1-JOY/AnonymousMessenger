// services/postServices.js
const { 
  createPost, 
  getAllPosts, 
  getPostsByUserId, 
  updatePostVotes 
} = require('../queries/postQueries');

const createNewPost = async (postData) => {
  try {
    console.log('Creating new post:', postData);
    const post = await createPost(postData);
    return post;
  } catch (error) {
    throw error;
  }
};

const fetchAllPosts = async () => {
  try {
    console.log('Fetching all posts');
    const posts = await getAllPosts();
    return posts;
  } catch (error) {
    throw error;
  }
};

const fetchPostsByUserId = async (userId) => {
  try {
    console.log('Fetching posts for user ID:', userId);
    const posts = await getPostsByUserId(userId);
    return posts;
  } catch (error) {
    throw error;
  }
};

const voteOnPost = async (postId, voteType) => {
  try {
    console.log('Voting on post:', postId, 'Vote type:', voteType);
    const post = await updatePostVotes(postId, voteType);
    return post;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createNewPost,
  fetchAllPosts,
  fetchPostsByUserId,
  voteOnPost
};
