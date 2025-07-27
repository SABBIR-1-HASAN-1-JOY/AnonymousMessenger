// fix-triggers-now.js - Use existing DB config to apply triggers
const db = require('./config/db');

async function fixTriggers() {
    console.log('🔄 Applying corrected post deletion triggers...');
    
    try {
        // Step 1: Drop existing function and trigger
        console.log('📝 Step 1: Dropping existing function and trigger...');
        const dropResult = await db.query('DROP FUNCTION IF EXISTS "public"."handle_post_deletion"() CASCADE;');
        console.log('✅ Dropped existing function');
        
        // Step 2: Create the corrected function
        console.log('📝 Step 2: Creating corrected function...');
        const functionSQL = `
        CREATE OR REPLACE FUNCTION "public"."handle_post_deletion"()
          RETURNS TRIGGER AS $$
        BEGIN
            RAISE NOTICE 'Post deletion triggered for post_id: %', OLD.post_id;
            
            DELETE FROM notifications 
            WHERE entity_type = 'post' AND entity_id = OLD.post_id;
            
            DELETE FROM photos 
            WHERE type = 'post' AND source_id = OLD.post_id;
            
            DELETE FROM reports 
            WHERE reported_item_type = 'post' AND reported_item_id = OLD.post_id;
            
            DELETE FROM votes 
            WHERE entity_type = 'post' AND entity_id = OLD.post_id;
            
            DELETE FROM comments 
            WHERE entity_type = 'post' AND entity_id = OLD.post_id;
            
            RAISE NOTICE 'Completed cascading deletion for post_id: %', OLD.post_id;
            
            RETURN OLD;
        END;
        $$ LANGUAGE plpgsql VOLATILE COST 100;`;
        
        const funcResult = await db.query(functionSQL);
        console.log('✅ Function created successfully');
        
        // Step 3: Create the trigger
        console.log('📝 Step 3: Creating trigger...');
        const triggerSQL = `
        CREATE TRIGGER "trigger_handle_post_deletion"
            AFTER DELETE ON "public"."post"
            FOR EACH ROW
            EXECUTE FUNCTION "public"."handle_post_deletion"();`;
        
        const trigResult = await db.query(triggerSQL);
        console.log('✅ Trigger created successfully');
        
        // Step 4: Verify
        console.log('📝 Step 4: Verifying trigger creation...');
        const verifyResult = await db.query(`
            SELECT tgname, tgrelid::regclass, tgfoid::regproc 
            FROM pg_trigger 
            WHERE tgname = 'trigger_handle_post_deletion';
        `);
        
        if (verifyResult.rows.length > 0) {
            console.log('🎉 SUCCESS! Trigger verified:', verifyResult.rows[0]);
            console.log('\n✅ Fixed column mappings:');
            console.log('   • votes table: entity_id ✅');
            console.log('   • comments table: entity_id ✅');
            console.log('   • notifications table: entity_id ✅');
            console.log('   • photos table: source_id ✅');
            console.log('   • reports table: reported_item_id ✅');
        } else {
            console.log('❌ Trigger verification failed');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
    
    process.exit();
}

fixTriggers();
