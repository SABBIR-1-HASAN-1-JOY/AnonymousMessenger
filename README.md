# Anonymous Messenger

A simple anonymous messaging application with code-based authentication and peer-to-peer messaging.

## Features

- **Code-based Authentication**: Login using time-limited codes
- **Anonymous P2P Messaging**: Connect randomly with other users for private chat
- **Automatic Cleanup**: Messages and connections expire automatically (5 minutes for messages, 10 minutes for connections)
- **Session-based Usernames**: Usernames are visible during chat but removed after each session
- **Real-time Messaging**: Live message updates during active conversations

## Database Schema

The application uses PostgreSQL with the following main tables:
- `login_codes`: Time-limited authentication codes
- `users`: Temporary user accounts with activity tracking
- `p2p_connections`: Peer-to-peer connection management with status tracking
- `p2p_messages`: Messages with automatic 5-minute expiration
- `groups` & `group_messages`: Group messaging (future feature)

## Setup

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL database

### Database Setup
1. Create a PostgreSQL database
2. Import the schema from `anon.sql`
3. Or use the setup script:
   ```bash
   cd server
   npm run setup-db
   ```

### Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your database connection:
   ```
   DATABASE_URL=your_postgresql_connection_string
   ```
4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm start
   ```

## Usage

1. **Login**: Enter a valid access code (test code: "1")
2. **Create Username**: Choose a unique username (3-20 characters, letters and numbers only)
3. **Join P2P**: Click "P2P Messaging" to join the queue
4. **Chat**: Once matched, send and receive anonymous messages
5. **Auto-Logout**: Session ends automatically when you leave or become inactive

## API Endpoints

### Authentication
- `POST /api/verify-code` - Verify access code
- `POST /api/check-username` - Check username availability
- `POST /api/create-user` - Create new user

### P2P Messaging
- `POST /api/join-p2p` - Join P2P queue or get matched
- `GET /api/check-p2p/:username` - Check P2P connection status
- `POST /api/send-p2p-message` - Send message to connected peer
- `GET /api/get-p2p-messages/:username/:partner` - Get conversation messages
- `POST /api/leave-p2p` - Leave P2P and cleanup session

### Utilities
- `GET /api/users` - List active users
- `GET /api/codes` - List valid login codes
- `POST /api/add-test-code` - Add test login code

## Technical Details

- **Automatic Cleanup**: Database triggers handle expired messages and connections
- **Connection States**: `waiting` → `active` → `ended`
- **Message Expiry**: All messages auto-delete after 5 minutes
- **User Cleanup**: Inactive users removed after 10 minutes
- **Anonymous Design**: No persistent user data or chat history
