-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    recipient_user_id INTEGER NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
    actor_user_id INTEGER REFERENCES "user"(user_id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50), -- 'post', 'review', 'user'
    entity_id INTEGER,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating timestamp
DROP TRIGGER IF EXISTS trigger_update_notification_timestamp ON notifications;
CREATE TRIGGER trigger_update_notification_timestamp
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_timestamp();

-- Create function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
    p_recipient_user_id INTEGER,
    p_actor_user_id INTEGER,
    p_notification_type VARCHAR(50),
    p_entity_type VARCHAR(50),
    p_entity_id INTEGER,
    p_message TEXT
) RETURNS INTEGER AS $$
DECLARE
    notification_id INTEGER;
BEGIN
    -- Don't create notification if user is acting on their own content
    IF p_recipient_user_id = p_actor_user_id THEN
        RETURN NULL;
    END IF;
    
    INSERT INTO notifications (
        recipient_user_id, 
        actor_user_id, 
        notification_type, 
        entity_type, 
        entity_id, 
        message
    ) VALUES (
        p_recipient_user_id, 
        p_actor_user_id, 
        p_notification_type, 
        p_entity_type, 
        p_entity_id, 
        p_message
    ) RETURNING notification_id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for comment notifications
CREATE OR REPLACE FUNCTION notify_comment() RETURNS TRIGGER AS $$
DECLARE
    content_owner_id INTEGER;
    actor_name VARCHAR(255);
    entity_title TEXT;
BEGIN
    -- Get the actor's name
    SELECT username INTO actor_name FROM "user" WHERE user_id = NEW.user_id;
    
    -- Determine content owner based on entity type
    IF NEW.entity_type = 'post' THEN
        SELECT user_id INTO content_owner_id FROM post WHERE post_id = NEW.entity_id;
        SELECT LEFT(post_text, 50) || '...' INTO entity_title 
        FROM post WHERE post_id = NEW.entity_id;
    ELSIF NEW.entity_type = 'review' THEN
        SELECT user_id INTO content_owner_id FROM review WHERE review_id = NEW.entity_id;
        SELECT LEFT(review_text, 50) || '...' INTO entity_title 
        FROM review WHERE review_id = NEW.entity_id;
    END IF;
    
    -- Create notification
    IF content_owner_id IS NOT NULL THEN
        PERFORM create_notification(
            content_owner_id,
            NEW.user_id,
            'comment',
            NEW.entity_type,
            NEW.entity_id,
            actor_name || ' commented on your ' || NEW.entity_type || ': "' || COALESCE(entity_title, 'your content') || '"'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for vote notifications
CREATE OR REPLACE FUNCTION notify_vote() RETURNS TRIGGER AS $$
DECLARE
    content_owner_id INTEGER;
    actor_name VARCHAR(255);
    entity_title TEXT;
    vote_action TEXT;
BEGIN
    -- Get the actor's name
    SELECT username INTO actor_name FROM "user" WHERE user_id = NEW.user_id;
    
    -- Determine vote action
    IF NEW.vote_type = 'upvote' THEN
        vote_action := 'upvoted';
    ELSIF NEW.vote_type = 'downvote' THEN
        vote_action := 'downvoted';
    ELSE
        vote_action := 'voted on';
    END IF;
    
    -- Determine content owner based on entity type
    IF NEW.entity_type = 'post' THEN
        SELECT user_id INTO content_owner_id FROM post WHERE post_id = NEW.entity_id;
        SELECT LEFT(post_text, 50) || '...' INTO entity_title 
        FROM post WHERE post_id = NEW.entity_id;
    ELSIF NEW.entity_type = 'review' THEN
        SELECT user_id INTO content_owner_id FROM review WHERE review_id = NEW.entity_id;
        SELECT LEFT(review_text, 50) || '...' INTO entity_title 
        FROM review WHERE review_id = NEW.entity_id;
    END IF;
    
    -- Create notification
    IF content_owner_id IS NOT NULL THEN
        PERFORM create_notification(
            content_owner_id,
            NEW.user_id,
            'vote',
            NEW.entity_type,
            NEW.entity_id,
            actor_name || ' ' || vote_action || ' your ' || NEW.entity_type || ': "' || COALESCE(entity_title, 'your content') || '"'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for follow notifications
CREATE OR REPLACE FUNCTION notify_follow() RETURNS TRIGGER AS $$
DECLARE
    follower_name VARCHAR(255);
BEGIN
    -- Get the follower's name
    SELECT username INTO follower_name FROM "user" WHERE user_id = NEW.follower_id;
    
    -- Create notification
    PERFORM create_notification(
        NEW.following_id,
        NEW.follower_id,
        'follow',
        'user',
        NEW.follower_id,
        follower_name || ' started following you'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_comment_notification ON comments;
CREATE TRIGGER trigger_comment_notification
    AFTER INSERT ON comments
    FOR EACH ROW
    EXECUTE FUNCTION notify_comment();

DROP TRIGGER IF EXISTS trigger_vote_notification ON vote;
CREATE TRIGGER trigger_vote_notification
    AFTER INSERT ON vote
    FOR EACH ROW
    EXECUTE FUNCTION notify_vote();

DROP TRIGGER IF EXISTS trigger_follow_notification ON user_follow;
CREATE TRIGGER trigger_follow_notification
    AFTER INSERT ON user_follow
    FOR EACH ROW
    EXECUTE FUNCTION notify_follow();
