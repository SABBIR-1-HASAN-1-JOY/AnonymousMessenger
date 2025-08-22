# Anonymous Messenger

A simple anonymous messaging application with code-based authentication.

## Features

- Code-based login system
- Unique username selection (letters and numbers only)
- Anonymous messaging interface
- Real-time message display

## Setup

### Prerequisites
- Node.js
- PostgreSQL database

### Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your database connection in `.env` file
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

## Database Requirements

The application expects the following tables:
- `code` table with `codeToday` column (character(1))
- `user` table with `username` column

## Usage

1. Enter the access code (test code: "1")
2. Choose a unique username (3-20 characters, letters and numbers only)
3. Start messaging anonymously!

## API Endpoints

- `POST /api/verify-code` - Verify access code
- `POST /api/check-username` - Check username availability
- `POST /api/create-user` - Create new user
- `GET /api/messages` - Get messages
- `POST /api/send-message` - Send a message
# AnonymousMessenger
