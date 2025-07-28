// Fix for vote notification trigger that references wrong table name
const pool = require('../config/db');

async function fixVoteNotificationTrigger() {
    try {
        console.log('🔧 Fixing vote notification trigger...');
        
        // Drop old triggers and functions if they exist (in correct order to avoid dependencies)
        await pool.query('DROP TRIGGER IF EXISTS trigger_vote_notification ON vote');
        await pool.query('DROP TRIGGER IF EXISTS vote_notification_trigger ON vote');
        await pool.query('DROP TRIGGER IF EXISTS trigger_notify_vote ON vote');
        await pool.query('DROP FUNCTION IF EXISTS notify_on_vote() CASCADE');
        await pool.query('DROP FUNCTION IF EXISTS notify_vote() CASCADE');
        
        console.log('✅ Dropped old triggers and functions');
        
        // Create the correct notification function
        const createFunctionQuery = `
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
                vote_action := CASE NEW.vote_type 
                    WHEN 'up' THEN 'upvoted'
                    WHEN 'down' THEN 'downvoted'
                    ELSE 'voted on'
                END;
                
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
                
                -- Create notification using the correct table name "notifications" (plural)
                IF content_owner_id IS NOT NULL AND content_owner_id != NEW.user_id THEN
                    INSERT INTO notifications (
                        recipient_user_id, 
                        actor_user_id, 
                        notification_type, 
                        entity_type, 
                        entity_id, 
                        message,
                        created_at
                    ) VALUES (
                        content_owner_id,
                        NEW.user_id,
                        'vote',
                        NEW.entity_type,
                        NEW.entity_id,
                        actor_name || ' ' || vote_action || ' your ' || NEW.entity_type || 
                        CASE WHEN entity_title IS NOT NULL THEN ': "' || entity_title || '"' ELSE '' END,
                        CURRENT_TIMESTAMP
                    );
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `;
        
        await pool.query(createFunctionQuery);
        console.log('✅ Created correct notify_vote function');
        
        // Create the trigger
        const createTriggerQuery = `
            CREATE TRIGGER trigger_vote_notification
                AFTER INSERT ON vote
                FOR EACH ROW
                EXECUTE FUNCTION notify_vote();
        `;
        
        await pool.query(createTriggerQuery);
        console.log('✅ Created vote notification trigger');
        
        console.log('🎉 Vote notification trigger fix completed successfully!');
        return { success: true, message: 'Vote notification trigger fixed' };
        
    } catch (error) {
        console.error('❌ Error fixing vote notification trigger:', error);
        return { success: false, error: error.message };
    }
}

// Run the fix if this file is executed directly
if (require.main === module) {
    fixVoteNotificationTrigger()
        .then(result => {
            console.log('Final Result:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Script Error:', error);
            process.exit(1);
        });
}

module.exports = { fixVoteNotificationTrigger };
