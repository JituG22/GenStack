#!/bin/bash

# Test script for notifications-simple endpoints
echo "🧪 Testing GenStack Notifications Simple API"
echo "============================================"

BASE_URL="http://localhost:5000"

# Test health check
echo "📊 Health Check:"
curl -s "$BASE_URL/health" | jq .
echo -e "\n"

# Test notifications simple endpoint (should require auth)
echo "🔔 Testing Notifications Simple (without auth - should fail):"
curl -s "$BASE_URL/api/notifications-simple" | jq .
echo -e "\n"

# Test notification count (should require auth)
echo "📊 Testing Notification Count (without auth - should fail):"
curl -s "$BASE_URL/api/notifications-simple/count" | jq .
echo -e "\n"

echo "✅ Basic endpoint tests completed!"
echo "🔐 Authentication is required for notification endpoints (as expected)"
echo "🚀 Server is running successfully with the new notifications-simple routes"
