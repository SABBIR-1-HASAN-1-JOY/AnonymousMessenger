-- Triggers to delete related notifications when posts or reviews are deleted
-- This ensures data consistency by removing orphaned notifications

-- Create function to clean up notifications when a post is deleted
CREATE OR REPLACE FUNCTION cleanup_post_notifications() RETURNS TRIGGER AS $$
BEGIN
    -- Delete all notifications related to the deleted post
    DELETE FROM notifications 
    WHERE entity_type = 'post' 
    AND entity_id = OLD.post_id;
    
    -- Log the cleanup action (optional)
    RAISE NOTICE 'Cleaned up notifications for deleted post ID: %', OLD.post_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up notifications when a review is deleted
CREATE OR REPLACE FUNCTION cleanup_review_notifications() RETURNS TRIGGER AS $$
BEGIN
    -- Delete all notifications related to the deleted review
    DELETE FROM notifications 
    WHERE entity_type = 'review' 
    AND entity_id = OLD.review_id;
    
    -- Log the cleanup action (optional)
    RAISE NOTICE 'Cleaned up notifications for deleted review ID: %', OLD.review_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_cleanup_post_notifications ON post;
DROP TRIGGER IF EXISTS trigger_cleanup_review_notifications ON review;

-- Create trigger that fires BEFORE post deletion
CREATE TRIGGER trigger_cleanup_post_notifications
    BEFORE DELETE ON post
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_post_notifications();

-- Create trigger that fires BEFORE review deletion
CREATE TRIGGER trigger_cleanup_review_notifications
    BEFORE DELETE ON review
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_review_notifications();

-- Verify the triggers were created
SELECT 'Post and Review notification cleanup triggers created successfully' as status;
