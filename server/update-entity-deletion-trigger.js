const pool = require('./config/db.js');
const fs = require('fs');
const path = require('path');

async function updateEntityDeletionTrigger() {
    try {
        console.log('Updating entity deletion trigger...');
        
        // First, drop the existing trigger and function
        console.log('Dropping existing trigger and function...');
        await pool.query('DROP TRIGGER IF EXISTS trigger_delete_entity_related_data ON reviewable_entity;');
        await pool.query('DROP FUNCTION IF EXISTS delete_entity_related_data();');
        
        // Read the updated SQL file
        const sqlPath = path.join(__dirname, 'migrations', 'create_entity_deletion_trigger.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // Execute the SQL
        await pool.query(sqlContent);
        
        console.log('✅ Entity deletion trigger updated successfully!');
        console.log('The trigger will now correctly delete:');
        console.log('- Related entity_requests (matched by item_name) when an entity is deleted');
        console.log('- Related reviews (matched by item_id) when an entity is deleted');
        
    } catch (error) {
        console.error('❌ Error updating entity deletion trigger:', error);
    } finally {
        // Close the pool
        await pool.end();
    }
}

updateEntityDeletionTrigger();
