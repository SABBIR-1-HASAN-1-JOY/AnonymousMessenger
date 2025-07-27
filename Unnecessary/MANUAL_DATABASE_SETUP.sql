-- MANUAL SETUP INSTRUCTIONS
-- Copy and paste these SQL commands into your database client

-- Step 1: Add new columns to post table
ALTER TABLE post ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT NULL;
ALTER TABLE post ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- Step 2: Add constraints
ALTER TABLE post ADD CONSTRAINT chk_average_rating_range 
  CHECK (average_rating IS NULL OR (average_rating >= 1.0 AND average_rating <= 5.0));
ALTER TABLE post ADD CONSTRAINT chk_total_ratings_positive 
  CHECK (total_ratings >= 0);

-- Step 3: Create the post_ratings table
CREATE SEQUENCE IF NOT EXISTS post_ratings_rating_id_seq;

CREATE TABLE IF NOT EXISTS post_ratings (
  rating_id INTEGER PRIMARY KEY DEFAULT nextval('post_ratings_rating_id_seq'),
  post_id INTEGER NOT NULL REFERENCES post(post_id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, post_id)
);

-- Step 4: Create the calculation function
CREATE OR REPLACE FUNCTION calculate_post_average_rating(post_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
    avg_rating DECIMAL(3,2);
    rating_count INTEGER;
BEGIN
    SELECT ROUND(AVG(rating), 2), COUNT(*)
    INTO avg_rating, rating_count
    FROM post_ratings
    WHERE post_id = post_id_param;
    
    UPDATE post 
    SET average_rating = CASE WHEN rating_count > 0 THEN avg_rating ELSE NULL END,
        total_ratings = rating_count
    WHERE post_id = post_id_param;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger function
CREATE OR REPLACE FUNCTION update_post_rating_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM calculate_post_average_rating(OLD.post_id);
        RETURN OLD;
    ELSE
        PERFORM calculate_post_average_rating(NEW.post_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create triggers
DROP TRIGGER IF EXISTS post_rating_insert_trigger ON post_ratings;
CREATE TRIGGER post_rating_insert_trigger 
    AFTER INSERT ON post_ratings
    FOR EACH ROW EXECUTE FUNCTION update_post_rating_trigger();

DROP TRIGGER IF EXISTS post_rating_update_trigger ON post_ratings;
CREATE TRIGGER post_rating_update_trigger 
    AFTER UPDATE ON post_ratings
    FOR EACH ROW EXECUTE FUNCTION update_post_rating_trigger();

DROP TRIGGER IF EXISTS post_rating_delete_trigger ON post_ratings;
CREATE TRIGGER post_rating_delete_trigger 
    AFTER DELETE ON post_ratings
    FOR EACH ROW EXECUTE FUNCTION update_post_rating_trigger();

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_post_ratings_post_id ON post_ratings(post_id);
CREATE INDEX IF NOT EXISTS idx_post_ratings_user_id ON post_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_post_ratings_created_at ON post_ratings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_average_rating ON post(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_post_is_rate_enabled ON post(is_rate_enabled);

-- Step 8: Add table comments
COMMENT ON TABLE post_ratings IS 'Stores individual ratings for rate_my_work posts';
COMMENT ON COLUMN post_ratings.rating IS 'Rating value from 1.0 to 5.0';
COMMENT ON COLUMN post_ratings.post_id IS 'Reference to the rated post';
COMMENT ON COLUMN post_ratings.user_id IS 'User who gave the rating';

-- Step 9: Migrate existing data (optional)
UPDATE post 
SET 
    average_rating = CASE 
        WHEN ratingpoint IS NOT NULL AND ratingpoint > 0 THEN ratingpoint 
        ELSE NULL 
    END,
    total_ratings = CASE 
        WHEN ratingpoint IS NOT NULL AND ratingpoint > 0 THEN 1 
        ELSE 0 
    END
WHERE is_rate_enabled = true;

-- Verification queries to run after setup:
-- Check if table exists:
-- SELECT * FROM information_schema.tables WHERE table_name = 'post_ratings';

-- Check new columns:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'post' AND column_name IN ('average_rating', 'total_ratings');

-- Test the system with a sample rating:
-- INSERT INTO post_ratings (post_id, user_id, rating) VALUES (1, 1, 4.5) ON CONFLICT (user_id, post_id) DO UPDATE SET rating = EXCLUDED.rating;
