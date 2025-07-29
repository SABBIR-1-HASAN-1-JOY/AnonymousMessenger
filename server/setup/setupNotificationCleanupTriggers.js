// Setup notification cleanup triggers for posts and reviews
const pool = require('../config/db');

async function setupNotificationCleanupTriggers() {
    try {
        console.log('🔧 Setting up notification cleanup triggers...');
        
        // Create function to clean up notifications when a post is deleted
        const createPostCleanupFunction = `
            CREATE OR REPLACE FUNCTION cleanup_post_notifications() RETURNS TRIGGER AS $$
            BEGIN
                -- Delete all notifications related to the deleted post
                DELETE FROM notifications 
                WHERE entity_type = 'post' 
                AND entity_id = OLD.post_id;
                
                -- Log the cleanup action (optional)
                RAISE NOTICE 'Cleaned up notifications for deleted post ID: %', OLD.post_id;
                
                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql;
        `;
        
        await pool.query(createPostCleanupFunction);
        console.log('✅ Created post cleanup function');
        
        // Create function to clean up notifications when a review is deleted
        const createReviewCleanupFunction = `
            CREATE OR REPLACE FUNCTION cleanup_review_notifications() RETURNS TRIGGER AS $$
            BEGIN
                -- Delete all notifications related to the deleted review
                DELETE FROM notifications 
                WHERE entity_type = 'review' 
                AND entity_id = OLD.review_id;
                
                -- Log the cleanup action (optional)
                RAISE NOTICE 'Cleaned up notifications for deleted review ID: %', OLD.review_id;
                
                RETURN OLD;
            END;
            $$ LANGUAGE plpgsql;
        `;
        
        await pool.query(createReviewCleanupFunction);
        console.log('✅ Created review cleanup function');
        
        // Drop existing triggers if they exist
        await pool.query('DROP TRIGGER IF EXISTS trigger_cleanup_post_notifications ON post');
        await pool.query('DROP TRIGGER IF EXISTS trigger_cleanup_review_notifications ON review');
        console.log('✅ Dropped existing cleanup triggers');
        
        // Create trigger for post deletion
        const createPostTrigger = `
            CREATE TRIGGER trigger_cleanup_post_notifications
                BEFORE DELETE ON post
                FOR EACH ROW
                EXECUTE FUNCTION cleanup_post_notifications();
        `;
        
        await pool.query(createPostTrigger);
        console.log('✅ Created post notification cleanup trigger');
        
        // Create trigger for review deletion
        const createReviewTrigger = `
            CREATE TRIGGER trigger_cleanup_review_notifications
                BEFORE DELETE ON review
                FOR EACH ROW
                EXECUTE FUNCTION cleanup_review_notifications();
        `;
        
        await pool.query(createReviewTrigger);
        console.log('✅ Created review notification cleanup trigger');
        
        console.log('🎉 Notification cleanup triggers setup completed successfully!');
        return { success: true, message: 'Notification cleanup triggers created for posts and reviews' };
        
    } catch (error) {
        console.error('❌ Error setting up notification cleanup triggers:', error);
        return { success: false, error: error.message };
    }
}

// Export for use in other modules
module.exports = { setupNotificationCleanupTriggers };

// Allow running this script directly
if (require.main === module) {
    setupNotificationCleanupTriggers()
        .then(result => {
            console.log('Final result:', result);
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('Unhandled error:', error);
            process.exit(1);
        });
}
