-- Fix the trigger function to work properly with PostgreSQL triggers
-- Run these commands to fix the ratingpoint update issue

-- STEP 1: Drop the existing problematic triggers
DROP TRIGGER IF EXISTS "trigger_calculate_rating_on_insert" ON "public"."post_ratings";
DROP TRIGGER IF EXISTS "trigger_calculate_rating_on_update" ON "public"."post_ratings";
DROP TRIGGER IF EXISTS "trigger_calculate_rating_on_delete" ON "public"."post_ratings";

-- STEP 2: Create a proper trigger function that works with PostgreSQL
DROP FUNCTION IF EXISTS "public"."update_post_rating_average"();
CREATE OR REPLACE FUNCTION "public"."update_post_rating_average"()
  RETURNS TRIGGER AS $BODY$
DECLARE
    avg_rating NUMERIC(3,2);
    rating_count INTEGER;
    target_post_id INTEGER;
BEGIN
    -- Determine which post_id to update based on the operation
    IF TG_OP = 'DELETE' THEN
        target_post_id := OLD.post_id;
    ELSE
        target_post_id := NEW.post_id;
    END IF;
    
    -- Calculate new average and count for this post
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
    
    -- Return the appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- STEP 3: Create the correct triggers
CREATE TRIGGER "trigger_update_rating_on_insert" 
AFTER INSERT ON "public"."post_ratings"
FOR EACH ROW
EXECUTE FUNCTION "public"."update_post_rating_average"();

CREATE TRIGGER "trigger_update_rating_on_update" 
AFTER UPDATE ON "public"."post_ratings"
FOR EACH ROW
EXECUTE FUNCTION "public"."update_post_rating_average"();

CREATE TRIGGER "trigger_update_rating_on_delete" 
AFTER DELETE ON "public"."post_ratings"
FOR EACH ROW
EXECUTE FUNCTION "public"."update_post_rating_average"();

-- STEP 4: Test the triggers immediately
-- Find a post to test with (replace 1 with an actual post_id from your database)
-- First check what posts exist:
-- SELECT post_id FROM post LIMIT 3;

-- Test with post_id = 1 (replace with your actual post_id)
-- Clear any existing test data
DELETE FROM post_ratings WHERE post_id = 1 AND user_id IN (998, 999);
UPDATE post SET ratingpoint = NULL, average_rating = NULL, total_ratings = 0 WHERE post_id = 1;

-- Add a test rating
INSERT INTO post_ratings (post_id, user_id, rating) VALUES (1, 998, 4.5);

-- Check if the post table was updated
SELECT post_id, ratingpoint, average_rating, total_ratings 
FROM post 
WHERE post_id = 1;

-- Add another rating to test averaging
INSERT INTO post_ratings (post_id, user_id, rating) VALUES (1, 999, 3.5);

-- Check the average (should be 4.0)
SELECT post_id, ratingpoint, average_rating, total_ratings 
FROM post 
WHERE post_id = 1;

-- Clean up test data
DELETE FROM post_ratings WHERE post_id = 1 AND user_id IN (998, 999);
UPDATE post SET ratingpoint = NULL, average_rating = NULL, total_ratings = 0 WHERE post_id = 1;

-- STEP 5: Verify triggers are working
-- Check that triggers exist
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'post_ratings'
ORDER BY trigger_name;
