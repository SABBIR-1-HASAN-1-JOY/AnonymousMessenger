-- Trigger to cascade delete entity-related data when an entity is deleted
-- This trigger will delete from entity_requests and review tables when a reviewable_entity is deleted

-- First, create the trigger function
CREATE OR REPLACE FUNCTION delete_entity_related_data()
RETURNS TRIGGER AS $trigger_function$
DECLARE
    deleted_requests INTEGER;
    deleted_reviews INTEGER;
BEGIN
    -- Log the deletion for debugging
    RAISE NOTICE 'Deleting related data for entity with item_id: %, item_name: %', OLD.item_id, OLD.item_name;
    
    -- Delete from entity_requests table based on item_name match
    -- Since entity_requests doesn't have item_id, we match by item_name
    DELETE FROM entity_requests 
    WHERE item_name = OLD.item_name;
    
    -- Get count of deleted entity_requests (for logging)
    GET DIAGNOSTICS deleted_requests = ROW_COUNT;
    RAISE NOTICE 'Deleted % entity_requests for item_name: %', deleted_requests, OLD.item_name;
    
    -- Delete from review table using item_id
    DELETE FROM review 
    WHERE item_id = OLD.item_id;
    
    -- Get count of deleted reviews (for logging)
    GET DIAGNOSTICS deleted_reviews = ROW_COUNT;
    RAISE NOTICE 'Deleted % reviews for item_id: %', deleted_reviews, OLD.item_id;
    
    -- Return OLD record to allow the deletion to proceed
    RETURN OLD;
END;
$trigger_function$ LANGUAGE plpgsql;

-- Create the trigger that fires BEFORE DELETE on reviewable_entity
DROP TRIGGER IF EXISTS trigger_delete_entity_related_data ON reviewable_entity;

CREATE TRIGGER trigger_delete_entity_related_data
    BEFORE DELETE ON reviewable_entity
    FOR EACH ROW
    EXECUTE FUNCTION delete_entity_related_data();

-- Add comments for documentation
COMMENT ON FUNCTION delete_entity_related_data() IS 'Function to cascade delete related entity data from entity_requests and review tables';
COMMENT ON TRIGGER trigger_delete_entity_related_data ON reviewable_entity IS 'Trigger to automatically delete related data when an entity is deleted';

-- Test the trigger (uncomment to test)
-- INSERT INTO reviewable_entity (item_name, description, category_id, owner_id) VALUES ('Test Entity', 'Test Description', 1, 1);
-- INSERT INTO entity_requests (item_id, user_id, status) VALUES (LASTVAL(), 1, 'approved');
-- INSERT INTO review (item_id, user_id, ratingpoint, review_text) VALUES (LASTVAL(), 1, 5.0, 'Test review');
-- DELETE FROM reviewable_entity WHERE item_name = 'Test Entity';
