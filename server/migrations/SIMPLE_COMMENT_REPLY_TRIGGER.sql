-- Simple trigger to create notifications when someone replies to a comment
-- Run this directly in your database

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS comment_reply_notification_trigger ON comments;
DROP FUNCTION IF EXISTS notify_comment_reply();

-- Create the trigger function
CREATE OR REPLACE FUNCTION notify_comment_reply()
RETURNS TRIGGER AS $$
DECLARE
    parent_comment_user_id INTEGER;
    replier_username TEXT;
    entity_title TEXT;
BEGIN
    -- Check if this is a reply (has parent_comment_id)
    IF NEW.parent_comment_id IS NOT NULL THEN
        -- Get the user_id of the parent comment author
        SELECT user_id INTO parent_comment_user_id
        FROM comments 
        WHERE comment_id = NEW.parent_comment_id;
        
        -- Only create notification if parent comment exists and it's not a self-reply
        IF parent_comment_user_id IS NOT NULL AND parent_comment_user_id != NEW.user_id THEN
            -- Get the username of the person replying
            SELECT username INTO replier_username 
            FROM "user" 
            WHERE user_id = NEW.user_id;
            
            -- Get entity title based on entity type (for context in notification message)
            IF NEW.entity_type = 'post' THEN
                SELECT post_text INTO entity_title 
                FROM post 
                WHERE post_id = NEW.entity_id;
            ELSIF NEW.entity_type = 'review' THEN
                SELECT title INTO entity_title 
                FROM review 
                WHERE review_id = NEW.entity_id;
            END IF;
            
            -- Create notification for the parent comment author
            INSERT INTO notifications (
                recipient_user_id,
                actor_user_id,
                notification_type,
                entity_type,
                entity_id,
                message,
                is_read,
                created_at
            ) VALUES (
                parent_comment_user_id,
                NEW.user_id,
                'comment_reply',
                NEW.entity_type,
                NEW.entity_id,
                COALESCE(replier_username, 'Someone') || ' replied to your comment' || 
                CASE 
                    WHEN entity_title IS NOT NULL THEN ' on "' || LEFT(entity_title, 50) || 
                        CASE WHEN LENGTH(entity_title) > 50 THEN '..."' ELSE '"' END
                    ELSE ''
                END,
                FALSE,
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER comment_reply_notification_trigger
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_comment_reply();
