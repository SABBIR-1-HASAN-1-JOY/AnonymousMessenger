const db = require('../config/db');

const setupDatabase = {
  // Check if vote table exists and has proper constraints
  checkVoteTable: async () => {
    try {
      // Check if vote table exists
      const tableExistsQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'vote'
        );
      `;
      const result = await db.query(tableExistsQuery);
      
      if (!result.rows[0].exists) {
        console.log('Vote table does not exist. Creating...');
        await setupDatabase.createVoteTable();
        return;
      }

      // Check if unique constraint exists
      const constraintQuery = `
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'vote' 
        AND constraint_type = 'UNIQUE'
        AND constraint_name = 'unique_user_entity_vote';
      `;
      const constraintResult = await db.query(constraintQuery);
      
      if (constraintResult.rows.length === 0) {
        console.log('Vote table exists but missing unique constraint. Adding...');
        await setupDatabase.addUniqueConstraint();
      } else {
        console.log('Vote table is properly configured.');
      }
    } catch (error) {
      console.error('Error checking vote table:', error);
      throw error;
    }
  },

  // Create vote table with proper structure
  createVoteTable: async () => {
    try {
      const createTableQuery = `
        CREATE TABLE vote (
          vote_id SERIAL PRIMARY KEY,
          user_id INT REFERENCES "USER"(user_id) ON DELETE CASCADE,
          entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('post', 'review')),
          entity_id INT NOT NULL,
          vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          -- Ensure one vote per user per entity
          CONSTRAINT unique_user_entity_vote UNIQUE (user_id, entity_type, entity_id)
        );
        
        -- Create indexes for better performance
        CREATE INDEX idx_vote_entity ON vote (entity_type, entity_id);
        CREATE INDEX idx_vote_user ON vote (user_id);
        CREATE INDEX idx_vote_created_at ON vote (created_at);
      `;
      
      await db.query(createTableQuery);
      console.log('Vote table created successfully with all constraints.');
    } catch (error) {
      console.error('Error creating vote table:', error);
      throw error;
    }
  },

  // Add unique constraint to existing table
  addUniqueConstraint: async () => {
    try {
      // First remove any duplicate votes (keeping the most recent)
      const removeDuplicatesQuery = `
        DELETE FROM vote v1 
        WHERE v1.vote_id NOT IN (
          SELECT MAX(v2.vote_id) 
          FROM vote v2 
          WHERE v2.user_id = v1.user_id 
            AND v2.entity_type = v1.entity_type 
            AND v2.entity_id = v1.entity_id
        );
      `;
      await db.query(removeDuplicatesQuery);

      // Add unique constraint
      const addConstraintQuery = `
        ALTER TABLE vote 
        ADD CONSTRAINT unique_user_entity_vote 
        UNIQUE (user_id, entity_type, entity_id);
      `;
      await db.query(addConstraintQuery);
      
      console.log('Unique constraint added to vote table.');
    } catch (error) {
      console.error('Error adding unique constraint:', error);
      throw error;
    }
  },

  // Initialize database setup
  init: async () => {
    try {
      console.log('Initializing vote system database setup...');
      await setupDatabase.checkVoteTable();
      console.log('Vote system database setup complete.');
    } catch (error) {
      console.error('Failed to initialize vote system database:', error);
    }
  }
};

module.exports = setupDatabase;
