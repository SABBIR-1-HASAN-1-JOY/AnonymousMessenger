// setup/entityRequestSetup.js
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

const setupEntityRequestSystem = async () => {
  try {
    console.log('Setting up entity request system...');

    // Read and execute the SQL setup file
    const sqlPath = path.join(__dirname, 'create_entity_requests_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    console.log('Entity requests table created successfully');

    // Add sample entity requests for testing
    await addSampleEntityRequests();
    
    // Verify the setup
    await verifyEntityRequestSystem();
    
    console.log('Entity request system setup complete');
  } catch (error) {
    console.error('Error setting up entity request system:', error);
    throw error;
  }
};

const addSampleEntityRequests = async () => {
  try {
    // Check if sample data already exists
    const existingRequests = await pool.query('SELECT COUNT(*) FROM entity_requests');
    if (parseInt(existingRequests.rows[0].count) > 0) {
      console.log('Sample entity requests already exist');
      return;
    }

    const sampleRequests = [
      {
        userId: 1,
        itemName: 'Avatar: The Last Airbender',
        description: 'Animated series about a young airbender who must master all four elements to save the world',
        category: 'TV Show',
        sector: 'Animation'
      },
      {
        userId: 2,
        itemName: 'The Matrix Resurrections',
        description: 'Fourth installment in The Matrix franchise',
        category: 'Movie',
        sector: 'Science Fiction'
      },
      {
        userId: 3,
        itemName: 'Tesla Model Y',
        description: 'Electric compact luxury crossover SUV',
        category: 'Vehicle',
        sector: 'Electric Vehicles'
      }
    ];

    for (const request of sampleRequests) {
      await pool.query(
        `INSERT INTO entity_requests (user_id, item_name, description, category, sector, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')`,
        [request.userId, request.itemName, request.description, request.category, request.sector]
      );
    }

    console.log('Sample entity requests added successfully');
  } catch (error) {
    console.error('Error adding sample entity requests:', error);
  }
};

const verifyEntityRequestSystem = async () => {
  try {
    // Check if table exists and has correct structure
    const tableCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'entity_requests'
      ORDER BY ordinal_position
    `);

    console.log('Entity requests table structure:');
    tableCheck.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type}`);
    });

    // Check sample data
    const requestCount = await pool.query('SELECT COUNT(*) FROM entity_requests');
    console.log(`Total entity requests: ${requestCount.rows[0].count}`);

    const pendingCount = await pool.query('SELECT COUNT(*) FROM entity_requests WHERE status = $1', ['pending']);
    console.log(`Pending requests: ${pendingCount.rows[0].count}`);

  } catch (error) {
    console.error('Error verifying entity request system:', error);
  }
};

module.exports = {
  setupEntityRequestSystem,
  addSampleEntityRequests,
  verifyEntityRequestSystem
};
