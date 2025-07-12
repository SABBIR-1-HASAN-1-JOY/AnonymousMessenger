# Voting System Implementation

## Overview
This implementation adds upvote/downvote functionality to posts and reviews, as well as star rating capability for posts using the vote table.

## Database Schema

### Vote Table
```sql
CREATE TABLE vote (
  vote_id SERIAL PRIMARY KEY,
  user_id INT REFERENCES "USER"(user_id) ON DELETE CASCADE,
  entity_type VARCHAR NOT NULL,      -- 'post' or 'review'
  entity_id INT NOT NULL,
  vote_type VARCHAR,                 -- 'up' or 'down' (for review votes)
  rating DECIMAL(2,1),               -- 1.0 to 5.0 (for post ratings)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_entity_vote UNIQUE (user_id, entity_type, entity_id)
);
```

## API Endpoints

### Vote Routes (`/api/votes`)

1. **POST /vote** - Cast or update a vote
   - Body: `{ entityType: 'post'|'review', entityId: number, voteType: 'up'|'down' }`
   - Headers: `user-id: <user_id>`

2. **POST /rate** - Rate a post (1-5 stars)
   - Body: `{ postId: number, rating: 1-5 }`
   - Headers: `user-id: <user_id>`

3. **GET /counts/:entityType/:entityId** - Get vote counts
   - Returns: `{ upvotes, downvotes, averageRating, ratingCount }`

4. **GET /user/:entityType/:entityId** - Get user's vote for entity
   - Headers: `user-id: <user_id>`
   - Returns: `{ vote_type, rating }` or `null`

## Frontend Components

### VoteComponent
A reusable React component that handles voting and rating functionality.

**Props:**
- `entityType`: 'post' | 'review'
- `entityId`: number
- `showRating`: boolean (optional, shows star rating for posts)
- `className`: string (optional)

**Usage:**
```tsx
import VoteComponent from '../common/VoteComponent';

// For posts with upvote/downvote
<VoteComponent entityType="post" entityId={postId} />

// For posts with upvote/downvote and star rating
<VoteComponent entityType="post" entityId={postId} showRating={true} />

// For reviews with upvote/downvote
<VoteComponent entityType="review" entityId={reviewId} />
```

### PostCard Component
Displays individual posts with voting functionality integrated.

### ReviewCard Component  
Displays individual reviews with voting functionality integrated.

## Features

### Voting Behavior
- **Toggle Voting**: Clicking the same vote type removes the vote
- **Switch Votes**: Clicking opposite vote type switches the vote
- **Authentication**: Must be logged in to vote
- **Real-time Updates**: Vote counts update immediately after voting

### Rating Behavior (Posts Only)
- **Star Rating**: Click stars to rate 1-5
- **Toggle Rating**: Clicking same star rating removes the rating
- **Average Display**: Shows average rating and count
- **Visual Feedback**: User's rating shows in blue, average in yellow

### Database Integrity
- **Unique Constraint**: One vote per user per entity
- **Automatic Timestamps**: Tracks when votes are cast/updated
- **Cascading Deletes**: Votes deleted when user is deleted

## Setup Instructions

1. **Run Database Migration**:
   ```sql
   -- Execute the migration in server/migrations/add_vote_constraints.sql
   ```

2. **Start Backend Server**:
   ```bash
   cd server
   npm start
   ```

3. **Start Frontend**:
   ```bash
   cd client
   npm run dev
   ```

4. **Test Voting**:
   - Login as any user
   - Navigate to the Feed
   - Try voting on posts and reviews
   - Try rating posts with star system

## Integration with Existing Components

The voting system has been integrated into:
- **Feed.tsx**: Shows voting on all posts and reviews in the feed
- **PostCard.tsx**: Standalone post component with voting
- **ReviewCard.tsx**: Standalone review component with voting

## Error Handling

- Authentication required for voting
- Invalid vote types rejected
- Database constraints prevent duplicate votes
- Network errors shown to user
- Loading states during vote operations

## Future Enhancements

1. **Notifications**: Notify users when their content gets voted on
2. **Vote History**: Track voting history per user
3. **Trending**: Use vote data to determine trending content
4. **Moderation**: Flag content with excessive downvotes
5. **Analytics**: Track voting patterns and engagement metrics
