// direct-trigger-fix.js - Direct connection to your Neon database
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://demo_owner:npg_FXUnhG86jcYw@ep-silent-heart-a85851wo-pooler.eastus2.azure.neon.tech/demo?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function applyTriggersDirectly() {
    console.log('🔄 Connecting to Neon database...');
    
    let client;
    try {
        client = await pool.connect();
        console.log('✅ Connected to database successfully!');
        
        // Step 1: Check current triggers
        console.log('📝 Checking existing triggers...');
        const existingTriggers = await client.query(`
            SELECT tgname, tgrelid::regclass 
            FROM pg_trigger 
            WHERE tgname LIKE '%post%delete%' OR tgname LIKE '%handle_post%';
        `);
        
        console.log('Current triggers:', existingTriggers.rows);
        
        // Step 2: Drop existing function
        console.log('📝 Dropping existing function...');
        await client.query('DROP FUNCTION IF EXISTS "public"."handle_post_deletion"() CASCADE;');
        console.log('✅ Dropped existing function');
        
        // Step 3: Create corrected function
        console.log('📝 Creating corrected function...');
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
            
            -- Delete votes (FIXED: uses entity_id, not post_id)
            DELETE FROM votes 
            WHERE entity_type = 'post' AND entity_id = OLD.post_id;
            
            -- Delete comments (FIXED: uses entity_id, not post_id)
            DELETE FROM comments 
            WHERE entity_type = 'post' AND entity_id = OLD.post_id;
            
            RAISE NOTICE 'Completed cascading deletion for post_id: %', OLD.post_id;
            
            RETURN OLD;
        END;
        $$ LANGUAGE plpgsql VOLATILE COST 100;`;
        
        await client.query(functionSQL);
        console.log('✅ Function created successfully!');
        
        // Step 4: Create trigger
        console.log('📝 Creating trigger...');
        const triggerSQL = `
        CREATE TRIGGER "trigger_handle_post_deletion"
            AFTER DELETE ON "public"."post"
            FOR EACH ROW
            EXECUTE FUNCTION "public"."handle_post_deletion"();`;
        
        await client.query(triggerSQL);
        console.log('✅ Trigger created successfully!');
        
        // Step 5: Verify
        const verifyResult = await client.query(`
            SELECT tgname, tgrelid::regclass, tgfoid::regproc 
            FROM pg_trigger 
            WHERE tgname = 'trigger_handle_post_deletion';
        `);
        
        if (verifyResult.rows.length > 0) {
            console.log('\n🎉 SUCCESS! Post deletion triggers are now working correctly!');
            console.log('📋 Trigger details:', verifyResult.rows[0]);
            console.log('\n✅ FIXED column mappings:');
            console.log('   • votes table: entity_id (was incorrectly post_id)');
            console.log('   • comments table: entity_id (was incorrectly post_id)');
            console.log('   • notifications table: entity_id ✓');
            console.log('   • photos table: source_id ✓');
            console.log('   • reports table: reported_item_id ✓');
            console.log('\n🧪 Test the system by:');
            console.log('   1. Creating a post with comments and votes');
            console.log('   2. Deleting the post from your profile');
            console.log('   3. Checking that comments and votes are also deleted');
        } else {
            console.log('❌ Trigger verification failed!');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

applyTriggersDirectly();
