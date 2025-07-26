// Direct setup script for reports table
const pool = require('./config/db');
const fs = require('fs');
const path = require('path');

const setupReports = async () => {
  console.log('Starting report setup...');
  
  let client;
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('Database connected successfully');
    
    console.log('🚀 Setting up Report System...');
    
    // Read and execute the SQL file
    const sqlFile = path.join(__dirname, 'setup', 'create_reports_table.sql');
    console.log('Reading SQL file from:', sqlFile);
    
    if (!fs.existsSync(sqlFile)) {
      throw new Error('SQL file not found: ' + sqlFile);
    }
    
    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log('SQL file read successfully, length:', sql.length);
    
    console.log('Executing SQL commands...');
    await client.query(sql);
    
    console.log('✅ Report system setup completed successfully!');
    console.log('📊 Reports table created');
    console.log('📋 Report reasons table created with default reasons');
    
  } catch (error) {
    console.error('❌ Error setting up report system:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (client) {
      client.release();
      console.log('Database connection released');
    }
    process.exit(0);
  }
};

setupReports();
