const express = require('express');
const cors = require('cors');
const pool = require('./config/db.js');

const app = express();

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use(cors({
  origin: ['https://kc5m06d5-5173.asse.devtunnels.ms', 'https://kc5m06d5-5174.asse.devtunnels.ms', 'https://kc5m06d5-4173.asse.devtunnels.ms'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Root route to confirm server is working
app.get('/', async (req, res) => {
  try {
    res.json({ message: 'Anonymous Messenger Server is running!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// Verify code endpoint
app.post('/api/verify-code', async (req, res) => {
  const { code } = req.body;
  
  console.log('=== CODE VERIFICATION REQUEST ===');
  console.log('Received code:', code);
  
  if (!code) {
    console.log('Error: No code provided');
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    console.log('Querying database for code:', code);
    // Check if code exists and is not expired in the 'login_codes' table
    const result = await pool.query(
      'SELECT * FROM "login_codes" WHERE "code" = $1 AND "expires_at" > NOW()',
      [code]
    );

    console.log('Database query result:', result.rows);
  

    if (result.rows.length === 0) {
      console.log('Code not found in database or expired - Invalid code');
      return res.status(401).json({ error: 'Invalid or expired code' });
    }

    console.log('Code verified successfully!');
    res.json({ success: true, message: 'Code verified successfully' });
  } catch (err) {
    console.error('Code verification error:', err.message);
    res.status(500).json({ error: 'Server error during code verification' });
  }
});

// Check username availability endpoint
app.post('/api/check-username', async (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  // Check if username contains only text and numbers
  const isValidUsername = /^[a-zA-Z0-9]+$/.test(username);
  if (!isValidUsername) {
    return res.status(400).json({ error: 'Username can only contain letters and numbers' });
  }

  try {
    // Check if username exists in the 'users' table
    const result = await pool.query(
      'SELECT username FROM "users" WHERE username = $1',
      [username]
    );

    if (result.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    res.json({ success: true, message: 'Username is available' });
  } catch (err) {
    console.error('Username check error:', err.message);
    res.status(500).json({ error: 'Server error during username check' });
  }
});

// Create user with username endpoint
app.post('/api/create-user', async (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  // Check if username contains only text and numbers
  const isValidUsername = /^[a-zA-Z0-9]+$/.test(username);
  if (!isValidUsername) {
    return res.status(400).json({ error: 'Username can only contain letters and numbers' });
  }

  try {
    // Double-check username availability
    const checkResult = await pool.query(
      'SELECT username FROM "users" WHERE username = $1',
      [username]
    );

    if (checkResult.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Create user with last_active timestamp
    const result = await pool.query(
      'INSERT INTO "users" (username, last_active) VALUES ($1, NOW()) RETURNING username, created_at',
      [username]
    );

    res.json({ 
      success: true, 
      message: 'User created successfully',
      user: { 
        username: result.rows[0].username, 
        user_id: null, 
        created_at: result.rows[0].created_at 
      }
    });
  } catch (err) {
    console.error('User creation error:', err.message);
    res.status(500).json({ error: 'Server error during user creation' });
  }
});

// Get messages endpoint
app.get('/api/messages', async (req, res) => {
  try {
    // For now, return a simple response
    // You can implement a messages table later
    res.json({ 
      messages: [],
      message: 'Messaging system ready - no messages yet'
    });
  } catch (err) {
    console.error('Get messages error:', err.message);
    res.status(500).json({ error: 'Server error retrieving messages' });
  }
});

// Send message endpoint
app.post('/api/send-message', async (req, res) => {
  const { username, message } = req.body;
  
  if (!username || !message) {
    return res.status(400).json({ error: 'Username and message are required' });
  }

  try {
    // For now, just return success
    // You can implement a messages table later
    res.json({ 
      success: true,
      message: 'Message sent successfully',
      data: {
        username,
        message,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Send message error:', err.message);
    res.status(500).json({ error: 'Server error sending message' });
  }
});

// Join P2P queue endpoint
app.post('/api/join-p2p', async (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    console.log(`User ${username} joining P2P queue`);
    
    // Update user's last_active timestamp
    await pool.query(
      'UPDATE "users" SET last_active = NOW() WHERE username = $1',
      [username]
    );

    // Check if user is already in an active connection
    const existingConnection = await pool.query(
      'SELECT * FROM "p2p_connections" WHERE (user1 = $1 OR user2 = $1) AND status IN ($2, $3)',
      [username, 'waiting', 'active']
    );

    if (existingConnection.rows.length > 0) {
      const connection = existingConnection.rows[0];
      if (connection.status === 'active') {
        const partner = connection.user1 === username ? connection.user2 : connection.user1;
        return res.json({
          success: true,
          matched: true,
          partner: partner,
          connectionId: connection.id
        });
      } else {
        return res.json({
          success: true,
          matched: false,
          waiting: true,
          connectionId: connection.id
        });
      }
    }

    // Look for someone waiting (random selection)
    const waitingConnection = await pool.query(
      'SELECT * FROM "p2p_connections" WHERE status = $1 AND expires_at > NOW() ORDER BY RANDOM() LIMIT 1',
      ['waiting']
    );

    if (waitingConnection.rows.length > 0) {
      // Match with waiting user
      const connection = waitingConnection.rows[0];
      const partnerUsername = connection.user1;
      
      await pool.query(
        'UPDATE "p2p_connections" SET user2 = $1, status = $2, expires_at = NOW() + INTERVAL \'10 minutes\' WHERE id = $3',
        [username, 'active', connection.id]
      );

      console.log(`Matched ${username} with ${partnerUsername}`);
      
      res.json({ 
        success: true, 
        matched: true,
        partner: partnerUsername,
        connectionId: connection.id
      });
    } else {
      // Create new waiting connection
      const result = await pool.query(
        'INSERT INTO "p2p_connections" (user1, user2, status, expires_at) VALUES ($1, $1, $2, NOW() + INTERVAL \'5 minutes\') RETURNING id',
        [username, 'waiting']
      );

      console.log(`${username} added to P2P queue`);
      
      res.json({ 
        success: true, 
        matched: false,
        waiting: true,
        connectionId: result.rows[0].id
      });
    }
  } catch (err) {
    console.error('P2P join error:', err.message);
    res.status(500).json({ error: 'Server error joining P2P' });
  }
});

// Get queue statistics endpoint
app.get('/api/queue-stats', async (req, res) => {
  try {
    // Count waiting users
    const waitingResult = await pool.query(
      'SELECT COUNT(*) as waiting_count FROM "p2p_connections" WHERE status = $1 AND expires_at > NOW()',
      ['waiting']
    );
    
    // Count active connections
    const activeResult = await pool.query(
      'SELECT COUNT(*) as active_count FROM "p2p_connections" WHERE status = $1 AND expires_at > NOW()',
      ['active']
    );
    
    // Count total users
    const usersResult = await pool.query(
      'SELECT COUNT(*) as total_users FROM "users" WHERE last_active > NOW() - INTERVAL \'5 minutes\''
    );

    res.json({
      waiting: parseInt(waitingResult.rows[0].waiting_count),
      active_connections: parseInt(activeResult.rows[0].active_count),
      total_active_users: parseInt(usersResult.rows[0].total_users)
    });
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check P2P status endpoint
app.get('/api/check-p2p/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    // Update user's last_active timestamp
    await pool.query(
      'UPDATE "users" SET last_active = NOW() WHERE username = $1',
      [username]
    );

    const result = await pool.query(
      'SELECT * FROM "p2p_connections" WHERE (user1 = $1 OR user2 = $1) AND status IN ($2, $3) AND expires_at > NOW()',
      [username, 'waiting', 'active']
    );

    if (result.rows.length === 0) {
      return res.json({ connected: false, waiting: false });
    }

    const connection = result.rows[0];
    if (connection.status === 'active') {
      // Connected
      const partner = connection.user1 === username ? connection.user2 : connection.user1;
      res.json({ 
        connected: true, 
        waiting: false, 
        partner,
        connectionId: connection.id 
      });
    } else {
      // Still waiting
      res.json({ connected: false, waiting: true, connectionId: connection.id });
    }
  } catch (err) {
    console.error('P2P check error:', err.message);
    res.status(500).json({ error: 'Server error checking P2P status' });
  }
});

// Send P2P message endpoint
app.post('/api/send-p2p-message', async (req, res) => {
  const { sender, receiver, message } = req.body;
  
  if (!sender || !receiver || !message) {
    return res.status(400).json({ error: 'Sender, receiver, and message are required' });
  }

  try {
    // Update sender's last_active timestamp
    await pool.query(
      'UPDATE "users" SET last_active = NOW() WHERE username = $1',
      [sender]
    );

    // Verify active connection exists
    const connection = await pool.query(
      'SELECT * FROM "p2p_connections" WHERE ((user1 = $1 AND user2 = $2) OR (user1 = $2 AND user2 = $1)) AND status = $3 AND expires_at > NOW()',
      [sender, receiver, 'active']
    );

    if (connection.rows.length === 0) {
      return res.status(403).json({ error: 'No active connection between users' });
    }

    const connectionId = connection.rows[0].id;

    // Store message in p2p_messages table
    await pool.query(
      'INSERT INTO "p2p_messages" (connection_id, sender, message) VALUES ($1, $2, $3)',
      [connectionId, sender, message]
    );

    res.json({ 
      success: true,
      message: 'Message sent successfully'
    });
  } catch (err) {
    console.error('Send P2P message error:', err.message);
    res.status(500).json({ error: 'Server error sending message' });
  }
});

// Get P2P messages endpoint
app.get('/api/get-p2p-messages/:username/:partner', async (req, res) => {
  const { username, partner } = req.params;
  
  try {
    // Update user's last_active timestamp
    await pool.query(
      'UPDATE "users" SET last_active = NOW() WHERE username = $1',
      [username]
    );

    // Find the active connection between users
    const connection = await pool.query(
      'SELECT id FROM "p2p_connections" WHERE ((user1 = $1 AND user2 = $2) OR (user1 = $2 AND user2 = $1)) AND status = $3 AND expires_at > NOW()',
      [username, partner, 'active']
    );

    if (connection.rows.length === 0) {
      return res.json({ messages: [] });
    }

    const connectionId = connection.rows[0].id;

    // Get messages for this connection that haven't expired
  const result = await pool.query(
  'SELECT sender, message, sent_at, expires_at FROM "p2p_messages" WHERE connection_id = $1 AND expires_at > NOW() ORDER BY sent_at ASC',
      [connectionId]
    );

  const nowRes = await pool.query('SELECT NOW() as server_now');
  res.json({ server_now: nowRes.rows[0].server_now, messages: result.rows });
  } catch (err) {
    console.error('Get P2P messages error:', err.message);
    res.status(500).json({ error: 'Server error retrieving messages' });
  }
});

// Leave P2P endpoint
app.post('/api/leave-p2p', async (req, res) => {
  const { username } = req.body;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    // End any active or waiting connections for this user
    await pool.query(
      'UPDATE "p2p_connections" SET status = $1, expires_at = NOW() WHERE (user1 = $2 OR user2 = $2) AND status IN ($3, $4)',
      ['ended', username, 'waiting', 'active']
    );

    // Only leave P2P here; full account cleanup should be done via /api/logout
      const { username } = req.query;
  } catch (err) {
    console.error('Leave P2P error:', err.message);
    res.status(500).json({ error: 'Server error leaving P2P' });
  }
});

// Logout endpoint with cleanup (preserve groups created by user for 5 hours)
app.post('/api/logout', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username is required' });
  try {
    await cleanupUserPreservingGroups(username);
    return res.json({ success: true });
  } catch (err) {
    console.error('Logout cleanup error:', err.message);
    return res.status(500).json({ error: 'Server error during logout cleanup' });
  }
});

// Create group endpoint
app.post('/api/create-group', async (req, res) => {
  const { creator, topic, description } = req.body;
  
  if (!creator || !topic) {
    return res.status(400).json({ error: 'Creator and topic are required' });
  }
  
  if (topic.length < 3 || topic.length > 50) {
    return res.status(400).json({ error: 'Topic must be between 3 and 50 characters' });
  }

  try {
    // Update creator's last_active
    await pool.query('UPDATE "users" SET last_active = NOW() WHERE username = $1', [creator]);
    
    // Create group with 30-minute expiry
    const result = await pool.query(
      'INSERT INTO "groups" (topic, description, creator, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'30 minutes\') RETURNING *',
      [topic.trim(), description?.trim() || null, creator]
    );
    
    const group = result.rows[0];
    
    // Add creator as first member
    await pool.query(
      'INSERT INTO "group_members" (group_id, username) VALUES ($1, $2)',
      [group.id, creator]
    );
    
    // Update member count
    await pool.query(
      'UPDATE "groups" SET member_count = 1 WHERE id = $1',
      [group.id]
    );
    
    console.log(`Group "${topic}" created by ${creator}`);
    res.json({ 
      success: true, 
      group: {
        id: group.id,
        topic: group.topic,
        description: group.description,
        creator: group.creator,
        member_count: 1,
        created_at: group.created_at
      }
    });
  } catch (err) {
    console.error('Create group error:', err.message);
    res.status(500).json({ error: 'Server error creating group' });
  }
});

// Get all groups (browse) endpoint
app.get('/api/groups', async (req, res) => {
  const { search, limit = 20 } = req.query;
  
  try {
    let query = `
      SELECT g.*, 
             (SELECT COUNT(*) FROM "group_members" gm WHERE gm.group_id = g.id) as member_count,
             (SELECT COUNT(*) FROM "group_messages" gm WHERE gm.group_id = g.id) as message_count
      FROM "groups" g 
      WHERE g.expires_at > NOW()
    `;
    let params = [];
    
    // Add search functionality
    if (search && search.trim()) {
      query += ` AND (LOWER(g.topic) LIKE $1 OR LOWER(g.description) LIKE $1)`;
      params.push(`%${search.trim().toLowerCase()}%`);
    }
    
    query += ` ORDER BY g.created_at DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit));
    
    const result = await pool.query(query, params);
    
    res.json({ groups: result.rows });
  } catch (error) {
    console.error('Error getting groups:', error);
    res.status(500).json({ error: error.message });
  }
});

// Join group endpoint
app.post('/api/join-group', async (req, res) => {
  const { username, groupId } = req.body;
  
  if (!username || !groupId) {
    return res.status(400).json({ error: 'Username and group ID are required' });
  }

  try {
    // Update user's last_active
    await pool.query('UPDATE "users" SET last_active = NOW() WHERE username = $1', [username]);
    
    // Check if group exists and is not expired
    const groupResult = await pool.query(
      'SELECT * FROM "groups" WHERE id = $1 AND expires_at > NOW()',
      [groupId]
    );
    
    if (groupResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found or expired' });
    }
    
    // Check if user is already a member
    const memberCheck = await pool.query(
      'SELECT * FROM "group_members" WHERE group_id = $1 AND username = $2',
      [groupId, username]
    );
    
    if (memberCheck.rows.length > 0) {
      return res.json({ success: true, message: 'Already a member', group: groupResult.rows[0] });
    }
    
    // Add user to group
    await pool.query(
      'INSERT INTO "group_members" (group_id, username) VALUES ($1, $2)',
      [groupId, username]
    );
    
    // Update member count
    await pool.query(
      'UPDATE "groups" SET member_count = (SELECT COUNT(*) FROM "group_members" WHERE group_id = $1) WHERE id = $1',
      [groupId]
    );
    
    console.log(`${username} joined group ${groupId}`);
    res.json({ success: true, message: 'Joined group successfully', group: groupResult.rows[0] });
  } catch (err) {
    console.error('Join group error:', err.message);
    res.status(500).json({ error: 'Server error joining group' });
  }
});

// Leave group endpoint
app.post('/api/leave-group', async (req, res) => {
  const { username, groupId } = req.body;
  
  if (!username || !groupId) {
    return res.status(400).json({ error: 'Username and group ID are required' });
  }

  try {
    // Remove user from group
    await pool.query(
      'DELETE FROM "group_members" WHERE group_id = $1 AND username = $2',
      [groupId, username]
    );
    
    // Update member count
    await pool.query(
      'UPDATE "groups" SET member_count = (SELECT COUNT(*) FROM "group_members" WHERE group_id = $1) WHERE id = $1',
      [groupId]
    );
    
    console.log(`${username} left group ${groupId}`);
    res.json({ success: true, message: 'Left group successfully' });
  } catch (err) {
    console.error('Leave group error:', err.message);
    res.status(500).json({ error: 'Server error leaving group' });
  }
});

// Send group message endpoint
app.post('/api/send-group-message', async (req, res) => {
  const { sender, groupId, message } = req.body;
  
  if (!sender || !groupId || !message) {
    return res.status(400).json({ error: 'Sender, group ID, and message are required' });
  }

  try {
    // Update sender's last_active
    await pool.query('UPDATE "users" SET last_active = NOW() WHERE username = $1', [sender]);
    
    // Check if user is a member of the group
    const memberCheck = await pool.query(
      'SELECT * FROM "group_members" WHERE group_id = $1 AND username = $2',
      [groupId, sender]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }
    
    // Check current message count
    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM "group_messages" WHERE group_id = $1',
      [groupId]
    );
    
    const currentCount = parseInt(countResult.rows[0].count);
    
    // If we have 50+ messages, delete the oldest ones to make room for the new message
    if (currentCount >= 50) {
      const deleteCount = currentCount - 49; // Keep 49, so new message makes 50
      await pool.query(
        'DELETE FROM "group_messages" WHERE group_id = $1 AND id IN (SELECT id FROM "group_messages" WHERE group_id = $1 ORDER BY sent_at ASC LIMIT $2)',
        [groupId, deleteCount]
      );
    }
    
    // Insert new message
    await pool.query(
      'INSERT INTO "group_messages" (group_id, sender, message) VALUES ($1, $2, $3)',
      [groupId, sender, message.trim()]
    );
    
    // Update group's message count
    await pool.query(
      'UPDATE "groups" SET message_count = (SELECT COUNT(*) FROM "group_messages" WHERE group_id = $1) WHERE id = $1',
      [groupId]
    );
    
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    console.error('Send group message error:', err.message);
    res.status(500).json({ error: 'Server error sending message' });
  }
});

// Get group messages endpoint
app.get('/api/get-group-messages/:groupId', async (req, res) => {
  const { groupId } = req.params;
  const { username } = req.query;
  
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  try {
    // Update user's last_active
    await pool.query('UPDATE "users" SET last_active = NOW() WHERE username = $1', [username]);
    
    // Check if user is a member
    const memberCheck = await pool.query(
      'SELECT * FROM "group_members" WHERE group_id = $1 AND username = $2',
      [groupId, username]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }
    
    // Get messages (up to 50, ordered by time) and ensure only non-expired messages are returned
  const result = await pool.query(
  'SELECT sender, message, sent_at, expires_at FROM "group_messages" WHERE group_id = $1 AND expires_at > NOW() ORDER BY sent_at ASC LIMIT 50',
      [groupId]
    );
  const nowRes = await pool.query('SELECT NOW() as server_now');
  res.json({ server_now: nowRes.rows[0].server_now, messages: result.rows });
  } catch (err) {
    console.error('Get group messages error:', err.message);
    res.status(500).json({ error: 'Server error retrieving messages' });
  }
});

// Get user's groups endpoint
app.get('/api/user-groups/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const result = await pool.query(`
      SELECT g.*, gm.joined_at,
             (SELECT COUNT(*) FROM "group_members" gm2 WHERE gm2.group_id = g.id) as member_count,
             (SELECT COUNT(*) FROM "group_messages" gm2 WHERE gm2.group_id = g.id) as message_count
      FROM "groups" g 
      JOIN "group_members" gm ON g.id = gm.group_id 
      WHERE gm.username = $1 AND g.expires_at > NOW()
      ORDER BY gm.joined_at DESC
    `, [username]);
    
    res.json({ groups: result.rows });
  } catch (error) {
    console.error('Error getting user groups:', error);
    res.status(500).json({ error: error.message });
  }
});

// Setup group messaging schema endpoint
app.post('/api/setup-groups', async (req, res) => {
  try {
    console.log('Setting up group messaging schema...');
    
    // Add missing fields to groups table
    await pool.query(`
      ALTER TABLE "groups" 
      ADD COLUMN IF NOT EXISTS "description" TEXT,
      ADD COLUMN IF NOT EXISTS "creator" VARCHAR REFERENCES "users"("username"),
      ADD COLUMN IF NOT EXISTS "member_count" INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "message_count" INT DEFAULT 0
    `);
    
    // Add sender field to group_messages table
    await pool.query(`
      ALTER TABLE "group_messages" 
      ADD COLUMN IF NOT EXISTS "sender" VARCHAR REFERENCES "users"("username")
    `);
    
    // Create group_members junction table for tracking membership
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "group_members" (
        "id" SERIAL PRIMARY KEY,
        "group_id" INT REFERENCES "groups"("id") ON DELETE CASCADE,
        "username" VARCHAR REFERENCES "users"("username") ON DELETE CASCADE,
        "joined_at" TIMESTAMP DEFAULT NOW(),
        UNIQUE(group_id, username)
      )
    `);
    
    console.log('Group messaging schema setup completed successfully!');
    res.json({ message: 'Group messaging schema setup completed successfully' });
  } catch (error) {
    console.error('Error setting up group schema:', error);
    res.status(500).json({ 
      error: 'Failed to setup group schema', 
      details: error.message 
    });
  }
});

// Get P2P connections endpoint (for debugging)
app.get('/api/p2p-connections', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "p2p_connections" ORDER BY started_at DESC');
    res.json({ connections: result.rows });
  } catch (error) {
    console.error('Error getting P2P connections:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get P2P messages endpoint (for debugging)
app.get('/api/p2p-messages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "p2p_messages" ORDER BY sent_at DESC LIMIT 100');
    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Error getting P2P messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users endpoint
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT username, created_at, last_active FROM "users"');
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all login codes endpoint
app.get('/api/codes', async (req, res) => {
  try {
    const result = await pool.query('SELECT code, created_at, expires_at FROM "login_codes"');
    res.json({ codes: result.rows });
  } catch (error) {
    console.error('Error getting codes:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add test code endpoint
app.post('/api/add-test-code', async (req, res) => {
  try {
    const result = await pool.query(
      'INSERT INTO "login_codes" (code, expires_at) VALUES ($1, NOW() + INTERVAL \'24 hours\') ON CONFLICT (code) DO UPDATE SET expires_at = NOW() + INTERVAL \'24 hours\' RETURNING *',
      ['1']
    );
    res.json({ message: 'Test code added', data: result.rows });
  } catch (error) {
    console.error('Error adding test code:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check database tables endpoint
app.get('/api/check-tables', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position
    `);
    res.json({ tables: result.rows });
  } catch (error) {
    console.error('Error checking tables:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to verify server is reachable
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit!');
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Anonymous Messenger Server running on http://localhost:${PORT}`);
  (async () => {
    try {
      // Check the database connection
      await pool.query('SELECT 1');
      console.log('Database connection successful');
      
      // Start cleanup jobs
      startCleanupJobs();
      
    } catch (err) {
      console.error('Error during server startup:', err);
    }
  })();
});

// Cleanup functions
function startCleanupJobs() {
  console.log('Starting cleanup jobs...');
  
  // Clean expired connections every minute
  setInterval(async () => {
    try {
      const result = await pool.query(
        'UPDATE "p2p_connections" SET status = $1 WHERE expires_at < NOW() AND status != $1',
        ['ended']
      );
      if (result.rowCount > 0) {
        console.log(`Marked ${result.rowCount} connections as ended due to expiration`);
      }
    } catch (err) {
      console.error('Connection cleanup error:', err.message);
    }
  }, 60000); // Every minute

  // Clean inactive users every 2 minutes (no messages in last 10 minutes)
  setInterval(async () => {
    try {
      // Find users with no messages in last 10 minutes across p2p and group chats
      const { rows } = await pool.query(`
        SELECT u.username
        FROM "users" u
        WHERE u.last_active < NOW() - INTERVAL '10 minutes'
          AND NOT EXISTS (
            SELECT 1 FROM "p2p_messages" pm 
            JOIN "p2p_connections" pc ON pc.id = pm.connection_id
            WHERE (pc.user1 = u.username OR pc.user2 = u.username)
              AND pm.sent_at > NOW() - INTERVAL '10 minutes'
          )
          AND NOT EXISTS (
            SELECT 1 FROM "group_messages" gm
            WHERE gm.sender = u.username AND gm.sent_at > NOW() - INTERVAL '10 minutes'
          )
      `);

      for (const r of rows) {
        await cleanupUserPreservingGroups(r.username);
      }
      if (rows.length > 0) {
        console.log(`Inactive cleanup completed for ${rows.length} user(s)`);
      }
    } catch (err) {
      console.error('User inactivity cleanup error:', err.message);
    }
  }, 120000); // Every 2 minutes

  // Clean expired login codes every hour
  setInterval(async () => {
    try {
      const result = await pool.query(
        'DELETE FROM "login_codes" WHERE expires_at < NOW()'
      );
      if (result.rowCount > 0) {
        console.log(`Cleaned up ${result.rowCount} expired login codes`);
      }
    } catch (err) {
      console.error('Login codes cleanup error:', err.message);
    }
  }, 3600000); // Every hour

  // Clean old group messages every 30 minutes (keep only latest 50 per group)
  setInterval(async () => {
    try {
      const result = await pool.query(`
        DELETE FROM "group_messages" 
        WHERE id NOT IN (
          SELECT id FROM (
            SELECT id, 
                   ROW_NUMBER() OVER (PARTITION BY group_id ORDER BY sent_at DESC) as rn
            FROM "group_messages"
          ) ranked 
          WHERE rn <= 50
        )
      `);
      if (result.rowCount > 0) {
        console.log(`Cleaned up ${result.rowCount} old group messages`);
      }
    } catch (err) {
      console.error('Group messages cleanup error:', err.message);
    }
  }, 1800000); // Every 30 minutes
}

// Helper function to clean up user data while preserving groups they created for 5 hours
async function cleanupUserPreservingGroups(username) {
  try {
    console.log(`Cleaning up user data (preserve groups for 5h): ${username}`);

    // 1) Extend retention for groups created by this user and detach creator to avoid FK issues
    await pool.query(
      'UPDATE "groups" SET expires_at = GREATEST(expires_at, NOW() + INTERVAL \'' +
      '5 hours\'), creator = NULL WHERE creator = $1',
      [username]
    );

    // 2) End any active/waiting P2P connections
    await pool.query(
      'UPDATE "p2p_connections" SET status = $1, expires_at = NOW() WHERE (user1 = $2 OR user2 = $2) AND status IN ($3, $4)',
      ['ended', username, 'waiting', 'active']
    );

    // 3) Delete P2P messages for connections involving this user
    await pool.query(
      'DELETE FROM "p2p_messages" WHERE connection_id IN (SELECT id FROM "p2p_connections" WHERE user1 = $1 OR user2 = $1)',
      [username]
    );

    // 4) Remove the user from any groups and delete their group messages
    await pool.query('DELETE FROM "group_members" WHERE username = $1', [username]);
    await pool.query('DELETE FROM "group_messages" WHERE sender = $1', [username]);

    // 5) Remove ended connections involving the user (optional to reduce clutter)
    await pool.query('DELETE FROM "p2p_connections" WHERE user1 = $1 OR user2 = $1', [username]);

    // 6) Finally, delete the user account
    await pool.query('DELETE FROM "users" WHERE username = $1', [username]);

    console.log(`User ${username} cleanup completed (groups retained for 5h).`);
  } catch (err) {
    console.error(`Error cleaning up user ${username}:`, err.message);
  }
}
