# Post Ratings System Documentation

## Overview

This update adds a comprehensive rating system for rate_my_work posts, replacing the simple single-rating approach with a robust multi-user rating system.

## Database Changes

### New Table: `post_ratings`

```sql
CREATE TABLE post_ratings (
  rating_id INTEGER PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES post(post_id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES "user"(user_id) ON DELETE CASCADE,
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, post_id)
);
```

### Modified Table: `post`

Added columns:
- `average_rating DECIMAL(3,2)` - Automatically calculated average rating
- `total_ratings INTEGER` - Total number of ratings received

### Database Functions

1. **calculate_post_average_rating(post_id)**: Calculates and updates average rating
2. **update_post_rating_trigger()**: Trigger function for automatic updates
3. **Triggers**: Automatically update averages on INSERT/UPDATE/DELETE of ratings

## API Endpoints

### Core Rating Endpoints

#### Rate a Post
```
POST /api/posts/:postId/rate
Body: { userId: number, rating: number (1-5) }
Response: { success, message, post, averageRating, totalRatings, ratingBreakdown }
```

#### Get Post Rating Details
```
GET /api/posts/:postId/ratings?userId=123
Response: { averageRating, totalRatings, ratingBreakdown, userRating, recentRatings }
```

#### Get User's Rating for a Post
```
GET /api/posts/:postId/ratings/user?userId=123
Response: { rating, ratingDate }
```

#### Remove User's Rating
```
DELETE /api/posts/:postId/rate
Body: { userId: number }
Response: { success, message, averageRating, totalRatings }
```

#### Get Top Rated Posts
```
GET /api/posts/top-rated?limit=10&minRatings=3
Response: { posts: [...], totalCount }
```

## Frontend Integration

### Updated RateMyWorkDetail Component

The component has been fixed with:

1. **Proper TypeScript Interfaces**: 
   - Added comprehensive `WorkItem` interface
   - Fixed all type-related compilation errors

2. **Enhanced Rating Display**:
   - Shows average rating and total count
   - Displays user's current rating
   - Handles rating updates properly

3. **Better Error Handling**:
   - Safe property access with null checks
   - Fallback values for undefined properties

4. **Improved Image Handling**:
   - Supports both single `image` and multiple `images` properties
   - Conditional rendering for better UX

### Key Frontend Changes

```typescript
// New interface for comprehensive work items
interface WorkItem {
  id: string;
  type: 'rate-my-work' | 'simple';
  userId: string;
  userName: string;
  title?: string;
  description?: string;
  content?: string;
  images?: string[];
  skills?: string[];
  category?: string;
  averageRating?: number;
  totalRatings?: number;
  userRating?: number;
  // ... other properties
}

// Enhanced rating component usage
<RatingComponent
  postId={work.id?.toString() || ''}
  currentUserRating={userRatings[work.id || ''] || Number(work.userRating) || 0}
  averageRating={Number(work.averageRating) || Number(work.ratingpoint) || 0}
  totalRatings={Number(work.totalRatings) || 0}
  onRate={(rating) => handleRatePost(work.id || '', rating)}
  disabled={work.userId === user?.id}
/>
```

## Setup Instructions

### 1. Database Migration

Run the setup script:
```bash
cd server
node setup/setup-post-ratings.js
```

Or manually execute the SQL from `migrations/add_post_ratings_simple.sql`

### 2. Manual Column Addition (if needed)

If the automatic column addition fails, run these manually:

```sql
ALTER TABLE post ADD COLUMN average_rating DECIMAL(3,2) DEFAULT NULL;
ALTER TABLE post ADD COLUMN total_ratings INTEGER DEFAULT 0;

-- Add constraints
ALTER TABLE post ADD CONSTRAINT chk_average_rating_range 
  CHECK (average_rating IS NULL OR (average_rating >= 1.0 AND average_rating <= 5.0));
ALTER TABLE post ADD CONSTRAINT chk_total_ratings_positive 
  CHECK (total_ratings >= 0);
```

### 3. Update Existing Data

Migrate existing `ratingpoint` values:
```sql
UPDATE post 
SET 
    average_rating = CASE 
        WHEN ratingpoint IS NOT NULL AND ratingpoint > 0 THEN ratingpoint 
        ELSE NULL 
    END,
    total_ratings = CASE 
        WHEN ratingpoint IS NOT NULL AND ratingpoint > 0 THEN 1 
        ELSE 0 
    END
WHERE is_rate_enabled = true;
```

## Usage Examples

### Rating a Post

```javascript
// Frontend API call
const ratePost = async (postId, rating) => {
  const response = await fetch(`/api/posts/${postId}/rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: currentUser.id, rating })
  });
  
  const result = await response.json();
  // result.averageRating, result.totalRatings available
};
```

### Getting Rating Information

```javascript
// Get comprehensive rating info
const getRatingInfo = async (postId, userId) => {
  const response = await fetch(`/api/posts/${postId}/ratings?userId=${userId}`);
  const info = await response.json();
  // info.averageRating, info.totalRatings, info.userRating, info.ratingBreakdown
};
```

## Benefits

1. **Multi-User Ratings**: Multiple users can rate the same post
2. **Automatic Calculations**: Database triggers handle average calculations
3. **Rating History**: Track when users rated and updated their ratings
4. **Rating Analytics**: Breakdown by star rating (1-5 stars)
5. **Performance**: Indexed queries for fast retrieval
6. **Data Integrity**: Constraints ensure valid ratings and prevent duplicates
7. **Scalable**: Designed to handle large numbers of ratings efficiently

## Migration Notes

- Existing `ratingpoint` values are preserved as fallbacks
- Old rating system remains functional during transition
- New system is backwards compatible with existing frontend code
- Database triggers ensure data consistency

## Testing

1. Create a rate_my_work post
2. Rate it with different users
3. Verify average calculation
4. Test rating updates
5. Check top-rated posts endpoint
6. Verify frontend display

## Troubleshooting

### Common Issues

1. **Missing Columns**: Run the manual ALTER TABLE statements
2. **Trigger Errors**: Check function creation and permissions
3. **Frontend Errors**: Ensure all new properties are handled safely
4. **Rating Not Updating**: Verify database triggers are active

### Verification Queries

```sql
-- Check if table exists
SELECT * FROM information_schema.tables WHERE table_name = 'post_ratings';

-- Check new columns
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'post' AND column_name IN ('average_rating', 'total_ratings');

-- Check functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name LIKE '%rating%';

-- Test data
SELECT p.post_id, p.average_rating, p.total_ratings, COUNT(pr.rating_id) as actual_count
FROM post p
LEFT JOIN post_ratings pr ON p.post_id = pr.post_id
WHERE p.is_rate_enabled = true
GROUP BY p.post_id, p.average_rating, p.total_ratings;
```
