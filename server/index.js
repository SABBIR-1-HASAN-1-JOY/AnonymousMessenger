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
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'],
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
    // Check if code exists in the 'code' table
    const result = await pool.query(
      'SELECT * FROM "code" WHERE "codeToday" = $1',
      [code]
    );

    console.log('Database query result:', result.rows);
    console.log('Number of rows found:', result.rows.length);

    if (result.rows.length === 0) {
      console.log('Code not found in database - Invalid code');
      return res.status(401).json({ error: 'Invalid code' });
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
    // Check if username exists in the 'user' table
    const result = await pool.query(
      'SELECT username FROM "user" WHERE username = $1',
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
      'SELECT username FROM "user" WHERE username = $1',
      [username]
    );

    if (checkResult.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Create user
    const result = await pool.query(
      'INSERT INTO "user" (username) VALUES ($1) RETURNING username',
      [username]
    );

    res.json({ 
      success: true, 
      message: 'User created successfully',
      user: { username: result.rows[0].username, user_id: null, created_at: new Date().toISOString() }
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
    
    // Check if user is already in queue
    const existingUser = await pool.query(
      'SELECT * FROM connection WHERE user1 = $1 OR user2 = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already in queue or connected' });
    }

    // Look for someone waiting (random selection for multiple users)
    const waitingUser = await pool.query(
      'SELECT * FROM connection WHERE user2 IS NULL ORDER BY RANDOM() LIMIT 1'
    );

    if (waitingUser.rows.length > 0) {
      // Match with waiting user
      const partnerId = waitingUser.rows[0].id;
      const partnerUsername = waitingUser.rows[0].user1;
      
      await pool.query(
        'UPDATE connection SET user2 = $1 WHERE id = $2',
        [username, partnerId]
      );

      console.log(`Matched ${username} with ${partnerUsername}`);
      
      res.json({ 
        success: true, 
        matched: true,
        partner: partnerUsername,
        connectionId: partnerId
      });
    } else {
      // Add to queue
      const result = await pool.query(
        'INSERT INTO connection (user1, time) VALUES ($1, NOW()) RETURNING id',
        [username]
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

// Check P2P status endpoint
app.get('/api/check-p2p/:username', async (req, res) => {
  const { username } = req.params;
  
  try {
    const result = await pool.query(
      'SELECT * FROM connection WHERE user1 = $1 OR user2 = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.json({ connected: false, waiting: false });
    }

    const connection = result.rows[0];
    if (connection.user2) {
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
    // Verify connection exists
    const connection = await pool.query(
      'SELECT * FROM connection WHERE (user1 = $1 AND user2 = $2) OR (user1 = $2 AND user2 = $1)',
      [sender, receiver]
    );

    if (connection.rows.length === 0) {
      return res.status(403).json({ error: 'No active connection between users' });
    }

    // Store message (using message column if available, otherwise store in reciever field)
    try {
      await pool.query(
        'INSERT INTO messages (sender, reciever, message, time) VALUES ($1, $2, $3, NOW())',
        [sender, receiver, message]
      );
    } catch (columnError) {
      // Fallback if message column doesn't exist
      await pool.query(
        'INSERT INTO messages (sender, reciever, time) VALUES ($1, $2, NOW())',
        [sender, receiver + ':' + message]
      );
    }

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
    // Try to get messages with message column first
    let result;
    try {
      result = await pool.query(
        `SELECT sender, reciever, message, time FROM messages 
         WHERE (sender = $1 AND reciever = $2) OR (sender = $2 AND reciever = $1)
         ORDER BY time ASC`,
        [username, partner]
      );
    } catch (columnError) {
      // Fallback if message column doesn't exist
      result = await pool.query(
        `SELECT sender, reciever, time FROM messages 
         WHERE (sender = $1 AND reciever LIKE $2) OR (sender = $2 AND reciever LIKE $1)
         ORDER BY time ASC`,
        [username, partner + ':%', username + ':%']
      );
      
      // Parse message from reciever field
      result.rows = result.rows.map(row => ({
        ...row,
        message: row.reciever.includes(':') ? row.reciever.split(':').slice(1).join(':') : '',
        reciever: row.reciever.includes(':') ? row.reciever.split(':')[0] : row.reciever
      }));
    }

    res.json({ messages: result.rows });
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
    // Remove from connection table
    await pool.query(
      'DELETE FROM connection WHERE user1 = $1 OR user2 = $1',
      [username]
    );

    // Delete user's messages
    await pool.query(
      'DELETE FROM messages WHERE sender = $1 OR reciever = $1',
      [username]
    );

    // Delete user
    await pool.query(
      'DELETE FROM "user" WHERE username = $1',
      [username]
    );

    res.json({ success: true, message: 'Left P2P and cleaned up data' });
  } catch (err) {
    console.error('Leave P2P error:', err.message);
    res.status(500).json({ error: 'Server error leaving P2P' });
  }
});

// Setup P2P database schema endpoint
app.post('/api/setup-p2p-schema', async (req, res) => {
  try {
    // Add message column to messages table if it doesn't exist
    await pool.query(`
      ALTER TABLE messages 
      ADD COLUMN IF NOT EXISTS message TEXT
    `);
    
    // Ensure connection table exists with proper structure
    // First, drop and recreate to fix any constraint issues
    await pool.query(`
      DROP TABLE IF EXISTS connection CASCADE
    `);
    
    await pool.query(`
      CREATE TABLE connection (
        id SERIAL PRIMARY KEY,
        user1 TEXT NOT NULL,
        user2 TEXT,
        time TIMESTAMP DEFAULT NOW()
      )
    `);

    res.json({ message: 'P2P database schema setup completed successfully' });
  } catch (error) {
    console.error('Error setting up P2P schema:', error);
    res.status(500).json({ 
      error: 'Failed to setup P2P schema', 
      details: error.message 
    });
  }
});

// Setup database endpoint
app.post('/api/setup-database', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Read the setup SQL file
    const setupPath = path.join(__dirname, 'setup_database.sql');
    const setupSQL = fs.readFileSync(setupPath, 'utf8');
    
    // Execute the setup
    await pool.query(setupSQL);
    
    res.json({ message: 'Database setup completed successfully' });
  } catch (error) {
    console.error('Error setting up database:', error);
    res.status(500).json({ 
      error: 'Failed to setup database', 
      details: error.message 
    });
  }
});

// Get all users endpoint
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT username FROM "user"');
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all codes endpoint
app.get('/api/codes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM code');
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
      'INSERT INTO code ("codeToday") VALUES ($1) ON CONFLICT DO NOTHING RETURNING *',
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
  
  // Clean messages older than 5 minutes every minute
  setInterval(async () => {
    try {
      const result = await pool.query(
        'DELETE FROM messages WHERE time < NOW() - INTERVAL \'5 minutes\''
      );
      if (result.rowCount > 0) {
        console.log(`Cleaned up ${result.rowCount} old messages`);
      }
    } catch (err) {
      console.error('Message cleanup error:', err.message);
    }
  }, 60000); // Every minute

  // Clean inactive users and connections every minute
  setInterval(async () => {
    try {
      // Find inactive connections (no messages in last 5 minutes)
      const inactiveConnections = await pool.query(`
        SELECT DISTINCT c.user1, c.user2 
        FROM connection c 
        WHERE c.user2 IS NOT NULL 
        AND NOT EXISTS (
          SELECT 1 FROM messages m 
          WHERE (m.sender = c.user1 OR m.sender = c.user2) 
          AND m.time > NOW() - INTERVAL '5 minutes'
        )
        AND c.time < NOW() - INTERVAL '5 minutes'
      `);

      for (const conn of inactiveConnections.rows) {
        if (conn.user1) {
          await cleanupUser(conn.user1);
        }
        if (conn.user2) {
          await cleanupUser(conn.user2);
        }
      }

      // Clean waiting users who have been waiting for more than 5 minutes
      const waitingUsers = await pool.query(`
        SELECT user1 FROM connection 
        WHERE user2 IS NULL 
        AND time < NOW() - INTERVAL '5 minutes'
      `);

      for (const user of waitingUsers.rows) {
        await cleanupUser(user.user1);
      }

    } catch (err) {
      console.error('User cleanup error:', err.message);
    }
  }, 60000); // Every minute
}

async function cleanupUser(username) {
  try {
    console.log(`Cleaning up inactive user: ${username}`);
    
    // Remove from connections
    await pool.query(
      'DELETE FROM connection WHERE user1 = $1 OR user2 = $1',
      [username]
    );

    // Delete user's messages
    await pool.query(
      'DELETE FROM messages WHERE sender = $1 OR reciever = $1',
      [username]
    );

    // Delete user
    await pool.query(
      'DELETE FROM "user" WHERE username = $1',
      [username]
    );

    console.log(`User ${username} cleaned up successfully`);
  } catch (err) {
    console.error(`Error cleaning up user ${username}:`, err.message);
  }
}
