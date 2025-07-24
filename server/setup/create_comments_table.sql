-- Create comments table if it doesn't exist

-- Create comments table with proper structure
CREATE TABLE IF NOT EXISTS comments (
    comment_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    comment_text TEXT NOT NULL,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('post', 'review', 'comment')),
    entity_id INTEGER NOT NULL,
    parent_comment_id INTEGER NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraint for user_id
    CONSTRAINT fk_comments_user_id 
        FOREIGN KEY (user_id) 
        REFERENCES "user"(user_id) 
        ON DELETE CASCADE,
    
    -- Foreign key constraint for parent_comment_id (self-referencing)
    CONSTRAINT fk_comments_parent_comment_id 
        FOREIGN KEY (parent_comment_id) 
        REFERENCES comments(comment_id) 
        ON DELETE CASCADE,
    
    -- Check constraint for valid entity types
    CONSTRAINT chk_comment_entity_type 
        CHECK (entity_type IN ('post', 'review', 'comment')),
    
    -- Check constraint for non-empty comment text
    CONSTRAINT chk_comment_text_not_empty 
        CHECK (LENGTH(TRIM(comment_text)) > 0),
    
    -- Check constraint to prevent self-referencing parent comments
    CONSTRAINT chk_comment_not_self_parent 
        CHECK (comment_id != parent_comment_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_comments_entity_type_id 
    ON comments(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_comments_user_id 
    ON comments(user_id);

CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id 
    ON comments(parent_comment_id);

CREATE INDEX IF NOT EXISTS idx_comments_created_at 
    ON comments(created_at DESC);

-- Create a composite index for efficient nested comment queries
CREATE INDEX IF NOT EXISTS idx_comments_entity_parent_created 
    ON comments(entity_type, entity_id, parent_comment_id, created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_comments_updated_at ON comments;
CREATE TRIGGER trigger_update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_comments_updated_at();
