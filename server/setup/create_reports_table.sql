-- Create reports table for user reports on posts, comments, and reviews
DROP TABLE IF EXISTS reports CASCADE;
CREATE TABLE reports (
    report_id SERIAL PRIMARY KEY,
    reporter_user_id INTEGER NOT NULL,
    reported_item_type VARCHAR(20) NOT NULL,
    reported_item_id INTEGER NOT NULL,
    reported_user_id INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_reports_reported FOREIGN KEY (reported_user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_reported_item_type CHECK (reported_item_type IN ('post', 'comment', 'review')),
    CONSTRAINT chk_status CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    CONSTRAINT unique_user_report UNIQUE(reporter_user_id, reported_item_type, reported_item_id)
);

-- Create indexes for better performance
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reporter ON reports(reporter_user_id);
CREATE INDEX idx_reports_reported_user ON reports(reported_user_id);
CREATE INDEX idx_reports_item ON reports(reported_item_type, reported_item_id);

-- Create report reasons table
DROP TABLE IF EXISTS report_reasons CASCADE;
CREATE TABLE report_reasons (
    reason_id SERIAL PRIMARY KEY,
    reason_text VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default report reasons
INSERT INTO report_reasons (reason_text, description) VALUES
('Spam', 'Content is repetitive, unwanted, or promotional spam'),
('Harassment', 'Content contains harassment, bullying, or personal attacks'),
('Hate Speech', 'Content promotes hatred or discrimination'),
('Inappropriate Content', 'Content is inappropriate, offensive, or violates community guidelines'),
('False Information', 'Content contains misleading or false information'),
('Copyright Violation', 'Content violates copyright or intellectual property rights'),
('Personal Information', 'Content contains personal or private information'),
('Violence', 'Content promotes or depicts violence'),
('Other', 'Other reason not listed above');

-- Create admin actions table to track admin actions on reports
DROP TABLE IF EXISTS admin_actions CASCADE;
CREATE TABLE admin_actions (
    action_id SERIAL PRIMARY KEY,
    admin_user_id INTEGER NOT NULL,
    report_id INTEGER NOT NULL,
    action_type VARCHAR(20) NOT NULL,
    target_item_type VARCHAR(20), -- post, comment, review
    target_item_id INTEGER,
    target_user_id INTEGER,
    action_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_admin_actions_admin FOREIGN KEY (admin_user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_admin_actions_report FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE,
    CONSTRAINT fk_admin_actions_target_user FOREIGN KEY (target_user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_action_type CHECK (action_type IN ('warning', 'delete_content', 'ban_user', 'no_action'))
);

-- Create user warnings table
DROP TABLE IF EXISTS user_warnings CASCADE;
CREATE TABLE user_warnings (
    warning_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    admin_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    content_type VARCHAR(20), -- post, comment, review
    content_id INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    CONSTRAINT fk_warnings_user FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_warnings_admin FOREIGN KEY (admin_id) REFERENCES "user"(user_id) ON DELETE CASCADE
);

-- Create user bans table
DROP TABLE IF EXISTS user_bans CASCADE;
CREATE TABLE user_bans (
    ban_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    admin_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    ban_type VARCHAR(20) DEFAULT 'temporary',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    CONSTRAINT fk_bans_user FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_bans_admin FOREIGN KEY (admin_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_ban_type CHECK (ban_type IN ('temporary', 'permanent'))
);

-- Create indexes for admin tables
CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_user_id);
CREATE INDEX idx_admin_actions_report ON admin_actions(report_id);
CREATE INDEX idx_admin_actions_target_user ON admin_actions(target_user_id);

CREATE INDEX idx_user_warnings_user ON user_warnings(user_id);
CREATE INDEX idx_user_warnings_active ON user_warnings(is_active);

CREATE INDEX idx_user_bans_user ON user_bans(user_id);
CREATE INDEX idx_user_bans_active ON user_bans(is_active);

-- Add columns for admin soft deletion to existing tables
-- Note: These statements will only work if the columns don't already exist
-- For posts table
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE posts ADD deleted_at TIMESTAMP';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -1430 THEN -- ORA-01430: column being added already exists in table
            RAISE;
        END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE posts ADD deleted_by_admin NUMBER(1) DEFAULT 0';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -1430 THEN -- ORA-01430: column being added already exists in table
            RAISE;
        END IF;
END;
/

-- For comments table
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE comments ADD deleted_at TIMESTAMP';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -1430 THEN -- ORA-01430: column being added already exists in table
            RAISE;
        END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE comments ADD deleted_by_admin NUMBER(1) DEFAULT 0';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -1430 THEN -- ORA-01430: column being added already exists in table
            RAISE;
        END IF;
END;
/

-- For reviews table
BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE reviews ADD deleted_at TIMESTAMP';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -1430 THEN -- ORA-01430: column being added already exists in table
            RAISE;
        END IF;
END;
/

BEGIN
    EXECUTE IMMEDIATE 'ALTER TABLE reviews ADD deleted_by_admin NUMBER(1) DEFAULT 0';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLCODE != -1430 THEN -- ORA-01430: column being added already exists in table
            RAISE;
        END IF;
END;
/
