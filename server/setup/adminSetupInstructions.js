// Admin System Setup Instructions and Utility

console.log(`
=== ADMIN SYSTEM SETUP INSTRUCTIONS ===

1. DATABASE SETUP:
   Run the SQL script to create the necessary tables:
   Execute: d:\\CSE Database Project\\Last hope\\server\\setup\\create_reports_table.sql
   
   This script will create:
   - reports table (if not exists)
   - report_reasons table (if not exists) 
   - admin_actions table
   - user_warnings table
   - user_bans table
   - Add isAdmin column to user table (if not exists)
   - Add soft deletion columns to posts, comments, reviews tables

2. API SETUP:
   Call the admin system setup endpoint:
   POST http://localhost:3000/api/setup/admin-system

3. MAKE FIRST ADMIN:
   You need at least one admin user to start. You can:
   
   Option A: Directly update the database:
   UPDATE "user" SET isAdmin = true WHERE user_id = 1;
   
   Option B: Use the API (requires an existing admin):
   POST http://localhost:3000/api/admin/make-admin/USER_ID
   Body: { "adminId": EXISTING_ADMIN_ID }

4. ADMIN FEATURES:
   - View and manage all reports
   - Take actions: Warning, Delete Content, Ban User, or No Action
   - Track admin actions and history
   - Manage user warnings and bans
   - Soft delete reported content

5. ADMIN ACCESS:
   - Admin Reports page: /admin/reports
   - Accessible only to users with isAdmin = true
   - Admin link appears in navigation for admin users

=== ADMIN ACTIONS AVAILABLE ===

1. WARNING: Issues a warning to the user
2. DELETE CONTENT: Soft deletes the reported post/comment/review
3. BAN USER: Temporarily or permanently bans the user
4. NO ACTION: Marks report as resolved without action

All actions are logged in the admin_actions table for audit purposes.

=== DATABASE SCHEMA ===

admin_actions:
- action_id, admin_user_id, report_id, action_type
- target_item_type, target_item_id, target_user_id
- action_details, created_at

user_warnings:
- warning_id, user_id, admin_id, reason
- content_type, content_id, is_active
- created_at, expires_at

user_bans:
- ban_id, user_id, admin_id, reason
- ban_type (temporary/permanent), created_at
- expires_at, is_active

=== SETUP COMPLETE ===
`);

// Export setup functions for programmatic use
const setupInstructions = {
  async callSetupEndpoint() {
    try {
      const response = await fetch('http://localhost:3000/api/setup/admin-system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      console.log('Setup endpoint response:', data);
      return data;
    } catch (error) {
      console.error('Setup endpoint error:', error);
      throw error;
    }
  },

  async makeUserAdmin(userId, adminId) {
    try {
      const response = await fetch(`http://localhost:3000/api/admin/make-admin/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminId }),
      });
      
      const data = await response.json();
      console.log('Make admin response:', data);
      return data;
    } catch (error) {
      console.error('Make admin error:', error);
      throw error;
    }
  },

  sqlScriptPath: 'd:\\CSE Database Project\\Last hope\\server\\setup\\create_reports_table.sql',
  
  quickStart: `
  QUICK START GUIDE:
  
  1. Execute the SQL script in your PostgreSQL database
  2. Start your server: npm start (in server directory)
  3. Call setup endpoint: POST http://localhost:3000/api/setup/admin-system
  4. Make your user admin: UPDATE "user" SET isAdmin = true WHERE user_id = YOUR_USER_ID;
  5. Access admin reports at: http://localhost:3000/admin/reports
  
  Your admin system is now ready!
  `
};

module.exports = setupInstructions;
