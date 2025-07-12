const databaseSetup = require('./setup/databaseSetup');

async function testDatabaseSetup() {
  try {
    console.log('Testing database setup...');
    await databaseSetup.init();
    console.log('Database setup test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database setup test failed:', error);
    process.exit(1);
  }
}

testDatabaseSetup();
