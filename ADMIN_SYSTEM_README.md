# Admin System for Report Management

This system provides comprehensive admin functionality to handle user reports on posts, comments, and reviews. Admins can issue warnings, delete content, ban users, or take no action on reports.

## Features

### Admin Capabilities
- **View All Reports**: Access to all user reports with filtering and search
- **Take Actions**: Four types of actions available:
  - **Warning**: Issue warning to user (with optional expiry)
  - **Delete Content**: Soft delete the reported content
  - **Ban User**: Temporary or permanent user bans
  - **No Action**: Resolve report without action
- **Action History**: Track all admin actions with audit trail
- **User Management**: View user warnings and bans

### Report System
- Users can report posts, comments, and reviews
- Predefined report reasons (Spam, Harassment, etc.)
- Report status tracking (pending → reviewed → resolved)
- Duplicate report prevention

## Database Schema

### Core Tables

#### reports
- Stores user reports on content
- Links reporter, reported user, and content
- Status tracking and timestamps

#### admin_actions  
- Logs all admin actions on reports
- Links to reports and target users/content
- Audit trail for accountability

#### user_warnings
- Tracks warnings issued to users
- Optional expiry dates
- Active/inactive status

#### user_bans
- Manages user bans (temporary/permanent)
- Expiry tracking for temporary bans
- Active/inactive status

#### report_reasons
- Predefined report categories
- Extensible for custom reasons

### Content Tables (Modified)
- **posts**, **comments**, **reviews** tables get new columns:
  - `deleted_at`: Timestamp for soft deletion
  - `deleted_by_admin`: Boolean flag for admin deletions

## API Endpoints

### Admin Actions
- `POST /api/admin/reports/:reportId/action` - Take action on report
- `GET /api/admin/reports/:reportId/actions` - Get action history
- `GET /api/admin/users/:userId/warnings` - Get user warnings
- `GET /api/admin/users/:userId/bans` - Get user bans
- `GET /api/admin/content/:type/:id` - Get content details

### Admin Management
- `POST /api/admin/make-admin/:userId` - Grant admin privileges
- `POST /api/admin/remove-admin/:userId` - Remove admin privileges

### Setup
- `POST /api/setup/admin-system` - Initialize admin system

## Setup Instructions

### 1. Database Setup

Execute the SQL script to create all necessary tables:

```sql
-- Run this file in your PostgreSQL database:
d:\CSE Database Project\Last hope\server\setup\create_reports_table.sql
```

### 2. API Setup

Call the setup endpoint to ensure all tables and columns exist:

```bash
curl -X POST http://localhost:3000/api/setup/admin-system
```

### 3. Create First Admin

Make your user an admin (replace USER_ID with your actual user ID):

```sql
UPDATE "user" SET isAdmin = true WHERE user_id = YOUR_USER_ID;
```

Or use the API if you already have an admin:

```bash
curl -X POST http://localhost:3000/api/admin/make-admin/USER_ID \
  -H "Content-Type: application/json" \
  -d '{"adminId": EXISTING_ADMIN_ID}'
```

### 4. Access Admin Panel

Navigate to `/admin/reports` in your application. The admin link will appear in the navigation for admin users.

## Usage Guide

### For Admins

1. **Access Reports**: Navigate to Admin Reports page
2. **Review Reports**: Click on any report to see details
3. **View Content**: See the actual reported content
4. **Take Action**: Choose appropriate action:
   - **Warning**: For minor violations
   - **Delete**: For content that violates guidelines
   - **Ban**: For serious or repeated violations
   - **No Action**: If report is unfounded

### Action Types Explained

#### Warning
- Issues a formal warning to the user
- Optional expiry date
- User can see warnings in their profile
- Useful for first-time violations

#### Delete Content
- Soft deletes the reported content
- Content becomes hidden but not permanently removed
- Can be reversed if needed
- Preserves data integrity

#### Ban User  
- **Temporary**: Ban with expiry date
- **Permanent**: Indefinite ban
- Prevents user from creating content
- Can be reversed by admins

#### No Action
- Marks report as resolved
- No penalties for the user
- Use when reports are unfounded

### Workflow

1. User submits report → Status: "pending"
2. Admin reviews report → Status: "reviewed" 
3. Admin takes action → Status: "resolved"
4. Action is logged for audit trail

## Security Features

- **Admin Authentication**: Only users with `isAdmin = true` can access
- **Action Logging**: All admin actions are recorded
- **Audit Trail**: Complete history of decisions
- **Permission Checks**: API endpoints verify admin status
- **Soft Deletion**: Content can be recovered if needed

## Frontend Components

### AdminReports.tsx
Main admin interface with:
- Report list with filtering
- Report details panel
- Action modal with forms
- Previous actions history
- Content preview

### ReportButton.tsx  
User-facing report trigger:
- Prevents self-reporting
- Integrates with auth system
- Opens report modal

### ReportModal.tsx
Report submission form:
- Reason selection
- Description input
- Duplicate prevention
- Error handling

## Configuration

### Environment Variables
```env
VITE_API_BASE_URL=http://localhost:3000
```

### Database Configuration
Ensure your PostgreSQL connection is configured in:
```javascript
// server/config/db.js
```

## Troubleshooting

### Common Issues

1. **Admin link not showing**
   - Check user's `isAdmin` field in database
   - Verify auth context includes `isAdmin`

2. **Reports not loading**
   - Ensure admin system setup was completed
   - Check API endpoints are accessible
   - Verify database connections

3. **Actions failing**
   - Check admin permissions in database
   - Verify all required tables exist
   - Check console for error messages

### Database Checks

```sql
-- Verify admin user
SELECT user_id, username, isAdmin FROM "user" WHERE isAdmin = true;

-- Check reports table
SELECT COUNT(*) FROM reports;

-- Verify admin actions table
SELECT COUNT(*) FROM admin_actions;
```

## Extending the System

### Adding New Action Types

1. Update the `action_type` constraint in `admin_actions` table
2. Add new case in `AdminActionService.handleReportAction()`
3. Update frontend action type options
4. Implement the new action logic

### Custom Report Reasons

```sql
INSERT INTO report_reasons (reason_text, description) 
VALUES ('Custom Reason', 'Description of custom reason');
```

### Additional Admin Features

The system is designed to be extensible. You can add:
- User activity monitoring
- Automated moderation rules
- Report analytics and statistics
- Bulk action capabilities
- Email notifications for actions

## Support

If you encounter issues:
1. Check the setup instructions
2. Verify database schema
3. Check API endpoint responses
4. Review console logs for errors

The admin system provides a robust foundation for content moderation and can be customized to fit specific community guidelines and policies.
