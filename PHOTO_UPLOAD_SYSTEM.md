# Photo Upload System Documentation

## Overview

The photo upload system allows users to upload photos for their reviews and profile pictures, while only admin users can upload photos for entities. Photos are stored locally with a specific naming convention and metadata is stored in a PostgreSQL database.

## Features

### 🎯 **Upload Types**
- **Profile Photos**: Users can upload their own profile pictures
- **Review Photos**: Users can attach photos to their reviews (up to 5 photos)
- **Entity Photos**: Only admin users can upload photos for entities

### 🔒 **Permission System**
- **Regular Users**: Can upload profile photos and review photos
- **Admin Users**: Can upload all photo types including entity photos
- **Ownership**: Users can only delete their own photos

### 📁 **File Storage**
- **Location**: `/server/uploads/` directory
- **Naming Convention**: `{uploader}{id}{type}{type_id}.{extension}`
  - `uploader`: "admin" or "user"
  - `id`: ID of the user who uploaded it
  - `type`: "profile", "reviews", or "entities"
  - `type_id`: corresponding profile_id, review_id, or entity_id
  - `extension`: original file extension

### 📊 **Database Schema**
```sql
CREATE TABLE photos (
    photo_id SERIAL PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('profile', 'reviews', 'entities')),
    photo_name VARCHAR(255) NOT NULL UNIQUE,
    user_id INTEGER,
    source_id INTEGER NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_size INTEGER,
    mime_type VARCHAR(100),
    CONSTRAINT fk_photos_user FOREIGN KEY (user_id) REFERENCES "user"(user_id) ON DELETE CASCADE
);
```

## API Endpoints

### 📤 **Upload Photos**

#### Single Photo Upload
```
POST /api/photos/upload
Content-Type: multipart/form-data

Form Data:
- photo: File (required)
- userId: Number (required)
- type: String ('profile' | 'reviews' | 'entities') (required)
- typeId: Number (required) - profile_id, review_id, or entity_id
- isAdmin: String ('true' | 'false') (required for entity uploads)
```

#### Multiple Photo Upload
```
POST /api/photos/upload-multiple
Content-Type: multipart/form-data

Form Data:
- photos: File[] (required, max 5 files)
- userId: Number (required)
- type: String ('profile' | 'reviews' | 'entities') (required)
- typeId: Number (required)
- isAdmin: String ('true' | 'false') (required for entity uploads)
```

### 📥 **Retrieve Photos**

#### Get Photos by Type and Source
```
GET /api/photos/{type}/{sourceId}

Example:
GET /api/photos/reviews/123
GET /api/photos/profile/456
GET /api/photos/entities/789
```

#### Get Photos by User
```
GET /api/photos/user/{userId}
```

#### Serve Photo File
```
GET /api/photos/file/{filename}
```

### 🗑️ **Delete Photo**
```
DELETE /api/photos/{photoId}
Headers:
- user-id: User ID (for permission check)
```

## React Components

### 🖼️ **PhotoGallery**
Displays photos in a responsive grid with modal view and delete functionality.

```tsx
<PhotoGallery
  type="reviews"
  sourceId={123}
  canDelete={true}
  userId={userId}
  className="w-full"
/>
```

### 👤 **ProfilePhotoUpload**
Circular profile photo upload component with preview.

```tsx
<ProfilePhotoUpload
  userId={userId}
  currentPhotoUrl={currentPhotoUrl}
  onPhotoUploaded={(photoUrl) => console.log('Photo uploaded:', photoUrl)}
  className="mx-auto"
/>
```

### 🏢 **EntityPhotoUpload**
Admin-only entity photo upload component.

```tsx
<EntityPhotoUpload
  entityId={entityId}
  userId={userId}
  isAdmin={true}
  onPhotoUploaded={(photoUrl) => console.log('Photo uploaded:', photoUrl)}
  className="w-full"
/>
```

### ✍️ **CreateReview (Enhanced)**
The CreateReview component now includes photo upload functionality for review photos.

## File Specifications

### 📐 **Size Limits**
- Maximum file size: 5MB per photo
- Maximum photos per upload: 5 files

### 🎨 **Supported Formats**
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

## Setup Instructions

### 1. **Database Setup**
```bash
# Run the photo system setup endpoint
curl -X POST http://localhost:3000/api/setup/photo-system
```

### 2. **Directory Structure**
```
server/
├── uploads/                    # Photo storage directory
├── middleware/
│   └── photoUpload.js         # Multer configuration
├── controllers/
│   └── photoControllers.js    # Photo API controllers
├── services/
│   └── photoServices.js       # Photo business logic
├── queries/
│   └── photoQueries.js        # Database queries
├── validators/
│   └── photoValidators.js     # Request validation
├── routes/
│   └── photoRoute.js          # Photo API routes
└── setup/
    ├── photoSetup.js          # Setup utilities
    └── create_photos_table.sql # Database schema
```

### 3. **Environment Requirements**
- Node.js with Express
- PostgreSQL database
- Multer for file uploads
- Joi for validation

## Usage Examples

### 1. **Uploading a Profile Photo**
```javascript
const formData = new FormData();
formData.append('photo', photoFile);
formData.append('userId', '123');
formData.append('type', 'profile');
formData.append('typeId', '123'); // Same as userId for profile photos
formData.append('isAdmin', 'false');

const response = await fetch('/api/photos/upload', {
  method: 'POST',
  body: formData,
});
```

### 2. **Uploading Review Photos**
```javascript
const formData = new FormData();
selectedPhotos.forEach(photo => {
  formData.append('photos', photo);
});
formData.append('userId', '123');
formData.append('type', 'reviews');
formData.append('typeId', '456'); // Review ID
formData.append('isAdmin', 'false');

const response = await fetch('/api/photos/upload-multiple', {
  method: 'POST',
  body: formData,
});
```

### 3. **Admin Entity Photo Upload**
```javascript
const formData = new FormData();
formData.append('photo', photoFile);
formData.append('userId', '123');
formData.append('type', 'entities');
formData.append('typeId', '789'); // Entity ID
formData.append('isAdmin', 'true');

const response = await fetch('/api/photos/upload', {
  method: 'POST',
  body: formData,
});
```

## Security Features

### 🔐 **File Validation**
- File type validation (only images allowed)
- File size validation (5MB limit)
- File extension validation

### 🛡️ **Permission Checks**
- Entity photos: Admin only
- Profile photos: Owner only
- Review photos: Any authenticated user
- Delete permissions: Owner or admin only

### 🧹 **Cleanup**
- Automatic file cleanup on upload failure
- URL object cleanup for preview images
- Database constraints prevent orphaned records

## Error Handling

### Common Error Responses
```json
{
  "error": "Only admin users can upload entity photos"
}

{
  "error": "File too large. Maximum size is 5MB."
}

{
  "error": "Only JPEG, PNG, GIF, and WebP images are allowed"
}

{
  "error": "You can only delete your own photos"
}
```

## Testing

Run the photo system test:
```bash
./test-photo-system.sh
```

This will verify:
- ✅ Server connectivity
- ✅ Photo API functionality
- ✅ Database connection
- ✅ Uploads directory existence

## File Naming Examples

```
user123profile123.jpg          # User 123's profile photo
admin456entities789.png        # Admin 456 uploaded photo for entity 789
user789reviews456.gif          # User 789's photo for review 456
admin001entities123.webp       # Admin 001's photo for entity 123
```

## Integration Points

### Frontend Components
- `CreateReview.tsx`: Enhanced with photo upload
- `EntityDetail.tsx`: Displays entity and review photos
- `ProfilePhotoUpload.tsx`: Profile photo management
- `PhotoGallery.tsx`: Photo display and management

### Backend Services
- Photo upload and storage
- Metadata management
- Permission validation
- File serving and cleanup

This system provides a complete photo management solution with proper security, validation, and user experience considerations.
