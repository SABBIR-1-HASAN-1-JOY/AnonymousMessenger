const pool = require('../config/db');

// Setup admin tables and functionality
const setupAdminSystem = async () => {
  const client = await pool.connect();
  
  try {
    console.log('Setting up admin system...');

    // Check if isAdmin column exists in user table
    const checkAdminColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user' AND column_name = 'isadmin'
    `);

    if (checkAdminColumn.rows.length === 0) {
      console.log('Adding isAdmin column to user table...');
      await client.query('ALTER TABLE "user" ADD COLUMN isAdmin BOOLEAN DEFAULT false');
    }

    // Create admin actions table if not exists
    const checkAdminActionsTable = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'admin_actions'
    `);

    if (checkAdminActionsTable.rows.length === 0) {
      console.log('Creating admin_actions table...');
      await client.query(`
        CREATE TABLE admin_actions (
          action_id SERIAL PRIMARY KEY,
          admin_user_id INTEGER NOT NULL,
          report_id INTEGER NOT NULL,
          action_type VARCHAR(20) NOT NULL,
          target_item_type VARCHAR(20),
          target_item_id INTEGER,
          target_user_id INTEGER,
          action_details TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT fk_admin_actions_admin FOREIGN KEY (admin_user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
          CONSTRAINT fk_admin_actions_report FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE,
          CONSTRAINT fk_admin_actions_target_user FOREIGN KEY (target_user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
          CONSTRAINT chk_action_type CHECK (action_type IN ('warning', 'delete_content', 'ban_user', 'no_action'))
        )
      `);

      await client.query('CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_user_id)');
      await client.query('CREATE INDEX idx_admin_actions_report ON admin_actions(report_id)');
      await client.query('CREATE INDEX idx_admin_actions_target_user ON admin_actions(target_user_id)');
    }

    // Create user warnings table if not exists
    const checkWarningsTable = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'user_warnings'
    `);

    if (checkWarningsTable.rows.length === 0) {
      console.log('Creating user_warnings table...');
      await client.query(`
        CREATE TABLE user_warnings (
          warning_id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          admin_id INTEGER NOT NULL,
          reason TEXT NOT NULL,
          content_type VARCHAR(20),
          content_id INTEGER,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP,
          
          CONSTRAINT fk_warnings_user FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
          CONSTRAINT fk_warnings_admin FOREIGN KEY (admin_id) REFERENCES "user"(user_id) ON DELETE CASCADE
        )
      `);

      await client.query('CREATE INDEX idx_user_warnings_user ON user_warnings(user_id)');
      await client.query('CREATE INDEX idx_user_warnings_active ON user_warnings(is_active)');
    }

    // Create user bans table if not exists
    const checkBansTable = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'user_bans'
    `);

    if (checkBansTable.rows.length === 0) {
      console.log('Creating user_bans table...');
      await client.query(`
        CREATE TABLE user_bans (
          ban_id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          admin_id INTEGER NOT NULL,
          reason TEXT NOT NULL,
          ban_type VARCHAR(20) DEFAULT 'temporary',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          
          CONSTRAINT fk_bans_user FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
          CONSTRAINT fk_bans_admin FOREIGN KEY (admin_id) REFERENCES "user"(user_id) ON DELETE CASCADE,
          CONSTRAINT chk_ban_type CHECK (ban_type IN ('temporary', 'permanent'))
        )
      `);

      await client.query('CREATE INDEX idx_user_bans_user ON user_bans(user_id)');
      await client.query('CREATE INDEX idx_user_bans_active ON user_bans(is_active)');
    }

    // Add soft deletion columns to posts, comments, reviews tables
    const tables = ['posts', 'comments', 'reviews'];
    
    for (const table of tables) {
      // Check and add deleted_at column
      const checkDeletedAt = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'deleted_at'
      `, [table]);

      if (checkDeletedAt.rows.length === 0) {
        console.log(`Adding deleted_at column to ${table} table...`);
        await client.query(`ALTER TABLE ${table} ADD COLUMN deleted_at TIMESTAMP NULL`);
      }

      // Check and add deleted_by_admin column
      const checkDeletedByAdmin = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = 'deleted_by_admin'
      `, [table]);

      if (checkDeletedByAdmin.rows.length === 0) {
        console.log(`Adding deleted_by_admin column to ${table} table...`);
        await client.query(`ALTER TABLE ${table} ADD COLUMN deleted_by_admin BOOLEAN DEFAULT false`);
      }
    }

    console.log('Admin system setup completed successfully');
    return { success: true, message: 'Admin system setup completed' };

  } catch (error) {
    console.error('Admin system setup error:', error);
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  setupAdminSystem
};
