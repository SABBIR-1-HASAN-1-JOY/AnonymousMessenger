-- Create user_follow table with correct schema
CREATE TABLE IF NOT EXISTS user_follow (
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    followed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES "user"(user_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_follow_follower ON user_follow(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follow_following ON user_follow(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follow_followed_at ON user_follow(followed_at);

-- Add constraint to prevent self-following
ALTER TABLE user_follow 
DROP CONSTRAINT IF EXISTS chk_no_self_follow;

ALTER TABLE user_follow 
ADD CONSTRAINT chk_no_self_follow 
CHECK (follower_id != following_id);
