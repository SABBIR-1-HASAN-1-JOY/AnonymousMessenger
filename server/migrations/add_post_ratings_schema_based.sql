-- Migration: Add post_ratings table based on the provided schema structure
-- This migration is designed to work with the exact schema structure provided

-- ----------------------------
-- Sequence structure for post_ratings_rating_id_seq
-- ----------------------------
DROP SEQUENCE IF EXISTS "public"."post_ratings_rating_id_seq";
CREATE SEQUENCE "public"."post_ratings_rating_id_seq" 
INCREMENT BY 1
MINVALUE 1
MAXVALUE 2147483647
START WITH 1
CACHE 1;

-- ----------------------------
-- Table structure for post_ratings
-- ----------------------------
DROP TABLE IF EXISTS "public"."post_ratings";
CREATE TABLE "public"."post_ratings" (
  "rating_id" int4 NOT NULL DEFAULT nextval('post_ratings_rating_id_seq'::regclass),
  "post_id" int4 NOT NULL,
  "user_id" int4 NOT NULL,
  "rating" numeric(2,1) NOT NULL,
  "created_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp(6) DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------
-- Add new columns to post table for rating aggregation
-- ----------------------------
ALTER TABLE "public"."post" ADD COLUMN IF NOT EXISTS "average_rating" numeric(3,2) DEFAULT NULL;
ALTER TABLE "public"."post" ADD COLUMN IF NOT EXISTS "total_ratings" int4 DEFAULT 0;

-- ----------------------------
-- Function to calculate post average rating
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."calculate_post_average_rating"(int4);
CREATE FUNCTION "public"."calculate_post_average_rating"("p_post_id" int4)
  RETURNS VOID AS $BODY$
DECLARE
    avg_rating NUMERIC(3,2);
    rating_count INTEGER;
BEGIN
    SELECT AVG(rating), COUNT(rating)
    INTO avg_rating, rating_count
    FROM post_ratings
    WHERE post_id = p_post_id;
    
    UPDATE post 
    SET 
        average_rating = ROUND(avg_rating, 2),
        total_ratings = rating_count,
        ratingpoint = ROUND(avg_rating, 1)  -- Keep ratingpoint in sync with existing schema
    WHERE post_id = p_post_id;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- ----------------------------
-- Function for updating post ratings timestamp
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
-- Function for post rating notifications (uses existing create_notification function)
-- ----------------------------
DROP FUNCTION IF EXISTS "public"."notify_post_rating"();
CREATE FUNCTION "public"."notify_post_rating"()
  RETURNS "pg_catalog"."trigger" AS $BODY$
DECLARE
    post_owner_id INTEGER;
    rater_name VARCHAR(255);
    post_preview TEXT;
BEGIN
    -- Get the post owner and rater info
    SELECT p.user_id, u.username, LEFT(p.post_text, 50)
    INTO post_owner_id, rater_name, post_preview
    FROM post p
    JOIN "user" u ON u.user_id = NEW.user_id
    WHERE p.post_id = NEW.post_id;
    
    -- Create notification using existing create_notification function
    IF post_owner_id IS NOT NULL AND post_owner_id != NEW.user_id THEN
        PERFORM create_notification(
            post_owner_id,
            NEW.user_id,
            'rating',
            'post',
            NEW.post_id,
            rater_name || ' rated your post "' || post_preview || '..." with ' || NEW.rating || ' stars'
        );
    END IF;
    
    RETURN NEW;
END;
$BODY$
  LANGUAGE plpgsql VOLATILE
  COST 100;

-- ----------------------------
-- Indexes for post_ratings table
-- ----------------------------
CREATE INDEX "idx_post_ratings_post_id" ON "public"."post_ratings" USING btree (
  "post_id" "pg_catalog"."int4_ops" ASC NULLS LAST
);

CREATE INDEX "idx_post_ratings_user_id" ON "public"."post_ratings" USING btree (
  "user_id" "pg_catalog"."int4_ops" ASC NULLS LAST
);

CREATE INDEX "idx_post_ratings_created_at" ON "public"."post_ratings" USING btree (
  "created_at" "pg_catalog"."timestamp_ops" DESC NULLS FIRST
);

CREATE INDEX "idx_post_ratings_rating" ON "public"."post_ratings" USING btree (
  "rating" "pg_catalog"."numeric_ops" DESC NULLS LAST
);

-- ----------------------------
-- Triggers for post_ratings table
-- ----------------------------
CREATE TRIGGER "trigger_update_post_ratings_timestamp" 
BEFORE UPDATE ON "public"."post_ratings"
FOR EACH ROW
EXECUTE PROCEDURE "public"."update_post_ratings_timestamp"();

CREATE TRIGGER "trigger_post_rating_notification" 
AFTER INSERT ON "public"."post_ratings"
FOR EACH ROW
EXECUTE PROCEDURE "public"."notify_post_rating"();

CREATE TRIGGER "trigger_calculate_rating_on_insert" 
AFTER INSERT ON "public"."post_ratings"
FOR EACH ROW
EXECUTE PROCEDURE "public"."calculate_post_average_rating"(NEW.post_id);

CREATE TRIGGER "trigger_calculate_rating_on_update" 
AFTER UPDATE ON "public"."post_ratings"
FOR EACH ROW
EXECUTE PROCEDURE "public"."calculate_post_average_rating"(NEW.post_id);

CREATE TRIGGER "trigger_calculate_rating_on_delete" 
AFTER DELETE ON "public"."post_ratings"
FOR EACH ROW
EXECUTE PROCEDURE "public"."calculate_post_average_rating"(OLD.post_id);

-- ----------------------------
-- Primary Key structure for table post_ratings
-- ----------------------------
ALTER TABLE "public"."post_ratings" ADD CONSTRAINT "post_ratings_pkey" PRIMARY KEY ("rating_id");

-- ----------------------------
-- Unique constraint to prevent multiple ratings from same user on same post
-- ----------------------------
ALTER TABLE "public"."post_ratings" ADD CONSTRAINT "unique_user_post_rating" UNIQUE ("user_id", "post_id");

-- ----------------------------
-- Check constraints for post_ratings table
-- ----------------------------
ALTER TABLE "public"."post_ratings" ADD CONSTRAINT "chk_rating_range" CHECK (rating >= 1.0 AND rating <= 5.0);

-- ----------------------------
-- Foreign Keys structure for table post_ratings
-- ----------------------------
ALTER TABLE "public"."post_ratings" ADD CONSTRAINT "fk_post_ratings_post_id" 
FOREIGN KEY ("post_id") REFERENCES "public"."post" ("post_id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "public"."post_ratings" ADD CONSTRAINT "fk_post_ratings_user_id" 
FOREIGN KEY ("user_id") REFERENCES "public"."user" ("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------
-- Alter sequence ownership
-- ----------------------------
ALTER SEQUENCE "public"."post_ratings_rating_id_seq"
OWNED BY "public"."post_ratings"."rating_id";

-- Set initial sequence value
SELECT setval('"public"."post_ratings_rating_id_seq"', 1, false);

-- ----------------------------
-- Initialize existing posts with rating data
-- ----------------------------
DO $$
DECLARE
    post_record RECORD;
BEGIN
    -- Update existing posts to have consistent rating data
    UPDATE post 
    SET 
        average_rating = CASE WHEN ratingpoint IS NOT NULL THEN ratingpoint ELSE NULL END,
        total_ratings = CASE WHEN ratingpoint IS NOT NULL THEN 1 ELSE 0 END
    WHERE average_rating IS NULL OR total_ratings IS NULL;
    
    RAISE NOTICE 'Post ratings table created and initialized successfully';
    RAISE NOTICE 'Added % ratings tracking to existing posts', (SELECT COUNT(*) FROM post WHERE ratingpoint IS NOT NULL);
END $$;

COMMENT ON TABLE "public"."post_ratings" IS 'Stores individual user ratings for rate_my_work posts';
COMMENT ON COLUMN "public"."post_ratings"."rating" IS 'Rating value from 1.0 to 5.0';
COMMENT ON COLUMN "public"."post_ratings"."post_id" IS 'Reference to the post being rated';
COMMENT ON COLUMN "public"."post_ratings"."user_id" IS 'User who gave the rating';
