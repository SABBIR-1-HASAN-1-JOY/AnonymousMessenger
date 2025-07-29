-- Trigger to delete photos when a review is deleted
-- This trigger will delete photos from the photos table and the actual files from storage

-- First, create the trigger function
CREATE OR REPLACE FUNCTION delete_review_photos()
RETURNS TRIGGER AS $trigger_function$
DECLARE
    photo_record RECORD;
    file_path TEXT;
    deleted_photos INTEGER;
BEGIN
    -- Log the deletion for debugging
    RAISE NOTICE 'Deleting photos for review with review_id: %', OLD.review_id;
    
    -- Get all photos related to this review
    FOR photo_record IN 
        SELECT photo_id, photo_name, type 
        FROM photos 
        WHERE type = 'reviews' AND source_id = OLD.review_id
    LOOP
        -- Log each photo being deleted
        RAISE NOTICE 'Deleting photo: % (ID: %)', photo_record.photo_name, photo_record.photo_id;
        
        -- Construct file path (adjust path as needed based on your upload structure)
        file_path := '/uploads/' || photo_record.photo_name;
        
        -- Note: PostgreSQL cannot directly delete files from filesystem
        -- We'll delete from database and handle file deletion in the application
        RAISE NOTICE 'Photo file to be deleted: %', file_path;
    END LOOP;
    
    -- Delete all photos related to this review from database
    DELETE FROM photos 
    WHERE type = 'reviews' AND source_id = OLD.review_id;
    
    -- Get count of deleted photos (for logging)
    GET DIAGNOSTICS deleted_photos = ROW_COUNT;
    RAISE NOTICE 'Deleted % photos for review_id: %', deleted_photos, OLD.review_id;
    
    -- Return OLD record to allow the deletion to proceed
    RETURN OLD;
END;
$trigger_function$ LANGUAGE plpgsql;

-- Create the trigger that fires BEFORE DELETE on review
DROP TRIGGER IF EXISTS trigger_delete_review_photos ON review;

CREATE TRIGGER trigger_delete_review_photos
    BEFORE DELETE ON review
    FOR EACH ROW
    EXECUTE FUNCTION delete_review_photos();

-- Add comments for documentation
COMMENT ON FUNCTION delete_review_photos() IS 'Function to cascade delete photos when a review is deleted';
COMMENT ON TRIGGER trigger_delete_review_photos ON review IS 'Trigger to automatically delete related photos when a review is deleted';
