-- Manual Database Setup for Post Ratings System
-- Run these commands in your PostgreSQL database client (pgAdmin, DBeaver, etc.)
-- Based on your exact schema structure

-- STEP 1: Add new columns to post table
ALTER TABLE "public"."post" ADD COLUMN IF NOT EXISTS "average_rating" numeric(3,2) DEFAULT NULL;
ALTER TABLE "public"."post" ADD COLUMN IF NOT EXISTS "total_ratings" int4 DEFAULT 0;

-- STEP 2: Create sequence for post_ratings
DROP SEQUENCE IF EXISTS "public"."post_ratings_rating_id_seq";
CREATE SEQUENCE "public"."post_ratings_rating_id_seq" 
INCREMENT BY 1
MINVALUE 1
MAXVALUE 2147483647
START WITH 1
CACHE 1;

-- STEP 3: Create post_ratings table
DROP TABLE IF EXISTS "public"."post_ratings";
CREATE TABLE "public"."post_ratings" (
  "rating_id" int4 NOT NULL DEFAULT nextval('"post_ratings_rating_id_seq"'::regclass),
  "post_id" int4 NOT NULL,
  "user_id" int4 NOT NULL,
  "rating" numeric(2,1) NOT NULL,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
);

-- STEP 4: Add primary key and constraints
ALTER TABLE "public"."post_ratings" ADD CONSTRAINT "post_ratings_pkey" PRIMARY KEY ("rating_id");
ALTER TABLE "public"."post_ratings" ADD CONSTRAINT "unique_user_post_rating" UNIQUE ("user_id", "post_id");
ALTER TABLE "public"."post_ratings" ADD CONSTRAINT "chk_rating_range" CHECK (rating >= 1.0 AND rating <= 5.0);

-- STEP 5: Add foreign key constraints
ALTER TABLE "public"."post_ratings" ADD CONSTRAINT "fk_post_ratings_post_id" 
FOREIGN KEY ("post_id") REFERENCES "public"."post" ("post_id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "public"."post_ratings" ADD CONSTRAINT "fk_post_ratings_user_id" 
FOREIGN KEY ("user_id") REFERENCES "public"."user" ("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- STEP 6: Create indexes for performance
CREATE INDEX "idx_post_ratings_post_id" ON "public"."post_ratings" USING btree ("post_id" "pg_catalog"."int4_ops" ASC NULLS LAST);
CREATE INDEX "idx_post_ratings_user_id" ON "public"."post_ratings" USING btree ("user_id" "pg_catalog"."int4_ops" ASC NULLS LAST);
CREATE INDEX "idx_post_ratings_created_at" ON "public"."post_ratings" USING btree ("created_at" "pg_catalog"."timestamp_ops" DESC NULLS FIRST);
CREATE INDEX "idx_post_ratings_rating" ON "public"."post_ratings" USING btree ("rating" "pg_catalog"."numeric_ops" DESC NULLS LAST);

-- STEP 7: Create proper trigger function that works without parameters
DROP FUNCTION IF EXISTS "public"."calculate_post_average_rating"(int4);
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

-- STEP 8: Create function for updating timestamps
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

-- STEP 9: Create function for notifications (uses your existing create_notification function)
DROP FUNCTION IF EXISTS "public"."notify_post_rating"();
CREATE OR REPLACE FUNCTION "public"."notify_post_rating"()
  RETURNS TRIGGER AS $BODY$
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
        -- Create notification using your existing create_notification function
        SELECT create_notification(
            post_owner_id,                    -- recipient_user_id
            NEW.user_id,                     -- actor_user_id  
            'rating',                        -- notification_type
            'post',                          -- entity_type
            NEW.post_id,                     -- entity_id
            rater_name || ' rated your post "' || COALESCE(post_preview, 'your content') || '..." with ' || NEW.rating || ' stars'  -- message
        ) INTO notification_result;
    END IF;
    
    RETURN NEW;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- STEP 10: Create working triggers (fixed version)
-- Drop any existing problematic triggers first
DROP TRIGGER IF EXISTS "trigger_calculate_rating_on_insert" ON "public"."post_ratings";
DROP TRIGGER IF EXISTS "trigger_calculate_rating_on_update" ON "public"."post_ratings";
DROP TRIGGER IF EXISTS "trigger_calculate_rating_on_delete" ON "public"."post_ratings";

-- Create the timestamp update trigger
CREATE TRIGGER "trigger_update_post_ratings_timestamp" 
BEFORE UPDATE ON "public"."post_ratings"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_post_ratings_timestamp"();

-- Create the notification trigger
CREATE TRIGGER "trigger_post_rating_notification" 
AFTER INSERT ON "public"."post_ratings"
FOR EACH ROW
EXECUTE PROCEDURE "public"."notify_post_rating"();

-- Create the working rating calculation triggers
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

-- STEP 11: Set sequence ownership
ALTER SEQUENCE "public"."post_ratings_rating_id_seq"
OWNED BY "public"."post_ratings"."rating_id";

-- Set initial sequence value
SELECT setval('"public"."post_ratings_rating_id_seq"', 1, false);

-- STEP 12: Initialize existing posts with rating data
UPDATE post 
SET 
    average_rating = CASE WHEN ratingpoint IS NOT NULL THEN ratingpoint ELSE NULL END,
    total_ratings = CASE WHEN ratingpoint IS NOT NULL THEN 1 ELSE 0 END
WHERE average_rating IS NULL OR total_ratings IS NULL;

-- STEP 13: Add table documentation
COMMENT ON TABLE "public"."post_ratings" IS 'Stores individual user ratings for rate_my_work posts';
COMMENT ON COLUMN "public"."post_ratings"."rating" IS 'Rating value from 1.0 to 5.0';
COMMENT ON COLUMN "public"."post_ratings"."post_id" IS 'Reference to the post being rated';
COMMENT ON COLUMN "public"."post_ratings"."user_id" IS 'User who gave the rating';

-- Verification query - run this to check if everything was created correctly
SELECT 
    'post_ratings' as table_name,
    COUNT(*) as row_count
FROM post_ratings
UNION ALL
SELECT 
    'post_with_new_columns' as table_name,
    COUNT(*) as posts_with_rating_columns
FROM post 
WHERE average_rating IS NOT NULL OR total_ratings IS NOT NULL;

-- Show the new table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'post_ratings' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Show the updated post table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'post' 
    AND table_schema = 'public'
    AND column_name IN ('average_rating', 'total_ratings')
ORDER BY ordinal_position;
