#!/bin/bash

# Configuration switcher for mobile testing

echo "🔧 GenStack Configuration Switcher"
echo ""
echo "Available configurations:"
echo "1. Original (HTTP) - Standard development setup"
echo "2. HTTPS - For mobile WebRTC testing"
echo ""

read -p "Select configuration (1 or 2): " choice

case $choice in
    1)
        echo "📦 Switching to original HTTP configuration..."
        cp vite.config.original.ts vite.config.ts
        echo "✅ Original configuration restored"
        echo "🌐 App will run on: http://192.168.1.26:3000"
        echo "📱 Note: Mobile WebRTC may not work without HTTPS"
        ;;
    2)
        echo "🔒 Switching to HTTPS configuration..."
        cp vite.config.https.ts vite.config.ts
        echo "✅ HTTPS configuration activated"
        echo "🌐 App will run on: https://192.168.1.26:3002"
        echo "📱 Mobile WebRTC will work with HTTPS"
        ;;
    *)
        echo "❌ Invalid choice. Please run again and select 1 or 2."
        exit 1
        ;;
esac

echo ""
echo "🚀 You can now run: npm run dev"
