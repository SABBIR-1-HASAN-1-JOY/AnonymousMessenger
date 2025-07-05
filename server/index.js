const express = require('express') ;
const cors = require('cors') ;
const pool = require('./config/db.js') ; // Your db.js that connects to Neon
const sectorRoutes = require('./routes/sectorRoute.js') ;
const categoryRoutes = require('./routes/categoryRoute.js') ;
const entityRoutes = require('./routes/entityRoute.js') ;
const heirarchyRoutes = require('./routes/hierarchyRoute.js') ;
const userProfileRoute = require('./routes/userProfileRoute.js') ; 
const userRoutes = require('./routes/userRoute.js') ; 

const app = express();

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  next();
});

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],   // allow your frontend
  credentials: true,   // if you are using cookies or auth tokens
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Root route to confirm server is working
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * = require() reviewable_entity');
    res.json(result.rows);
  } catch (err) {
    console.error('Error querying database:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * = require() reviewable_entity');
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
app.use('/api/users', userRoutes);

// Get the sectors
app.use('/api/sector', sectorRoutes);

// Get the categories
app.use('/api/categories', categoryRoutes);

// Get entity details
app.use('/api/entities', entityRoutes);
// app.use('/api/entities/sub', entityRoutes);

// Get hierarchy
app.use('/api/hierarchy', heirarchyRoutes);

//get user profile
app.use('/api/userProfile', userProfileRoute);



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
      `INSERT INTO "USER" (username, email, password, created_at, isAdmin, bio, profile_picture, location)
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

// User login
app.post('/api/login', async (req, res) => {
  console.log('=== LOGIN ENDPOINT HIT ===');
  const { email, password } = req.body;
  console.log('Login request received for email:', email);
  
  try {
    console.log('Querying database for user...');
    const result = await pool.query(
      'SELECT user_id, username, email, password, isAdmin from "USER" WHERE email = $1',
      [email]
    );
    
    console.log('Query result:', result.rows.length, 'rows found');
    
    if (result.rows.length === 0) {
      console.log('No user found with this email');
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = result.rows[0];
    console.log('User found:', { user_id: user.user_id, username: user.username, email: user.email });
    
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

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  (async () => {
    try {
      // Optionally, you can check the database connection without logging user details
      await pool.query('SELECT 1');
      console.log('Database connection successful');
    } catch (err) {
      console.error('Error querying database:', err);
    }
  })();
});
