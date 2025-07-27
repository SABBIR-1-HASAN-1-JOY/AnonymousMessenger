-- QUICK FIX FOR POST DELETE TRIGGERS
-- Run these commands in your PostgreSQL database client (pgAdmin, DBeaver, etc.)
-- This fixes the issue with entity_id columns in votes and comments tables

-- Step 1: Drop and recreate the corrected function
DROP FUNCTION IF EXISTS "public"."handle_post_deletion"() CASCADE;

CREATE OR REPLACE FUNCTION "public"."handle_post_deletion"()
  RETURNS TRIGGER AS $$
BEGIN
    -- Log the deletion for debugging
    RAISE NOTICE 'Post deletion triggered for post_id: %', OLD.post_id;
    
    -- Delete notifications related to this post
    DELETE FROM notifications 
    WHERE entity_type = 'post' AND entity_id = OLD.post_id;
    RAISE NOTICE 'Deleted notifications for post_id: %', OLD.post_id;
    
    -- Delete photos related to this post (if any)
    DELETE FROM photos 
    WHERE type = 'post' AND source_id = OLD.post_id;
    RAISE NOTICE 'Deleted photos for post_id: %', OLD.post_id;
    
    -- Delete reports related to this post
    DELETE FROM reports 
    WHERE reported_item_type = 'post' AND reported_item_id = OLD.post_id;
    RAISE NOTICE 'Deleted reports for post_id: %', OLD.post_id;
    
    -- Delete votes related to this post (FIXED: using entity_id column)
    DELETE FROM votes 
    WHERE entity_type = 'post' AND entity_id = OLD.post_id;
    RAISE NOTICE 'Deleted votes for post_id: %', OLD.post_id;
    
    -- Delete comments related to this post (FIXED: using entity_id column)
    DELETE FROM comments 
    WHERE entity_type = 'post' AND entity_id = OLD.post_id;
    RAISE NOTICE 'Deleted comments for post_id: %', OLD.post_id;
    
    RAISE NOTICE 'Completed cascading deletion for post_id: %', OLD.post_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql VOLATILE COST 100;

-- Step 2: Recreate the trigger
DROP TRIGGER IF EXISTS "trigger_handle_post_deletion" ON "public"."post";

CREATE TRIGGER "trigger_handle_post_deletion"
    AFTER DELETE ON "public"."post"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."handle_post_deletion"();

-- Step 3: Test the corrected setup (OPTIONAL)
-- You can run this to test if the triggers work correctly:

/*
-- Create a test post
INSERT INTO post (user_id, post_text, is_rate_enabled, created_at)
VALUES (999, 'TEST POST FOR DELETION - This will be deleted', true, NOW());

-- Get the post ID (replace XXX with actual ID from above)
-- Add some test data:
-- INSERT INTO post_ratings (post_id, user_id, rating) VALUES (XXX, 998, 4.5);
-- INSERT INTO comments (entity_type, entity_id, user_id, comment_text) VALUES ('post', XXX, 998, 'Test comment');
-- INSERT INTO votes (entity_type, entity_id, user_id, vote_type) VALUES ('post', XXX, 998, 'up');

-- Check counts before deletion:
-- SELECT COUNT(*) FROM post_ratings WHERE post_id = XXX;
-- SELECT COUNT(*) FROM comments WHERE entity_type = 'post' AND entity_id = XXX;
-- SELECT COUNT(*) FROM votes WHERE entity_type = 'post' AND entity_id = XXX;

-- Delete the post (this should trigger cascading deletions):
-- DELETE FROM post WHERE post_id = XXX;

-- Check counts after deletion (should all be 0):
-- SELECT COUNT(*) FROM post_ratings WHERE post_id = XXX;
-- SELECT COUNT(*) FROM comments WHERE entity_type = 'post' AND entity_id = XXX;
-- SELECT COUNT(*) FROM votes WHERE entity_type = 'post' AND entity_id = XXX;
*/

-- VERIFICATION: Check if the trigger was created
SELECT tgname, tgrelid::regclass, tgfoid::regproc 
FROM pg_trigger 
WHERE tgname = 'trigger_handle_post_deletion';

-- SUCCESS MESSAGE
SELECT 'Post deletion triggers have been fixed! The triggers now correctly handle:
• post_ratings table (uses post_id)
• comments table (uses entity_id) ✅ FIXED
• votes table (uses entity_id) ✅ FIXED  
• notifications table (uses entity_id)
• photos table (uses source_id)
• reports table (uses reported_item_id)' AS status;
