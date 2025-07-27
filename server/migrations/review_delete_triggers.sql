-- REVIEW DELETE TRIGGERS
-- Cascading deletion for review table: automatically delete comments, votes, notifications, photos, and reports

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS handle_review_deletion() CASCADE;

-- Create the review deletion trigger function
CREATE OR REPLACE FUNCTION handle_review_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the deletion attempt
    RAISE NOTICE 'Deleting review with ID: %', OLD.review_id;
    
    -- Delete votes for this review (table name: vote)
    DELETE FROM vote WHERE entity_type = 'review' AND entity_id = OLD.review_id;
    RAISE NOTICE 'Deleted votes for review %', OLD.review_id;
    
    -- Delete comments for this review (table name: comments)  
    DELETE FROM comments WHERE entity_type = 'review' AND entity_id = OLD.review_id;
    RAISE NOTICE 'Deleted comments for review %', OLD.review_id;
    
    -- Delete notifications related to this review
    DELETE FROM notifications WHERE entity_type = 'review' AND entity_id = OLD.review_id;
    RAISE NOTICE 'Deleted notifications for review %', OLD.review_id;
    
    -- Delete photos associated with this review
    DELETE FROM photos WHERE type = 'review' AND source_id = OLD.review_id;
    RAISE NOTICE 'Deleted photos for review %', OLD.review_id;
    
    -- Delete reports about this review
    DELETE FROM reports WHERE reported_item_type = 'review' AND reported_item_id = OLD.review_id;
    RAISE NOTICE 'Deleted reports for review %', OLD.review_id;
    
    RAISE NOTICE 'Successfully completed cascading deletion for review %', OLD.review_id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS review_deletion_cascade ON review;
CREATE TRIGGER review_deletion_cascade
    BEFORE DELETE ON review
    FOR EACH ROW
    EXECUTE FUNCTION handle_review_deletion();

-- Verify the trigger was created
SELECT trigger_name, event_manipulation, event_object_table, trigger_schema
FROM information_schema.triggers 
WHERE trigger_name = 'review_deletion_cascade';

RAISE NOTICE 'Review deletion trigger created successfully!';
