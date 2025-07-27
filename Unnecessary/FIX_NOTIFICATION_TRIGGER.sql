-- Fix notification trigger for post ratings
-- Run this in your database client to ensure rating notifications work properly

-- 1. Drop existing notification trigger if it exists
DROP TRIGGER IF EXISTS "trigger_post_rating_notification" ON "public"."post_ratings";

-- 2. Create improved notification function for ratings
CREATE OR REPLACE FUNCTION "public"."notify_post_rating"()
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
        -- Don't notify if user rates their own post (handled by create_notification function)
        SELECT create_notification(
            post_owner_id,                    -- recipient_user_id
            NEW.user_id,                     -- actor_user_id  
            'rating',                        -- notification_type
            'post',                          -- entity_type
            NEW.post_id,                     -- entity_id
            rater_name || ' rated your post "' || COALESCE(post_preview, 'your content') || '..." with ' || NEW.rating || ' stars'  -- message
        ) INTO notification_result;
        
        -- Log for debugging (optional - remove in production)
        -- RAISE NOTICE 'Rating notification created: user % rated post % (owner: %) with % stars', 
        --     NEW.user_id, NEW.post_id, post_owner_id, NEW.rating;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql VOLATILE COST 100;

-- 3. Create the notification trigger
CREATE TRIGGER "trigger_post_rating_notification" 
AFTER INSERT ON "public"."post_ratings"
FOR EACH ROW
EXECUTE FUNCTION "public"."notify_post_rating"();

-- 4. Test the notification system
-- Find a post to test with (make sure it's not owned by the user you're testing with)
-- SELECT post_id, user_id, post_text FROM post WHERE is_rate_enabled = true LIMIT 3;

-- Example test (replace with actual values):
-- INSERT INTO post_ratings (post_id, user_id, rating) VALUES (1, 2, 4.5);
-- 
-- Check if notification was created:
-- SELECT * FROM notifications 
-- WHERE entity_type = 'post' AND notification_type = 'rating' 
-- ORDER BY created_at DESC LIMIT 5;
--
-- Clean up test:
-- DELETE FROM post_ratings WHERE post_id = 1 AND user_id = 2;
-- DELETE FROM notifications WHERE entity_type = 'post' AND notification_type = 'rating' AND entity_id = 1;
