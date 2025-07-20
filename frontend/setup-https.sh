#!/bin/bash

echo "🔒 Setting up HTTPS for mobile WebRTC testing"

# Method 1: Create self-signed certificates
echo "📜 Creating self-signed certificates..."
if command -v openssl &> /dev/null; then
    openssl req -x509 -newkey rsa:4096 -keyout localhost-key.pem -out localhost.pem -days 365 -nodes -subj "/C=US/ST=CA/L=San Francisco/O=Dev/CN=localhost"
    echo "✅ Self-signed certificates created"
else
    echo "❌ OpenSSL not found, skipping certificate creation"
fi

# Method 2: Install and run ngrok (if available)
echo "🌐 Checking for ngrok..."
if command -v ngrok &> /dev/null; then
    echo "✅ ngrok found"
    echo "🚀 Starting ngrok tunnel on port 3002..."
    echo "📱 Use the HTTPS URL from ngrok for mobile testing"
    ngrok http 3002
else
    echo "❌ ngrok not found"
    echo "💡 Install ngrok for easy HTTPS tunneling:"
    echo "   brew install ngrok (macOS)"
    echo "   or download from https://ngrok.com/"
fi
