const express = require('express') ;
const cors = require('cors') ;
const pool = require('./config/db.js') ; // Your db.js that connects to Neon
const sectorRoutes = require('./routes/sectorRoute.js') ;
const categoryRoutes = require('./routes/categoryRoute.js') ;
const entityRoutes = require('./routes/entityRoute.js') ;
const heirarchyRoutes = require('./routes/hierarchyRoute.js') ;
const userProfileRoute = require('./routes/userProfileRoute.js') ; 
const userRoutes = require('./routes/userRoute.js') ;
const postRoutes = require('./routes/postRoute.js') ;
const reviewRoutes = require('./routes/reviewRoute.js') ;
const searchRoutes = require('./routes/searchRoute.js') ;
const followingRoutes = require('./routes/followingRoute.js') ;
const voteRoutes = require('./routes/voteRoute.js') ;
const photoRoutes = require('./routes/photoRoute.js') ;
const commentRoutes = require('./routes/commentRoute.js') ;
const notificationRoutes = require('./routes/notificationRoute.js') ;
const entityRequestRoutes = require('./routes/entityRequestRoute.js') ;
const databaseSetup = require('./setup/databaseSetup.js') ;
const photoSetup = require('./setup/photoSetup.js') ;
const commentSetup = require('./setup/commentSetup.js') ;
const notificationSetup = require('./setup/notificationSetup.js') ;
const entityRequestSetup = require('./setup/entityRequestSetup.js') ;
// const entityDetailsRoute = require('./routes/entityDetails.js') ; // Assuming you have this route for entity details

const app = express();

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  next();
});

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:4173'],   // allow your frontend
  credentials: true,   // if you are using cookies or auth tokens
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'user-id']
}));
app.use(express.json());

// Root route to confirm server is working
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reviewable_entity');
    res.json(result.rows);
  } catch (err) {
    console.error('Error querying database:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reviewable_entity');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// Add a new product
app.post('/api/products', async (req, res) => {
  const { category_id, item_name, owner_id, description } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO reviewable_entity (category_id, item_name, owner_id, description) VALUES ($1, $2, $3, $4) RETURNING item_id, category_id, item_name, owner_id, description`,
      [category_id, item_name, owner_id, description]
    );
    res.json(result.rows[0]); // result.rows[0].item_id will be the new item's id
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get user 
// app.use('/api/users', userRoutes);

// Get the sectors
app.use('/api/sector', sectorRoutes);

// Get the categories
app.use('/api/categories', categoryRoutes);

// Get entity details
app.use('/api/entities', entityRoutes);
// app.use('/api/entities/sub', entityRoutes);

// app.use('/api/entities/:entityId/details', entityDetailsRoute); // Route for entity details

// Get hierarchy
// app.use('/api/hierarchy', heirarchyRoutes);

//get user profile
app.use('/api/userProfile', userProfileRoute);

//post routes
app.use('/api/posts', postRoutes);

//review routes
app.use('/api/reviews', reviewRoutes);

//search routes
app.use('/api/search',searchRoutes)
//following routes
app.use('/api/users', followingRoutes);

//vote routes
app.use('/api/votes', voteRoutes);

//photo routes
app.use('/api/photos', photoRoutes);

//comment routes
// Comments API
app.use('/api/comments', commentRoutes);

//notification routes
// Notifications API
app.use('/api/notifications', notificationRoutes);

// Entity Requests API (Admin)
app.use('/api/entity-requests', entityRequestRoutes);

// Database setup endpoint (for manual setup if needed)
app.post('/api/setup/vote-table', async (req, res) => {
  try {
    await databaseSetup.init();
    res.json({ message: 'Vote table setup completed successfully' });
  } catch (error) {
    console.error('Error setting up vote table:', error);
    res.status(500).json({ 
      error: 'Failed to setup vote table', 
      details: error.message 
    });
  }
});

// Photo system setup endpoint
app.post('/api/setup/photo-system', async (req, res) => {
  try {
    await photoSetup.setupPhotoSystem();
    res.json({ message: 'Photo system setup completed successfully' });
  } catch (error) {
    console.error('Error setting up photo system:', error);
    res.status(500).json({ 
      error: 'Failed to setup photo system', 
      details: error.message 
    });
  }
});

// Entity Request system setup endpoint
app.post('/api/setup/entity-request-system', async (req, res) => {
  console.log('=== ENTITY REQUEST SYSTEM SETUP ENDPOINT HIT ===');
  try {
    await entityRequestSetup.setupEntityRequestSystem();
    res.json({ message: 'Entity request system setup completed successfully' });
  } catch (error) {
    console.error('Error setting up entity request system:', error);
    res.status(500).json({ 
      error: 'Failed to setup entity request system', 
      details: error.message 
    });
  }
});

// Comment system setup endpoint
app.post('/api/setup/comment-system', async (req, res) => {
  console.log('=== COMMENT SYSTEM SETUP ENDPOINT HIT ===');
  try {
    const result = await commentSetup.setupCommentSystem();
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to setup comment system', 
        details: result.error 
      });
    }
    res.json({ message: result.message });
  } catch (error) {
    console.error('Error setting up comment system:', error);
    res.status(500).json({ 
      error: 'Failed to setup comment system', 
      details: error.message 
    });
  }
});

// Add sample comments endpoint
app.post('/api/setup/sample-comments', async (req, res) => {
  try {
    const result = await commentSetup.addSampleComments();
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to add sample comments', 
        details: result.error 
      });
    }
    res.json({ message: result.message });
  } catch (error) {
    console.error('Error adding sample comments:', error);
    res.status(500).json({ 
      error: 'Failed to add sample comments', 
      details: error.message 
    });
  }
});

// Add notification setup endpoints
app.post('/api/setup/notifications', async (req, res) => {
  try {
    const result = await notificationSetup.setupNotificationSystem();
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to setup notification system', 
        details: result.error 
      });
    }
    res.json({ message: result.message });
  } catch (error) {
    console.error('Error setting up notification system:', error);
    res.status(500).json({ 
      error: 'Failed to setup notification system', 
      details: error.message 
    });
  }
});

app.post('/api/setup/sample-notifications', async (req, res) => {
  try {
    const result = await notificationSetup.addSampleNotifications();
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Failed to add sample notifications', 
        details: result.error 
      });
    }
    res.json({ message: result.message });
  } catch (error) {
    console.error('Error adding sample notifications:', error);
    res.status(500).json({ 
      error: 'Failed to add sample notifications', 
      details: error.message 
    });
  }
});

// Verify comment system endpoint
app.post('/api/setup/verify-comments', async (req, res) => {
  try {
    const result = await commentSetup.verifyCommentSystem();
    if (!result.success) {
      return res.status(500).json({ 
        error: 'Comment system verification failed', 
        details: result.error 
      });
    }
    res.json({ message: result.message });
  } catch (error) {
    console.error('Error verifying comment system:', error);
    res.status(500).json({ 
      error: 'Failed to verify comment system', 
      details: error.message 
    });
  }
});

// Migration endpoint for fixing photos table
app.post('/api/migrate/fix-photos-table', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'fix_photos_table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await pool.query(migrationSQL);
    
    res.json({ message: 'Photos table migration completed successfully' });
  } catch (error) {
    console.error('Error running photos table migration:', error);
    res.status(500).json({ 
      error: 'Failed to run migration', 
      details: error.message 
    });
  }
});

// Add a new user
app.post('/api/register', async (req, res) => {
  console.log('=== REGISTRATION ENDPOINT HIT ===');
  console.log('Registration request received:', req.body);
  
  const { username, email, password, created_at, isAdmin, bio, profile_picture, location } = req.body;
  
  // Log the exact values being inserted
  console.log('Values to insert:', {
    username,
    email,
    password: password ? '[HIDDEN]' : 'undefined',
    created_at,
    isAdmin,
    bio,
    profile_picture,
    location
  });
  
  try {
    console.log('Attempting to insert user into database...');
    const result = await pool.query(
      `INSERT INTO "user" (username, email, password, created_at, isAdmin, bio, profile_picture, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING user_id, username, email, created_at, isAdmin, bio, profile_picture, location`,
      [username, email, password, created_at, isAdmin, bio, profile_picture, location]
    );
    console.log('New user registered successfully:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Database error during registration:', err.message);
    console.error('Error code:', err.code);
    console.error('Error detail:', err.detail);
    console.error('Full error:', err);
    res.status(500).json({ 
      error: err.message,
      code: err.code,
      detail: err.detail 
    });
  }
});

// user login
app.post('/api/login', async (req, res) => {
  console.log('=== LOGIN ENDPOINT HIT ===');
  const { email, password } = req.body;
  console.log('Login request received for email:', email);
  
  try {
    console.log('Querying database for user...');
    const result = await pool.query(
      'SELECT user_id, username, email, password, isAdmin from "user" WHERE email = $1',
      [email]
    );
    
    console.log('Query result:', result.rows.length, 'rows found');
    
    if (result.rows.length === 0) {
      console.log('No user found with this email');
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    console.log('user found:', { user_id: user.user_id, username: user.username, email: user.email });
    
    // In production, use bcrypt to compare hashed passwords
    if (user.password !== password) {
      console.log('Password mismatch');
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    console.log('Login successful');
    // Exclude password from response
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err) {
    console.error('Login error:', err.message);
    console.error('Full login error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get reviews for a specific product (item_id)
// app.get('/api/entities/:item_id/reviews', async (req, res) => {
//   const { item_id } = req.params;
//   try {
//     const result = await pool.query(
//       'SELECT * = require() "review" WHERE item_id = $1',
//       [item_id]
//     );
//     console.log(`Fetching reviews for item_id: ${item_id}`);
//     res.json(result.rows);  
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// Test endpoint to verify server is reachable
app.get('/api/test', (req, res) => {
  console.log('Test endpoint hit!');
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Test endpoint to check review table schema
app.get('/api/test/review-schema', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'review' 
      ORDER BY ordinal_position
    `);
    res.json({ schema: result.rows });
  } catch (err) {
    console.error('Error checking schema:', err);
    res.status(500).json({ error: err.message });
  }
});

// Test endpoint to check photos table schema
app.get('/api/test/photos-schema', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'photos' 
      ORDER BY ordinal_position
    `);
    res.json({ schema: result.rows });
  } catch (err) {
    console.error('Error checking photos schema:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  (async () => {
    try {
      // Check the database connection
      await pool.query('SELECT 1');
      console.log('Database connection successful');
      
      // Initialize vote system database setup
      await databaseSetup.init();
      
    } catch (err) {
      console.error('Error during server startup:', err);
    }
  })();
});
