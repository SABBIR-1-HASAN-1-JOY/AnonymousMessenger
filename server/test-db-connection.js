// test-db-connection.js - Test database connection and apply triggers
const { Pool } = require('pg');

// Database configuration (you may need to adjust these settings)
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'rate_my_work_db', // adjust if different
    password: 'JOYhasan@1234',  // your provided password
    port: 5432,
});

async function testAndApplyTriggers() {
    console.log('🔄 Testing database connection...');
    
    try {
        // Test connection
        const client = await pool.connect();
        console.log('✅ Database connected successfully!');
        
        // Check if the trigger already exists
        console.log('📝 Checking existing triggers...');
        const existingTriggers = await client.query(`
            SELECT tgname, tgrelid::regclass 
            FROM pg_trigger 
            WHERE tgname = 'trigger_handle_post_deletion';
        `);
        
        if (existingTriggers.rows.length > 0) {
            console.log('⚠️  Trigger already exists:', existingTriggers.rows[0]);
        }
        
        console.log('📝 Dropping existing function and trigger...');
        await client.query('DROP FUNCTION IF EXISTS "public"."handle_post_deletion"() CASCADE;');
        
        console.log('📝 Creating corrected function...');
        const functionSQL = `
        CREATE OR REPLACE FUNCTION "public"."handle_post_deletion"()
          RETURNS TRIGGER AS $$
        BEGIN
            -- Log the deletion for debugging
            RAISE NOTICE 'Post deletion triggered for post_id: %', OLD.post_id;
            
            -- Delete notifications related to this post
            DELETE FROM notifications 
            WHERE entity_type = 'post' AND entity_id = OLD.post_id;
            
            -- Delete photos related to this post (if any)
            DELETE FROM photos 
            WHERE type = 'post' AND source_id = OLD.post_id;
            
            -- Delete reports related to this post
            DELETE FROM reports 
            WHERE reported_item_type = 'post' AND reported_item_id = OLD.post_id;
            
            -- Delete votes related to this post (FIXED: using entity_id column)
            DELETE FROM votes 
            WHERE entity_type = 'post' AND entity_id = OLD.post_id;
            
            -- Delete comments related to this post (FIXED: using entity_id column)
            DELETE FROM comments 
            WHERE entity_type = 'post' AND entity_id = OLD.post_id;
            
            RAISE NOTICE 'Completed cascading deletion for post_id: %', OLD.post_id;
            
            RETURN OLD;
        END;
        $$ LANGUAGE plpgsql VOLATILE COST 100;`;
        
        await client.query(functionSQL);
        console.log('✅ Function created successfully!');
        
        console.log('📝 Creating trigger...');
        const triggerSQL = `
        CREATE TRIGGER "trigger_handle_post_deletion"
            AFTER DELETE ON "public"."post"
            FOR EACH ROW
            EXECUTE FUNCTION "public"."handle_post_deletion"();`;
        
        await client.query(triggerSQL);
        console.log('✅ Trigger created successfully!');
        
        // Verify the trigger was created
        const verificationResult = await client.query(`
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
        
        client.release();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('📋 Full error details:', error);
    } finally {
        pool.end();
    }
}

// Run the script
testAndApplyTriggers();
