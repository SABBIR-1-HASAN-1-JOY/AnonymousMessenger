#!/bin/bash

# Local deployment test script for Anonymous Messenger
# This script mimics what Railway does during deployment

echo "🚀 Starting Anonymous Messenger deployment test..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install --only=prod

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install
cd ..

# Install server dependencies  
echo "📦 Installing server dependencies..."
cd server
npm install
cd ..

# Build client
echo "🏗️ Building React client..."
cd client
npm run build
cd ..

# Copy built files to server
echo "📁 Copying built files to server..."
cp -r client/dist server/client_dist

# Test build
echo "🔍 Testing build..."
if [ -f "server/client_dist/index.html" ]; then
    echo "✅ Client build successful - index.html found"
else
    echo "❌ Client build failed - index.html not found"
    exit 1
fi

echo "✅ Build test completed successfully!"
echo ""
echo "To start the server:"
echo "  cd server && npm start"
echo ""
echo "Make sure to set up your DATABASE_URL environment variable before starting!"
echo "Example: export DATABASE_URL='postgresql://user:pass@localhost:5432/dbname'"