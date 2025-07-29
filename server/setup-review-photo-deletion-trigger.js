const pool = require('./config/db.js');
const fs = require('fs');
const path = require('path');

async function createReviewPhotoDeletionTrigger() {
    try {
        console.log('Creating review photo deletion trigger...');
        
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'migrations', 'create_review_photo_deletion_trigger.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        
        // Execute the SQL
        await pool.query(sqlContent);
        
        console.log('✅ Review photo deletion trigger created successfully!');
        console.log('The trigger will now automatically:');
        console.log('- Delete related photos from database when a review is deleted');
        console.log('- The review controller will also delete physical files from storage');
        
    } catch (error) {
        console.error('❌ Error creating review photo deletion trigger:', error);
    } finally {
        // Close the pool
        await pool.end();
    }
}

createReviewPhotoDeletionTrigger();
