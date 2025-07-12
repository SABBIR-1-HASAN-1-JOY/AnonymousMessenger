// services/searchServices.js
const { 
  searchEntities, 
  searchUsers, 
  searchAll 
} = require('../queries/searchQueries');

const performEntitySearch = async (query) => {
  try {
    const entities = await searchEntities(query);
    return entities;
  } catch (error) {
    throw error;
  }
};

const performUserSearch = async (query) => {
  try {
    const users = await searchUsers(query);
    return users;
  } catch (error) {
    throw error;
  }
};

const performCombinedSearch = async (query) => {
  try {
    const results = await searchAll(query);
    return results;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  performEntitySearch,
  performUserSearch,
  performCombinedSearch
};
