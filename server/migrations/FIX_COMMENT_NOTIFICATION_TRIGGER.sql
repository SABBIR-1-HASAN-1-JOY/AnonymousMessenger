-- Fix existing comment notification trigger to exclude replies
-- This will update the notify_comment() function to only notify for top-level comments
-- Run this in your database to fix the double notification issue

-- Update the existing comment notification function
CREATE OR REPLACE FUNCTION notify_comment() RETURNS TRIGGER AS $$
DECLARE
    content_owner_id INTEGER;
    actor_name VARCHAR(255);
    entity_title TEXT;
BEGIN
    -- Only create notification for top-level comments (not replies)
    -- If parent_comment_id is NOT NULL, this is a reply and should be handled by the reply trigger
    IF NEW.parent_comment_id IS NULL THEN
        -- Get the actor's name
        SELECT username INTO actor_name FROM "user" WHERE user_id = NEW.user_id;
        
        -- Determine content owner based on entity type
        IF NEW.entity_type = 'post' THEN
            SELECT user_id INTO content_owner_id FROM post WHERE post_id = NEW.entity_id;
            SELECT LEFT(post_text, 50) || '...' INTO entity_title 
            FROM post WHERE post_id = NEW.entity_id;
        ELSIF NEW.entity_type = 'review' THEN
            SELECT user_id INTO content_owner_id FROM review WHERE review_id = NEW.entity_id;
            SELECT LEFT(review_text, 50) || '...' INTO entity_title 
            FROM review WHERE review_id = NEW.entity_id;
        END IF;
        
        -- Create notification only if this is not the content owner commenting on their own content
        IF content_owner_id IS NOT NULL AND content_owner_id != NEW.user_id THEN
            PERFORM create_notification(
                content_owner_id,
                NEW.user_id,
                'comment',
                NEW.entity_type,
                NEW.entity_id,
                actor_name || ' commented on your ' || NEW.entity_type || ': "' || COALESCE(entity_title, 'your content') || '"'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
