-- MANUAL POST DELETE TRIGGERS SETUP
-- Copy and paste these commands one by one in your PostgreSQL database client
-- (pgAdmin, DBeaver, etc.)

-- ==================================================
-- STEP 1: Create cascading deletion function
-- ==================================================

DROP FUNCTION IF EXISTS "public"."handle_post_deletion"() CASCADE;

CREATE OR REPLACE FUNCTION "public"."handle_post_deletion"()
  RETURNS TRIGGER AS $$
BEGIN
    -- Log the deletion for debugging
    RAISE NOTICE 'Post deletion triggered for post_id: %', OLD.post_id;
    
    -- Delete notifications related to this post
    DELETE FROM notifications 
    WHERE entity_type = 'post' AND entity_id = OLD.post_id;
    
    -- Delete photos related to this post (if any)
    DELETE FROM photos 
    WHERE type = 'post' AND source_id = OLD.post_id;
    
    -- Delete reports related to this post
    DELETE FROM reports 
    WHERE reported_item_type = 'post' AND reported_item_id = OLD.post_id;
    
    -- Delete votes related to this post
    DELETE FROM votes 
    WHERE entity_type = 'post' AND entity_id = OLD.post_id;
    
    -- Delete comments related to this post
    DELETE FROM comments 
    WHERE entity_type = 'post' AND entity_id = OLD.post_id;
    
    RAISE NOTICE 'Completed cascading deletion for post_id: %', OLD.post_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql VOLATILE COST 100;

-- ==================================================
-- STEP 2: Create deletion trigger
-- ==================================================

DROP TRIGGER IF EXISTS "trigger_handle_post_deletion" ON "public"."post";

CREATE TRIGGER "trigger_handle_post_deletion"
    AFTER DELETE ON "public"."post"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."handle_post_deletion"();

-- ==================================================
-- STEP 3: Update foreign key constraints with CASCADE
-- ==================================================

-- Update post_ratings foreign key constraint
ALTER TABLE "public"."post_ratings" 
DROP CONSTRAINT IF EXISTS "fk_post_ratings_post_id";

ALTER TABLE "public"."post_ratings" 
ADD CONSTRAINT "fk_post_ratings_post_id" 
FOREIGN KEY ("post_id") 
REFERENCES "public"."post" ("post_id") 
ON DELETE CASCADE ON UPDATE NO ACTION;

-- ==================================================
-- STEP 4: Create cleanup function for orphaned data
-- ==================================================

DROP FUNCTION IF EXISTS "public"."cleanup_orphaned_post_data"() CASCADE;

CREATE OR REPLACE FUNCTION "public"."cleanup_orphaned_post_data"()
  RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Clean up orphaned post_ratings
    DELETE FROM post_ratings WHERE post_id NOT IN (SELECT post_id FROM post);
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    RAISE NOTICE 'Deleted % orphaned post_ratings', temp_count;
    
    -- Clean up orphaned comments for posts
    DELETE FROM comments 
    WHERE entity_type = 'post' 
    AND entity_id NOT IN (SELECT post_id FROM post);
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    RAISE NOTICE 'Deleted % orphaned comments', temp_count;
    
    -- Clean up orphaned votes for posts
    DELETE FROM votes 
    WHERE entity_type = 'post' 
    AND entity_id NOT IN (SELECT post_id FROM post);
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    RAISE NOTICE 'Deleted % orphaned votes', temp_count;
    
    -- Clean up orphaned notifications for posts
    DELETE FROM notifications 
    WHERE entity_type = 'post' 
    AND entity_id NOT IN (SELECT post_id FROM post);
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    RAISE NOTICE 'Deleted % orphaned notifications', temp_count;
    
    -- Clean up orphaned photos for posts
    DELETE FROM photos 
    WHERE type = 'post' 
    AND source_id NOT IN (SELECT post_id FROM post);
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    RAISE NOTICE 'Deleted % orphaned photos', temp_count;
    
    -- Clean up orphaned reports for posts
    DELETE FROM reports 
    WHERE reported_item_type = 'post' 
    AND reported_item_id NOT IN (SELECT post_id FROM post);
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    RAISE NOTICE 'Deleted % orphaned reports', temp_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql VOLATILE COST 100;

-- ==================================================
-- STEP 5: Test the setup (OPTIONAL)
-- ==================================================

-- Create test function
DROP FUNCTION IF EXISTS "public"."test_post_deletion_cascade"() CASCADE;

CREATE OR REPLACE FUNCTION "public"."test_post_deletion_cascade"()
  RETURNS TEXT AS $$
DECLARE
    test_post_id INTEGER;
    test_user_id INTEGER := 999; -- Using a test user ID
    result_text TEXT := '';
    rating_count INTEGER := 0;
    notification_count INTEGER := 0;
    rating_count_after INTEGER := 0;
    notification_count_after INTEGER := 0;
BEGIN
    -- Create a test post
    INSERT INTO post (user_id, post_text, is_rate_enabled, created_at)
    VALUES (test_user_id, 'Test post for deletion cascade test', true, NOW())
    RETURNING post_id INTO test_post_id;
    
    result_text := result_text || 'Created test post with ID: ' || test_post_id || E'\n';
    
    -- Add a test rating (if post_ratings table exists)
    BEGIN
        INSERT INTO post_ratings (post_id, user_id, rating)
        VALUES (test_post_id, test_user_id + 1, 4.5);
        result_text := result_text || 'Added test rating' || E'\n';
    EXCEPTION
        WHEN OTHERS THEN
            result_text := result_text || 'Could not add test rating: ' || SQLERRM || E'\n';
    END;
    
    -- Add a test notification (if notifications table exists)
    BEGIN
        INSERT INTO notifications (user_id, entity_type, entity_id, message, created_at)
        VALUES (test_user_id, 'post', test_post_id, 'Test notification', NOW());
        result_text := result_text || 'Added test notification' || E'\n';
    EXCEPTION
        WHEN OTHERS THEN
            result_text := result_text || 'Could not add test notification: ' || SQLERRM || E'\n';
    END;
    
    -- Count related records before deletion
    SELECT COUNT(*) INTO rating_count FROM post_ratings WHERE post_id = test_post_id;
    SELECT COUNT(*) INTO notification_count FROM notifications WHERE entity_type = 'post' AND entity_id = test_post_id;
    
    result_text := result_text || 'Before deletion - Ratings: ' || rating_count || ', Notifications: ' || notification_count || E'\n';
    
    -- Delete the test post (this should trigger cascading deletions)
    DELETE FROM post WHERE post_id = test_post_id;
    result_text := result_text || 'Deleted test post' || E'\n';
    
    -- Count related records after deletion
    SELECT COUNT(*) INTO rating_count_after FROM post_ratings WHERE post_id = test_post_id;
    SELECT COUNT(*) INTO notification_count_after FROM notifications WHERE entity_type = 'post' AND entity_id = test_post_id;
    
    result_text := result_text || 'After deletion - Ratings: ' || rating_count_after || ', Notifications: ' || notification_count_after || E'\n';
    
    IF rating_count_after = 0 AND notification_count_after = 0 THEN
        result_text := result_text || 'SUCCESS: All related records were properly deleted!' || E'\n';
    ELSE
        result_text := result_text || 'WARNING: Some related records were not deleted' || E'\n';
    END IF;
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql VOLATILE COST 100;

-- ==================================================
-- TEST COMMANDS (Run these to test the setup)
-- ==================================================

-- Test the cascading deletion
-- SELECT test_post_deletion_cascade();

-- Clean up any orphaned data
-- SELECT cleanup_orphaned_post_data();

-- ==================================================
-- VERIFICATION QUERIES
-- ==================================================

-- Check if functions were created
-- SELECT proname FROM pg_proc WHERE proname LIKE '%post%deletion%' OR proname LIKE '%cleanup%post%';

-- Check if trigger was created
-- SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_handle_post_deletion';

-- Check foreign key constraints
-- SELECT conname, confdeltype FROM pg_constraint WHERE conname LIKE '%post_ratings%';

-- ==================================================
-- SUMMARY
-- ==================================================
/*
After running these commands:

1. ✅ Created handle_post_deletion() function
2. ✅ Created trigger_handle_post_deletion trigger  
3. ✅ Updated foreign key constraints with CASCADE
4. ✅ Created cleanup_orphaned_post_data() function
5. ✅ Created test_post_deletion_cascade() function

When a post is deleted, the following will be automatically removed:
• Post ratings (post_ratings table)
• Comments on the post (comments table) 
• Votes on the post (votes table)
• Notifications about the post (notifications table)
• Photos attached to the post (photos table)
• Reports about the post (reports table)

To test: SELECT test_post_deletion_cascade();
To cleanup: SELECT cleanup_orphaned_post_data();
*/
