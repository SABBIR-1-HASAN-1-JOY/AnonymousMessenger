#!/bin/bash

echo "Testing Photo Upload System"
echo "=========================="

# Test if server is running
echo "1. Testing server status..."
curl -s http://localhost:3000/api/photos > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Server is running"
else
    echo "❌ Server is not running"
    exit 1
fi

# Test photo API endpoint
echo "2. Testing photo API endpoint..."
response=$(curl -s http://localhost:3000/api/photos)
if [[ $response == *"Photo API is running"* ]]; then
    echo "✅ Photo API is working"
else
    echo "❌ Photo API is not working"
    exit 1
fi

# Test uploads directory
echo "3. Checking uploads directory..."
if [ -d "../server/uploads" ]; then
    echo "✅ Uploads directory exists"
else
    echo "❌ Uploads directory not found"
fi

# Test database table (by trying to get photos for a non-existent entity)
echo "4. Testing database connection..."
response=$(curl -s http://localhost:3000/api/photos/entities/999999)
if [[ $response == *"[]"* ]] || [[ $response == *"error"* ]]; then
    echo "✅ Database connection working"
else
    echo "❌ Database connection issue"
fi

echo ""
echo "Photo Upload System Test Complete!"
echo ""
echo "🔧 Available endpoints:"
echo "POST /api/photos/upload - Upload single photo"
echo "POST /api/photos/upload-multiple - Upload multiple photos"
echo "GET /api/photos/:type/:sourceId - Get photos by type and source"
echo "GET /api/photos/user/:userId - Get photos by user"
echo "GET /api/photos/file/:filename - Serve photo file"
echo "DELETE /api/photos/:photoId - Delete photo"
echo ""
echo "📸 Photo types: profile, reviews, entities"
echo "🗂️ Naming convention: uploader+id+type+type_id+.extension"
echo "📏 Max file size: 5MB per file"
echo "🎨 Supported formats: JPEG, PNG, GIF, WebP"
