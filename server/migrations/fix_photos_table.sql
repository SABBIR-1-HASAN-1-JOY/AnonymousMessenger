-- Migration to add missing columns to photos table
-- Add missing columns if they don't exist

DO $$ 
BEGIN
    -- Add upload_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'photos' AND column_name = 'upload_date'
    ) THEN
        ALTER TABLE photos ADD COLUMN upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add file_size column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'photos' AND column_name = 'file_size'
    ) THEN
        ALTER TABLE photos ADD COLUMN file_size INTEGER;
    END IF;

    -- Add mime_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'photos' AND column_name = 'mime_type'
    ) THEN
        ALTER TABLE photos ADD COLUMN mime_type VARCHAR(100);
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_photos_type_source ON photos(type, source_id);
CREATE INDEX IF NOT EXISTS idx_photos_user ON photos(user_id);

-- Add check constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'photos' AND constraint_name = 'photos_type_check'
    ) THEN
        ALTER TABLE photos ADD CONSTRAINT photos_type_check CHECK (type IN ('profile', 'reviews', 'entities'));
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraint already exists, do nothing
        NULL;
END $$;
