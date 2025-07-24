-- Create entity_requests table for admin approval workflow
CREATE TABLE IF NOT EXISTS entity_requests (
    request_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    sector VARCHAR(100),
    picture TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    admin_notes TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER,
    CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES "user"(user_id) ON DELETE SET NULL,
    CONSTRAINT check_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_entity_requests_status ON entity_requests(status);
CREATE INDEX IF NOT EXISTS idx_entity_requests_user_id ON entity_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_entity_requests_requested_at ON entity_requests(requested_at DESC);
