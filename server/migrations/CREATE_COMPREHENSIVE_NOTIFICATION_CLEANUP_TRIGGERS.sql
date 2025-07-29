-- Comprehensive notification cleanup triggers for all entity deletions
-- This will ensure data integrity by removing orphaned notifications

-- Drop existing cleanup triggers if they exist (with proper names from existing system)
DROP TRIGGER IF EXISTS cleanup_post_notifications_trigger ON post;
DROP TRIGGER IF EXISTS cleanup_review_notifications_trigger ON review;
DROP TRIGGER IF EXISTS cleanup_comment_notifications_trigger ON comments;
DROP TRIGGER IF EXISTS cleanup_vote_notifications_trigger ON vote;
DROP TRIGGER IF EXISTS cleanup_follow_notifications_trigger ON user_follow;
DROP TRIGGER IF EXISTS trigger_cleanup_post_notifications ON post;
DROP TRIGGER IF EXISTS trigger_cleanup_review_notifications ON review;

-- Drop existing cleanup functions if they exist (use CASCADE to handle dependencies)
DROP FUNCTION IF EXISTS cleanup_post_notifications() CASCADE;
DROP FUNCTION IF EXISTS cleanup_review_notifications() CASCADE;
DROP FUNCTION IF EXISTS cleanup_comment_notifications() CASCADE;
DROP FUNCTION IF EXISTS cleanup_vote_notifications() CASCADE;
DROP FUNCTION IF EXISTS cleanup_follow_notifications() CASCADE;

-- Function to clean up notifications when a post is deleted
CREATE OR REPLACE FUNCTION cleanup_post_notifications()
RETURNS TRIGGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete all notifications related to this post
    DELETE FROM notifications 
    WHERE entity_type = 'post' AND entity_id = OLD.post_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup (optional)
    RAISE NOTICE 'Deleted % notifications for post ID %', deleted_count, OLD.post_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up notifications when a review is deleted
CREATE OR REPLACE FUNCTION cleanup_review_notifications()
RETURNS TRIGGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete all notifications related to this review
    DELETE FROM notifications 
    WHERE entity_type = 'review' AND entity_id = OLD.review_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup (optional)
    RAISE NOTICE 'Deleted % notifications for review ID %', deleted_count, OLD.review_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up notifications when a comment is deleted
CREATE OR REPLACE FUNCTION cleanup_comment_notifications()
RETURNS TRIGGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete notifications where this comment is the subject
    -- This includes comment notifications and comment reply notifications
    DELETE FROM notifications 
    WHERE (notification_type = 'comment' AND entity_type = OLD.entity_type AND entity_id = OLD.entity_id AND actor_user_id = OLD.user_id)
       OR (notification_type = 'comment_reply' AND entity_type = OLD.entity_type AND entity_id = OLD.entity_id AND actor_user_id = OLD.user_id);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup (optional)
    RAISE NOTICE 'Deleted % notifications for comment ID %', deleted_count, OLD.comment_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up notifications when a vote is deleted
CREATE OR REPLACE FUNCTION cleanup_vote_notifications()
RETURNS TRIGGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete notifications for this specific vote
    DELETE FROM notifications 
    WHERE notification_type = 'vote' 
      AND entity_type = OLD.entity_type 
      AND entity_id = OLD.entity_id 
      AND actor_user_id = OLD.user_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup (optional)
    RAISE NOTICE 'Deleted % notifications for vote by user % on % %', deleted_count, OLD.user_id, OLD.entity_type, OLD.entity_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up notifications when a follow relationship is deleted
CREATE OR REPLACE FUNCTION cleanup_follow_notifications()
RETURNS TRIGGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete follow notifications for this specific relationship
    DELETE FROM notifications 
    WHERE notification_type = 'follow' 
      AND recipient_user_id = OLD.following_id 
      AND actor_user_id = OLD.follower_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup (optional)
    RAISE NOTICE 'Deleted % follow notifications for user % following user %', deleted_count, OLD.follower_id, OLD.following_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for each entity type

-- Post deletion trigger
CREATE TRIGGER cleanup_post_notifications_trigger
    BEFORE DELETE ON post
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_post_notifications();

-- Review deletion trigger
CREATE TRIGGER cleanup_review_notifications_trigger
    BEFORE DELETE ON review
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_review_notifications();

-- Comment deletion trigger
CREATE TRIGGER cleanup_comment_notifications_trigger
    BEFORE DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_comment_notifications();

-- Vote deletion trigger
CREATE TRIGGER cleanup_vote_notifications_trigger
    BEFORE DELETE ON vote
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_vote_notifications();

-- Follow deletion trigger
CREATE TRIGGER cleanup_follow_notifications_trigger
    BEFORE DELETE ON user_follow
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_follow_notifications();

-- Optional: Function to clean up all orphaned notifications (run manually if needed)
CREATE OR REPLACE FUNCTION cleanup_orphaned_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    total_deleted INTEGER := 0;
BEGIN
    -- Clean up notifications for non-existent posts
    DELETE FROM notifications 
    WHERE entity_type = 'post' 
      AND entity_id NOT IN (SELECT post_id FROM post);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % orphaned post notifications', deleted_count;
    
    -- Clean up notifications for non-existent reviews
    DELETE FROM notifications 
    WHERE entity_type = 'review' 
      AND entity_id NOT IN (SELECT review_id FROM review);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % orphaned review notifications', deleted_count;
    
    -- Clean up notifications for non-existent users
    DELETE FROM notifications 
    WHERE recipient_user_id NOT IN (SELECT user_id FROM "user")
       OR actor_user_id NOT IN (SELECT user_id FROM "user");
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    total_deleted := total_deleted + deleted_count;
    RAISE NOTICE 'Deleted % notifications with non-existent users', deleted_count;
    
    RAISE NOTICE 'Total orphaned notifications deleted: %', total_deleted;
    RETURN total_deleted;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust as needed for your database user)
-- GRANT EXECUTE ON FUNCTION cleanup_post_notifications() TO your_app_user;
-- GRANT EXECUTE ON FUNCTION cleanup_review_notifications() TO your_app_user;
-- GRANT EXECUTE ON FUNCTION cleanup_comment_notifications() TO your_app_user;
-- GRANT EXECUTE ON FUNCTION cleanup_vote_notifications() TO your_app_user;
-- GRANT EXECUTE ON FUNCTION cleanup_follow_notifications() TO your_app_user;
-- GRANT EXECUTE ON FUNCTION cleanup_orphaned_notifications() TO your_app_user;
