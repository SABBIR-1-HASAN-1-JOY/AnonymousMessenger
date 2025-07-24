// setup/photoSetup.js
const pool = require('../config/db.js');
const fs = require('fs');
const path = require('path');

const setupPhotosTable = async () => {
  try {
    console.log('Setting up photos table...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create_photos_table.sql');
    const sqlQuery = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await pool.query(sqlQuery);
    
    console.log('Photos table setup completed successfully');
    return { success: true, message: 'Photos table setup completed successfully' };
  } catch (error) {
    console.error('Error setting up photos table:', error);
    throw error;
  }
};

// Function to ensure uploads directory exists
const setupUploadsDirectory = () => {
  try {
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Uploads directory created:', uploadsDir);
    } else {
      console.log('Uploads directory already exists:', uploadsDir);
    }
    return { success: true, message: 'Uploads directory setup completed' };
  } catch (error) {
    console.error('Error setting up uploads directory:', error);
    throw error;
  }
};

// Combined setup function
const setupPhotoSystem = async () => {
  try {
    console.log('=== SETTING UP PHOTO SYSTEM ===');
    
    // Setup uploads directory
    setupUploadsDirectory();
    
    // Setup database table
    await setupPhotosTable();
    
    console.log('Photo system setup completed successfully');
    return { success: true, message: 'Photo system setup completed successfully' };
  } catch (error) {
    console.error('Error setting up photo system:', error);
    throw error;
  }
};

module.exports = {
  setupPhotosTable,
  setupUploadsDirectory,
  setupPhotoSystem
};
