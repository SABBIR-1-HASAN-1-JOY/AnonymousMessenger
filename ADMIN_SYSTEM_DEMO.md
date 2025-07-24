# Admin System Demo Guide

## Complete Admin Entity Request System

This document outlines the complete admin system implementation that has been added to the Jachai application.

## System Overview

### Features Implemented:
1. **Admin Role Management** - Users can have admin privileges
2. **Entity Request Workflow** - Users submit requests, admins approve/reject
3. **Admin Dashboard** - Complete interface for managing entity requests
4. **Database Integration** - Full backend API with PostgreSQL storage
5. **Demo Mode** - Fallback functionality when backend is unavailable

## How to Test the Admin System

### Step 1: Clear Browser Storage
Open browser console (F12) and run:
```javascript
localStorage.clear()
```

### Step 2: Login as Admin User
- **Email:** `admin@demo.com`
- **Password:** `admin123`

### Step 3: Access Admin Panel
- After login, you'll see "Admin Panel" in the navigation
- Click on "Admin Panel" to access the dashboard

### Step 4: Test Admin Features
1. **View Entity Requests** - See all pending/approved/rejected requests
2. **Approve Requests** - Click approve button to create entities
3. **Reject Requests** - Click reject button with optional notes
4. **Filter Requests** - Filter by status (pending, approved, rejected)
5. **View Statistics** - See request counts by status

## Regular User Testing

### Step 1: Login as Regular User
- **Email:** `john@demo.com`
- **Password:** `demo123`

### Step 2: Create Entity Request
- Go to "Create Entity" page
- Fill out entity information
- Submit request (goes to admin approval queue)

## Technical Implementation

### Frontend Components:
- `AdminDashboard.tsx` - Main admin interface
- `CreateEntity.tsx` - Modified to submit requests
- `Header.tsx` - Added admin navigation
- `AuthContext.tsx` - Added role management

### Backend API:
- `entityRequestRoutes.js` - RESTful API endpoints
- `entityRequestControllers.js` - Request handlers
- `entityRequestServices.js` - Business logic
- `entityRequestQueries.js` - Database operations

### Database:
- `entity_requests` table - Stores all requests
- Foreign key relationships with users and entities
- Status tracking (pending/approved/rejected)

## API Endpoints

### Entity Request Management:
- `POST /api/entity-requests` - Submit new request
- `GET /api/entity-requests` - Get all requests (admin)
- `GET /api/entity-requests/stats` - Get statistics (admin)
- `PUT /api/entity-requests/:id/approve` - Approve request (admin)
- `PUT /api/entity-requests/:id/reject` - Reject request (admin)
- `DELETE /api/entity-requests/:id` - Delete request (admin)

### Setup:
- `POST /api/setup/entity-request-system` - Initialize database

## Demo Data

When the backend is unavailable, the system uses demo data:
- 3 sample entity requests
- Sample statistics
- Local state management for approve/reject actions

## User Roles

### Admin Users:
- Can access Admin Panel
- Can approve/reject entity requests
- Can view all requests and statistics
- Have full CRUD access to entity requests

### Regular Users:
- Can submit entity requests
- Cannot directly create entities
- Must wait for admin approval

## Security Features

1. **Role-based Access** - Admin routes protected by role check
2. **Admin ID Tracking** - All admin actions logged with user ID
3. **Request Validation** - Server-side validation for all requests
4. **Error Handling** - Graceful fallbacks when services unavailable

## Database Schema

```sql
CREATE TABLE entity_requests (
    request_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES "user"(user_id) NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    sector VARCHAR(100),
    picture TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    admin_notes TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by INTEGER REFERENCES "user"(user_id)
);
```

## Testing Workflow

1. **Admin Login** → Access dashboard → View requests
2. **User Submission** → Create entity request → Wait for approval
3. **Admin Approval** → Review request → Approve → Entity created
4. **Admin Rejection** → Review request → Reject with notes
5. **Statistics** → View request counts and trends

This complete system provides a professional entity management workflow with proper admin oversight and user request handling.
