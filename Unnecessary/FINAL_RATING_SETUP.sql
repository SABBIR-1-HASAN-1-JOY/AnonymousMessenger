-- FINAL DATABASE SETUP FOR POST RATINGS SYSTEM
-- Execute these commands in your database to ensure triggers work properly

-- 1. Ensure post_ratings table exists
CREATE TABLE IF NOT EXISTS post_ratings (
    rating_id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES post(post_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    rating NUMERIC(2,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, post_id)
);

-- 2. Ensure columns exist in post table
ALTER TABLE post ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT NULL;
ALTER TABLE post ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- 3. Create the trigger function (this is the key fix!)
CREATE OR REPLACE FUNCTION calculate_post_average_rating()
RETURNS TRIGGER AS $$
DECLARE
    avg_rating NUMERIC(3,2);
    rating_count INTEGER;
    target_post_id INTEGER;
BEGIN
    -- Determine which post_id to update
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
    
    -- Update the post table with new values
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

-- 4. Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_post_rating_on_insert ON post_ratings;
DROP TRIGGER IF EXISTS update_post_rating_on_update ON post_ratings;
DROP TRIGGER IF EXISTS update_post_rating_on_delete ON post_ratings;

-- 5. Create the triggers
CREATE TRIGGER update_post_rating_on_insert
    AFTER INSERT ON post_ratings
    FOR EACH ROW
    EXECUTE FUNCTION calculate_post_average_rating();

CREATE TRIGGER update_post_rating_on_update
    AFTER UPDATE ON post_ratings
    FOR EACH ROW
    EXECUTE FUNCTION calculate_post_average_rating();

CREATE TRIGGER update_post_rating_on_delete
    AFTER DELETE ON post_ratings
    FOR EACH ROW
    EXECUTE FUNCTION calculate_post_average_rating();

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_ratings_post_id ON post_ratings(post_id);
CREATE INDEX IF NOT EXISTS idx_post_ratings_user_id ON post_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_post_ratings_rating ON post_ratings(rating DESC);

-- 7. Test the setup (optional - you can run this to verify)
/*
-- Find a test post
SELECT post_id FROM post LIMIT 1;

-- Let's say the post_id is 1, replace with actual post_id
-- Clear any existing test ratings
DELETE FROM post_ratings WHERE post_id = 1;
UPDATE post SET ratingpoint = NULL, average_rating = NULL, total_ratings = 0 WHERE post_id = 1;

-- Add a test rating
INSERT INTO post_ratings (post_id, user_id, rating) VALUES (1, 2, 4.5);

-- Check if the post table was updated automatically
SELECT post_id, ratingpoint, average_rating, total_ratings FROM post WHERE post_id = 1;
-- Should show: ratingpoint = 4.5, average_rating = 4.50, total_ratings = 1

-- Add another rating
INSERT INTO post_ratings (post_id, user_id, rating) VALUES (1, 3, 3.5);

-- Check average calculation
SELECT post_id, ratingpoint, average_rating, total_ratings FROM post WHERE post_id = 1;
-- Should show: ratingpoint = 4.0, average_rating = 4.00, total_ratings = 2

-- Clean up test data
DELETE FROM post_ratings WHERE post_id = 1;
UPDATE post SET ratingpoint = NULL, average_rating = NULL, total_ratings = 0 WHERE post_id = 1;
*/

-- VERIFICATION QUERIES
-- Run these to check if everything is set up correctly:

-- Check if post_ratings table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'post_ratings' AND table_schema = 'public';

-- Check if new columns exist in post table
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'post' AND column_name IN ('average_rating', 'total_ratings') 
AND table_schema = 'public';

-- Check if triggers exist
SELECT trigger_name, event_manipulation
FROM information_schema.triggers 
WHERE event_object_table = 'post_ratings';

-- Check if the function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_name = 'calculate_post_average_rating' AND routine_schema = 'public';
