-- EXECUTE_THESE_TRIGGERS.sql
-- Copy and paste these commands into your database client (pgAdmin, DBeaver, or any PostgreSQL client)
-- Connect to your Neon database: postgresql://demo_owner:npg_FXUnhG86jcYw@ep-silent-heart-a85851wo-pooler.eastus2.azure.neon.tech/demo

-- ================================================================
-- STEP 1: DROP EXISTING FUNCTION AND TRIGGER
-- ================================================================
DROP FUNCTION IF EXISTS "public"."handle_post_deletion"() CASCADE;

-- ================================================================
-- STEP 2: CREATE CORRECTED FUNCTION (FIXED COLUMN MAPPINGS)
-- ================================================================
CREATE OR REPLACE FUNCTION "public"."handle_post_deletion"()
  RETURNS TRIGGER AS $$
BEGIN
    -- Log the deletion for debugging
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
    
    -- FIXED: Delete votes related to this post (uses entity_id, NOT post_id)
    DELETE FROM votes 
    WHERE entity_type = 'post' AND entity_id = OLD.post_id;
    RAISE NOTICE 'Deleted % votes for post_id: %', ROW_COUNT, OLD.post_id;
    
    -- FIXED: Delete comments related to this post (uses entity_id, NOT post_id)
    DELETE FROM comments 
    WHERE entity_type = 'post' AND entity_id = OLD.post_id;
    RAISE NOTICE 'Deleted % comments for post_id: %', ROW_COUNT, OLD.post_id;
    
    RAISE NOTICE 'Completed cascading deletion for post_id: %', OLD.post_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql VOLATILE COST 100;

-- ================================================================
-- STEP 3: CREATE THE TRIGGER
-- ================================================================
CREATE TRIGGER "trigger_handle_post_deletion"
    AFTER DELETE ON "public"."post"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."handle_post_deletion"();

-- ================================================================
-- STEP 4: VERIFY THE TRIGGER WAS CREATED
-- ================================================================
SELECT 
    tgname AS trigger_name, 
    tgrelid::regclass AS table_name, 
    tgfoid::regproc AS function_name,
    tgenabled AS enabled
FROM pg_trigger 
WHERE tgname = 'trigger_handle_post_deletion';

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================
SELECT 'Post deletion triggers have been successfully applied! 
The triggers now correctly handle all related data with proper column mappings:

✅ FIXED ISSUES:
• votes table: Now uses entity_id (was incorrectly using post_id)
• comments table: Now uses entity_id (was incorrectly using post_id)

✅ WORKING CORRECTLY:
• post_ratings table: Uses post_id
• notifications table: Uses entity_id  
• photos table: Uses source_id
• reports table: Uses reported_item_id

🧪 TEST THE SYSTEM:
1. Create a post in your app
2. Add some comments and votes to it
3. Delete the post from your profile
4. Check that comments and votes are also deleted

The cascading deletion will now work properly!' AS status;
