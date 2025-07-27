-- QUICK FIX: Fix the ratingpoint update issue
-- Run these commands in your database client

-- 1. Drop the broken triggers
DROP TRIGGER IF EXISTS trigger_calculate_rating_on_insert ON post_ratings;
DROP TRIGGER IF EXISTS trigger_calculate_rating_on_update ON post_ratings;
DROP TRIGGER IF EXISTS trigger_calculate_rating_on_delete ON post_ratings;

-- 2. Create the correct trigger function
CREATE OR REPLACE FUNCTION update_post_rating_average()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating NUMERIC(3,2);
    rating_count INTEGER;
    target_post_id INTEGER;
BEGIN
    -- Get the post_id to update
    IF TG_OP = 'DELETE' THEN
        target_post_id := OLD.post_id;
    ELSE
        target_post_id := NEW.post_id;
    END IF;
    
    -- Calculate new average and count
    SELECT AVG(rating), COUNT(rating)
    INTO avg_rating, rating_count
    FROM post_ratings
    WHERE post_id = target_post_id;
    
    -- Update the post table
    UPDATE post 
    SET 
        average_rating = ROUND(COALESCE(avg_rating, 0), 2),
        total_ratings = COALESCE(rating_count, 0),
        ratingpoint = ROUND(COALESCE(avg_rating, 0), 1)
    WHERE post_id = target_post_id;
    
    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Create the working triggers
CREATE TRIGGER update_rating_on_insert 
    AFTER INSERT ON post_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_post_rating_average();

CREATE TRIGGER update_rating_on_update 
    AFTER UPDATE ON post_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_post_rating_average();

CREATE TRIGGER update_rating_on_delete 
    AFTER DELETE ON post_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_post_rating_average();

-- 4. Test the fix immediately
-- (Replace '1' with an actual post_id from your database)

-- First, find a post to test with:
SELECT post_id FROM post LIMIT 1;

-- Let's use the first post_id found above. For example, if post_id = 1:
-- Clear test data
DELETE FROM post_ratings WHERE post_id = 1 AND user_id = 999;

-- Reset the post
UPDATE post SET ratingpoint = NULL, average_rating = NULL, total_ratings = 0 WHERE post_id = 1;

-- Add a test rating
INSERT INTO post_ratings (post_id, user_id, rating) VALUES (1, 999, 4.5);

-- Check if ratingpoint was updated (should show 4.5)
SELECT post_id, ratingpoint, average_rating, total_ratings FROM post WHERE post_id = 1;

-- Clean up test
DELETE FROM post_ratings WHERE post_id = 1 AND user_id = 999;
UPDATE post SET ratingpoint = NULL, average_rating = NULL, total_ratings = 0 WHERE post_id = 1;
