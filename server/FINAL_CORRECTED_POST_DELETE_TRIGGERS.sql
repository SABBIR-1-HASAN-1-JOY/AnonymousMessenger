-- FINAL CORRECTED POST DELETE TRIGGERS
-- Table names: "comments" (with s), "vote" (without s)

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS handle_post_deletion() CASCADE;

-- Create the corrected post deletion trigger function
CREATE OR REPLACE FUNCTION handle_post_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the deletion attempt
    RAISE NOTICE 'Deleting post with ID: %', OLD.post_id;
    
    -- Delete votes for this post (table name: vote)
    DELETE FROM vote WHERE entity_type = 'post' AND entity_id = OLD.post_id;
    RAISE NOTICE 'Deleted votes for post %', OLD.post_id;
    
    -- Delete comments for this post (table name: comments)  
    DELETE FROM comments WHERE entity_type = 'post' AND entity_id = OLD.post_id;
    RAISE NOTICE 'Deleted comments for post %', OLD.post_id;
    
    -- Delete notifications related to this post
    DELETE FROM notifications WHERE entity_type = 'post' AND entity_id = OLD.post_id;
    RAISE NOTICE 'Deleted notifications for post %', OLD.post_id;
    
    -- Delete photos associated with this post
    DELETE FROM photos WHERE source_type = 'post' AND source_id = OLD.post_id;
    RAISE NOTICE 'Deleted photos for post %', OLD.post_id;
    
    -- Delete reports about this post
    DELETE FROM reports WHERE reported_item_type = 'post' AND reported_item_id = OLD.post_id;
    RAISE NOTICE 'Deleted reports for post %', OLD.post_id;
    
    -- Delete ratings if this is a rate_my_work post
    IF OLD.post_type = 'rate_my_work' THEN
        DELETE FROM post_ratings WHERE post_id = OLD.post_id;
        RAISE NOTICE 'Deleted ratings for rate_my_work post %', OLD.post_id;
    END IF;
    
    RAISE NOTICE 'Successfully completed cascading deletion for post %', OLD.post_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS post_deletion_cascade ON post;
CREATE TRIGGER post_deletion_cascade
    BEFORE DELETE ON post
    FOR EACH ROW
    EXECUTE FUNCTION handle_post_deletion();

-- Confirm trigger creation
SELECT 'Post deletion triggers created successfully with correct table names: comments (with s), vote (without s)' AS status;
