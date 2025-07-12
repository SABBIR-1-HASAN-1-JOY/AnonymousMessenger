-- Migration to add unique constraint to vote table
-- This ensures one vote per user per entity

-- First, remove any duplicate votes (keeping the most recent)
DELETE FROM vote v1 
WHERE v1.vote_id NOT IN (
  SELECT MAX(v2.vote_id) 
  FROM vote v2 
  WHERE v2.user_id = v1.user_id 
    AND v2.entity_type = v1.entity_type 
    AND v2.entity_id = v1.entity_id
);

-- Add unique constraint
ALTER TABLE vote 
ADD CONSTRAINT unique_user_entity_vote 
UNIQUE (user_id, entity_type, entity_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vote_entity ON vote (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_vote_user ON vote (user_id);
CREATE INDEX IF NOT EXISTS idx_vote_created_at ON vote (created_at);
