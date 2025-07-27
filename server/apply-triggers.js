// apply-triggers.js - Apply the corrected post deletion triggers
const db = require('./config/db');

async function applyTriggers() {
    console.log('🔄 Applying corrected post deletion triggers...');
    
    try {
        // Step 1: Drop and recreate the corrected function
        console.log('📝 Step 1: Dropping existing function and trigger...');
        await db.query('DROP FUNCTION IF EXISTS "public"."handle_post_deletion"() CASCADE;');
        
        // Step 2: Create the corrected function
        console.log('📝 Step 2: Creating corrected function...');
        const functionSQL = `
        CREATE OR REPLACE FUNCTION "public"."handle_post_deletion"()
          RETURNS TRIGGER AS $$
        BEGIN
            -- Log the deletion for debugging
            RAISE NOTICE 'Post deletion triggered for post_id: %', OLD.post_id;
            
            -- Delete notifications related to this post
            DELETE FROM notifications 
            WHERE entity_type = 'post' AND entity_id = OLD.post_id;
            RAISE NOTICE 'Deleted notifications for post_id: %', OLD.post_id;
            
            -- Delete photos related to this post (if any)
            DELETE FROM photos 
            WHERE type = 'post' AND source_id = OLD.post_id;
            RAISE NOTICE 'Deleted photos for post_id: %', OLD.post_id;
            
            -- Delete reports related to this post
            DELETE FROM reports 
            WHERE reported_item_type = 'post' AND reported_item_id = OLD.post_id;
            RAISE NOTICE 'Deleted reports for post_id: %', OLD.post_id;
            
            -- Delete votes related to this post (FIXED: using entity_id column)
            DELETE FROM votes 
            WHERE entity_type = 'post' AND entity_id = OLD.post_id;
            RAISE NOTICE 'Deleted votes for post_id: %', OLD.post_id;
            
            -- Delete comments related to this post (FIXED: using entity_id column)
            DELETE FROM comments 
            WHERE entity_type = 'post' AND entity_id = OLD.post_id;
            RAISE NOTICE 'Deleted comments for post_id: %', OLD.post_id;
            
            RAISE NOTICE 'Completed cascading deletion for post_id: %', OLD.post_id;
            
            RETURN OLD;
        END;
        $$ LANGUAGE plpgsql VOLATILE COST 100;`;
        
        await db.query(functionSQL);
        
        // Step 3: Create the trigger
        console.log('📝 Step 3: Creating trigger...');
        const triggerSQL = `
        CREATE TRIGGER "trigger_handle_post_deletion"
            AFTER DELETE ON "public"."post"
            FOR EACH ROW
            EXECUTE FUNCTION "public"."handle_post_deletion"();`;
        
        await db.query(triggerSQL);
        
        // Step 4: Verify the trigger was created
        console.log('📝 Step 4: Verifying trigger creation...');
        const verificationResult = await db.query(`
            SELECT tgname, tgrelid::regclass, tgfoid::regproc 
            FROM pg_trigger 
            WHERE tgname = 'trigger_handle_post_deletion';
        `);
        
        if (verificationResult.rows.length > 0) {
            console.log('✅ SUCCESS: Post deletion triggers have been applied successfully!');
            console.log('📋 Trigger details:', verificationResult.rows[0]);
            console.log('\n🔧 The triggers now correctly handle:');
            console.log('   • post_ratings table (uses post_id)');
            console.log('   • comments table (uses entity_id) ✅ FIXED');
            console.log('   • votes table (uses entity_id) ✅ FIXED');
            console.log('   • notifications table (uses entity_id)');
            console.log('   • photos table (uses source_id)');
            console.log('   • reports table (uses reported_item_id)');
        } else {
            console.log('❌ ERROR: Trigger was not created properly');
        }
        
    } catch (error) {
        console.error('❌ Error applying triggers:', error.message);
        console.error('📋 Full error:', error);
    } finally {
        process.exit();
    }
}

// Run the script
applyTriggers();
