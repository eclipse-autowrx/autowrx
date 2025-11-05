#!/bin/bash

# Build script for frontend
# This script installs dependencies and builds the frontend with custom dist directory

echo "🚀 Building frontend..."

# Navigate to frontend directory
cd frontend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in frontend directory"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
yarn install

if [ $? -ne 0 ]; then
    echo "❌ Error: npm install failed"
    exit 1
fi

# Build the project with custom dist directory
echo "🔨 Building project with dist directory: ../backend/static/frontend-dist/"
yarn build

if [ $? -ne 0 ]; then
    echo "❌ Error: npm run build failed"
    exit 1
fi

echo "✅ Frontend build completed successfully!"
echo "📁 Build output: frontend/@frontend-dist/"
