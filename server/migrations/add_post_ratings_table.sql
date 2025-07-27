/*
 Add post_ratings table and related functionality for rate_my_work posts
 
 This migration adds:
 1. post_ratings table to store individual user ratings for posts
 2. average_rating column to post table
 3. Triggers to automatically calculate and update average ratings
 4. Functions to handle rating calculations
 5. Indexes for performance optimization
*/

-- ----------------------------
-- Sequence structure for post_ratings_rating_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS post_ratings_rating_id_seq CASCADE;
CREATE SEQUENCE post_ratings_rating_id_seq 
INCREMENT BY 1
MINVALUE 1
MAXVALUE 2147483647
START WITH 1
CACHE 1;

-- ----------------------------
-- Table structure for post_ratings
-- ----------------------------
DROP TABLE IF EXISTS post_ratings CASCADE;
CREATE TABLE post_ratings (
  rating_id INTEGER NOT NULL DEFAULT nextval('post_ratings_rating_id_seq'),
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  rating NUMERIC(2,1) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE post_ratings IS 'Stores individual user ratings for rate_my_work posts';
COMMENT ON COLUMN post_ratings.rating IS 'Rating value from 1.0 to 5.0';
COMMENT ON COLUMN post_ratings.post_id IS 'Reference to the post being rated';
COMMENT ON COLUMN post_ratings.user_id IS 'User who gave the rating';

-- ----------------------------
-- Add average_rating column to post table
-- ----------------------------
-- Note: Run these commands only if columns don't exist
-- ALTER TABLE post ADD COLUMN average_rating NUMERIC(3,2) DEFAULT NULL;
-- ALTER TABLE post ADD COLUMN total_ratings INTEGER DEFAULT 0;

-- For existing installations, use these safer commands:
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='post' AND column_name='average_rating') THEN
        ALTER TABLE post ADD COLUMN average_rating NUMERIC(3,2) DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='post' AND column_name='total_ratings') THEN
        ALTER TABLE post ADD COLUMN total_ratings INTEGER DEFAULT 0;
    END IF;
END $$;

COMMENT ON COLUMN post.average_rating IS 'Calculated average rating for rate_my_work posts';
COMMENT ON COLUMN post.total_ratings IS 'Total number of ratings received';

-- ----------------------------
-- Alter sequences owned by
-- ----------------------------
ALTER SEQUENCE post_ratings_rating_id_seq OWNED BY post_ratings.rating_id;

-- ----------------------------
-- Indexes structure for table post_ratings
-- ----------------------------
CREATE INDEX idx_post_ratings_post_id ON post_ratings (post_id);
CREATE INDEX idx_post_ratings_user_id ON post_ratings (user_id);
CREATE INDEX idx_post_ratings_created_at ON post_ratings (created_at DESC);

-- ----------------------------
-- Unique constraint to prevent duplicate ratings from same user
-- ----------------------------
ALTER TABLE post_ratings ADD CONSTRAINT unique_user_post_rating UNIQUE (user_id, post_id);

-- ----------------------------
-- Check constraints
-- ----------------------------
ALTER TABLE post_ratings ADD CONSTRAINT chk_rating_range CHECK (rating >= 1.0 AND rating <= 5.0);
ALTER TABLE post ADD CONSTRAINT chk_average_rating_range CHECK (average_rating IS NULL OR (average_rating >= 1.0 AND average_rating <= 5.0));
ALTER TABLE post ADD CONSTRAINT chk_total_ratings_positive CHECK (total_ratings >= 0);

-- ----------------------------
-- Primary Key structure for table post_ratings
-- ----------------------------
ALTER TABLE post_ratings ADD CONSTRAINT post_ratings_pkey PRIMARY KEY (rating_id);

-- ----------------------------
-- Foreign Keys structure for table post_ratings
-- ----------------------------
ALTER TABLE post_ratings ADD CONSTRAINT fk_post_ratings_post_id 
    FOREIGN KEY (post_id) REFERENCES post (post_id) ON DELETE CASCADE;
ALTER TABLE post_ratings ADD CONSTRAINT fk_post_ratings_user_id 
    FOREIGN KEY (user_id) REFERENCES "user" (user_id) ON DELETE CASCADE;

-- ----------------------------
-- Function to calculate and update post average rating
-- ----------------------------
CREATE OR REPLACE FUNCTION update_post_average_rating(p_post_id INTEGER)
RETURNS VOID AS $$
DECLARE
    avg_rating NUMERIC(3,2);
    rating_count INTEGER;
BEGIN
    -- Calculate average rating and count for the post
    SELECT 
        ROUND(AVG(rating), 2),
        COUNT(*)
    INTO avg_rating, rating_count
    FROM post_ratings
    WHERE post_id = p_post_id;
    
    -- Update the post table with calculated values
    IF rating_count > 0 THEN
        UPDATE post 
        SET 
            average_rating = avg_rating,
            total_ratings = rating_count
        WHERE post_id = p_post_id;
    ELSE
        -- If no ratings, set to NULL and 0
        UPDATE post 
        SET 
            average_rating = NULL,
            total_ratings = 0
        WHERE post_id = p_post_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------
-- Function to handle post rating notifications
-- ----------------------------
CREATE OR REPLACE FUNCTION notify_post_rating()
RETURNS TRIGGER AS $$
DECLARE
    post_owner_id INTEGER;
    rater_name VARCHAR(255);
    post_text_preview TEXT;
    action_text VARCHAR(20);
BEGIN
    -- Get the post owner and rater info
    SELECT p.user_id, u.username, LEFT(p.post_text, 50)
    INTO post_owner_id, rater_name, post_text_preview
    FROM post p
    JOIN "user" u ON u.user_id = NEW.user_id
    WHERE p.post_id = NEW.post_id;
    
    -- Determine if this is a new rating or an update
    IF TG_OP = 'INSERT' THEN
        action_text := 'rated';
    ELSE
        action_text := 'updated their rating for';
    END IF;
    
    -- Create notification (only if not rating own post)
    IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
        PERFORM create_notification(
            post_owner_id,
            NEW.user_id,
            'rating',
            'post',
            NEW.post_id,
            rater_name || ' ' || action_text || ' your post "' || post_text_preview || '..." with ' || NEW.rating || ' stars'
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ----------------------------
-- Function to update timestamp on post_ratings
-- ----------------------------
CREATE OR REPLACE FUNCTION update_post_ratings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------
-- Function for trigger to call update_post_average_rating
-- ----------------------------
CREATE OR REPLACE FUNCTION trigger_update_post_rating()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM update_post_average_rating(OLD.post_id);
        RETURN OLD;
    ELSE
        PERFORM update_post_average_rating(NEW.post_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------
-- Triggers for automatically updating average rating
-- ----------------------------
CREATE TRIGGER trigger_update_post_rating_insert 
    AFTER INSERT ON post_ratings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_post_rating();

CREATE TRIGGER trigger_update_post_rating_update 
    AFTER UPDATE ON post_ratings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_post_rating();

CREATE TRIGGER trigger_update_post_rating_delete 
    AFTER DELETE ON post_ratings
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_post_rating();

-- ----------------------------
-- Triggers for rating notifications
-- ----------------------------
CREATE TRIGGER trigger_notify_post_rating_insert 
    AFTER INSERT ON post_ratings
    FOR EACH ROW
    EXECUTE FUNCTION notify_post_rating();

CREATE TRIGGER trigger_notify_post_rating_update 
    AFTER UPDATE ON post_ratings
    FOR EACH ROW
    EXECUTE FUNCTION notify_post_rating();

-- ----------------------------
-- Trigger to update timestamp on post_ratings changes
-- ----------------------------
CREATE TRIGGER trigger_update_post_ratings_timestamp 
    BEFORE UPDATE ON post_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_post_ratings_timestamp();

-- ----------------------------
-- Initialize average ratings for existing posts
-- ----------------------------
-- Update average ratings for any existing rate_my_work posts that might have ratings in the old format
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

-- ----------------------------
-- Create indexes on post table for performance
-- ----------------------------
CREATE INDEX IF NOT EXISTS idx_post_is_rate_enabled ON post (is_rate_enabled);
CREATE INDEX IF NOT EXISTS idx_post_average_rating ON post (average_rating DESC NULLS LAST);

-- ----------------------------
-- Set sequence to start from 1
-- ----------------------------
SELECT setval('post_ratings_rating_id_seq', 1, false);

-- ----------------------------
-- Function to calculate and update post average rating
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."update_post_average_rating"(int4);
CREATE FUNCTION "public"."update_post_average_rating"("p_post_id" int4)
  RETURNS "pg_catalog"."void" AS $BODY$
DECLARE
    avg_rating NUMERIC(3,2);
    rating_count INTEGER;
BEGIN
    -- Calculate average rating and count for the post
    SELECT 
        ROUND(AVG(rating), 2),
        COUNT(*)
    INTO avg_rating, rating_count
    FROM post_ratings
    WHERE post_id = p_post_id;
    
    -- Update the post table with calculated values
    IF rating_count > 0 THEN
        UPDATE post 
        SET 
            average_rating = avg_rating,
            total_ratings = rating_count
        WHERE post_id = p_post_id;
    ELSE
        -- If no ratings, set to NULL and 0
        UPDATE post 
        SET 
            average_rating = NULL,
            total_ratings = 0
        WHERE post_id = p_post_id;
    END IF;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- ----------------------------
-- Function to handle post rating notifications
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."notify_post_rating"();
CREATE FUNCTION "public"."notify_post_rating"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
DECLARE
    post_owner_id INTEGER;
    rater_name VARCHAR(255);
    post_text_preview TEXT;
    action_text VARCHAR(20);
BEGIN
    -- Get the post owner and rater info
    SELECT p.user_id, u.username, LEFT(p.post_text, 50)
    INTO post_owner_id, rater_name, post_text_preview
    FROM post p
    JOIN "user" u ON u.user_id = NEW.user_id
    WHERE p.post_id = NEW.post_id;
    
    -- Determine if this is a new rating or an update
    IF TG_OP = 'INSERT' THEN
        action_text := 'rated';
    ELSE
        action_text := 'updated their rating for';
    END IF;
    
    -- Create notification (only if not rating own post)
    IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
        PERFORM create_notification(
            post_owner_id,
            NEW.user_id,
            'rating',
            'post',
            NEW.post_id,
            rater_name || ' ' || action_text || ' your post "' || post_text_preview || '..." with ' || NEW.rating || ' stars'
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- ----------------------------
-- Function to update timestamp on post_ratings
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."update_post_ratings_timestamp"();
CREATE FUNCTION "public"."update_post_ratings_timestamp"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- ----------------------------
-- Trigger to automatically update average rating when rating is added/updated/deleted
-- ----------------------------
DROP TRIGGER IF EXISTS "trigger_update_post_rating_insert" ON "public"."post_ratings";
CREATE TRIGGER "trigger_update_post_rating_insert" 
    AFTER INSERT ON "public"."post_ratings"
    FOR EACH ROW
    EXECUTE PROCEDURE "public"."update_post_average_rating"(NEW.post_id);

DROP TRIGGER IF EXISTS "trigger_update_post_rating_update" ON "public"."post_ratings";
CREATE TRIGGER "trigger_update_post_rating_update" 
    AFTER UPDATE ON "public"."post_ratings"
    FOR EACH ROW
    EXECUTE PROCEDURE "public"."update_post_average_rating"(NEW.post_id);

DROP TRIGGER IF EXISTS "trigger_update_post_rating_delete" ON "public"."post_ratings";
CREATE TRIGGER "trigger_update_post_rating_delete" 
    AFTER DELETE ON "public"."post_ratings"
    FOR EACH ROW
    EXECUTE PROCEDURE "public"."update_post_average_rating"(OLD.post_id);

-- ----------------------------
-- Trigger for rating notifications
-- ----------------------------
DROP TRIGGER IF EXISTS "trigger_notify_post_rating_insert" ON "public"."post_ratings";
CREATE TRIGGER "trigger_notify_post_rating_insert" 
    AFTER INSERT ON "public"."post_ratings"
    FOR EACH ROW
    EXECUTE PROCEDURE "public"."notify_post_rating"();

DROP TRIGGER IF EXISTS "trigger_notify_post_rating_update" ON "public"."post_ratings";
CREATE TRIGGER "trigger_notify_post_rating_update" 
    AFTER UPDATE ON "public"."post_ratings"
    FOR EACH ROW
    EXECUTE PROCEDURE "public"."notify_post_rating"();

-- ----------------------------
-- Trigger to update timestamp on post_ratings changes
-- ----------------------------
DROP TRIGGER IF EXISTS "trigger_update_post_ratings_timestamp" ON "public"."post_ratings";
CREATE TRIGGER "trigger_update_post_ratings_timestamp" 
    BEFORE UPDATE ON "public"."post_ratings"
    FOR EACH ROW
    EXECUTE PROCEDURE "public"."update_post_ratings_timestamp"();

-- ----------------------------
-- Initialize average ratings for existing posts
-- ----------------------------
-- Update average ratings for any existing rate_my_work posts that might have ratings in the old format
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

-- ----------------------------
-- Create indexes on post table for performance
-- ----------------------------
CREATE INDEX IF NOT EXISTS "idx_post_is_rate_enabled" ON "public"."post" USING btree (
  "is_rate_enabled" "pg_catalog"."bool_ops" ASC NULLS LAST
);
CREATE INDEX IF NOT EXISTS "idx_post_average_rating" ON "public"."post" USING btree (
  "average_rating" "pg_catalog"."numeric_ops" DESC NULLS LAST
);

COMMENT ON INDEX "public"."idx_post_is_rate_enabled" IS 'Index for filtering rate_my_work posts';
COMMENT ON INDEX "public"."idx_post_average_rating" IS 'Index for sorting posts by rating';
