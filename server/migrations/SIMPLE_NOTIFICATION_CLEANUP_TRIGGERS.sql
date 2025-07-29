-- Simple direct script to set up notification cleanup triggers
-- This version handles existing dependencies properly

-- First, drop all existing triggers that might conflict
DROP TRIGGER IF EXISTS trigger_cleanup_post_notifications ON post CASCADE;
DROP TRIGGER IF EXISTS trigger_cleanup_review_notifications ON review CASCADE;
DROP TRIGGER IF EXISTS cleanup_post_notifications_trigger ON post CASCADE;
DROP TRIGGER IF EXISTS cleanup_review_notifications_trigger ON review CASCADE;
DROP TRIGGER IF EXISTS cleanup_comment_notifications_trigger ON comments CASCADE;
DROP TRIGGER IF EXISTS cleanup_vote_notifications_trigger ON vote CASCADE;
DROP TRIGGER IF EXISTS cleanup_follow_notifications_trigger ON user_follow CASCADE;

-- Then drop all existing functions with CASCADE
DROP FUNCTION IF EXISTS cleanup_post_notifications() CASCADE;
DROP FUNCTION IF EXISTS cleanup_review_notifications() CASCADE;
DROP FUNCTION IF EXISTS cleanup_comment_notifications() CASCADE;
DROP FUNCTION IF EXISTS cleanup_vote_notifications() CASCADE;
DROP FUNCTION IF EXISTS cleanup_follow_notifications() CASCADE;

-- Now create the new functions
CREATE OR REPLACE FUNCTION cleanup_post_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete all notifications related to this post
    DELETE FROM notifications 
    WHERE entity_type = 'post' AND entity_id = OLD.post_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_review_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete all notifications related to this review
    DELETE FROM notifications 
    WHERE entity_type = 'review' AND entity_id = OLD.review_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_comment_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete notifications where this comment is the subject
    DELETE FROM notifications 
    WHERE (notification_type = 'comment' AND entity_type = OLD.entity_type AND entity_id = OLD.entity_id AND actor_user_id = OLD.user_id)
       OR (notification_type = 'comment_reply' AND entity_type = OLD.entity_type AND entity_id = OLD.entity_id AND actor_user_id = OLD.user_id);
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_vote_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete notifications for this specific vote
    DELETE FROM notifications 
    WHERE notification_type = 'vote' 
      AND entity_type = OLD.entity_type 
      AND entity_id = OLD.entity_id 
      AND actor_user_id = OLD.user_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION cleanup_follow_notifications()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete follow notifications for this specific relationship
    DELETE FROM notifications 
    WHERE notification_type = 'follow' 
      AND recipient_user_id = OLD.following_id 
      AND actor_user_id = OLD.follower_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create new triggers
CREATE TRIGGER cleanup_post_notifications_trigger
    BEFORE DELETE ON post
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_post_notifications();

CREATE TRIGGER cleanup_review_notifications_trigger
    BEFORE DELETE ON review
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_review_notifications();

CREATE TRIGGER cleanup_comment_notifications_trigger
    BEFORE DELETE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_comment_notifications();

CREATE TRIGGER cleanup_vote_notifications_trigger
    BEFORE DELETE ON vote
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_vote_notifications();

CREATE TRIGGER cleanup_follow_notifications_trigger
    BEFORE DELETE ON user_follow
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_follow_notifications();
