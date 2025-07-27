// simple-test.js - Simple connection test
console.log('Starting simple test...');

const { Pool } = require('pg');

async function quickTest() {
    const pool = new Pool({
        connectionString: 'postgresql://demo_owner:npg_FXUnhG86jcYw@ep-silent-heart-a85851wo-pooler.eastus2.azure.neon.tech/demo?sslmode=require',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Attempting connection...');
        const result = await pool.query('SELECT NOW() as current_time');
        console.log('✅ Database connection successful!');
        console.log('Current time:', result.rows[0].current_time);
        
        // Check if our trigger exists
        const triggerCheck = await pool.query(`
            SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_handle_post_deletion'
        `);
        
        if (triggerCheck.rows.length > 0) {
            console.log('✅ Trigger already exists:', triggerCheck.rows[0].tgname);
        } else {
            console.log('❌ Trigger NOT found - needs to be created');
        }
        
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
    } finally {
        await pool.end();
    }
}

quickTest();
