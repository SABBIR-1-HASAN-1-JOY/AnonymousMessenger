-- Create photos table for storing photo metadata
-- This table will store metadata about uploaded photos

CREATE TABLE IF NOT EXISTS photos (
    photo_id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('profile', 'reviews', 'entities')),
    photo_name VARCHAR(255) NOT NULL UNIQUE, -- The generated filename on disk
    user_id INTEGER, -- Can be null for admin uploads
    source_id INTEGER NOT NULL, -- The ID of the entity, review, or profile this photo belongs to
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_size INTEGER, -- File size in bytes
    mime_type VARCHAR(100), -- e.g., 'image/jpeg', 'image/png'
    CONSTRAINT fk_photos_user FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_photos_type_source ON photos(type, source_id);
CREATE INDEX IF NOT EXISTS idx_photos_user ON photos(user_id);

-- Add comments for documentation
COMMENT ON TABLE photos IS 'Stores metadata for uploaded photos including profile pictures, review photos, and entity photos';
COMMENT ON COLUMN photos.type IS 'Type of photo: profile, reviews, or entities';
COMMENT ON COLUMN photos.photo_name IS 'Generated filename stored on disk using naming convention';
COMMENT ON COLUMN photos.user_id IS 'ID of user who uploaded the photo (null for admin uploads)';
COMMENT ON COLUMN photos.source_id IS 'ID of the entity/review/profile this photo belongs to';
