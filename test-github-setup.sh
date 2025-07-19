#!/bin/bash

# Test script for GitHub integration functionality
echo "🔧 Testing GitHub Integration Setup..."

# Check if environment variables are set
if [ -z "$GITHUB_TOKEN" ] && [ -z "$(grep GITHUB_TOKEN /Users/jitendrajahagirdar/Desktop/GitHub/GenStack/backend/.env.development)" ]; then
    echo "❌ GITHUB_TOKEN not found in environment or .env.development"
    exit 1
fi

if [ -z "$GITHUB_USERNAME" ] && [ -z "$(grep GITHUB_USERNAME /Users/jitendrajahagirdar/Desktop/GitHub/GenStack/backend/.env.development)" ]; then
    echo "❌ GITHUB_USERNAME not found in environment or .env.development"
    exit 1
fi

echo "✅ GitHub environment variables configured"

# Check if GitHub service files exist
if [ ! -f "/Users/jitendrajahagirdar/Desktop/GitHub/GenStack/backend/src/services/githubService.ts" ]; then
    echo "❌ GitHub service file missing"
    exit 1
fi

if [ ! -f "/Users/jitendrajahagirdar/Desktop/GitHub/GenStack/backend/src/services/projectGitHubService.ts" ]; then
    echo "❌ Project GitHub service file missing"
    exit 1
fi

if [ ! -f "/Users/jitendrajahagirdar/Desktop/GitHub/GenStack/backend/src/types/github.ts" ]; then
    echo "❌ GitHub types file missing"
    exit 1
fi

echo "✅ GitHub service files exist"

# Test TypeScript compilation of GitHub services
echo "🔍 Testing TypeScript compilation..."

cd /Users/jitendrajahagirdar/Desktop/GitHub/GenStack/backend

# Test individual files
echo "Testing GitHub types..."
npx tsc --noEmit src/types/github.ts
if [ $? -ne 0 ]; then
    echo "❌ GitHub types compilation failed"
    exit 1
fi

echo "Testing GitHub service..."
npx tsc --noEmit src/services/githubService.ts
if [ $? -ne 0 ]; then
    echo "❌ GitHub service compilation failed"
    exit 1
fi

echo "Testing Project GitHub service..."
npx tsc --noEmit src/services/projectGitHubService.ts
if [ $? -ne 0 ]; then
    echo "❌ Project GitHub service compilation failed"
    exit 1
fi

echo "✅ All GitHub services compile successfully"

# Check if all necessary dependencies exist
echo "🔍 Checking dependencies..."

if ! npm list axios > /dev/null 2>&1; then
    echo "❌ axios dependency missing"
    exit 1
fi

echo "✅ All dependencies available"

# Test basic MongoDB connection (Project model)
echo "🔍 Testing Project model access..."
node -e "
const mongoose = require('mongoose');
try {
  require('./src/models/Project-simple.ts');
  console.log('✅ Project model accessible');
} catch (error) {
  console.log('❌ Project model error:', error.message);
  process.exit(1);
}
"

if [ $? -ne 0 ]; then
    echo "❌ Project model test failed"
    exit 1
fi

echo ""
echo "🎉 GitHub Integration Setup Complete!"
echo ""
echo "📋 Summary:"
echo "  ✅ Environment variables configured"
echo "  ✅ Service files created"
echo "  ✅ TypeScript compilation successful"
echo "  ✅ Dependencies available"
echo "  ✅ Project model accessible"
echo ""
echo "🚀 Ready to test GitHub functionality!"
echo ""
echo "📝 Next steps:"
echo "  1. Start the backend server: npm run dev"
echo "  2. Test project creation with GitHub integration"
echo "  3. Verify GitHub repository creation"
echo ""

exit 0
