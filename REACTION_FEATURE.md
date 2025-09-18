# Emoji Reaction Feature

This document describes the emoji reaction feature implemented for the Anonymous Messenger application.

## Overview

Users can now react to messages with multiple emoji reactions in both P2P and group chats.

## Features

### Frontend (React)
- **Message Display**: Shows existing reactions on messages
- **Multi-Emoji Picker**: Click the 😊 button to open a popup with 6 emoji options
- **Available Reactions**: ❤️ (love), 👍 (like), 😂 (haha), 😢 (sad), 😮 (wow), 😠 (angry)
- **Remove Reaction**: Click the 💔 button when a message already has a reaction, or click on the existing emoji
- **Visual Feedback**: Reactions appear below the message text with hover effects
- **Modal Interface**: Reaction picker opens as a centered modal with backdrop

### Backend (Node.js/Express)
- **API Endpoint**: `POST /api/react-to-message`
  - Parameters: `messageId`, `messageType` (p2p/group), `username`, `emoji`
  - Returns: Success/error status and updated reaction
- **Database**: Added `react` column to both `p2p_messages` and `group_messages` tables
- **Authorization**: Validates user permission to react to messages
- **Auto-migration**: Server automatically adds the `react` column on startup

## Usage

### For P2P Messages
1. Hover over any message in a P2P chat
2. Click the 😊 button to open the reaction picker
3. Choose from: ❤️ (love), 👍 (like), 😂 (haha), 😢 (sad), 😮 (wow), 😠 (angry)
4. Click 💔 button to remove reaction (when message already has one)
5. Click on existing emoji to remove it

### For Group Messages
1. Hover over any message in a group chat
2. Click the 😊 button to open the reaction picker
3. Choose from the available emoji reactions
4. Click 💔 button to remove reaction (when message already has one)
5. Click on existing emoji to remove it

## Available Emojis

| Emoji | Label | Description |
|-------|-------|-------------|
| ❤️ | love | Express love or appreciation |
| 👍 | like | Show approval or agreement |
| 😂 | haha | Find something funny or amusing |
| 😢 | sad | Express sadness or sympathy |
| 😮 | wow | Show surprise or amazement |
| 😠 | angry | Express anger or disagreement |

## Database Schema

### Added Columns
```sql
-- P2P Messages
ALTER TABLE "p2p_messages" ADD COLUMN "react" TEXT;

-- Group Messages  
ALTER TABLE "group_messages" ADD COLUMN "react" TEXT;
```

### API Response Format
```json
{
  "success": true,
  "message": "Reaction added successfully",
  "reaction": "😂"
}
```

## Technical Implementation

### Message Interface (TypeScript)
```typescript
interface Message {
  // ... existing properties
  react?: string | null; // Emoji reaction
}
```

### Emoji Reactions Array
```typescript
const emojiReactions = [
  { emoji: '❤️', label: 'love' },
  { emoji: '👍', label: 'like' },
  { emoji: '😂', label: 'haha' },
  { emoji: '😢', label: 'sad' },
  { emoji: '😮', label: 'wow' },
  { emoji: '😠', label: 'angry' }
];
```

### React Function
```typescript
const reactToMessage = async (
  messageId: string, 
  emoji: string | null, 
  messageType: 'p2p' | 'group'
) => {
  // Implementation handles API calls and state updates
}
```

## UI Components

### Reaction Picker Modal
- **Backdrop**: Semi-transparent overlay
- **Grid Layout**: 3x2 grid of emoji buttons
- **Interactive**: Hover effects and click handling
- **Responsive**: Centers on screen
- **Accessible**: Keyboard navigation and proper labels

### Message Buttons
- **😊 Button**: Opens reaction picker when no reaction exists
- **💔 Button**: Removes reaction when message already has one
- **↩️ Button**: Reply functionality (unchanged)

## Files Modified

1. **Server**: `/server/index.js`
   - Added `POST /api/react-to-message` endpoint
   - Updated message queries to include `react` column
   - Added database schema initialization

2. **Client**: `/client/src/components/Messaging/Messaging.tsx`
   - Updated Message interface
   - Added multiple state variables for reaction picker
   - Added `emojiReactions` array with 6 emoji options
   - Added `reactToMessage` function
   - Modified message rendering for both P2P and group chats
   - Added reaction picker modal UI
   - Added click-outside-to-close functionality

3. **Database**: 
   - `/add_react_column.sql` - Migration script for manual execution
   - Automatic schema updates on server startup

## Testing

The application is ready for testing:

1. **Server**: Running on `http://localhost:3000`
2. **Client**: Running on `http://localhost:5173`

### Test Scenarios

1. **Basic Reaction**: 
   - Send a message
   - Hover over it and click 😊
   - Select any emoji from the picker
   - Verify it appears below the message

2. **Remove Reaction**:
   - Click the 💔 button on a message with a reaction
   - OR click on the existing emoji
   - Verify the reaction disappears

3. **Different Emojis**:
   - Test all 6 emoji types
   - Verify they display correctly
   - Test switching between different emojis

4. **Modal Interaction**:
   - Click outside the picker to close it
   - Click Cancel button to close it
   - Verify proper modal behavior

## Future Enhancements

- Reaction counts when multiple users react
- Reaction notifications
- Custom emoji support
- Reaction history
- Animated reactions