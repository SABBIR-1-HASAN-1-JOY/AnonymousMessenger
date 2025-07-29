-- Comment Cascade Delete Trigger for PostgreSQL
-- This trigger automatically deletes all descendant comments when a parent comment is deleted
-- It handles multi-level nesting by recursively deleting all child comments

-- First, clean up any existing trigger and function
DO $$ 
BEGIN
    -- Drop trigger if it exists
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'comment_cascade_delete_trigger') THEN
        DROP TRIGGER comment_cascade_delete_trigger ON comments;
    END IF;
    
    -- Drop function if it exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'cascade_delete_comment_children') THEN
        DROP FUNCTION cascade_delete_comment_children();
    END IF;
END $$;

-- Create the recursive function to delete all descendant comments
CREATE OR REPLACE FUNCTION cascade_delete_comment_children()
RETURNS TRIGGER AS $$
DECLARE
    child_comment_id INTEGER;
    deleted_count INTEGER := 0;
BEGIN
    -- Log the deletion for debugging
    RAISE NOTICE 'Cascading delete for comment_id: %', OLD.comment_id;
    
    -- Find all direct child comments and recursively delete them
    FOR child_comment_id IN 
        SELECT comment_id 
        FROM comments 
        WHERE parent_comment_id = OLD.comment_id
    LOOP
        -- Delete the child comment (this will trigger the cascade for its children too)
        DELETE FROM comments WHERE comment_id = child_comment_id;
        deleted_count := deleted_count + 1;
        
        RAISE NOTICE 'Deleted child comment_id: %', child_comment_id;
    END LOOP;
    
    -- Log total deletions
    IF deleted_count > 0 THEN
        RAISE NOTICE 'Total child comments deleted: %', deleted_count;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that fires BEFORE DELETE on comments table
CREATE TRIGGER comment_cascade_delete_trigger
    BEFORE DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION cascade_delete_comment_children();

-- Verification query to check comment hierarchy (useful for debugging)
/*
WITH RECURSIVE comment_tree AS (
    -- Base case: root comments (no parent)
    SELECT 
        comment_id, 
        parent_comment_id, 
        comment_text, 
        user_id,
        0 as level,
        ARRAY[comment_id] as path
    FROM comments 
    WHERE parent_comment_id IS NULL
    
    UNION ALL
    
    -- Recursive case: child comments
    SELECT 
        c.comment_id, 
        c.parent_comment_id, 
        c.comment_text, 
        c.user_id,
        ct.level + 1,
        ct.path || c.comment_id
    FROM comments c
    JOIN comment_tree ct ON c.parent_comment_id = ct.comment_id
    WHERE NOT c.comment_id = ANY(ct.path) -- Prevent infinite loops
)
SELECT 
    REPEAT('  ', level) || comment_text as indented_comment,
    comment_id,
    parent_comment_id,
    level,
    path
FROM comment_tree 
ORDER BY path;
*/

-- Test script for the trigger (DO NOT RUN IN PRODUCTION WITHOUT BACKUP!)
/*
BEGIN;

-- Insert test comments to create a hierarchy
INSERT INTO comments (user_id, comment_text, entity_type, entity_id) 
VALUES (1, 'Test Parent Comment', 'post', 1) 
RETURNING comment_id;

-- Get the parent comment ID (replace X with actual ID)
INSERT INTO comments (user_id, comment_text, entity_type, entity_id, parent_comment_id) 
VALUES (1, 'Test Child Comment 1', 'post', 1, X);

INSERT INTO comments (user_id, comment_text, entity_type, entity_id, parent_comment_id) 
VALUES (1, 'Test Child Comment 2', 'post', 1, X);

-- Check hierarchy before deletion
SELECT comment_id, parent_comment_id, comment_text 
FROM comments 
WHERE comment_text LIKE 'Test%' 
ORDER BY comment_id;

-- Delete parent (should cascade to children due to trigger)
DELETE FROM comments WHERE comment_text = 'Test Parent Comment';

-- Check hierarchy after deletion (should be empty)
SELECT comment_id, parent_comment_id, comment_text 
FROM comments 
WHERE comment_text LIKE 'Test%' 
ORDER BY comment_id;

ROLLBACK; -- Safe rollback to preserve existing data
*/
