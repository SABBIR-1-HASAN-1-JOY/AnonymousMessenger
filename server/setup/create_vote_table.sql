-- Create vote table with proper constraints
-- Run this SQL to set up the vote table

-- Drop table if it exists to recreate with proper structure
DROP TABLE IF EXISTS vote;

-- Create vote table
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
