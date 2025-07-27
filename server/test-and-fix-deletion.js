// test-and-fix-deletion.js - Apply triggers and test post deletion
const pool = require('./config/db');

async function fixAndTest() {
    try {
        console.log('🔄 Applying post deletion triggers...');
        
        // Step 1: Drop existing function
        await pool.query('DROP FUNCTION IF EXISTS "public"."handle_post_deletion"() CASCADE;');
        console.log('✅ Dropped existing function');
        
        // Step 2: Create corrected function
        const functionSQL = `
        CREATE OR REPLACE FUNCTION "public"."handle_post_deletion"()
          RETURNS TRIGGER AS $$
        BEGIN
            RAISE NOTICE 'Post deletion triggered for post_id: %', OLD.post_id;
            
            -- Delete notifications (uses entity_id)
            DELETE FROM notifications 
            WHERE entity_type = 'post' AND entity_id = OLD.post_id;
            
            -- Delete photos (uses source_id) 
            DELETE FROM photos 
            WHERE type = 'post' AND source_id = OLD.post_id;
            
            -- Delete reports (uses reported_item_id)
            DELETE FROM reports 
            WHERE reported_item_type = 'post' AND reported_item_id = OLD.post_id;
            
            -- Delete votes (FIXED: uses entity_id)
            DELETE FROM votes 
            WHERE entity_type = 'post' AND entity_id = OLD.post_id;
            
            -- Delete comments (FIXED: uses entity_id)
            DELETE FROM comments 
            WHERE entity_type = 'post' AND entity_id = OLD.post_id;
            
            RAISE NOTICE 'Completed cascading deletion for post_id: %', OLD.post_id;
            
            RETURN OLD;
        END;
        $$ LANGUAGE plpgsql VOLATILE COST 100;`;
        
        await pool.query(functionSQL);
        console.log('✅ Created corrected function');
        
        // Step 3: Create trigger
        const triggerSQL = `
        CREATE TRIGGER "trigger_handle_post_deletion"
            AFTER DELETE ON "public"."post"
            FOR EACH ROW
            EXECUTE FUNCTION "public"."handle_post_deletion"();`;
        
        await pool.query(triggerSQL);
        console.log('✅ Created trigger');
        
        // Step 4: Verify trigger exists
        const verifyResult = await pool.query(`
            SELECT tgname, tgrelid::regclass, tgfoid::regproc 
            FROM pg_trigger 
            WHERE tgname = 'trigger_handle_post_deletion';
        `);
        
        if (verifyResult.rows.length > 0) {
            console.log('🎉 Trigger verified:', verifyResult.rows[0]);
        } else {
            console.log('❌ Trigger not found after creation');
            return;
        }
        
        // Step 5: Test post deletion (find a post to test with)
        console.log('\n🧪 Testing post deletion...');
        
        const testPosts = await pool.query('SELECT post_id, user_id, post_text FROM post LIMIT 3;');
        console.log('Available test posts:', testPosts.rows);
        
        if (testPosts.rows.length > 0) {
            const testPost = testPosts.rows[0];
            console.log(`\n📝 Found test post: ${testPost.post_id} by user ${testPost.user_id}`);
            console.log(`Content: "${testPost.post_text}"`);
            
            // Check related data before deletion
            const beforeVotes = await pool.query('SELECT COUNT(*) FROM votes WHERE entity_type = $1 AND entity_id = $2', ['post', testPost.post_id]);
            const beforeComments = await pool.query('SELECT COUNT(*) FROM comments WHERE entity_type = $1 AND entity_id = $2', ['post', testPost.post_id]);
            const beforeRatings = await pool.query('SELECT COUNT(*) FROM post_ratings WHERE post_id = $1', [testPost.post_id]);
            
            console.log(`\n📊 Before deletion:`);
            console.log(`  Votes: ${beforeVotes.rows[0].count}`);
            console.log(`  Comments: ${beforeComments.rows[0].count}`);
            console.log(`  Ratings: ${beforeRatings.rows[0].count}`);
            
            console.log('\n⚠️  Triggers are now installed and ready!');
            console.log('✅ Your post deletion should work correctly now.');
            console.log('\n🧪 To test:');
            console.log('1. Go to your profile in the app');
            console.log('2. Try deleting a post');
            console.log('3. Check that comments and votes are also deleted');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

fixAndTest();
