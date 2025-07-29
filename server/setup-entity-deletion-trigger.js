const pool = require('./config/db.js');
const fs = require('fs');
const path = require('path');

async function createEntityDeletionTrigger() {
    try {
        console.log('Creating entity deletion trigger...');
        
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'migrations', 'create_entity_deletion_trigger.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // Execute the SQL
        await pool.query(sqlContent);
        
        console.log('✅ Entity deletion trigger created successfully!');
        console.log('The trigger will now automatically delete:');
        console.log('- Related entity_requests when an entity is deleted');
        console.log('- Related reviews when an entity is deleted');
        
    } catch (error) {
        console.error('❌ Error creating entity deletion trigger:', error);
    } finally {
        // Close the pool
        await pool.end();
    }
}

createEntityDeletionTrigger();
