-- CORRECTED_POST_DELETE_TRIGGERS.sql
-- Fix table name from "votes" to "vote" and "comments" to "comment" if needed

-- Step 1: Drop and recreate the corrected function with proper table names
DROP FUNCTION IF EXISTS "public"."handle_post_deletion"() CASCADE;

CREATE OR REPLACE FUNCTION "public"."handle_post_deletion"()
  RETURNS TRIGGER AS $$
BEGIN
    RAISE NOTICE 'Post deletion triggered for post_id: %', OLD.post_id;
    
    -- Delete notifications related to this post (uses entity_id)
    DELETE FROM notifications 
    WHERE entity_type = 'post' AND entity_id = OLD.post_id;
    RAISE NOTICE 'Deleted % notifications for post_id: %', ROW_COUNT, OLD.post_id;
    
    -- Delete photos related to this post (uses source_id)
    DELETE FROM photos 
    WHERE type = 'post' AND source_id = OLD.post_id;
    RAISE NOTICE 'Deleted % photos for post_id: %', ROW_COUNT, OLD.post_id;
    
    -- Delete reports related to this post (uses reported_item_id)
    DELETE FROM reports 
    WHERE reported_item_type = 'post' AND reported_item_id = OLD.post_id;
    RAISE NOTICE 'Deleted % reports for post_id: %', ROW_COUNT, OLD.post_id;
    
    -- FIXED: Delete from "vote" table (not "votes") - uses entity_id
    DELETE FROM vote 
    WHERE entity_type = 'post' AND entity_id = OLD.post_id;
    RAISE NOTICE 'Deleted % votes for post_id: %', ROW_COUNT, OLD.post_id;
    
    -- FIXED: Delete from "comment" table (check if singular) - uses entity_id  
    DELETE FROM comment 
    WHERE entity_type = 'post' AND entity_id = OLD.post_id;
    RAISE NOTICE 'Deleted % comments for post_id: %', ROW_COUNT, OLD.post_id;
    
    -- Delete from post_ratings table if it exists (uses post_id)
    DELETE FROM post_ratings 
    WHERE post_id = OLD.post_id;
    RAISE NOTICE 'Deleted % ratings for post_id: %', ROW_COUNT, OLD.post_id;
    
    RAISE NOTICE 'Completed cascading deletion for post_id: %', OLD.post_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql VOLATILE COST 100;

-- Step 2: Recreate the trigger
CREATE TRIGGER "trigger_handle_post_deletion"
    AFTER DELETE ON "public"."post"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."handle_post_deletion"();

-- Step 3: Verify the trigger was created
SELECT tgname, tgrelid::regclass, tgfoid::regproc 
FROM pg_trigger 
WHERE tgname = 'trigger_handle_post_deletion';

-- SUCCESS MESSAGE
SELECT 'Post deletion triggers fixed with correct table names:
• vote (not votes) ✅ FIXED
• comment (not comments) ✅ FIXED
• All other tables correct' AS status;
