-- COPY AND PASTE THIS INTO YOUR DATABASE CLIENT
-- This will fix the ratingpoint update issue

-- Step 1: Drop broken triggers
DROP TRIGGER IF EXISTS trigger_calculate_rating_on_insert ON post_ratings;
DROP TRIGGER IF EXISTS trigger_calculate_rating_on_update ON post_ratings;
DROP TRIGGER IF EXISTS trigger_calculate_rating_on_delete ON post_ratings;

-- Step 2: Create working trigger function
CREATE OR REPLACE FUNCTION update_post_rating_average()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating NUMERIC(3,2);
    rating_count INTEGER;
    target_post_id INTEGER;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_post_id := OLD.post_id;
    ELSE
        target_post_id := NEW.post_id;
    END IF;
    
    SELECT AVG(rating), COUNT(rating)
    INTO avg_rating, rating_count
    FROM post_ratings
    WHERE post_id = target_post_id;
    
    UPDATE post 
    SET 
        average_rating = ROUND(COALESCE(avg_rating, 0), 2),
        total_ratings = COALESCE(rating_count, 0),
        ratingpoint = ROUND(COALESCE(avg_rating, 0), 1)
    WHERE post_id = target_post_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create working triggers
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

-- Step 4: Test it (replace 1 with your actual post_id)
-- Find a post first:
-- SELECT post_id FROM post LIMIT 1;

-- Test with the post_id you found:
-- INSERT INTO post_ratings (post_id, user_id, rating) VALUES (1, 999, 4.5);
-- SELECT post_id, ratingpoint FROM post WHERE post_id = 1;
-- DELETE FROM post_ratings WHERE post_id = 1 AND user_id = 999;
