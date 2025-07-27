// fix-table-names-triggers.js - Fix the table names in triggers
const pool = require('./config/db');

async function fixTriggerTableNames() {
    try {
        console.log('🔧 Fixing post deletion triggers with correct table names...');
        
        // Step 1: Drop existing function
        console.log('📝 Dropping existing function...');
        await pool.query('DROP FUNCTION IF EXISTS "public"."handle_post_deletion"() CASCADE;');
        console.log('✅ Dropped existing function');
        
        // Step 2: Create corrected function with proper table names
        console.log('📝 Creating corrected function with proper table names...');
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
            
            -- FIXED: Delete from "vote" table (not "votes") - uses entity_id
            DELETE FROM vote 
            WHERE entity_type = 'post' AND entity_id = OLD.post_id;
            
            -- FIXED: Delete from "comment" table (not "comments") - uses entity_id
            DELETE FROM comment 
            WHERE entity_type = 'post' AND entity_id = OLD.post_id;
            
            -- Delete from post_ratings table (uses post_id)
            DELETE FROM post_ratings 
            WHERE post_id = OLD.post_id;
            
            RAISE NOTICE 'Completed cascading deletion for post_id: %', OLD.post_id;
            
            RETURN OLD;
        END;
        $$ LANGUAGE plpgsql VOLATILE COST 100;`;
        
        await pool.query(functionSQL);
        console.log('✅ Created corrected function with proper table names');
        
        // Step 3: Create trigger
        console.log('📝 Creating trigger...');
        const triggerSQL = `
        CREATE TRIGGER "trigger_handle_post_deletion"
            AFTER DELETE ON "public"."post"
            FOR EACH ROW
            EXECUTE FUNCTION "public"."handle_post_deletion"();`;
        
        await pool.query(triggerSQL);
        console.log('✅ Created trigger');
        
        // Step 4: Verify
        const verifyResult = await pool.query(`
            SELECT tgname, tgrelid::regclass, tgfoid::regproc 
            FROM pg_trigger 
            WHERE tgname = 'trigger_handle_post_deletion';
        `);
        
        if (verifyResult.rows.length > 0) {
            console.log('🎉 SUCCESS! Trigger verified with correct table names:');
            console.log('📋 Trigger details:', verifyResult.rows[0]);
            console.log('\n✅ FIXED TABLE NAMES:');
            console.log('   • vote (not votes) ✅');
            console.log('   • comment (not comments) ✅');
            console.log('   • All other tables correct ✅');
            console.log('\n🧪 Now try deleting the post again!');
        } else {
            console.log('❌ Trigger verification failed');
        }
        
    } catch (error) {
        console.error('❌ Error fixing triggers:', error);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

fixTriggerTableNames();
