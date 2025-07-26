// Simple script to test report setup
const reportSetup = require('./setup/reportSetup');

async function testReportSetup() {
  try {
    console.log('Testing report system setup...');
    const result = await reportSetup.setupReportSystem();
    
    if (result.success) {
      console.log('✅ Success:', result.message);
      
      // Now add sample data
      console.log('\nAdding sample reports...');
      const sampleResult = await reportSetup.addSampleReports();
      
      if (sampleResult.success) {
        console.log('✅ Sample data added:', sampleResult.message);
      } else {
        console.log('❌ Sample data failed:', sampleResult.error);
      }
    } else {
      console.log('❌ Setup failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

testReportSetup();
