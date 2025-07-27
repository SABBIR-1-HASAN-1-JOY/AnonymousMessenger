-- Post Ratings Migration Script
-- This script adds the post_ratings table and related functionality

-- Create the post_ratings table
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

-- Add columns to post table (only if they don't exist)
-- You may need to run these manually if the table already has data
-- ALTER TABLE post ADD COLUMN average_rating DECIMAL(3,2) CHECK (average_rating IS NULL OR (average_rating >= 1.0 AND average_rating <= 5.0));
-- ALTER TABLE post ADD COLUMN total_ratings INTEGER DEFAULT 0 CHECK (total_ratings >= 0);

-- Function to calculate and update average rating
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

-- Trigger function for automatic rating updates
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

-- Create triggers
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_ratings_post_id ON post_ratings(post_id);
CREATE INDEX IF NOT EXISTS idx_post_ratings_user_id ON post_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_post_ratings_created_at ON post_ratings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_average_rating ON post(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_post_is_rate_enabled ON post(is_rate_enabled);

-- Comments for documentation
COMMENT ON TABLE post_ratings IS 'Stores individual ratings for rate_my_work posts';
COMMENT ON COLUMN post_ratings.rating IS 'Rating value from 1.0 to 5.0';
COMMENT ON COLUMN post_ratings.post_id IS 'Reference to the rated post';
COMMENT ON COLUMN post_ratings.user_id IS 'User who gave the rating';
