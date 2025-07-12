// controllers/searchControllers.js
const { 
  performEntitySearch, 
  performUserSearch, 
  performCombinedSearch 
} = require('../services/searchServices');

const searchEntities = async (req, res) => {
  try {
    console.log('=== SEARCH ENTITIES ENDPOINT HIT ===');
    const { q: query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    console.log('Search query:', query);
    
    const entities = await performEntitySearch(query);
    
    // Format response to match frontend expectations
    const responseData = entities.map(entity => ({
      id: entity.item_id.toString(),
      name: entity.item_name,
      description: entity.description,
      category: entity.category_name,
      picture: entity.picture
    }));
    
    console.log(`Found ${responseData.length} entities`);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error searching entities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const searchUsers = async (req, res) => {
  try {
    console.log('=== SEARCH USERS ENDPOINT HIT ===');
    const { q: query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    console.log('Search query:', query);
    
    const users = await performUserSearch(query);
    
    // Format response to match frontend expectations
    const responseData = users.map(user => ({
      id: user.user_id.toString(),
      username: user.username,
      displayName: user.username // Use username as display name
    }));
    
    console.log(`Found ${responseData.length} users`);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const searchAll = async (req, res) => {
    console.log('=== SEARCH ALL ENDPOINT HIT ===');
  try {
    console.log('=== SEARCH ALL ENDPOINT HIT ===2');
    const { q: query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    console.log('Search query:', query);
    
    const results = await performCombinedSearch(query);
    
    // Format entities
    const entities = results.entities.map(entity => ({
      id: entity.item_id.toString(),
      name: entity.item_name,
      description: entity.description,
      category: entity.category_name,
      picture: entity.picture,
      type: 'entity'
    }));
    
    // Format users
    const users = results.users.map(user => ({
      id: user.user_id.toString(),
      username: user.username,
      displayName: user.username,
      type: 'user'
    }));
    
    const responseData = {
      entities,
      users,
      total: entities.length + users.length
    };
    
    console.log(`Found ${entities.length} entities and ${users.length} users`);
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error searching all:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  searchEntities,
  searchUsers,
  searchAll
};
