-- COPY AND PASTE THIS TO FIX NOTIFICATION TRIGGER
-- This will ensure notifications are sent when users rate posts

-- 1. Drop existing notification trigger
DROP TRIGGER IF EXISTS trigger_post_rating_notification ON post_ratings;

-- 2. Create improved notification function
CREATE OR REPLACE FUNCTION notify_post_rating()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id INTEGER;
    rater_name VARCHAR(255);
    post_preview TEXT;
    notification_result INTEGER;
BEGIN
    -- Get the post owner and rater info
    SELECT p.user_id, u.username, LEFT(p.post_text, 50)
    INTO post_owner_id, rater_name, post_preview
    FROM post p
    JOIN "user" u ON u.user_id = NEW.user_id
    WHERE p.post_id = NEW.post_id;
    
    -- Only create notification if we found the post and user info
    IF post_owner_id IS NOT NULL AND rater_name IS NOT NULL THEN
        -- Create notification (the create_notification function automatically prevents self-notifications)
        SELECT create_notification(
            post_owner_id,                    -- recipient_user_id
            NEW.user_id,                     -- actor_user_id  
            'rating',                        -- notification_type
            'post',                          -- entity_type
            NEW.post_id,                     -- entity_id
            rater_name || ' rated your post "' || COALESCE(post_preview, 'your content') || '..." with ' || NEW.rating || ' stars'
        ) INTO notification_result;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create notification trigger
CREATE TRIGGER trigger_post_rating_notification 
AFTER INSERT ON post_ratings
FOR EACH ROW
EXECUTE FUNCTION notify_post_rating();

-- 4. Test the notification system (optional)
-- Replace the values below with actual user_id and post_id from your database

-- Find users and posts to test with:
-- SELECT user_id, username FROM "user" LIMIT 3;
-- SELECT post_id, user_id, post_text FROM post WHERE is_rate_enabled = true LIMIT 3;

-- Test example (replace with your actual values):
-- INSERT INTO post_ratings (post_id, user_id, rating) VALUES (1, 2, 4.5);

-- Check if notification was created:
-- SELECT * FROM notifications 
-- WHERE entity_type = 'post' AND notification_type = 'rating' 
-- ORDER BY created_at DESC LIMIT 3;

-- Clean up test (replace with your actual values):
-- DELETE FROM post_ratings WHERE post_id = 1 AND user_id = 2;
-- DELETE FROM notifications WHERE entity_type = 'post' AND notification_type = 'rating' AND entity_id = 1;
